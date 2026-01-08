/**
 * DelegateStandardV1 tests for js-kit client
 *
 * Standard delegates work for OG token standards (NonFungible, Fungible, FungibleAsset)
 * but NOT for ProgrammableNonFungible (which uses specialized delegates like Transfer, Utility, etc.)
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-kit)
 */

import test from 'ava';
import { TokenStandard } from '../src/generated/types';
import { getDelegateStandardV1InstructionAsync } from '../src/generated/instructions';
import { fetchDigitalAssetWithAssociatedToken } from '../src/hooked';
import { createNft, createFungible } from '../src/hooked/createHelpers';
import { SPL_TOKEN_2022_PROGRAM_ADDRESS } from './_setup';
import {
  createKeypair,
  createRpc,
  createRpcSubscriptions,
  basisPoints,
  canRunTests,
  getSkipMessage,
  airdrop,
  sendAndConfirm,
  sendAndConfirmInstructions,
} from './_setup';

/**
 * Test: Cannot approve standard delegate for ProgrammableNonFungible
 */
test('it cannot approve a standard delegate for a ProgrammableNonFungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const owner = await createKeypair();

  await airdrop(rpc, owner.address);

  // Create a ProgrammableNonFungible
  const { createProgrammableNft } = await import('../src/hooked/createHelpers');
  const [createIx, mintIx] = await createProgrammableNft({
    mint,
    authority: owner,
    payer: owner,
    name: 'Test PNFT',
    uri: 'https://example.com/pnft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenOwner: owner.address,
  });

  await sendAndConfirmInstructions(rpc, rpcSubscriptions, [createIx, mintIx], [
    mint,
    owner,
  ]);

  // Try to approve a standard delegate (should fail)
  const standardDelegate = await createKeypair();
  const delegateInstruction = await getDelegateStandardV1InstructionAsync({
    mint: mint.address,
    tokenOwner: owner.address,
    authority: owner,
    payer: owner,
    delegate: standardDelegate.address,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // Should throw InvalidDelegateRole error
  await t.throwsAsync(
    sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [owner])
  );
});

/**
 * Test: Approve standard delegate for NonFungible
 */
test('it can approve a standard delegate for a NonFungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const owner = await createKeypair();

  await airdrop(rpc, owner.address);

  // Create a NonFungible NFT
  const [createIx, mintIx] = await createNft({
    mint,
    authority: owner,
    payer: owner,
    name: 'Test NFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenOwner: owner.address,
  });

  await sendAndConfirmInstructions(rpc, rpcSubscriptions, [createIx, mintIx], [
    mint,
    owner,
  ]);

  // Approve a standard delegate
  const standardDelegate = await createKeypair();
  const delegateInstruction = await getDelegateStandardV1InstructionAsync({
    mint: mint.address,
    tokenOwner: owner.address,
    authority: owner,
    payer: owner,
    delegate: standardDelegate.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [owner]);

  // Verify the delegate was set
  const asset = await fetchDigitalAssetWithAssociatedToken(
    rpc,
    mint.address,
    owner.address
  );

  t.is(asset.token.owner, owner.address);
  t.is(asset.token.amount, 1n);
  if (asset.token.delegate.__option === 'Some') {
    t.is(asset.token.delegate.value, standardDelegate.address);
  } else {
    t.fail('Expected delegate to be set');
  }
  t.is(asset.token.delegatedAmount, 1n);
  t.is(asset.tokenRecord, undefined); // NonFungible doesn't have token record
});

/**
 * Test: Approve standard delegate for Fungible
 */
test('it can approve a standard delegate for a Fungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const authority = await createKeypair();

  await airdrop(rpc, authority.address);

  // Create a Fungible token
  const createIx = await createFungible({
    mint,
    authority,
    payer: authority,
    name: 'Test Token',
    uri: 'https://example.com/token.json',
    sellerFeeBasisPoints: basisPoints(2),
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, authority]);

  // Mint some tokens to the authority
  const { getMintV1InstructionAsync } = await import('../src/generated/instructions');
  const { findMetadataPda } = await import('../src/generated/pdas');
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });

  const mintIx = await getMintV1InstructionAsync({
    mint: mint.address,
    authority,
    payer: authority,
    metadata: metadataAddress,
    amount: 1000,
    tokenStandard: TokenStandard.Fungible,
    tokenOwner: authority.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintIx, [authority]);

  // Approve a standard delegate for 500 tokens
  const standardDelegate = await createKeypair();
  const delegateInstruction = await getDelegateStandardV1InstructionAsync({
    mint: mint.address,
    tokenOwner: authority.address,
    authority,
    payer: authority,
    delegate: standardDelegate.address,
    amount: 500,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [authority]);

  // Verify the delegate was set
  const asset = await fetchDigitalAssetWithAssociatedToken(
    rpc,
    mint.address,
    authority.address
  );

  t.is(asset.token.owner, authority.address);
  t.is(asset.token.amount, 1000n);
  if (asset.token.delegate.__option === 'Some') {
    t.is(asset.token.delegate.value, standardDelegate.address);
  } else {
    t.fail('Expected delegate to be set');
  }
  t.is(asset.token.delegatedAmount, 500n);
});

/**
 * Test: Approve standard delegate for FungibleAsset
 */
test('it can approve a standard delegate for a FungibleAsset', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const authority = await createKeypair();

  await airdrop(rpc, authority.address);

  // Create a FungibleAsset token
  const { createFungibleAsset } = await import('../src/hooked/createHelpers');
  const createIx = await createFungibleAsset({
    mint,
    authority,
    payer: authority,
    name: 'Test Asset',
    uri: 'https://example.com/asset.json',
    sellerFeeBasisPoints: basisPoints(3),
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, authority]);

  // Mint some tokens
  const { getMintV1InstructionAsync } = await import('../src/generated/instructions');
  const { findMetadataPda } = await import('../src/generated/pdas');
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });

  const mintIx = await getMintV1InstructionAsync({
    mint: mint.address,
    authority,
    payer: authority,
    metadata: metadataAddress,
    amount: 2000,
    tokenStandard: TokenStandard.FungibleAsset,
    tokenOwner: authority.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintIx, [authority]);

  // Approve a standard delegate for all tokens
  const standardDelegate = await createKeypair();
  const delegateInstruction = await getDelegateStandardV1InstructionAsync({
    mint: mint.address,
    tokenOwner: authority.address,
    authority,
    payer: authority,
    delegate: standardDelegate.address,
    amount: 2000,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [authority]);

  // Verify the delegate was set
  const asset = await fetchDigitalAssetWithAssociatedToken(
    rpc,
    mint.address,
    authority.address
  );

  t.is(asset.token.owner, authority.address);
  t.is(asset.token.amount, 2000n);
  if (asset.token.delegate.__option === 'Some') {
    t.is(asset.token.delegate.value, standardDelegate.address);
  } else {
    t.fail('Expected delegate to be set');
  }
  t.is(asset.token.delegatedAmount, 2000n);
});
