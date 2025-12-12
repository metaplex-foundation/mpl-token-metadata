/**
 * DelegatePrintDelegateV1 tests for js-kit client
 *
 * Print delegates are holder-level delegates that can print editions
 * on behalf of the holder. They work for NonFungible and ProgrammableNonFungible
 * token standards that have master editions.
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-kit)
 */

import test from 'ava';
import { TokenStandard, HolderDelegateRole } from '../src/generated/types';
import { getDelegatePrintDelegateV1InstructionAsync } from '../src/generated/instructions';
import {
  findHolderDelegateRecordPda,
  findTokenRecordPda,
} from '../src/generated/pdas';
import { findAssociatedTokenPda } from './_setup';
import { fetchHolderDelegateRecordFromSeeds } from '../src/generated/accounts';
import { createNft, createProgrammableNft } from '../src/hooked/createHelpers';
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
 * Test: Approve print delegate for NonFungible
 */
test('it can approve a print delegate for a NonFungible', async (t) => {
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

  // Create a NonFungible NFT (with master edition)
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

  // Derive the token address
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });

  // Approve a print delegate
  const printDelegate = await createKeypair();

  // Derive the delegate record
  const [delegateRecordAddress] = await findHolderDelegateRecordPda({
    mint: mint.address,
    delegateRole: HolderDelegateRole.PrintDelegate,
    owner: owner.address,
    delegate: printDelegate.address,
  });

  const delegateInstruction = await getDelegatePrintDelegateV1InstructionAsync({
    mint: mint.address,
    token: tokenAddress,
    delegateRecord: delegateRecordAddress,
    authority: owner,
    payer: owner,
    delegate: printDelegate.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [owner]);

  // Verify the holder delegate record was created
  const delegateRecord = await fetchHolderDelegateRecordFromSeeds(rpc, {
    mint: mint.address,
    delegateRole: HolderDelegateRole.PrintDelegate,
    owner: owner.address,
    delegate: printDelegate.address,
  });

  t.is(delegateRecord.data.mint, mint.address);
  t.is(delegateRecord.data.delegate, printDelegate.address);
});

/**
 * Test: Approve print delegate for ProgrammableNonFungible
 */
test('it can approve a print delegate for a ProgrammableNonFungible', async (t) => {
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

  // Create a ProgrammableNonFungible (with master edition)
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

  // Derive the token address and token record
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });
  const [tokenRecordAddress] = await findTokenRecordPda({
    mint: mint.address,
    token: tokenAddress,
  });

  // Approve a print delegate
  const printDelegate = await createKeypair();

  // Derive the delegate record
  const [delegateRecordAddress] = await findHolderDelegateRecordPda({
    mint: mint.address,
    delegateRole: HolderDelegateRole.PrintDelegate,
    owner: owner.address,
    delegate: printDelegate.address,
  });

  const delegateInstruction = await getDelegatePrintDelegateV1InstructionAsync({
    mint: mint.address,
    token: tokenAddress,
    tokenRecord: tokenRecordAddress,
    delegateRecord: delegateRecordAddress,
    authority: owner,
    payer: owner,
    delegate: printDelegate.address,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [owner]);

  // Verify the holder delegate record was created
  const delegateRecord = await fetchHolderDelegateRecordFromSeeds(rpc, {
    mint: mint.address,
    delegateRole: HolderDelegateRole.PrintDelegate,
    owner: owner.address,
    delegate: printDelegate.address,
  });

  t.is(delegateRecord.data.mint, mint.address);
  t.is(delegateRecord.data.delegate, printDelegate.address);
});
