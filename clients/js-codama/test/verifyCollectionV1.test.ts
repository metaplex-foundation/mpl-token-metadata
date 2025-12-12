/**
 * VerifyCollectionV1 tests for js-codama client
 *
 * These tests demonstrate verifying collection membership:
 * - Create a collection NFT
 * - Create an NFT with unverified collection reference
 * - Verify the collection using the collection authority
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
  getVerifyCollectionV1InstructionAsync,
} from '../src/generated/instructions';
import { findMetadataPda } from '../src/generated/pdas';
import { SPL_TOKEN_PROGRAM_ADDRESS } from './_setup';
import { fetchMetadata } from '../src/generated/accounts';
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
 * Test: Verify collection on NonFungible
 */
test('it can verify the collection of a NonFungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const collectionMint = await createKeypair();
  const collectionAuthority = await createKeypair();
  const itemMint = await createKeypair();
  const itemOwner = await createKeypair();

  await airdrop(rpc, collectionAuthority.address);
  await airdrop(rpc, itemOwner.address);

  // Create collection NFT
  const createCollectionInstruction = await getCreateV1InstructionAsync({
    mint: collectionMint,
    authority: collectionAuthority,
    payer: collectionAuthority,
    name: 'My Collection',
    uri: 'https://example.com/collection.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
    isCollection: true,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createCollectionInstruction, [
    collectionMint,
    collectionAuthority,
  ]);

  // Mint collection NFT
  const [collectionMetadataAddress] = await findMetadataPda({
    mint: collectionMint.address,
  });
  const mintCollectionInstruction = await getMintV1InstructionAsync({
    mint: collectionMint.address,
    authority: collectionAuthority,
    payer: collectionAuthority,
    metadata: collectionMetadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
    tokenOwner: collectionAuthority.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintCollectionInstruction, [
    collectionAuthority,
  ]);

  // Create item NFT with unverified collection
  const createItemInstruction = await getCreateV1InstructionAsync({
    mint: itemMint,
    authority: itemOwner,
    payer: itemOwner,
    name: 'My NFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
    collection: {
      key: collectionMint.address,
      verified: false,
    },
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createItemInstruction, [
    itemMint,
    itemOwner,
  ]);

  // Verify collection is unverified
  const [itemMetadataAddress] = await findMetadataPda({
    mint: itemMint.address,
  });
  const metadataBefore = await fetchMetadata(rpc, itemMetadataAddress);
  t.truthy(metadataBefore.data.collection);
  if (metadataBefore.data.collection.__option === 'Some') {
    t.false(metadataBefore.data.collection.value.verified);
  }

  // Verify collection using collection authority
  const verifyInstruction = await getVerifyCollectionV1InstructionAsync({
    authority: collectionAuthority,
    metadata: itemMetadataAddress,
    collectionMint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, verifyInstruction, [
    collectionAuthority,
  ]);

  // Verify collection is now verified
  const metadataAfter = await fetchMetadata(rpc, itemMetadataAddress);
  t.truthy(metadataAfter.data.collection);
  if (metadataAfter.data.collection.__option === 'Some') {
    t.true(metadataAfter.data.collection.value.verified);
    t.is(
      metadataAfter.data.collection.value.key,
      collectionMint.address
    );
  }

  t.pass('Successfully verified collection on NonFungible');
});

/**
 * Test: Verify collection on ProgrammableNonFungible
 */
test('it can verify the collection of a ProgrammableNonFungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const collectionMint = await createKeypair();
  const collectionAuthority = await createKeypair();
  const itemMint = await createKeypair();
  const itemOwner = await createKeypair();

  await airdrop(rpc, collectionAuthority.address);
  await airdrop(rpc, itemOwner.address);

  // Create collection PNFT
  const createCollectionInstruction = await getCreateV1InstructionAsync({
    mint: collectionMint,
    authority: collectionAuthority,
    payer: collectionAuthority,
    name: 'My PNFT Collection',
    uri: 'https://example.com/pnft-collection.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    isCollection: true,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createCollectionInstruction, [
    collectionMint,
    collectionAuthority,
  ]);

  // Mint collection PNFT
  const [collectionMetadataAddress] = await findMetadataPda({
    mint: collectionMint.address,
  });
  const mintCollectionInstruction = await getMintV1InstructionAsync({
    mint: collectionMint.address,
    authority: collectionAuthority,
    payer: collectionAuthority,
    metadata: collectionMetadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    tokenOwner: collectionAuthority.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintCollectionInstruction, [
    collectionAuthority,
  ]);

  // Create item PNFT with unverified collection
  const createItemInstruction = await getCreateV1InstructionAsync({
    mint: itemMint,
    authority: itemOwner,
    payer: itemOwner,
    name: 'My PNFT',
    uri: 'https://example.com/pnft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    collection: {
      key: collectionMint.address,
      verified: false,
    },
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createItemInstruction, [
    itemMint,
    itemOwner,
  ]);

  // Verify collection is unverified
  const [itemMetadataAddress] = await findMetadataPda({
    mint: itemMint.address,
  });
  const metadataBefore = await fetchMetadata(rpc, itemMetadataAddress);
  t.truthy(metadataBefore.data.collection);
  if (metadataBefore.data.collection.__option === 'Some') {
    t.false(metadataBefore.data.collection.value.verified);
  }

  // Verify collection using collection authority
  const verifyInstruction = await getVerifyCollectionV1InstructionAsync({
    authority: collectionAuthority,
    metadata: itemMetadataAddress,
    collectionMint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, verifyInstruction, [
    collectionAuthority,
  ]);

  // Verify collection is now verified
  const metadataAfter = await fetchMetadata(rpc, itemMetadataAddress);
  t.truthy(metadataAfter.data.collection);
  if (metadataAfter.data.collection.__option === 'Some') {
    t.true(metadataAfter.data.collection.value.verified);
    t.is(
      metadataAfter.data.collection.value.key,
      collectionMint.address
    );
  }

  t.pass('Successfully verified collection on ProgrammableNonFungible');
});

/**
 * Test: Verify collection on Fungible
 */
test('it can verify the collection of a Fungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const collectionMint = await createKeypair();
  const collectionAuthority = await createKeypair();
  const itemMint = await createKeypair();
  const itemAuthority = await createKeypair();

  await airdrop(rpc, collectionAuthority.address);
  await airdrop(rpc, itemAuthority.address);

  // Create collection NFT
  const createCollectionInstruction = await getCreateV1InstructionAsync({
    mint: collectionMint,
    authority: collectionAuthority,
    payer: collectionAuthority,
    name: 'Fungible Collection',
    uri: 'https://example.com/fungible-collection.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
    isCollection: true,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createCollectionInstruction, [
    collectionMint,
    collectionAuthority,
  ]);

  // Mint collection NFT
  const [collectionMetadataAddress] = await findMetadataPda({
    mint: collectionMint.address,
  });
  const mintCollectionInstruction = await getMintV1InstructionAsync({
    mint: collectionMint.address,
    authority: collectionAuthority,
    payer: collectionAuthority,
    metadata: collectionMetadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
    tokenOwner: collectionAuthority.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintCollectionInstruction, [
    collectionAuthority,
  ]);

  // Create fungible token with unverified collection
  const createItemInstruction = await getCreateV1InstructionAsync({
    mint: itemMint,
    authority: itemAuthority,
    payer: itemAuthority,
    name: 'My Fungible Token',
    uri: 'https://example.com/fungible.json',
    sellerFeeBasisPoints: basisPoints(2),
    tokenStandard: TokenStandard.Fungible,
    collection: {
      key: collectionMint.address,
      verified: false,
    },
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createItemInstruction, [
    itemMint,
    itemAuthority,
  ]);

  // Verify collection is unverified
  const [itemMetadataAddress] = await findMetadataPda({
    mint: itemMint.address,
  });
  const metadataBefore = await fetchMetadata(rpc, itemMetadataAddress);
  t.truthy(metadataBefore.data.collection);
  if (metadataBefore.data.collection.__option === 'Some') {
    t.false(metadataBefore.data.collection.value.verified);
  }

  // Verify collection using collection authority
  const verifyInstruction = await getVerifyCollectionV1InstructionAsync({
    authority: collectionAuthority,
    metadata: itemMetadataAddress,
    collectionMint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, verifyInstruction, [
    collectionAuthority,
  ]);

  // Verify collection is now verified
  const metadataAfter = await fetchMetadata(rpc, itemMetadataAddress);
  t.truthy(metadataAfter.data.collection);
  if (metadataAfter.data.collection.__option === 'Some') {
    t.true(metadataAfter.data.collection.value.verified);
  }

  t.pass('Successfully verified collection on Fungible');
});
