/**
 * RevokeUtilityV1 tests for js-codama client
 *
 * Utility delegates work for ProgrammableNonFungible only.
 * They do NOT work for OG token standards (use Standard delegate instead).
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-codama)
 */

import test from 'ava';
import { TokenStandard, TokenDelegateRole, TokenState } from '../src/generated/types';
import {
  getDelegateUtilityV1InstructionAsync,
  getRevokeUtilityV1InstructionAsync,
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
 * Test: Revoke utility delegate for ProgrammableNonFungible
 */
test('it can revoke a utility delegate for a ProgrammableNonFungible', async (t) => {
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

  // Approve a utility delegate
  const utilityDelegate = await createKeypair();
  const delegateInstruction = await getDelegateUtilityV1InstructionAsync({
    mint: mint.address,
    tokenOwner: owner.address,
    authority: owner,
    payer: owner,
    delegate: utilityDelegate.address,
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
    t.is(asset.token.delegate.value, utilityDelegate.address);
  }

  t.truthy(asset.tokenRecord);
  if (asset.tokenRecord) {
    t.is(asset.tokenRecord.delegate.__option, 'Some');
    if (asset.tokenRecord.delegate.__option === 'Some') {
      t.is(asset.tokenRecord.delegate.value, utilityDelegate.address);
    }
    t.is(asset.tokenRecord.delegateRole.__option, 'Some');
    if (asset.tokenRecord.delegateRole.__option === 'Some') {
      t.is(asset.tokenRecord.delegateRole.value, TokenDelegateRole.Utility);
    }
    t.is(asset.tokenRecord.state, TokenState.Unlocked);
  }

  // Revoke the utility delegate
  const revokeInstruction = await getRevokeUtilityV1InstructionAsync({
    mint: mint.address,
    tokenOwner: owner.address,
    authority: owner,
    payer: owner,
    delegate: utilityDelegate.address,
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
    t.is(asset.tokenRecord.state, TokenState.Unlocked);
  }
});

/**
 * Test: Cannot revoke utility delegate for NonFungible
 */
test('it cannot revoke a utility delegate for a NonFungible', async (t) => {
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

  // Try to revoke using utility revoke (should fail - wrong delegate type)
  const utilityDelegate = await createKeypair();
  const revokeInstruction = await getRevokeUtilityV1InstructionAsync({
    mint: mint.address,
    tokenOwner: owner.address,
    authority: owner,
    payer: owner,
    delegate: utilityDelegate.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  // Should throw InvalidDelegateRole error
  await t.throwsAsync(
    sendAndConfirm(rpc, rpcSubscriptions, revokeInstruction, [owner])
  );
});

/**
 * Test: Cannot revoke utility delegate for Fungible
 */
test('it cannot revoke a utility delegate for a Fungible', async (t) => {
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

  // Try to revoke using utility revoke (should fail - wrong delegate type)
  const utilityDelegate = await createKeypair();
  const revokeInstruction = await getRevokeUtilityV1InstructionAsync({
    mint: mint.address,
    tokenOwner: authority.address,
    authority,
    payer: authority,
    delegate: utilityDelegate.address,
    tokenStandard: TokenStandard.Fungible,
  });

  // Should throw InvalidDelegateRole error
  await t.throwsAsync(
    sendAndConfirm(rpc, rpcSubscriptions, revokeInstruction, [authority])
  );
});

/**
 * Test: Cannot revoke utility delegate for FungibleAsset
 */
test('it cannot revoke a utility delegate for a FungibleAsset', async (t) => {
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

  // Try to revoke using utility revoke (should fail - wrong delegate type)
  const utilityDelegate = await createKeypair();
  const revokeInstruction = await getRevokeUtilityV1InstructionAsync({
    mint: mint.address,
    tokenOwner: authority.address,
    authority,
    payer: authority,
    delegate: utilityDelegate.address,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  // Should throw InvalidDelegateRole error
  await t.throwsAsync(
    sendAndConfirm(rpc, rpcSubscriptions, revokeInstruction, [authority])
  );
});
