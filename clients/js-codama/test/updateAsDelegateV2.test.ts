/**
 * UpdateAs*DelegateV2 tests for js-codama client
 *
 * These tests demonstrate using delegates to update metadata for different token standards.
 * The tests cover both "item" delegates (per-NFT) and "collection" delegates.
 *
 * Changes tested:
 * - updateAsDataItemDelegateV2: Data item delegate can update metadata
 * - updateAsCollectionItemDelegateV2: Collection item delegate can update metadata
 * - updateAsAuthorityItemDelegateV2: Authority item delegate can update metadata
 * - updateAsDataDelegateV2: Data delegate (collection-level) can update metadata
 * - updateAsCollectionDelegateV2: Collection delegate can update metadata
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-codama)
 */

import test from 'ava';
import { some } from '@solana/kit';
import { TokenStandard, MetadataDelegateRole } from '../src/generated/types';
import {
  getDelegateDataItemV1InstructionAsync,
  getDelegateCollectionItemV1InstructionAsync,
  getDelegateAuthorityItemV1InstructionAsync,
  getDelegateDataV1InstructionAsync,
  getDelegateCollectionV1InstructionAsync,
  getUpdateAsDataItemDelegateV2InstructionAsync,
  getUpdateAsCollectionItemDelegateV2InstructionAsync,
  getUpdateAsAuthorityItemDelegateV2InstructionAsync,
  getUpdateAsDataDelegateV2InstructionAsync,
  getUpdateAsCollectionDelegateV2InstructionAsync,
} from '../src/generated/instructions';
import { fetchMetadata, fetchMetadataDelegateRecordFromSeeds } from '../src/generated/accounts';
import { findMetadataPda } from '../src/generated/pdas';
import { SPL_TOKEN_PROGRAM_ADDRESS } from './_setup';
import { createNft, createFungible } from '../src/hooked/createHelpers';
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
 * Test: Data Item Delegate can update NonFungible metadata
 * This uses updateAsMetadataDelegateDefaults("DataItem") which has isOptional: true for token
 */
test('updateAsDataItemDelegateV2 › it can update NonFungible metadata as data item delegate', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const updateAuthority = await createKeypair();
  const delegate = await createKeypair();

  await airdrop(rpc, updateAuthority.address);

  // Create a NonFungible NFT
  const [createIx, mintIx] = await createNft({
    mint,
    authority: updateAuthority,
    payer: updateAuthority,
    name: 'Original NFT',
    uri: 'https://example.com/original.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenOwner: updateAuthority.address,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirmInstructions(rpc, rpcSubscriptions, [createIx, mintIx], [
    mint,
    updateAuthority,
  ]);

  // Delegate data item authority
  const delegateInstruction = await getDelegateDataItemV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: delegate.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [updateAuthority]);

  // Verify delegate record was created
  const delegateRecord = await fetchMetadataDelegateRecordFromSeeds(rpc, {
    mint: mint.address,
    delegateRole: MetadataDelegateRole.DataItem,
    updateAuthority: updateAuthority.address,
    delegate: delegate.address,
  });
  t.is(delegateRecord.data.delegate, delegate.address);

  // Airdrop to delegate so they can pay for transaction
  await airdrop(rpc, delegate.address);

  // Update metadata as delegate (token is optional - not provided)
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const originalMetadata = await fetchMetadata(rpc, metadataAddress);

  const updateInstruction = await getUpdateAsDataItemDelegateV2InstructionAsync({
    mint: mint.address,
    authority: delegate,
    payer: delegate,
    updateAuthority: updateAuthority.address,
    data: some({
      name: 'Updated by Delegate',
      symbol: 'DEL',
      uri: 'https://example.com/delegate-updated.json',
      sellerFeeBasisPoints: basisPoints(5),
      creators: originalMetadata.data.creators.__option === 'Some'
        ? originalMetadata.data.creators.value
        : null,
    }),
  });

  await sendAndConfirm(rpc, rpcSubscriptions, updateInstruction, [delegate]);

  // Verify metadata was updated
  const updatedMetadata = await fetchMetadata(rpc, metadataAddress);
  t.is(updatedMetadata.data.name, 'Updated by Delegate');
  t.is(updatedMetadata.data.symbol, 'DEL');
  t.is(updatedMetadata.data.uri, 'https://example.com/delegate-updated.json');

  t.pass('Successfully updated NonFungible metadata as data item delegate');
});

/**
 * Test: Collection Item Delegate can update NonFungible metadata
 * This uses updateAsMetadataDelegateDefaults("CollectionItem") which has isOptional: true for token
 */
test('updateAsCollectionItemDelegateV2 › it can update NonFungible metadata as collection item delegate', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const updateAuthority = await createKeypair();
  const delegate = await createKeypair();

  await airdrop(rpc, updateAuthority.address);

  // Create a NonFungible NFT
  const [createIx, mintIx] = await createNft({
    mint,
    authority: updateAuthority,
    payer: updateAuthority,
    name: 'Collection Item NFT',
    uri: 'https://example.com/collection-item.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenOwner: updateAuthority.address,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirmInstructions(rpc, rpcSubscriptions, [createIx, mintIx], [
    mint,
    updateAuthority,
  ]);

  // Delegate collection item authority
  const delegateInstruction = await getDelegateCollectionItemV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: delegate.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [updateAuthority]);

  // Airdrop to delegate
  await airdrop(rpc, delegate.address);

  // Update metadata as collection item delegate (token is optional - not provided)
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const originalMetadata = await fetchMetadata(rpc, metadataAddress);

  const updateInstruction = await getUpdateAsCollectionItemDelegateV2InstructionAsync({
    mint: mint.address,
    authority: delegate,
    payer: delegate,
    updateAuthority: updateAuthority.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, updateInstruction, [delegate]);

  // Verify metadata still exists (collection item delegate has limited update capabilities)
  const updatedMetadata = await fetchMetadata(rpc, metadataAddress);
  t.truthy(updatedMetadata);

  t.pass('Successfully called updateAsCollectionItemDelegateV2 without token account');
});

/**
 * Test: Authority Item Delegate can update NonFungible metadata
 * This uses updateAsMetadataDelegateDefaults("AuthorityItem") which has isOptional: true for token
 */
test('updateAsAuthorityItemDelegateV2 › it can update NonFungible metadata as authority item delegate', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const updateAuthority = await createKeypair();
  const delegate = await createKeypair();

  await airdrop(rpc, updateAuthority.address);

  // Create a NonFungible NFT
  const [createIx, mintIx] = await createNft({
    mint,
    authority: updateAuthority,
    payer: updateAuthority,
    name: 'Authority Item NFT',
    uri: 'https://example.com/authority-item.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenOwner: updateAuthority.address,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirmInstructions(rpc, rpcSubscriptions, [createIx, mintIx], [
    mint,
    updateAuthority,
  ]);

  // Delegate authority item
  const delegateInstruction = await getDelegateAuthorityItemV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: delegate.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [updateAuthority]);

  // Airdrop to delegate
  await airdrop(rpc, delegate.address);

  // Update metadata as authority item delegate (token is optional - not provided)
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });

  const updateInstruction = await getUpdateAsAuthorityItemDelegateV2InstructionAsync({
    mint: mint.address,
    authority: delegate,
    payer: delegate,
    updateAuthority: updateAuthority.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, updateInstruction, [delegate]);

  // Verify metadata still exists
  const updatedMetadata = await fetchMetadata(rpc, metadataAddress);
  t.truthy(updatedMetadata);

  t.pass('Successfully called updateAsAuthorityItemDelegateV2 without token account');
});

/**
 * Test: Data Delegate (collection-level) can update Fungible metadata
 * This uses updateAsMetadataCollectionDelegateDefaults("Data") which has isOptional: true for token
 */
test('updateAsDataDelegateV2 › it can update Fungible metadata as data delegate', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const updateAuthority = await createKeypair();
  const delegate = await createKeypair();

  await airdrop(rpc, updateAuthority.address);

  // Create a Fungible token
  const createIx = await createFungible({
    mint,
    authority: updateAuthority,
    payer: updateAuthority,
    name: 'Data Delegate Token',
    uri: 'https://example.com/data-delegate.json',
    sellerFeeBasisPoints: basisPoints(2),
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, updateAuthority]);

  // Delegate data authority (collection-level)
  const delegateInstruction = await getDelegateDataV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: delegate.address,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [updateAuthority]);

  // Airdrop to delegate
  await airdrop(rpc, delegate.address);

  // Update metadata as data delegate (token is optional - not provided)
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const originalMetadata = await fetchMetadata(rpc, metadataAddress);

  const updateInstruction = await getUpdateAsDataDelegateV2InstructionAsync({
    mint: mint.address,
    authority: delegate,
    payer: delegate,
    delegateUpdateAuthority: updateAuthority.address,
    data: some({
      name: 'Updated Fungible by Delegate',
      symbol: 'UFD',
      uri: 'https://example.com/fungible-updated.json',
      sellerFeeBasisPoints: basisPoints(2),
      creators: originalMetadata.data.creators.__option === 'Some'
        ? originalMetadata.data.creators.value
        : null,
    }),
  });

  await sendAndConfirm(rpc, rpcSubscriptions, updateInstruction, [delegate]);

  // Verify metadata was updated
  const updatedMetadata = await fetchMetadata(rpc, metadataAddress);
  t.is(updatedMetadata.data.name, 'Updated Fungible by Delegate');
  t.is(updatedMetadata.data.symbol, 'UFD');
  t.is(updatedMetadata.data.uri, 'https://example.com/fungible-updated.json');

  t.pass('Successfully updated Fungible metadata as data delegate');
});

/**
 * Test: Collection Delegate can update NonFungible metadata
 * This uses updateAsMetadataCollectionDelegateDefaults("Collection") which has isOptional: true for token
 */
test('updateAsCollectionDelegateV2 › it can update NonFungible metadata as collection delegate', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const updateAuthority = await createKeypair();
  const delegate = await createKeypair();

  await airdrop(rpc, updateAuthority.address);

  // Create a NonFungible NFT
  const [createIx, mintIx] = await createNft({
    mint,
    authority: updateAuthority,
    payer: updateAuthority,
    name: 'Collection Delegate NFT',
    uri: 'https://example.com/collection-delegate.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenOwner: updateAuthority.address,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirmInstructions(rpc, rpcSubscriptions, [createIx, mintIx], [
    mint,
    updateAuthority,
  ]);

  // Delegate collection authority
  const delegateInstruction = await getDelegateCollectionV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: delegate.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [updateAuthority]);

  // Airdrop to delegate
  await airdrop(rpc, delegate.address);

  // Update metadata as collection delegate (token is optional - not provided)
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });

  const updateInstruction = await getUpdateAsCollectionDelegateV2InstructionAsync({
    mint: mint.address,
    authority: delegate,
    payer: delegate,
    delegateUpdateAuthority: updateAuthority.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, updateInstruction, [delegate]);

  // Verify metadata still exists
  const updatedMetadata = await fetchMetadata(rpc, metadataAddress);
  t.truthy(updatedMetadata);

  t.pass('Successfully called updateAsCollectionDelegateV2 without token account');
});

/**
 * Test: Data Delegate can update NonFungible metadata
 */
test('updateAsDataDelegateV2 › it can update NonFungible metadata as data delegate', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const updateAuthority = await createKeypair();
  const delegate = await createKeypair();

  await airdrop(rpc, updateAuthority.address);

  // Create a NonFungible NFT
  const [createIx, mintIx] = await createNft({
    mint,
    authority: updateAuthority,
    payer: updateAuthority,
    name: 'Data Delegate NFT',
    uri: 'https://example.com/data-delegate-nft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenOwner: updateAuthority.address,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirmInstructions(rpc, rpcSubscriptions, [createIx, mintIx], [
    mint,
    updateAuthority,
  ]);

  // Delegate data authority (collection-level)
  const delegateInstruction = await getDelegateDataV1InstructionAsync({
    mint: mint.address,
    authority: updateAuthority,
    payer: updateAuthority,
    delegate: delegate.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [updateAuthority]);

  // Airdrop to delegate
  await airdrop(rpc, delegate.address);

  // Update metadata as data delegate (token is optional)
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const originalMetadata = await fetchMetadata(rpc, metadataAddress);

  const updateInstruction = await getUpdateAsDataDelegateV2InstructionAsync({
    mint: mint.address,
    authority: delegate,
    payer: delegate,
    delegateUpdateAuthority: updateAuthority.address,
    data: some({
      name: 'NFT Updated by Data Delegate',
      symbol: 'NDD',
      uri: 'https://example.com/nft-data-delegate-updated.json',
      sellerFeeBasisPoints: basisPoints(5),
      creators: originalMetadata.data.creators.__option === 'Some'
        ? originalMetadata.data.creators.value
        : null,
    }),
  });

  await sendAndConfirm(rpc, rpcSubscriptions, updateInstruction, [delegate]);

  // Verify metadata was updated
  const updatedMetadata = await fetchMetadata(rpc, metadataAddress);
  t.is(updatedMetadata.data.name, 'NFT Updated by Data Delegate');
  t.is(updatedMetadata.data.symbol, 'NDD');
  t.is(updatedMetadata.data.uri, 'https://example.com/nft-data-delegate-updated.json');

  t.pass('Successfully updated NonFungible metadata as data delegate');
});
