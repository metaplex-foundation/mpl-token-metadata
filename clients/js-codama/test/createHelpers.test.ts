/**
 * createHelpers tests for js-codama client
 *
 * These tests demonstrate using the create helper functions:
 * - createNft: Create and mint a NonFungible NFT
 * - createProgrammableNft: Create and mint a ProgrammableNonFungible
 * - createFungible: Create a Fungible token (without minting)
 * - createFungibleAsset: Create a FungibleAsset token (without minting)
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-codama)
 */

import test from 'ava';
import { TokenStandard } from '../src/generated/types';
import { getMintV1InstructionAsync } from '../src/generated/instructions';
import { findMetadataPda } from '../src/generated/pdas';
import { SPL_TOKEN_PROGRAM_ADDRESS } from './_setup';
import { fetchMetadata } from '../src/generated/accounts';
import {
  createNft,
  createProgrammableNft,
  createFungible,
  createFungibleAsset,
} from '../src/hooked/createHelpers';
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
 * Test: Create and mint NFT using helper
 */
test('it can create and mint a NonFungible using createNft helper', async (t) => {
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

  // Use helper to create and mint NFT
  const [createIx, mintIx] = await createNft({
    mint,
    authority: owner,
    payer: owner,
    name: 'Test NFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenOwner: owner.address,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  // Send both instructions in one transaction
  await sendAndConfirmInstructions(rpc, rpcSubscriptions, [createIx, mintIx], [
    mint,
    owner,
  ]);

  // Verify metadata was created
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const metadata = await fetchMetadata(rpc, metadataAddress);

  t.is(metadata.data.name, 'Test NFT');
  t.is(metadata.data.uri, 'https://example.com/nft.json');
  t.is(metadata.data.sellerFeeBasisPoints, basisPoints(5));
  if (metadata.data.tokenStandard.__option === 'Some') {
    t.is(metadata.data.tokenStandard.value, TokenStandard.NonFungible);
  }

  t.pass('Successfully created and minted NFT using helper');
});

/**
 * Test: Create and mint PNFT using helper
 */
test('it can create and mint a ProgrammableNonFungible using createProgrammableNft helper', async (t) => {
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

  // Use helper to create and mint PNFT
  const [createIx, mintIx] = await createProgrammableNft({
    mint,
    authority: owner,
    payer: owner,
    name: 'Test PNFT',
    uri: 'https://example.com/pnft.json',
    sellerFeeBasisPoints: basisPoints(7.5),
    tokenOwner: owner.address,
  });

  // Send both instructions in one transaction
  await sendAndConfirmInstructions(rpc, rpcSubscriptions, [createIx, mintIx], [
    mint,
    owner,
  ]);

  // Verify metadata
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const metadata = await fetchMetadata(rpc, metadataAddress);

  t.is(metadata.data.name, 'Test PNFT');
  t.is(metadata.data.uri, 'https://example.com/pnft.json');
  t.is(metadata.data.sellerFeeBasisPoints, basisPoints(7.5));
  if (metadata.data.tokenStandard.__option === 'Some') {
    t.is(metadata.data.tokenStandard.value, TokenStandard.ProgrammableNonFungible);
  }

  t.pass('Successfully created and minted PNFT using helper');
});

/**
 * Test: Create Fungible using helper (without minting)
 */
test('it can create a Fungible using createFungible helper', async (t) => {
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

  // Use helper to create Fungible (without minting)
  const createIx = await createFungible({
    mint,
    authority,
    payer: authority,
    name: 'Test Fungible',
    uri: 'https://example.com/fungible.json',
    sellerFeeBasisPoints: basisPoints(2.5),
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, authority]);

  // Verify metadata
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const metadata = await fetchMetadata(rpc, metadataAddress);

  t.is(metadata.data.name, 'Test Fungible');
  t.is(metadata.data.uri, 'https://example.com/fungible.json');
  t.is(metadata.data.sellerFeeBasisPoints, basisPoints(2.5));
  if (metadata.data.tokenStandard.__option === 'Some') {
    t.is(metadata.data.tokenStandard.value, TokenStandard.Fungible);
  }

  // Now mint tokens separately
  const mintIx = await getMintV1InstructionAsync({
    mint: mint.address,
    authority,
    payer: authority,
    metadata: metadataAddress,
    amount: 1000,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintIx, [authority]);

  t.pass('Successfully created Fungible using helper and minted separately');
});

/**
 * Test: Create FungibleAsset using helper
 */
test('it can create a FungibleAsset using createFungibleAsset helper', async (t) => {
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

  // Use helper to create FungibleAsset
  const createIx = await createFungibleAsset({
    mint,
    authority,
    payer: authority,
    name: 'Test Asset',
    uri: 'https://example.com/asset.json',
    sellerFeeBasisPoints: basisPoints(3),
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, authority]);

  // Verify metadata
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const metadata = await fetchMetadata(rpc, metadataAddress);

  t.is(metadata.data.name, 'Test Asset');
  t.is(metadata.data.uri, 'https://example.com/asset.json');
  t.is(metadata.data.sellerFeeBasisPoints, basisPoints(3));
  if (metadata.data.tokenStandard.__option === 'Some') {
    t.is(metadata.data.tokenStandard.value, TokenStandard.FungibleAsset);
  }

  // Mint tokens separately
  const mintIx = await getMintV1InstructionAsync({
    mint: mint.address,
    authority,
    payer: authority,
    metadata: metadataAddress,
    amount: 500,
    tokenStandard: TokenStandard.FungibleAsset,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintIx, [authority]);

  t.pass('Successfully created FungibleAsset using helper');
});

/**
 * Test: Create NFT with collection
 */
test('it can create an NFT with collection using createNft helper', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const collectionMint = await createKeypair();
  const itemMint = await createKeypair();
  const authority = await createKeypair();

  await airdrop(rpc, authority.address);

  // Create collection
  const [createCollectionIx, mintCollectionIx] = await createNft({
    mint: collectionMint,
    authority,
    payer: authority,
    name: 'Test Collection',
    uri: 'https://example.com/collection.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenOwner: authority.address,
    isCollection: true,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirmInstructions(
    rpc,
    rpcSubscriptions,
    [createCollectionIx, mintCollectionIx],
    [collectionMint, authority]
  );

  // Create item with collection reference
  const [createItemIx, mintItemIx] = await createNft({
    mint: itemMint,
    authority,
    payer: authority,
    name: 'Collection Item',
    uri: 'https://example.com/item.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenOwner: authority.address,
    collection: {
      key: collectionMint.address,
      verified: false,
    },
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirmInstructions(rpc, rpcSubscriptions, [createItemIx, mintItemIx], [
    itemMint,
    authority,
  ]);

  // Verify item has collection reference
  const [itemMetadataAddress] = await findMetadataPda({ mint: itemMint.address });
  const metadata = await fetchMetadata(rpc, itemMetadataAddress);

  t.truthy(metadata.data.collection);
  if (metadata.data.collection.__option === 'Some') {
    t.is(metadata.data.collection.value.key, collectionMint.address);
    t.false(metadata.data.collection.value.verified);
  }

  t.pass('Successfully created NFT with collection using helper');
});
