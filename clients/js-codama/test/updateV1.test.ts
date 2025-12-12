/**
 * UpdateV1 tests for js-codama client
 *
 * These tests demonstrate updating metadata for different token standards:
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
  getUpdateV1InstructionAsync,
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
 * Test: Update NonFungible metadata name and URI
 */
test('it can update NonFungible metadata name and URI', async (t) => {
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
  const payer = authority;

  // Airdrop SOL to payer
  await airdrop(rpc, authority.address);

  // Create NonFungible token
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer,
    name: 'Original Name',
    uri: 'https://example.com/original.json',
    sellerFeeBasisPoints: basisPoints(5.5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    authority,
  ]);

  // Mint the token
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority,
    payer,
    metadata: metadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
    tokenOwner: authority.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [authority]);

  // Fetch original metadata
  const originalMetadata = await fetchMetadata(rpc, metadataAddress);
  t.is(originalMetadata.data.name, 'Original Name');
  t.is(originalMetadata.data.uri, 'https://example.com/original.json');
  t.is(originalMetadata.data.sellerFeeBasisPoints, basisPoints(5.5));

  // Update metadata (extract values from Option types)
  const updateInstruction = await getUpdateV1InstructionAsync({
    mint: mint.address,
    authority,
    payer,
    data: {
      name: 'Updated Name',
      symbol: 'UPD',
      uri: 'https://example.com/updated.json',
      sellerFeeBasisPoints: basisPoints(10),
      creators: originalMetadata.data.creators.__option === 'Some'
        ? originalMetadata.data.creators.value
        : null,
    },
  });

  await sendAndConfirm(rpc, rpcSubscriptions, updateInstruction, [authority]);

  // Verify updated metadata
  const updatedMetadata = await fetchMetadata(rpc, metadataAddress);
  t.is(updatedMetadata.data.name, 'Updated Name');
  t.is(updatedMetadata.data.symbol, 'UPD');
  t.is(updatedMetadata.data.uri, 'https://example.com/updated.json');
  t.is(updatedMetadata.data.sellerFeeBasisPoints, basisPoints(10));

  t.pass('Successfully updated NonFungible metadata');
});

/**
 * Test: Update Fungible metadata
 */
test('it can update Fungible metadata', async (t) => {
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
  const payer = authority;

  await airdrop(rpc, authority.address);

  // Create Fungible token
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer,
    name: 'Fungible Token',
    uri: 'https://example.com/fungible.json',
    sellerFeeBasisPoints: basisPoints(2.5),
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    authority,
  ]);

  // Mint tokens
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority,
    payer,
    metadata: metadataAddress,
    amount: 100,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [authority]);

  // Fetch original metadata
  const originalMetadata = await fetchMetadata(rpc, metadataAddress);

  // Update metadata with new seller fee
  const updateInstruction = await getUpdateV1InstructionAsync({
    mint: mint.address,
    authority,
    payer,
    data: {
      name: 'Updated Fungible',
      symbol: 'UFNG',
      uri: 'https://example.com/fungible-updated.json',
      sellerFeeBasisPoints: basisPoints(7.5),
      creators: originalMetadata.data.creators.__option === 'Some'
        ? originalMetadata.data.creators.value
        : null,
    },
  });

  await sendAndConfirm(rpc, rpcSubscriptions, updateInstruction, [authority]);

  // Verify changes
  const updatedMetadata = await fetchMetadata(rpc, metadataAddress);
  t.is(updatedMetadata.data.name, 'Updated Fungible');
  t.is(updatedMetadata.data.symbol, 'UFNG');
  t.is(updatedMetadata.data.sellerFeeBasisPoints, basisPoints(7.5));

  t.pass('Successfully updated Fungible metadata');
});

/**
 * Test: Update ProgrammableNonFungible metadata
 */
test('it can update ProgrammableNonFungible metadata', async (t) => {
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
  const payer = authority;

  await airdrop(rpc, authority.address);

  // Create ProgrammableNonFungible
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer,
    name: 'PNFT Original',
    uri: 'https://example.com/pnft-original.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    authority,
  ]);

  // Mint the PNFT
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority,
    payer,
    metadata: metadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    tokenOwner: authority.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [authority]);

  // Fetch original metadata
  const originalMetadata = await fetchMetadata(rpc, metadataAddress);

  // Update PNFT metadata
  const updateInstruction = await getUpdateV1InstructionAsync({
    mint: mint.address,
    authority,
    payer,
    data: {
      name: 'PNFT Updated',
      symbol: 'PNFT',
      uri: 'https://example.com/pnft-updated.json',
      sellerFeeBasisPoints: basisPoints(8),
      creators: originalMetadata.data.creators.__option === 'Some'
        ? originalMetadata.data.creators.value
        : null,
    },
  });

  await sendAndConfirm(rpc, rpcSubscriptions, updateInstruction, [authority]);

  // Verify changes
  const updatedMetadata = await fetchMetadata(rpc, metadataAddress);
  t.is(updatedMetadata.data.name, 'PNFT Updated');
  t.is(updatedMetadata.data.symbol, 'PNFT');
  t.is(updatedMetadata.data.uri, 'https://example.com/pnft-updated.json');
  t.is(updatedMetadata.data.sellerFeeBasisPoints, basisPoints(8));

  t.pass('Successfully updated ProgrammableNonFungible metadata');
});

/**
 * Test: Update only seller fee basis points
 */
test('it can update only seller fee basis points', async (t) => {
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
  const payer = authority;

  await airdrop(rpc, authority.address);

  // Create token
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer,
    name: 'My NFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    authority,
  ]);

  const [metadataAddress] = await findMetadataPda({ mint: mint.address });

  // Fetch original metadata
  const originalMetadata = await fetchMetadata(rpc, metadataAddress);
  const originalName = originalMetadata.data.name;
  const originalUri = originalMetadata.data.uri;

  // Update only seller fee (preserve all other fields)
  const updateInstruction = await getUpdateV1InstructionAsync({
    mint: mint.address,
    authority,
    payer,
    data: {
      name: originalName,
      symbol: originalMetadata.data.symbol,
      uri: originalUri,
      sellerFeeBasisPoints: basisPoints(12),
      creators: originalMetadata.data.creators.__option === 'Some'
        ? originalMetadata.data.creators.value
        : null,
    },
  });

  await sendAndConfirm(rpc, rpcSubscriptions, updateInstruction, [authority]);

  // Verify only seller fee changed
  const updatedMetadata = await fetchMetadata(rpc, metadataAddress);
  t.is(updatedMetadata.data.name, originalName, 'Name should remain unchanged');
  t.is(updatedMetadata.data.uri, originalUri, 'URI should remain unchanged');
  t.is(updatedMetadata.data.sellerFeeBasisPoints, basisPoints(12));

  t.pass('Successfully updated only seller fee basis points');
});
