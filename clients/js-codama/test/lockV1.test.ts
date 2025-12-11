/**
 * LockV1 tests for js-codama client
 *
 * These tests demonstrate locking tokens:
 * - ProgrammableNonFungible: Updates token record state to Locked
 * - NonFungible/Fungible: Freezes the token account
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
} from '../src/generated/instructions';
import {
  findMetadataPda,
  findTokenRecordPda,
} from '../src/generated/pdas';
import { findAssociatedTokenPda, SPL_TOKEN_PROGRAM_ADDRESS } from './_setup';
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
 * Test: Lock ProgrammableNonFungible with utility delegate
 */
test('it can lock a ProgrammableNonFungible with utility delegate', async (t) => {
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

  // Verify initial token record state is Unlocked
  const [tokenRecordAddress] = await findTokenRecordPda({
    mint: mint.address,
    token: tokenAddress,
  });
  const tokenRecordBefore = await fetchTokenRecord(rpc, tokenRecordAddress);
  t.is(tokenRecordBefore.data.state, TokenState.Unlocked);

  // Lock the token using utility delegate
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

  // Verify token record state is now Locked
  const tokenRecordAfter = await fetchTokenRecord(rpc, tokenRecordAddress);
  t.is(tokenRecordAfter.data.state, TokenState.Locked);

  t.pass('Successfully locked ProgrammableNonFungible with utility delegate');
});

/**
 * Test: Freeze NonFungible with standard delegate
 */
test('it can freeze a NonFungible with standard delegate', async (t) => {
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
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
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

  // Verify token account is not frozen initially
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });
  const tokenBefore = await fetchToken(rpc, tokenAddress);
  t.is(tokenBefore.data.state, AccountState.Initialized);

  // Lock (freeze) the token using standard delegate
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

  // Verify token account is now frozen
  const tokenAfter = await fetchToken(rpc, tokenAddress);
  t.is(tokenAfter.data.state, AccountState.Frozen);

  t.pass('Successfully froze NonFungible with standard delegate');
});

/**
 * Test: Freeze Fungible with freeze authority
 */
test('it can freeze a Fungible with freeze authority', async (t) => {
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

  // Verify token account is not frozen initially
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });
  const tokenBefore = await fetchToken(rpc, tokenAddress);
  t.is(tokenBefore.data.state, AccountState.Initialized);

  // Lock (freeze) the token using freeze authority (which is the owner)
  const lockInstruction = await getLockV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer: owner,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, lockInstruction, [owner]);

  // Verify token account is now frozen
  const tokenAfter = await fetchToken(rpc, tokenAddress);
  t.is(tokenAfter.data.state, AccountState.Frozen);

  t.pass('Successfully froze Fungible with freeze authority');
});

/**
 * Test: Freeze FungibleAsset with freeze authority
 */
test('it can freeze a FungibleAsset with freeze authority', async (t) => {
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
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
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
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [owner]);

  // Verify token account is not frozen initially
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });
  const tokenBefore = await fetchToken(rpc, tokenAddress);
  t.is(tokenBefore.data.state, AccountState.Initialized);

  // Lock (freeze) the token
  const lockInstruction = await getLockV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer: owner,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, lockInstruction, [owner]);

  // Verify token account is now frozen
  const tokenAfter = await fetchToken(rpc, tokenAddress);
  t.is(tokenAfter.data.state, AccountState.Frozen);

  t.pass('Successfully froze FungibleAsset with freeze authority');
});
