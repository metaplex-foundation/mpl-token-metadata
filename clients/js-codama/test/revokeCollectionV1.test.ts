/**
 * RevokeCollectionV1 tests for js-codama client
 *
 * Collection delegates are metadata-level delegates that can manage collections.
 * They work for all non-edition token standards.
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-codama)
 */

import test from 'ava';
import { TokenStandard, MetadataDelegateRole } from '../src/generated/types';
import {
  getDelegateCollectionV1InstructionAsync,
  getRevokeCollectionV1InstructionAsync,
} from '../src/generated/instructions';
import { findMetadataDelegateRecordPda } from '../src/generated/pdas';
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
 * Test: Revoke collection delegate for NonFungible
 */
test('it can revoke a collection delegate for a NonFungible', async (t) => {
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

  // Approve a collection delegate
  const collectionDelegate = await createKeypair();
  const delegateInstruction = await getDelegateCollectionV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: collectionDelegate.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [updateAuthority]);

  // Verify the metadata delegate record was created
  const [delegateRecordAddress] = await findMetadataDelegateRecordPda({
    mint: mint.address,
    delegateRole: MetadataDelegateRole.Collection,
    updateAuthority: updateAuthority.address,
    delegate: collectionDelegate.address,
  });

  const delegateRecord = await fetchMetadataDelegateRecordFromSeeds(rpc, {
    mint: mint.address,
    delegateRole: MetadataDelegateRole.Collection,
    updateAuthority: updateAuthority.address,
    delegate: collectionDelegate.address,
  });

  t.is(delegateRecord.data.mint, mint.address);
  t.is(delegateRecord.data.delegate, collectionDelegate.address);

  // Revoke the collection delegate
  const revokeInstruction = await getRevokeCollectionV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: collectionDelegate.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, revokeInstruction, [updateAuthority]);

  // Verify the metadata delegate record was deleted
  const accountInfo = await rpc.getAccountInfo(delegateRecordAddress).send();
  t.is(accountInfo.value, null);
});

/**
 * Test: Revoke collection delegate for ProgrammableNonFungible
 */
test('it can revoke a collection delegate for a ProgrammableNonFungible', async (t) => {
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

  // Approve a collection delegate
  const collectionDelegate = await createKeypair();
  const delegateInstruction = await getDelegateCollectionV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: collectionDelegate.address,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [updateAuthority]);

  // Verify the metadata delegate record was created
  const [delegateRecordAddress] = await findMetadataDelegateRecordPda({
    mint: mint.address,
    delegateRole: MetadataDelegateRole.Collection,
    updateAuthority: updateAuthority.address,
    delegate: collectionDelegate.address,
  });

  const delegateRecord = await fetchMetadataDelegateRecordFromSeeds(rpc, {
    mint: mint.address,
    delegateRole: MetadataDelegateRole.Collection,
    updateAuthority: updateAuthority.address,
    delegate: collectionDelegate.address,
  });

  t.is(delegateRecord.data.mint, mint.address);
  t.is(delegateRecord.data.delegate, collectionDelegate.address);

  // Revoke the collection delegate
  const revokeInstruction = await getRevokeCollectionV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: collectionDelegate.address,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, revokeInstruction, [updateAuthority]);

  // Verify the metadata delegate record was deleted
  const accountInfo = await rpc.getAccountInfo(delegateRecordAddress).send();
  t.is(accountInfo.value, null);
});

/**
 * Test: Revoke collection delegate for Fungible
 */
test('it can revoke a collection delegate for a Fungible', async (t) => {
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

  // Approve a collection delegate
  const collectionDelegate = await createKeypair();
  const delegateInstruction = await getDelegateCollectionV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: collectionDelegate.address,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [updateAuthority]);

  // Verify the metadata delegate record was created
  const [delegateRecordAddress] = await findMetadataDelegateRecordPda({
    mint: mint.address,
    delegateRole: MetadataDelegateRole.Collection,
    updateAuthority: updateAuthority.address,
    delegate: collectionDelegate.address,
  });

  const delegateRecord = await fetchMetadataDelegateRecordFromSeeds(rpc, {
    mint: mint.address,
    delegateRole: MetadataDelegateRole.Collection,
    updateAuthority: updateAuthority.address,
    delegate: collectionDelegate.address,
  });

  t.is(delegateRecord.data.mint, mint.address);
  t.is(delegateRecord.data.delegate, collectionDelegate.address);

  // Revoke the collection delegate
  const revokeInstruction = await getRevokeCollectionV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: collectionDelegate.address,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, revokeInstruction, [updateAuthority]);

  // Verify the metadata delegate record was deleted
  const accountInfo = await rpc.getAccountInfo(delegateRecordAddress).send();
  t.is(accountInfo.value, null);
});

/**
 * Test: Revoke collection delegate for FungibleAsset
 */
test('it can revoke a collection delegate for a FungibleAsset', async (t) => {
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

  // Approve a collection delegate
  const collectionDelegate = await createKeypair();
  const delegateInstruction = await getDelegateCollectionV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: collectionDelegate.address,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [updateAuthority]);

  // Verify the metadata delegate record was created
  const [delegateRecordAddress] = await findMetadataDelegateRecordPda({
    mint: mint.address,
    delegateRole: MetadataDelegateRole.Collection,
    updateAuthority: updateAuthority.address,
    delegate: collectionDelegate.address,
  });

  const delegateRecord = await fetchMetadataDelegateRecordFromSeeds(rpc, {
    mint: mint.address,
    delegateRole: MetadataDelegateRole.Collection,
    updateAuthority: updateAuthority.address,
    delegate: collectionDelegate.address,
  });

  t.is(delegateRecord.data.mint, mint.address);
  t.is(delegateRecord.data.delegate, collectionDelegate.address);

  // Revoke the collection delegate
  const revokeInstruction = await getRevokeCollectionV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: collectionDelegate.address,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, revokeInstruction, [updateAuthority]);

  // Verify the metadata delegate record was deleted
  const accountInfo = await rpc.getAccountInfo(delegateRecordAddress).send();
  t.is(accountInfo.value, null);
});

/**
 * Test: Self-revoke collection delegate for NonFungible
 */
test('it can self-revoke a collection delegate for a NonFungible', async (t) => {
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

  // Approve a collection delegate
  const collectionDelegate = await createKeypair();
  await airdrop(rpc, collectionDelegate.address);

  const delegateInstruction = await getDelegateCollectionV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: collectionDelegate.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [updateAuthority]);

  // Verify the metadata delegate record was created
  const [delegateRecordAddress] = await findMetadataDelegateRecordPda({
    mint: mint.address,
    delegateRole: MetadataDelegateRole.Collection,
    updateAuthority: updateAuthority.address,
    delegate: collectionDelegate.address,
  });

  const delegateRecord = await fetchMetadataDelegateRecordFromSeeds(rpc, {
    mint: mint.address,
    delegateRole: MetadataDelegateRole.Collection,
    updateAuthority: updateAuthority.address,
    delegate: collectionDelegate.address,
  });

  t.is(delegateRecord.data.mint, mint.address);
  t.is(delegateRecord.data.delegate, collectionDelegate.address);

  // Self-revoke the collection delegate (the delegate itself revokes)
  const revokeInstruction = await getRevokeCollectionV1InstructionAsync({
    mint: mint.address,
    authority: collectionDelegate,
    payer: collectionDelegate,
    updateAuthority: updateAuthority.address,
    delegate: collectionDelegate.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, revokeInstruction, [collectionDelegate]);

  // Verify the metadata delegate record was deleted
  const accountInfo = await rpc.getAccountInfo(delegateRecordAddress).send();
  t.is(accountInfo.value, null);
});
