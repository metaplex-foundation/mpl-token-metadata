/**
 * fetchDigitalAsset tests for js-codama client
 *
 * These tests demonstrate using the high-level digitalAsset API:
 * - fetchDigitalAsset: Fetch a complete digital asset by mint address
 * - fetchDigitalAssetByMetadata: Fetch by metadata address
 * - fetchAllDigitalAsset: Batch fetch multiple digital assets
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-codama)
 */

import test from 'ava';
import { TokenStandard } from '../src/generated/types';
import { getCreateV1InstructionAsync } from '../src/generated/instructions';
import { findMetadataPda } from '../src/generated/pdas';
import { SPL_TOKEN_PROGRAM_ADDRESS } from './_setup';
import {
  fetchDigitalAsset,
  fetchDigitalAssetByMetadata,
  fetchAllDigitalAsset,
} from '../src/hooked/digitalAsset';
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
 * Test: Fetch a NonFungible digital asset
 */
test('it can fetch a NonFungible digital asset', async (t) => {
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

  // Create NFT
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer: authority,
    name: 'Test NFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: basisPoints(5.5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    authority,
  ]);

  // Fetch the digital asset
  const digitalAsset = await fetchDigitalAsset(rpc, mint.address);

  // Verify the digital asset structure
  t.is(digitalAsset.address, mint.address);
  t.truthy(digitalAsset.mint);
  t.truthy(digitalAsset.metadata);
  t.is(digitalAsset.metadata.name, 'Test NFT');
  t.is(digitalAsset.metadata.uri, 'https://example.com/nft.json');
  t.is(digitalAsset.metadata.sellerFeeBasisPoints, basisPoints(5.5));

  // Note: Edition data may or may not be present immediately after creation
  // depending on whether the master edition has been initialized
  // Just verify the core metadata structure is correct

  t.pass('Successfully fetched NonFungible digital asset');
});

/**
 * Test: Fetch digital asset by metadata address
 */
test('it can fetch a digital asset by metadata address', async (t) => {
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

  // Create NFT
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer: authority,
    name: 'Test NFT 2',
    uri: 'https://example.com/nft2.json',
    sellerFeeBasisPoints: basisPoints(2.5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    authority,
  ]);

  // Get metadata address
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });

  // Fetch by metadata address
  const digitalAsset = await fetchDigitalAssetByMetadata(rpc, metadataAddress);

  // Verify the data
  t.is(digitalAsset.address, mint.address);
  t.is(digitalAsset.metadata.name, 'Test NFT 2');
  t.is(digitalAsset.metadata.uri, 'https://example.com/nft2.json');

  t.pass('Successfully fetched digital asset by metadata address');
});

/**
 * Test: Fetch a Fungible digital asset (no edition)
 */
test('it can fetch a Fungible digital asset without edition', async (t) => {
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

  // Create Fungible token
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer: authority,
    name: 'Test Fungible',
    uri: 'https://example.com/fungible.json',
    sellerFeeBasisPoints: basisPoints(1),
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    authority,
  ]);

  // Fetch the digital asset
  const digitalAsset = await fetchDigitalAsset(rpc, mint.address);

  // Verify structure
  t.is(digitalAsset.address, mint.address);
  t.is(digitalAsset.metadata.name, 'Test Fungible');

  // Fungible tokens don't have editions
  t.is(digitalAsset.edition, undefined);

  t.pass('Successfully fetched Fungible digital asset');
});

/**
 * Test: Batch fetch multiple digital assets
 */
test('it can fetch multiple digital assets in a batch', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint1 = await createKeypair();
  const mint2 = await createKeypair();
  const mint3 = await createKeypair();
  const authority = await createKeypair();

  await airdrop(rpc, authority.address);

  // Create three NFTs
  for (const [index, mint] of [mint1, mint2, mint3].entries()) {
    const createInstruction = await getCreateV1InstructionAsync({
      mint,
      authority,
      payer: authority,
      name: `Batch NFT ${index + 1}`,
      uri: `https://example.com/batch${index + 1}.json`,
      sellerFeeBasisPoints: basisPoints(2),
      tokenStandard: TokenStandard.NonFungible,
    });

    await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
      mint,
      authority,
    ]);
  }

  // Fetch all three at once
  const digitalAssets = await fetchAllDigitalAsset(rpc, [
    mint1.address,
    mint2.address,
    mint3.address,
  ]);

  // Verify we got all three
  t.is(digitalAssets.length, 3);

  // Verify each asset
  for (const [index, asset] of digitalAssets.entries()) {
    t.truthy(asset.mint);
    t.truthy(asset.metadata);
    t.is(asset.metadata.name, `Batch NFT ${index + 1}`);
    t.is(asset.metadata.uri, `https://example.com/batch${index + 1}.json`);
    // Note: Edition data may or may not be present depending on initialization
  }

  t.pass('Successfully batch fetched multiple digital assets');
});

/**
 * Test: Batch fetch with empty array
 */
test('it returns empty array when fetching with no mints', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();

  // Fetch with empty array
  const digitalAssets = await fetchAllDigitalAsset(rpc, []);

  t.is(digitalAssets.length, 0);
  t.pass('Successfully handled empty mint array');
});
