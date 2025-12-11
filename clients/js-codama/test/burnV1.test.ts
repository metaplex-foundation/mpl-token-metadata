/**
 * BurnV1 tests for js-codama client
 *
 * These tests demonstrate burning tokens for different token standards:
 * - NonFungible (NFT)
 * - Fungible
 * - ProgrammableNonFungible (PNFT)
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
  getBurnV1InstructionAsync,
} from '../src/generated/instructions';
import { findMetadataPda } from '../src/generated/pdas';
import { findAssociatedTokenPda, SPL_TOKEN_PROGRAM_ADDRESS } from './_setup';
import {
  createKeypair,
  createRpc,
  createRpcSubscriptions,
  basisPoints,
  canRunTests,
  getSkipMessage,
  airdrop,
  sendAndConfirm,
  fetchMint,
  fetchToken,
} from './_setup';

/**
 * Test: Burn NonFungible token
 */
test('it can burn NonFungible token', async (t) => {
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

  // Airdrop SOL to payer
  await airdrop(rpc, owner.address);

  // Create NonFungible token
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

  // Mint the token
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

  // Verify mint supply is 1
  const mintAccountBefore = await fetchMint(rpc, mint.address);
  t.is(mintAccountBefore.data.supply, 1n);

  // Burn the token
  const burnInstruction = await getBurnV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    tokenOwner: owner.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, burnInstruction, [owner]);

  // Verify mint supply is 0
  const mintAccountAfter = await fetchMint(rpc, mint.address);
  t.is(mintAccountAfter.data.supply, 0n, 'Mint supply should be 0 after burn');

  t.pass('Successfully burned NonFungible token');
});

/**
 * Test: Burn ProgrammableNonFungible token
 */
test('it can burn ProgrammableNonFungible token', async (t) => {
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

  // Create PNFT
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

  // Verify mint supply is 1
  const mintAccountBefore = await fetchMint(rpc, mint.address);
  t.is(mintAccountBefore.data.supply, 1n);

  // Burn the PNFT
  const burnInstruction = await getBurnV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    tokenOwner: owner.address,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, burnInstruction, [owner]);

  // Verify mint supply is 0
  const mintAccountAfter = await fetchMint(rpc, mint.address);
  t.is(mintAccountAfter.data.supply, 0n, 'PNFT supply should be 0 after burn');

  t.pass('Successfully burned ProgrammableNonFungible token');
});

/**
 * Test: Burn partial amount of Fungible tokens
 */
test('it can burn partial amount of Fungible tokens', async (t) => {
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

  // Create Fungible token
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

  // Mint 100 tokens
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

  // Verify mint supply is 100
  const mintAccountBefore = await fetchMint(rpc, mint.address);
  t.is(mintAccountBefore.data.supply, 100n);

  // Burn 42 tokens
  const burnInstruction = await getBurnV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    tokenOwner: owner.address,
    amount: 42,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, burnInstruction, [owner]);

  // Verify mint supply decreased to 58
  const mintAccountAfter = await fetchMint(rpc, mint.address);
  t.is(mintAccountAfter.data.supply, 58n, 'Supply should be 58 after burning 42');

  // Verify token account has 58 tokens
  const [tokenAccount] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });
  const tokenData = await fetchToken(rpc, tokenAccount);
  t.is(tokenData.data.amount, 58n, 'Token account should have 58 tokens');

  t.pass('Successfully burned partial Fungible tokens');
});

/**
 * Test: Burn all Fungible tokens
 */
test('it can burn all Fungible tokens', async (t) => {
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

  // Create Fungible token
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: owner,
    payer,
    name: 'Fungible Token',
    uri: 'https://example.com/fungible.json',
    sellerFeeBasisPoints: basisPoints(3),
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    owner,
  ]);

  // Mint 150 tokens
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer,
    metadata: metadataAddress,
    amount: 150,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [owner]);

  // Verify mint supply is 150
  const mintAccountBefore = await fetchMint(rpc, mint.address);
  t.is(mintAccountBefore.data.supply, 150n);

  // Burn all 150 tokens
  const burnInstruction = await getBurnV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    tokenOwner: owner.address,
    amount: 150,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, burnInstruction, [owner]);

  // Verify mint supply is 0
  const mintAccountAfter = await fetchMint(rpc, mint.address);
  t.is(mintAccountAfter.data.supply, 0n, 'Supply should be 0 after burning all');

  t.pass('Successfully burned all Fungible tokens');
});

/**
 * Test: Burn FungibleAsset token
 */
test('it can burn FungibleAsset token', async (t) => {
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
    sellerFeeBasisPoints: basisPoints(4),
    tokenStandard: TokenStandard.FungibleAsset,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    owner,
  ]);

  // Mint 75 tokens
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer,
    metadata: metadataAddress,
    amount: 75,
    tokenStandard: TokenStandard.FungibleAsset,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [owner]);

  // Burn 25 tokens
  const burnInstruction = await getBurnV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    tokenOwner: owner.address,
    amount: 25,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, burnInstruction, [owner]);

  // Verify mint supply is 50
  const mintAccountAfter = await fetchMint(rpc, mint.address);
  t.is(mintAccountAfter.data.supply, 50n, 'Supply should be 50 after burning 25');

  t.pass('Successfully burned FungibleAsset tokens');
});
