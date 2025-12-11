/**
 * DelegateLockedTransferV1 tests for js-codama client
 *
 * LockedTransfer delegates work for ProgrammableNonFungible only.
 * They do NOT work for OG token standards.
 * They specify a lockedAddress that restricts where the token can be transferred.
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-codama)
 */

import test from 'ava';
import { TokenStandard, TokenDelegateRole, TokenState } from '../src/generated/types';
import { getDelegateLockedTransferV1InstructionAsync } from '../src/generated/instructions';
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
 * Test: Approve locked transfer delegate for ProgrammableNonFungible
 */
test('it can approve a locked transfer delegate for a ProgrammableNonFungible', async (t) => {
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

  // Approve a locked transfer delegate
  const lockedTransferDelegate = await createKeypair();
  const lockedAddress = await createKeypair();
  const delegateInstruction = await getDelegateLockedTransferV1InstructionAsync({
    mint: mint.address,
    tokenOwner: owner.address,
    authority: owner,
    payer: owner,
    delegate: lockedTransferDelegate.address,
    amount: 1,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    lockedAddress: lockedAddress.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [owner]);

  // Verify the delegate was set with locked address
  const asset = await fetchDigitalAssetWithAssociatedToken(
    rpc,
    mint.address,
    owner.address
  );

  t.is(asset.token.owner, owner.address);
  t.is(asset.token.amount, 1n);
  if (asset.token.delegate.__option === 'Some') {
    t.is(asset.token.delegate.value, lockedTransferDelegate.address);
  } else {
    t.fail('Expected delegate to be set on token');
  }
  t.is(asset.token.delegatedAmount, 1n);

  // Token record should have the delegate with LockedTransfer role and locked address
  t.truthy(asset.tokenRecord);
  if (asset.tokenRecord) {
    if (asset.tokenRecord.delegate.__option === 'Some') {
      t.is(asset.tokenRecord.delegate.value, lockedTransferDelegate.address);
    } else {
      t.fail('Expected delegate to be set on token record');
    }

    if (asset.tokenRecord.delegateRole.__option === 'Some') {
      t.is(asset.tokenRecord.delegateRole.value, TokenDelegateRole.LockedTransfer);
    } else {
      t.fail('Expected delegate role to be set');
    }

    if (asset.tokenRecord.lockedTransfer.__option === 'Some') {
      t.is(asset.tokenRecord.lockedTransfer.value, lockedAddress.address);
    } else {
      t.fail('Expected locked address to be set');
    }

    t.is(asset.tokenRecord.state, TokenState.Unlocked);
  }
});

/**
 * Test: Cannot approve locked transfer delegate for NonFungible
 */
test('it cannot approve a locked transfer delegate for a NonFungible', async (t) => {
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

  // Try to approve a locked transfer delegate (should fail)
  const lockedTransferDelegate = await createKeypair();
  const lockedAddress = await createKeypair();
  const delegateInstruction = await getDelegateLockedTransferV1InstructionAsync({
    mint: mint.address,
    tokenOwner: owner.address,
    authority: owner,
    payer: owner,
    delegate: lockedTransferDelegate.address,
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
    lockedAddress: lockedAddress.address,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  // Should throw InvalidDelegateRole error
  await t.throwsAsync(
    sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [owner])
  );
});
