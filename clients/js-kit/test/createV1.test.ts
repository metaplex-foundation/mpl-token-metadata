/**
 * CreateV1 tests for js-kit client
 *
 * The createV1 instruction creates a new asset with metadata.
 * It supports all token standards: NonFungible, ProgrammableNonFungible, Fungible, FungibleAsset
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-kit)
 */

import test from 'ava';
import { TokenStandard } from '../src/generated/types';
import { getCreateV1InstructionAsync } from '../src/generated/instructions';
import { findMetadataPda, findMasterEditionPda } from '../src/generated/pdas';
import { fetchMetadata, fetchMasterEdition } from '../src/generated/accounts';
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
 * Test: Create a NonFungible NFT
 */
test('it can create a new NonFungible', async (t) => {
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

  // Create a NonFungible NFT
  const createIx = await getCreateV1InstructionAsync({
    mint: mint,
    authority: authority,
    payer: authority,
    name: 'My NFT',
    uri: 'https://example.com/my-nft.json',
    sellerFeeBasisPoints: basisPoints(5.5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, authority]);

  // Verify metadata account was created
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const metadata = await fetchMetadata(rpc, metadataAddress);

  t.is(metadata.data.mint, mint.address);
  t.is(metadata.data.name, 'My NFT');
  t.is(metadata.data.uri, 'https://example.com/my-nft.json');
  t.is(metadata.data.sellerFeeBasisPoints, 550);
  t.deepEqual(metadata.data.tokenStandard, {
    __option: 'Some',
    value: TokenStandard.NonFungible,
  });
  t.is(metadata.data.primarySaleHappened, false);
  t.is(metadata.data.isMutable, true);

  // Verify master edition was created
  const [masterEditionAddress] = await findMasterEditionPda({
    mint: mint.address,
  });
  const masterEdition = await fetchMasterEdition(rpc, masterEditionAddress);

  t.is(masterEdition.data.supply, 0n);
  t.deepEqual(masterEdition.data.maxSupply, { __option: 'Some', value: 0n });
});

/**
 * Test: Create a ProgrammableNonFungible
 */
test('it can create a new ProgrammableNonFungible', async (t) => {
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

  // Create a ProgrammableNonFungible
  const createIx = await getCreateV1InstructionAsync({
    mint: mint,
    authority: authority,
    payer: authority,
    name: 'My Programmable NFT',
    uri: 'https://example.com/my-programmable-nft.json',
    sellerFeeBasisPoints: basisPoints(5.5),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, authority]);

  // Verify metadata account was created
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const metadata = await fetchMetadata(rpc, metadataAddress);

  t.is(metadata.data.mint, mint.address);
  t.is(metadata.data.name, 'My Programmable NFT');
  t.is(metadata.data.uri, 'https://example.com/my-programmable-nft.json');
  t.is(metadata.data.sellerFeeBasisPoints, 550);
  t.deepEqual(metadata.data.tokenStandard, {
    __option: 'Some',
    value: TokenStandard.ProgrammableNonFungible,
  });
  t.is(metadata.data.primarySaleHappened, false);
  t.is(metadata.data.isMutable, true);

  // Verify programmable config is set
  t.is(metadata.data.programmableConfig.__option, 'Some');

  // Verify master edition was created
  const [masterEditionAddress] = await findMasterEditionPda({
    mint: mint.address,
  });
  const masterEdition = await fetchMasterEdition(rpc, masterEditionAddress);

  t.is(masterEdition.data.supply, 0n);
  t.deepEqual(masterEdition.data.maxSupply, { __option: 'Some', value: 0n });
});

/**
 * Test: Create a Fungible token
 */
test('it can create a new Fungible', async (t) => {
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

  // Create a Fungible token
  const createIx = await getCreateV1InstructionAsync({
    mint: mint,
    authority: authority,
    payer: authority,
    name: 'My Fungible',
    uri: 'https://example.com/my-fungible.json',
    sellerFeeBasisPoints: basisPoints(5.5),
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, authority]);

  // Verify metadata account was created
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const metadata = await fetchMetadata(rpc, metadataAddress);

  t.is(metadata.data.mint, mint.address);
  t.is(metadata.data.name, 'My Fungible');
  t.is(metadata.data.uri, 'https://example.com/my-fungible.json');
  t.is(metadata.data.sellerFeeBasisPoints, 550);
  t.deepEqual(metadata.data.tokenStandard, {
    __option: 'Some',
    value: TokenStandard.Fungible,
  });
  t.is(metadata.data.primarySaleHappened, false);
  t.is(metadata.data.isMutable, true);

  // Fungible tokens don't have master editions
  const [masterEditionAddress] = await findMasterEditionPda({
    mint: mint.address,
  });
  const masterEditionAccount = await rpc.getAccountInfo(masterEditionAddress).send();
  t.is(masterEditionAccount.value, null);
});

/**
 * Test: Create a FungibleAsset token
 */
test('it can create a new FungibleAsset', async (t) => {
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

  // Create a FungibleAsset token
  const createIx = await getCreateV1InstructionAsync({
    mint: mint,
    authority: authority,
    payer: authority,
    name: 'My Fungible Asset',
    uri: 'https://example.com/my-fungible-asset.json',
    sellerFeeBasisPoints: basisPoints(5.5),
    tokenStandard: TokenStandard.FungibleAsset,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, authority]);

  // Verify metadata account was created
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const metadata = await fetchMetadata(rpc, metadataAddress);

  t.is(metadata.data.mint, mint.address);
  t.is(metadata.data.name, 'My Fungible Asset');
  t.is(metadata.data.uri, 'https://example.com/my-fungible-asset.json');
  t.is(metadata.data.sellerFeeBasisPoints, 550);
  t.deepEqual(metadata.data.tokenStandard, {
    __option: 'Some',
    value: TokenStandard.FungibleAsset,
  });
  t.is(metadata.data.primarySaleHappened, false);
  t.is(metadata.data.isMutable, true);

  // FungibleAsset tokens don't have master editions
  const [masterEditionAddress] = await findMasterEditionPda({
    mint: mint.address,
  });
  const masterEditionAccount = await rpc.getAccountInfo(masterEditionAddress).send();
  t.is(masterEditionAccount.value, null);
});
