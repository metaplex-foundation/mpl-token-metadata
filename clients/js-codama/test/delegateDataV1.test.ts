/**
 * DelegateDataV1 tests for js-codama client
 *
 * Data delegates are metadata-level delegates that can update data fields.
 * They work for all token standards.
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-codama)
 */

import test from 'ava';
import { TokenStandard, MetadataDelegateRole } from '../src/generated/types';
import { getDelegateDataV1InstructionAsync } from '../src/generated/instructions';
import { fetchMetadataDelegateRecordFromSeeds } from '../src/generated/accounts';
import { createNft, createProgrammableNft, createFungible, createFungibleAsset } from '../src/hooked/createHelpers';
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
 * Test: Approve data delegate for NonFungible
 */
test('it can approve a data delegate for a NonFungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const updateAuthority = await createKeypair();

  await airdrop(rpc, updateAuthority.address);

  // Create a NonFungible NFT
  const [createIx, mintIx] = await createNft({
    mint,
    authority: updateAuthority,
    payer: updateAuthority,
    name: 'Test NFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenOwner: updateAuthority.address,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirmInstructions(rpc, rpcSubscriptions, [createIx, mintIx], [
    mint,
    updateAuthority,
  ]);

  // Approve a data delegate
  const dataDelegate = await createKeypair();
  const delegateInstruction = await getDelegateDataV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: dataDelegate.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [updateAuthority]);

  // Verify the metadata delegate record was created
  const delegateRecord = await fetchMetadataDelegateRecordFromSeeds(rpc, {
    mint: mint.address,
    delegateRole: MetadataDelegateRole.Data,
    updateAuthority: updateAuthority.address,
    delegate: dataDelegate.address,
  });

  t.is(delegateRecord.data.mint, mint.address);
  t.is(delegateRecord.data.delegate, dataDelegate.address);
  t.is(delegateRecord.data.updateAuthority, updateAuthority.address);
});

/**
 * Test: Approve data delegate for ProgrammableNonFungible
 */
test('it can approve a data delegate for a ProgrammableNonFungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const updateAuthority = await createKeypair();

  await airdrop(rpc, updateAuthority.address);

  // Create a ProgrammableNonFungible
  const [createIx, mintIx] = await createProgrammableNft({
    mint,
    authority: updateAuthority,
    payer: updateAuthority,
    name: 'Test PNFT',
    uri: 'https://example.com/pnft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenOwner: updateAuthority.address,
  });

  await sendAndConfirmInstructions(rpc, rpcSubscriptions, [createIx, mintIx], [
    mint,
    updateAuthority,
  ]);

  // Approve a data delegate
  const dataDelegate = await createKeypair();
  const delegateInstruction = await getDelegateDataV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: dataDelegate.address,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [updateAuthority]);

  // Verify the metadata delegate record was created
  const delegateRecord = await fetchMetadataDelegateRecordFromSeeds(rpc, {
    mint: mint.address,
    delegateRole: MetadataDelegateRole.Data,
    updateAuthority: updateAuthority.address,
    delegate: dataDelegate.address,
  });

  t.is(delegateRecord.data.mint, mint.address);
  t.is(delegateRecord.data.delegate, dataDelegate.address);
  t.is(delegateRecord.data.updateAuthority, updateAuthority.address);
});

/**
 * Test: Approve data delegate for Fungible
 */
test('it can approve a data delegate for a Fungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const updateAuthority = await createKeypair();

  await airdrop(rpc, updateAuthority.address);

  // Create a Fungible token
  const createIx = await createFungible({
    mint,
    authority: updateAuthority,
    payer: updateAuthority,
    name: 'Test Token',
    uri: 'https://example.com/token.json',
    sellerFeeBasisPoints: basisPoints(2),
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, updateAuthority]);

  // Approve a data delegate
  const dataDelegate = await createKeypair();
  const delegateInstruction = await getDelegateDataV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: dataDelegate.address,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [updateAuthority]);

  // Verify the metadata delegate record was created
  const delegateRecord = await fetchMetadataDelegateRecordFromSeeds(rpc, {
    mint: mint.address,
    delegateRole: MetadataDelegateRole.Data,
    updateAuthority: updateAuthority.address,
    delegate: dataDelegate.address,
  });

  t.is(delegateRecord.data.mint, mint.address);
  t.is(delegateRecord.data.delegate, dataDelegate.address);
  t.is(delegateRecord.data.updateAuthority, updateAuthority.address);
});

/**
 * Test: Approve data delegate for FungibleAsset
 */
test('it can approve a data delegate for a FungibleAsset', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const updateAuthority = await createKeypair();

  await airdrop(rpc, updateAuthority.address);

  // Create a FungibleAsset token
  const createIx = await createFungibleAsset({
    mint,
    authority: updateAuthority,
    payer: updateAuthority,
    name: 'Test Asset',
    uri: 'https://example.com/asset.json',
    sellerFeeBasisPoints: basisPoints(3),
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, updateAuthority]);

  // Approve a data delegate
  const dataDelegate = await createKeypair();
  const delegateInstruction = await getDelegateDataV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: dataDelegate.address,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [updateAuthority]);

  // Verify the metadata delegate record was created
  const delegateRecord = await fetchMetadataDelegateRecordFromSeeds(rpc, {
    mint: mint.address,
    delegateRole: MetadataDelegateRole.Data,
    updateAuthority: updateAuthority.address,
    delegate: dataDelegate.address,
  });

  t.is(delegateRecord.data.mint, mint.address);
  t.is(delegateRecord.data.delegate, dataDelegate.address);
  t.is(delegateRecord.data.updateAuthority, updateAuthority.address);
});
