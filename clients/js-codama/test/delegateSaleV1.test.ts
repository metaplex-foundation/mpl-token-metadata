/**
 * DelegateSaleV1 tests for js-codama client
 *
 * Sale delegates work for ProgrammableNonFungible only.
 * They do NOT work for OG token standards.
 * When approved, the token state changes to Listed.
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-codama)
 */

import test from 'ava';
import { TokenStandard, TokenDelegateRole, TokenState } from '../src/generated/types';
import { getDelegateSaleV1InstructionAsync } from '../src/generated/instructions';
import { fetchDigitalAssetWithAssociatedToken } from '../src/hooked';
import { createProgrammableNft, createNft } from '../src/hooked/createHelpers';
import { SPL_TOKEN_PROGRAM_ADDRESS } from './_setup';
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
 * Test: Approve sale delegate for ProgrammableNonFungible
 */
test('it can approve a sale delegate for a ProgrammableNonFungible', async (t) => {
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

  // Approve a sale delegate
  const saleDelegate = await createKeypair();
  const delegateInstruction = await getDelegateSaleV1InstructionAsync({
    mint: mint.address,
    tokenOwner: owner.address,
    authority: owner,
    payer: owner,
    delegate: saleDelegate.address,
    amount: 1,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [owner]);

  // Verify the delegate was set and token state is Listed
  const asset = await fetchDigitalAssetWithAssociatedToken(
    rpc,
    mint.address,
    owner.address
  );

  t.is(asset.token.owner, owner.address);
  t.is(asset.token.amount, 1n);
  if (asset.token.delegate.__option === 'Some') {
    t.is(asset.token.delegate.value, saleDelegate.address);
  } else {
    t.fail('Expected delegate to be set on token');
  }
  t.is(asset.token.delegatedAmount, 1n);

  // Token record should have the delegate with Sale role and Listed state
  t.truthy(asset.tokenRecord);
  if (asset.tokenRecord) {
    if (asset.tokenRecord.delegate.__option === 'Some') {
      t.is(asset.tokenRecord.delegate.value, saleDelegate.address);
    } else {
      t.fail('Expected delegate to be set on token record');
    }

    if (asset.tokenRecord.delegateRole.__option === 'Some') {
      t.is(asset.tokenRecord.delegateRole.value, TokenDelegateRole.Sale);
    } else {
      t.fail('Expected delegate role to be set');
    }

    t.is(asset.tokenRecord.state, TokenState.Listed);
  }
});

/**
 * Test: Cannot approve sale delegate for NonFungible
 */
test('it cannot approve a sale delegate for a NonFungible', async (t) => {
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

  // Try to approve a sale delegate (should fail)
  const saleDelegate = await createKeypair();
  const delegateInstruction = await getDelegateSaleV1InstructionAsync({
    mint: mint.address,
    tokenOwner: owner.address,
    authority: owner,
    payer: owner,
    delegate: saleDelegate.address,
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
  });

  // Should throw InvalidDelegateRole error
  await t.throwsAsync(
    sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [owner])
  );
});

/**
 * Test: Cannot approve sale delegate for Fungible
 */
test('it cannot approve a sale delegate for a Fungible', async (t) => {
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
  const { createFungible } = await import('../src/hooked/createHelpers');
  const createIx = await createFungible({
    mint,
    authority,
    payer: authority,
    name: 'Test Token',
    uri: 'https://example.com/token.json',
    sellerFeeBasisPoints: basisPoints(2),
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
    amount: 1000,
    tokenStandard: TokenStandard.Fungible,
    tokenOwner: authority.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintIx, [authority]);

  // Try to approve a sale delegate (should fail)
  const saleDelegate = await createKeypair();
  const delegateInstruction = await getDelegateSaleV1InstructionAsync({
    mint: mint.address,
    tokenOwner: authority.address,
    authority,
    payer: authority,
    delegate: saleDelegate.address,
    amount: 100,
    tokenStandard: TokenStandard.Fungible,
  });

  // Should throw InvalidDelegateRole error
  await t.throwsAsync(
    sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [authority])
  );
});

/**
 * Test: Cannot approve sale delegate for FungibleAsset
 */
test('it cannot approve a sale delegate for a FungibleAsset', async (t) => {
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
    amount: 1000,
    tokenStandard: TokenStandard.FungibleAsset,
    tokenOwner: authority.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintIx, [authority]);

  // Try to approve a sale delegate (should fail)
  const saleDelegate = await createKeypair();
  const delegateInstruction = await getDelegateSaleV1InstructionAsync({
    mint: mint.address,
    tokenOwner: authority.address,
    authority,
    payer: authority,
    delegate: saleDelegate.address,
    amount: 100,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  // Should throw InvalidDelegateRole error
  await t.throwsAsync(
    sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [authority])
  );
});
