/**
 * UnverifyCollectionV1 tests for js-codama client
 *
 * These tests demonstrate unverifying collection membership:
 * - Create a collection NFT
 * - Create an NFT with verified collection reference
 * - Unverify the collection using the collection authority
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
  getUnverifyCollectionV1InstructionAsync,
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
 * Test: Unverify collection on NonFungible
 */
test('it can unverify the collection of a NonFungible', async (t) => {
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

  // Verify collection using collection authority
  const [itemMetadataAddress] = await findMetadataPda({
    mint: itemMint.address,
  });
  const verifyInstruction = await getVerifyCollectionV1InstructionAsync({
    authority: collectionAuthority,
    metadata: itemMetadataAddress,
    collectionMint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, verifyInstruction, [
    collectionAuthority,
  ]);

  // Verify collection is verified
  const metadataAfterVerify = await fetchMetadata(rpc, itemMetadataAddress);
  t.truthy(metadataAfterVerify.data.collection);
  if (metadataAfterVerify.data.collection.__option === 'Some') {
    t.true(metadataAfterVerify.data.collection.value.verified);
  }

  // Unverify collection using collection authority
  const unverifyInstruction = await getUnverifyCollectionV1InstructionAsync({
    authority: collectionAuthority,
    metadata: itemMetadataAddress,
    collectionMint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, unverifyInstruction, [
    collectionAuthority,
  ]);

  // Verify collection is now unverified
  const metadataAfterUnverify = await fetchMetadata(rpc, itemMetadataAddress);
  t.truthy(metadataAfterUnverify.data.collection);
  if (metadataAfterUnverify.data.collection.__option === 'Some') {
    t.false(metadataAfterUnverify.data.collection.value.verified);
    t.is(
      metadataAfterUnverify.data.collection.value.key,
      collectionMint.address
    );
  }

  t.pass('Successfully unverified collection on NonFungible');
});

/**
 * Test: Unverify collection on ProgrammableNonFungible
 */
test('it can unverify the collection of a ProgrammableNonFungible', async (t) => {
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

  // Verify collection
  const [itemMetadataAddress] = await findMetadataPda({
    mint: itemMint.address,
  });
  const verifyInstruction = await getVerifyCollectionV1InstructionAsync({
    authority: collectionAuthority,
    metadata: itemMetadataAddress,
    collectionMint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, verifyInstruction, [
    collectionAuthority,
  ]);

  // Verify collection is verified
  const metadataAfterVerify = await fetchMetadata(rpc, itemMetadataAddress);
  t.truthy(metadataAfterVerify.data.collection);
  if (metadataAfterVerify.data.collection.__option === 'Some') {
    t.true(metadataAfterVerify.data.collection.value.verified);
  }

  // Unverify collection
  const unverifyInstruction = await getUnverifyCollectionV1InstructionAsync({
    authority: collectionAuthority,
    metadata: itemMetadataAddress,
    collectionMint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, unverifyInstruction, [
    collectionAuthority,
  ]);

  // Verify collection is now unverified
  const metadataAfterUnverify = await fetchMetadata(rpc, itemMetadataAddress);
  t.truthy(metadataAfterUnverify.data.collection);
  if (metadataAfterUnverify.data.collection.__option === 'Some') {
    t.false(metadataAfterUnverify.data.collection.value.verified);
    t.is(
      metadataAfterUnverify.data.collection.value.key,
      collectionMint.address
    );
  }

  t.pass('Successfully unverified collection on ProgrammableNonFungible');
});

/**
 * Test: Unverify collection on Fungible
 */
test('it can unverify the collection of a Fungible', async (t) => {
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

  // Verify collection
  const [itemMetadataAddress] = await findMetadataPda({
    mint: itemMint.address,
  });
  const verifyInstruction = await getVerifyCollectionV1InstructionAsync({
    authority: collectionAuthority,
    metadata: itemMetadataAddress,
    collectionMint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, verifyInstruction, [
    collectionAuthority,
  ]);

  // Verify collection is verified
  const metadataAfterVerify = await fetchMetadata(rpc, itemMetadataAddress);
  t.truthy(metadataAfterVerify.data.collection);
  if (metadataAfterVerify.data.collection.__option === 'Some') {
    t.true(metadataAfterVerify.data.collection.value.verified);
  }

  // Unverify collection
  const unverifyInstruction = await getUnverifyCollectionV1InstructionAsync({
    authority: collectionAuthority,
    metadata: itemMetadataAddress,
    collectionMint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, unverifyInstruction, [
    collectionAuthority,
  ]);

  // Verify collection is now unverified
  const metadataAfterUnverify = await fetchMetadata(rpc, itemMetadataAddress);
  t.truthy(metadataAfterUnverify.data.collection);
  if (metadataAfterUnverify.data.collection.__option === 'Some') {
    t.false(metadataAfterUnverify.data.collection.value.verified);
  }

  t.pass('Successfully unverified collection on Fungible');
});
