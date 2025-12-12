/**
 * Metadata fetching tests for js-kit client
 *
 * Tests fetching metadata accounts and related data from the blockchain
 */

import test from 'ava';
import { TokenStandard } from '../src/generated/types';
import {
  getCreateV1InstructionAsync,
} from '../src/generated/instructions';
import {
  findMetadataPda,
  findMasterEditionPda,
} from '../src/generated/pdas';
import {
  fetchMetadata,
  fetchMaybeMetadata,
  fetchAllMetadata,
  fetchMetadataFromSeeds,
} from '../src/generated/accounts/metadata';
import {
  fetchMasterEdition,
  fetchMaybeMasterEdition,
} from '../src/generated/accounts/masterEdition';
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

test('it can fetch metadata by address', async (t) => {
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

  // Create an NFT
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer: authority,
    name: 'Test NFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [mint, authority]);

  // Fetch metadata by address
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const metadata = await fetchMetadata(rpc, metadataAddress);

  t.truthy(metadata, 'Metadata should exist');
  t.is(metadata.address, metadataAddress, 'Address should match');
  t.is(metadata.data.mint, mint.address, 'Mint should match');
  t.is(metadata.data.name, 'Test NFT', 'Name should match');
  t.is(metadata.data.uri, 'https://example.com/nft.json', 'URI should match');
  t.is(metadata.data.sellerFeeBasisPoints, basisPoints(5), 'Seller fee should match');
});

test('it can fetch metadata from seeds', async (t) => {
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

  // Create an NFT
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer: authority,
    name: 'NFT from Seeds',
    uri: 'https://example.com/seeds.json',
    sellerFeeBasisPoints: basisPoints(2.5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [mint, authority]);

  // Fetch metadata using seeds
  const metadata = await fetchMetadataFromSeeds(rpc, { mint: mint.address });

  t.truthy(metadata, 'Metadata should exist');
  t.is(metadata.data.mint, mint.address, 'Mint should match');
  t.is(metadata.data.name, 'NFT from Seeds', 'Name should match');
  t.is(metadata.data.uri, 'https://example.com/seeds.json', 'URI should match');
});

test('it can fetch maybe metadata (exists)', async (t) => {
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

  // Create an NFT
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer: authority,
    name: 'Maybe NFT',
    uri: 'https://example.com/maybe.json',
    sellerFeeBasisPoints: basisPoints(1),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [mint, authority]);

  // Fetch maybe metadata
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const maybeMetadata = await fetchMaybeMetadata(rpc, metadataAddress);

  t.truthy(maybeMetadata.exists, 'Metadata should exist');
  if (maybeMetadata.exists) {
    t.is(maybeMetadata.data.name, 'Maybe NFT', 'Name should match');
  }
});

test('it can fetch maybe metadata (does not exist)', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const mint = await createKeypair();

  // Try to fetch metadata for a mint that doesn't have metadata
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const maybeMetadata = await fetchMaybeMetadata(rpc, metadataAddress);

  t.false(maybeMetadata.exists, 'Metadata should not exist');
});

test('it can fetch all metadata by addresses', async (t) => {
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
  const authority = await createKeypair();

  await airdrop(rpc, authority.address);

  // Create two NFTs
  const create1 = await getCreateV1InstructionAsync({
    mint: mint1,
    authority,
    payer: authority,
    name: 'NFT One',
    uri: 'https://example.com/1.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
  });

  const create2 = await getCreateV1InstructionAsync({
    mint: mint2,
    authority,
    payer: authority,
    name: 'NFT Two',
    uri: 'https://example.com/2.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, create1, [mint1, authority]);
  await sendAndConfirm(rpc, rpcSubscriptions, create2, [mint2, authority]);

  // Fetch all metadata
  const [metadata1Address] = await findMetadataPda({ mint: mint1.address });
  const [metadata2Address] = await findMetadataPda({ mint: mint2.address });
  const allMetadata = await fetchAllMetadata(rpc, [metadata1Address, metadata2Address]);

  t.is(allMetadata.length, 2, 'Should fetch 2 metadata accounts');

  const names = allMetadata.map((m) => m.data.name);
  t.true(names.includes('NFT One'), 'Should include NFT One');
  t.true(names.includes('NFT Two'), 'Should include NFT Two');
});

test('it can fetch master edition', async (t) => {
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

  // Create an NFT
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer: authority,
    name: 'Master Edition NFT',
    uri: 'https://example.com/master.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [mint, authority]);

  // Fetch master edition
  const [editionAddress] = await findMasterEditionPda({ mint: mint.address });
  const edition = await fetchMasterEdition(rpc, editionAddress);

  t.truthy(edition, 'Master edition should exist');
  t.is(edition.address, editionAddress, 'Address should match');
  t.is(edition.data.supply, 0n, 'Supply should be 0 for unprinted edition');
});

test('it can fetch maybe master edition (exists)', async (t) => {
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

  // Create an NFT
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer: authority,
    name: 'Maybe Edition',
    uri: 'https://example.com/maybe-edition.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [mint, authority]);

  // Fetch maybe master edition
  const [editionAddress] = await findMasterEditionPda({ mint: mint.address });
  const maybeEdition = await fetchMaybeMasterEdition(rpc, editionAddress);

  t.truthy(maybeEdition.exists, 'Master edition should exist');
  if (maybeEdition.exists) {
    t.is(maybeEdition.data.supply, 0n, 'Supply should be 0');
  }
});

test('it can fetch maybe master edition (does not exist)', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const mint = await createKeypair();

  // Try to fetch master edition for a mint that doesn't have one
  const [editionAddress] = await findMasterEditionPda({ mint: mint.address });
  const maybeEdition = await fetchMaybeMasterEdition(rpc, editionAddress);

  t.false(maybeEdition.exists, 'Master edition should not exist');
});

test('it can verify fetched metadata properties', async (t) => {
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

  // Create NFT with specific properties
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer: authority,
    name: 'Property Test NFT',
    uri: 'https://example.com/properties.json',
    sellerFeeBasisPoints: basisPoints(7.5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [mint, authority]);

  // Fetch and verify all properties
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const metadata = await fetchMetadata(rpc, metadataAddress);

  t.is(metadata.data.updateAuthority, authority.address, 'Update authority should match');
  t.is(metadata.data.mint, mint.address, 'Mint should match');
  t.is(metadata.data.name, 'Property Test NFT', 'Name should match');
  t.is(metadata.data.symbol, '', 'Symbol should be empty');
  t.is(metadata.data.uri, 'https://example.com/properties.json', 'URI should match');
  t.is(metadata.data.sellerFeeBasisPoints, 750, 'Seller fee should be 750 basis points (7.5%)');
  t.false(metadata.data.primarySaleHappened, 'Primary sale should not have happened');
  t.true(metadata.data.isMutable, 'Should be mutable by default');
  // Token standard should always be set for a NonFungible
  t.deepEqual(
    metadata.data.tokenStandard,
    { __option: 'Some', value: TokenStandard.NonFungible },
    'Token standard should be Some(NonFungible)'
  );
});
