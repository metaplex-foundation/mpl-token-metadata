/**
 * UnlockV1 tests for js-codama client
 *
 * These tests demonstrate unlocking tokens:
 * - ProgrammableNonFungible: Updates token record state from Locked to Unlocked
 * - NonFungible/Fungible: Unfreezes (thaws) the token account
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-codama)
 */

import test from 'ava';
import { TokenStandard, TokenState } from '../src/generated/types';
import {
  getCreateV1InstructionAsync,
  getMintV1InstructionAsync,
  getDelegateUtilityV1InstructionAsync,
  getDelegateStandardV1InstructionAsync,
  getLockV1InstructionAsync,
  getUnlockV1InstructionAsync,
} from '../src/generated/instructions';
import {
  findMetadataPda,
  findTokenRecordPda,
} from '../src/generated/pdas';
import { findAssociatedTokenPda } from './_setup';
import { fetchTokenRecord } from '../src/generated/accounts';
import {
  createKeypair,
  createRpc,
  createRpcSubscriptions,
  basisPoints,
  canRunTests,
  getSkipMessage,
  airdrop,
  sendAndConfirm,
  fetchToken,
} from './_setup';
import { AccountState } from '@solana-program/token';

/**
 * Test: Unlock ProgrammableNonFungible with utility delegate
 */
test('it can unlock a ProgrammableNonFungible with utility delegate', async (t) => {
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
  const utilityDelegate = await createKeypair();
  const payer = owner;

  await airdrop(rpc, owner.address);

  // Create ProgrammableNonFungible
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: owner,
    payer,
    name: 'My PNFT',
    uri: 'https://example.com/pnft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    owner,
  ]);

  // Mint the PNFT
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer,
    metadata: metadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    tokenOwner: owner.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [owner]);

  // Delegate utility to another keypair
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });

  const delegateInstruction = await getDelegateUtilityV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer: owner,
    tokenOwner: owner.address,
    delegate: utilityDelegate.address,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [owner]);

  // Lock the token
  const lockInstruction = await getLockV1InstructionAsync({
    mint: mint.address,
    authority: utilityDelegate,
    payer: owner,
    tokenOwner: owner.address,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, lockInstruction, [
    utilityDelegate,
    owner,
  ]);

  // Verify token record state is Locked
  const [tokenRecordAddress] = await findTokenRecordPda({
    mint: mint.address,
    token: tokenAddress,
  });
  const tokenRecordLocked = await fetchTokenRecord(rpc, tokenRecordAddress);
  t.is(tokenRecordLocked.data.state, TokenState.Locked);

  // Unlock the token using utility delegate
  const unlockInstruction = await getUnlockV1InstructionAsync({
    mint: mint.address,
    authority: utilityDelegate,
    payer: owner,
    tokenOwner: owner.address,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, unlockInstruction, [
    utilityDelegate,
    owner,
  ]);

  // Verify token record state is now Unlocked
  const tokenRecordUnlocked = await fetchTokenRecord(rpc, tokenRecordAddress);
  t.is(tokenRecordUnlocked.data.state, TokenState.Unlocked);

  t.pass('Successfully unlocked ProgrammableNonFungible with utility delegate');
});

/**
 * Test: Unfreeze NonFungible with standard delegate
 */
test('it can unfreeze a NonFungible with standard delegate', async (t) => {
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
  const standardDelegate = await createKeypair();
  const payer = owner;

  await airdrop(rpc, owner.address);

  // Create NonFungible
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: owner,
    payer,
    name: 'My NFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    owner,
  ]);

  // Mint the NFT
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer,
    metadata: metadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
    tokenOwner: owner.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [owner]);

  // Delegate standard authority
  const delegateInstruction = await getDelegateStandardV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer: owner,
    tokenOwner: owner.address,
    delegate: standardDelegate.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [owner]);

  // Lock (freeze) the token
  const lockInstruction = await getLockV1InstructionAsync({
    mint: mint.address,
    authority: standardDelegate,
    payer: owner,
    tokenOwner: owner.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, lockInstruction, [
    standardDelegate,
    owner,
  ]);

  // Verify token account is frozen
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });
  const tokenFrozen = await fetchToken(rpc, tokenAddress);
  t.is(tokenFrozen.data.state, AccountState.Frozen);

  // Unlock (unfreeze) the token using standard delegate
  const unlockInstruction = await getUnlockV1InstructionAsync({
    mint: mint.address,
    authority: standardDelegate,
    payer: owner,
    tokenOwner: owner.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, unlockInstruction, [
    standardDelegate,
    owner,
  ]);

  // Verify token account is now unfrozen
  const tokenUnfrozen = await fetchToken(rpc, tokenAddress);
  t.is(tokenUnfrozen.data.state, AccountState.Initialized);

  t.pass('Successfully unfroze NonFungible with standard delegate');
});

/**
 * Test: Unfreeze Fungible with freeze authority
 */
test('it can unfreeze a Fungible with freeze authority', async (t) => {
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
  const payer = owner;

  await airdrop(rpc, owner.address);

  // Create Fungible (owner is also the freeze authority)
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: owner,
    payer,
    name: 'Fungible Token',
    uri: 'https://example.com/fungible.json',
    sellerFeeBasisPoints: basisPoints(2.5),
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    owner,
  ]);

  // Mint tokens
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer,
    metadata: metadataAddress,
    amount: 100,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [owner]);

  // Lock (freeze) the token
  const lockInstruction = await getLockV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer: owner,
    tokenOwner: owner.address,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, lockInstruction, [owner]);

  // Verify token account is frozen
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });
  const tokenFrozen = await fetchToken(rpc, tokenAddress);
  t.is(tokenFrozen.data.state, AccountState.Frozen);

  // Unlock (unfreeze) the token using freeze authority
  const unlockInstruction = await getUnlockV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer: owner,
    tokenOwner: owner.address,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, unlockInstruction, [owner]);

  // Verify token account is now unfrozen
  const tokenUnfrozen = await fetchToken(rpc, tokenAddress);
  t.is(tokenUnfrozen.data.state, AccountState.Initialized);

  t.pass('Successfully unfroze Fungible with freeze authority');
});

/**
 * Test: Unfreeze FungibleAsset with freeze authority
 */
test('it can unfreeze a FungibleAsset with freeze authority', async (t) => {
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
  const payer = owner;

  await airdrop(rpc, owner.address);

  // Create FungibleAsset
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: owner,
    payer,
    name: 'Fungible Asset',
    uri: 'https://example.com/asset.json',
    sellerFeeBasisPoints: basisPoints(3),
    tokenStandard: TokenStandard.FungibleAsset,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    owner,
  ]);

  // Mint tokens
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer,
    metadata: metadataAddress,
    amount: 50,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [owner]);

  // Lock (freeze) the token
  const lockInstruction = await getLockV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer: owner,
    tokenOwner: owner.address,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, lockInstruction, [owner]);

  // Verify token account is frozen
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });
  const tokenFrozen = await fetchToken(rpc, tokenAddress);
  t.is(tokenFrozen.data.state, AccountState.Frozen);

  // Unlock (unfreeze) the token
  const unlockInstruction = await getUnlockV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer: owner,
    tokenOwner: owner.address,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, unlockInstruction, [owner]);

  // Verify token account is now unfrozen
  const tokenUnfrozen = await fetchToken(rpc, tokenAddress);
  t.is(tokenUnfrozen.data.state, AccountState.Initialized);

  t.pass('Successfully unfroze FungibleAsset with freeze authority');
});
