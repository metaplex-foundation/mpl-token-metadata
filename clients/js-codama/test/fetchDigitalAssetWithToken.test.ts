/**
 * fetchDigitalAssetWithToken tests for js-codama client
 *
 * These tests demonstrate using the digitalAssetWithToken API:
 * - fetchDigitalAssetWithToken: Fetch with explicit token address
 * - fetchDigitalAssetWithAssociatedToken: Fetch using ATA
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
} from '../src/generated/instructions';
import { findMetadataPda } from '../src/generated/pdas';
import { findAssociatedTokenPda, SPL_TOKEN_PROGRAM_ADDRESS } from './_setup';
import {
  fetchDigitalAssetWithToken,
  fetchDigitalAssetWithAssociatedToken,
} from '../src/hooked/digitalAssetWithToken';
import {
  createKeypair,
  createRpc,
  createRpcSubscriptions,
  basisPoints,
  canRunTests,
  getSkipMessage,
  airdrop,
  sendAndConfirm,
} from './_setup';

/**
 * Test: Fetch NonFungible digital asset with token
 */
test('it can fetch a NonFungible with token account', async (t) => {
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

  // Create and mint NFT
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: owner,
    payer: owner,
    name: 'Test NFT with Token',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    owner,
  ]);

  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer: owner,
    metadata: metadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
    tokenOwner: owner.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [owner]);

  // Get token address
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });

  // Fetch digital asset with token
  const assetWithToken = await fetchDigitalAssetWithToken(
    rpc,
    mint.address,
    tokenAddress
  );

  // Verify structure
  t.is(assetWithToken.address, mint.address);
  t.truthy(assetWithToken.mint);
  t.truthy(assetWithToken.metadata);
  t.is(assetWithToken.metadata.name, 'Test NFT with Token');

  // Verify token account data
  t.truthy(assetWithToken.token);
  t.is(assetWithToken.token.mint, mint.address);
  t.is(assetWithToken.token.owner, owner.address);
  t.is(assetWithToken.token.amount, 1n);

  // NFTs don't have token records by default
  t.is(assetWithToken.tokenRecord, undefined);

  t.pass('Successfully fetched NonFungible with token account');
});

/**
 * Test: Fetch using associated token account
 */
test('it can fetch using associated token account', async (t) => {
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

  // Create and mint NFT
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: owner,
    payer: owner,
    name: 'Test ATA NFT',
    uri: 'https://example.com/ata-nft.json',
    sellerFeeBasisPoints: basisPoints(3),
    tokenStandard: TokenStandard.NonFungible,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    owner,
  ]);

  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer: owner,
    metadata: metadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
    tokenOwner: owner.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [owner]);

  // Fetch using owner address (ATA will be derived automatically)
  const assetWithToken = await fetchDigitalAssetWithAssociatedToken(
    rpc,
    mint.address,
    owner.address
  );

  // Verify data
  t.is(assetWithToken.metadata.name, 'Test ATA NFT');
  t.is(assetWithToken.token.owner, owner.address);
  t.is(assetWithToken.token.amount, 1n);

  t.pass('Successfully fetched using associated token account');
});

/**
 * Test: Fetch Fungible with token account
 */
test('it can fetch a Fungible with token account', async (t) => {
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

  // Create Fungible token
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: owner,
    payer: owner,
    name: 'Test Fungible Token',
    uri: 'https://example.com/fungible.json',
    sellerFeeBasisPoints: basisPoints(1),
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    owner,
  ]);

  // Mint 1000 tokens
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer: owner,
    metadata: metadataAddress,
    amount: 1000,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [owner]);

  // Fetch with token
  const assetWithToken = await fetchDigitalAssetWithAssociatedToken(
    rpc,
    mint.address,
    owner.address
  );

  // Verify
  t.is(assetWithToken.metadata.name, 'Test Fungible Token');
  t.is(assetWithToken.token.amount, 1000n);
  t.is(assetWithToken.edition, undefined); // Fungibles don't have editions
  t.is(assetWithToken.tokenRecord, undefined); // Fungibles don't have token records

  t.pass('Successfully fetched Fungible with token account');
});

/**
 * Test: Fetch ProgrammableNonFungible with token record
 */
test('it can fetch a ProgrammableNonFungible with token record', async (t) => {
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

  // Create PNFT
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: owner,
    payer: owner,
    name: 'Test PNFT',
    uri: 'https://example.com/pnft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    owner,
  ]);

  // Mint PNFT
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority: owner,
    payer: owner,
    metadata: metadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    tokenOwner: owner.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [owner]);

  // Fetch with token
  const assetWithToken = await fetchDigitalAssetWithAssociatedToken(
    rpc,
    mint.address,
    owner.address
  );

  // Verify
  t.is(assetWithToken.metadata.name, 'Test PNFT');
  t.is(assetWithToken.token.amount, 1n);

  // PNFTs have token records
  t.truthy(assetWithToken.tokenRecord);

  t.pass('Successfully fetched ProgrammableNonFungible with token record');
});
