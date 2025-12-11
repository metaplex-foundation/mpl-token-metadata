/**
 * RevokeSaleV1 tests for js-codama client
 *
 * Sale delegates work for ProgrammableNonFungible only.
 * They do NOT work for OG token standards (use Standard delegate instead).
 * Sale delegates put the token in Listed state.
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-codama)
 */

import test from 'ava';
import { TokenStandard, TokenDelegateRole, TokenState } from '../src/generated/types';
import {
  getDelegateSaleV1InstructionAsync,
  getRevokeSaleV1InstructionAsync,
} from '../src/generated/instructions';
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
 * Test: Revoke sale delegate for ProgrammableNonFungible
 */
test('it can revoke a sale delegate for a ProgrammableNonFungible', async (t) => {
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
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [owner]);

  // Verify the delegate was set
  let asset = await fetchDigitalAssetWithAssociatedToken(
    rpc,
    mint.address,
    owner.address
  );

  t.is(asset.token.delegate.__option, 'Some');
  if (asset.token.delegate.__option === 'Some') {
    t.is(asset.token.delegate.value, saleDelegate.address);
  }

  t.truthy(asset.tokenRecord);
  if (asset.tokenRecord) {
    t.is(asset.tokenRecord.delegate.__option, 'Some');
    if (asset.tokenRecord.delegate.__option === 'Some') {
      t.is(asset.tokenRecord.delegate.value, saleDelegate.address);
    }
    t.is(asset.tokenRecord.delegateRole.__option, 'Some');
    if (asset.tokenRecord.delegateRole.__option === 'Some') {
      t.is(asset.tokenRecord.delegateRole.value, TokenDelegateRole.Sale);
    }
    // Sale delegate puts token in Listed state
    t.is(asset.tokenRecord.state, TokenState.Listed);
  }

  // Revoke the sale delegate
  const revokeInstruction = await getRevokeSaleV1InstructionAsync({
    mint: mint.address,
    tokenOwner: owner.address,
    authority: owner,
    payer: owner,
    delegate: saleDelegate.address,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, revokeInstruction, [owner]);

  // Verify the delegate was removed
  asset = await fetchDigitalAssetWithAssociatedToken(
    rpc,
    mint.address,
    owner.address
  );

  t.is(asset.token.delegate.__option, 'None');

  t.truthy(asset.tokenRecord);
  if (asset.tokenRecord) {
    t.is(asset.tokenRecord.delegate.__option, 'None');
    t.is(asset.tokenRecord.delegateRole.__option, 'None');
    // Token should be back to Unlocked state after revoking sale delegate
    t.is(asset.tokenRecord.state, TokenState.Unlocked);
  }
});

/**
 * Test: Cannot revoke sale delegate for NonFungible
 */
test('it cannot revoke a sale delegate for a NonFungible', async (t) => {
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
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirmInstructions(rpc, rpcSubscriptions, [createIx, mintIx], [
    mint,
    owner,
  ]);

  // Try to revoke using sale revoke (should fail - wrong delegate type)
  const saleDelegate = await createKeypair();
  const revokeInstruction = await getRevokeSaleV1InstructionAsync({
    mint: mint.address,
    tokenOwner: owner.address,
    authority: owner,
    payer: owner,
    delegate: saleDelegate.address,
    tokenStandard: TokenStandard.NonFungible,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  // Should throw InvalidDelegateRole error
  await t.throwsAsync(
    sendAndConfirm(rpc, rpcSubscriptions, revokeInstruction, [owner])
  );
});

/**
 * Test: Cannot revoke sale delegate for Fungible
 */
test('it cannot revoke a sale delegate for a Fungible', async (t) => {
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

  // Try to revoke using sale revoke (should fail - wrong delegate type)
  const saleDelegate = await createKeypair();
  const revokeInstruction = await getRevokeSaleV1InstructionAsync({
    mint: mint.address,
    tokenOwner: authority.address,
    authority,
    payer: authority,
    delegate: saleDelegate.address,
    tokenStandard: TokenStandard.Fungible,
  });

  // Should throw InvalidDelegateRole error
  await t.throwsAsync(
    sendAndConfirm(rpc, rpcSubscriptions, revokeInstruction, [authority])
  );
});

/**
 * Test: Cannot revoke sale delegate for FungibleAsset
 */
test('it cannot revoke a sale delegate for a FungibleAsset', async (t) => {
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
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, authority]);

  // Try to revoke using sale revoke (should fail - wrong delegate type)
  const saleDelegate = await createKeypair();
  const revokeInstruction = await getRevokeSaleV1InstructionAsync({
    mint: mint.address,
    tokenOwner: authority.address,
    authority,
    payer: authority,
    delegate: saleDelegate.address,
    tokenStandard: TokenStandard.FungibleAsset,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  // Should throw InvalidDelegateRole error
  await t.throwsAsync(
    sendAndConfirm(rpc, rpcSubscriptions, revokeInstruction, [authority])
  );
});
