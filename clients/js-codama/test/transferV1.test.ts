/**
 * TransferV1 tests for js-codama client
 *
 * These tests demonstrate transferring tokens for different token standards:
 * - NonFungible (NFT)
 * - Fungible
 * - ProgrammableNonFungible (PNFT)
 * - FungibleAsset
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-codama)
 */

import test from 'ava';
import { TokenStandard } from '../src/generated/types';
import {
  getCreateV1InstructionAsync,
  getMintV1InstructionAsync,
  getTransferV1InstructionAsync,
} from '../src/generated/instructions';
import { findMetadataPda } from '../src/generated/pdas';
import { findAssociatedTokenPda } from './_setup';
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

/**
 * Test: Transfer NonFungible to new owner
 */
test('it can transfer NonFungible to new owner', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const ownerA = await createKeypair();
  const ownerB = await createKeypair();
  const payer = ownerA;

  // Airdrop SOL to payer
  await airdrop(rpc, ownerA.address);

  // Create NonFungible token
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: ownerA,
    payer,
    name: 'My NFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    ownerA,
  ]);

  // Mint to owner A
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority: ownerA,
    payer,
    metadata: metadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
    tokenOwner: ownerA.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [ownerA]);

  // Verify owner A has the token
  const [tokenAccountA] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: ownerA.address,
  });
  const tokenA = await fetchToken(rpc, tokenAccountA);
  t.is(tokenA.data.amount, 1n, 'Owner A should have 1 token');

  // Transfer to owner B
  const transferInstruction = await getTransferV1InstructionAsync({
    mint: mint.address,
    tokenOwner: ownerA.address,
    destinationOwner: ownerB.address,
    authority: ownerA,
    payer: ownerA,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, transferInstruction, [ownerA]);

  // Verify owner B has the token
  const [tokenAccountB] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: ownerB.address,
  });
  const tokenB = await fetchToken(rpc, tokenAccountB);
  t.is(tokenB.data.amount, 1n, 'Owner B should have 1 token');

  // Verify owner A no longer has the token
  const tokenAAfterTransfer = await fetchToken(rpc, tokenAccountA);
  t.is(tokenAAfterTransfer.data.amount, 0n, 'Owner A should have 0 tokens');

  t.pass('Successfully transferred NonFungible to new owner');
});

/**
 * Test: Transfer ProgrammableNonFungible
 */
test('it can transfer ProgrammableNonFungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const ownerA = await createKeypair();
  const ownerB = await createKeypair();
  const payer = ownerA;

  await airdrop(rpc, ownerA.address);

  // Create PNFT
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: ownerA,
    payer,
    name: 'My PNFT',
    uri: 'https://example.com/pnft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    ownerA,
  ]);

  // Mint to owner A
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority: ownerA,
    payer,
    metadata: metadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    tokenOwner: ownerA.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [ownerA]);

  // Verify owner A has the token
  const [tokenAccountA] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: ownerA.address,
  });
  const tokenA = await fetchToken(rpc, tokenAccountA);
  t.is(tokenA.data.amount, 1n);

  // Transfer to owner B
  const transferInstruction = await getTransferV1InstructionAsync({
    mint: mint.address,
    tokenOwner: ownerA.address,
    destinationOwner: ownerB.address,
    authority: ownerA,
    payer: ownerA,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, transferInstruction, [ownerA]);

  // Verify owner B has the token
  const [tokenAccountB] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: ownerB.address,
  });
  const tokenB = await fetchToken(rpc, tokenAccountB);
  t.is(tokenB.data.amount, 1n, 'Owner B should have 1 PNFT');

  // Verify owner A no longer has the token
  const tokenAAfterTransfer = await fetchToken(rpc, tokenAccountA);
  t.is(tokenAAfterTransfer.data.amount, 0n, 'Owner A should have 0 tokens');

  t.pass('Successfully transferred ProgrammableNonFungible');
});

/**
 * Test: Transfer partial amount of Fungible tokens
 */
test('it can transfer partial amount of Fungible tokens', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const ownerA = await createKeypair();
  const ownerB = await createKeypair();
  const payer = ownerA;

  await airdrop(rpc, ownerA.address);

  // Create Fungible token
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: ownerA,
    payer,
    name: 'Fungible Token',
    uri: 'https://example.com/fungible.json',
    sellerFeeBasisPoints: basisPoints(2.5),
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    ownerA,
  ]);

  // Mint 100 tokens to owner A
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority: ownerA,
    payer,
    metadata: metadataAddress,
    amount: 100,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [ownerA]);

  // Verify owner A has 100 tokens
  const [tokenAccountA] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: ownerA.address,
  });
  const tokenABefore = await fetchToken(rpc, tokenAccountA);
  t.is(tokenABefore.data.amount, 100n);

  // Transfer 42 tokens to owner B
  const transferInstruction = await getTransferV1InstructionAsync({
    mint: mint.address,
    tokenOwner: ownerA.address,
    destinationOwner: ownerB.address,
    authority: ownerA,
    payer: ownerA,
    amount: 42,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, transferInstruction, [ownerA]);

  // Verify owner A has 58 tokens
  const tokenAAfter = await fetchToken(rpc, tokenAccountA);
  t.is(tokenAAfter.data.amount, 58n, 'Owner A should have 58 tokens');

  // Verify owner B has 42 tokens
  const [tokenAccountB] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: ownerB.address,
  });
  const tokenB = await fetchToken(rpc, tokenAccountB);
  t.is(tokenB.data.amount, 42n, 'Owner B should have 42 tokens');

  t.pass('Successfully transferred partial Fungible tokens');
});

/**
 * Test: Transfer all FungibleAsset tokens
 */
test('it can transfer all FungibleAsset tokens', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const ownerA = await createKeypair();
  const ownerB = await createKeypair();
  const payer = ownerA;

  await airdrop(rpc, ownerA.address);

  // Create FungibleAsset
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: ownerA,
    payer,
    name: 'Fungible Asset',
    uri: 'https://example.com/asset.json',
    sellerFeeBasisPoints: basisPoints(3),
    tokenStandard: TokenStandard.FungibleAsset,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    ownerA,
  ]);

  // Mint 250 tokens to owner A
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority: ownerA,
    payer,
    metadata: metadataAddress,
    amount: 250,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [ownerA]);

  // Transfer all 250 tokens to owner B
  const transferInstruction = await getTransferV1InstructionAsync({
    mint: mint.address,
    tokenOwner: ownerA.address,
    destinationOwner: ownerB.address,
    authority: ownerA,
    payer: ownerA,
    amount: 250,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, transferInstruction, [ownerA]);

  // Verify owner A has 0 tokens
  const [tokenAccountA] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: ownerA.address,
  });
  const tokenA = await fetchToken(rpc, tokenAccountA);
  t.is(tokenA.data.amount, 0n, 'Owner A should have 0 tokens');

  // Verify owner B has all 250 tokens
  const [tokenAccountB] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: ownerB.address,
  });
  const tokenB = await fetchToken(rpc, tokenAccountB);
  t.is(tokenB.data.amount, 250n, 'Owner B should have 250 tokens');

  t.pass('Successfully transferred all FungibleAsset tokens');
});
