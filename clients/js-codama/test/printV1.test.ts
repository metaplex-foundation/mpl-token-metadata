/**
 * PrintV1 tests for js-codama client
 *
 * The printV1 instruction prints edition NFTs from a master edition.
 * It supports NonFungible and ProgrammableNonFungible token standards.
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-codama)
 */

import test from 'ava';
import { TokenStandard, PrintSupply } from '../src/generated/types';
import {
  getCreateV1InstructionAsync,
  getMintV1InstructionAsync,
  getPrintV1InstructionAsync,
} from '../src/generated/instructions';
import {
  findMetadataPda,
  findMasterEditionPda,
} from '../src/generated/pdas';
import { findAssociatedTokenPda } from './_setup';
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
  sendAndConfirmInstructions,
} from './_setup';

/**
 * Test: Print a new edition from a NonFungible master edition
 */
test('it can print a new edition from a NonFungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();

  // Create master edition
  const masterMint = await createKeypair();
  const masterOwner = await createKeypair();

  await airdrop(rpc, masterOwner.address);

  // Create master edition with limited print supply
  const createIx = await getCreateV1InstructionAsync({
    mint: masterMint,
    authority: masterOwner,
    payer: masterOwner,
    name: 'My Master NFT',
    uri: 'https://example.com/master-nft.json',
    sellerFeeBasisPoints: basisPoints(5.42),
    tokenStandard: TokenStandard.NonFungible,
    printSupply: { __kind: 'Limited', fields: [10n] } as PrintSupply,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [masterMint, masterOwner]);

  // Mint the master edition token
  const [masterTokenAddress] = await findAssociatedTokenPda({
    mint: masterMint.address,
    owner: masterOwner.address,
  });

  const mintIx = await getMintV1InstructionAsync({
    mint: masterMint.address,
    authority: masterOwner,
    payer: masterOwner,
    token: masterTokenAddress,
    tokenOwner: masterOwner.address,
    tokenStandard: TokenStandard.NonFungible,
    amount: 1n,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintIx, [masterOwner]);

  // Print a new edition
  const editionMint = await createKeypair();
  const editionOwner = await createKeypair();

  await airdrop(rpc, editionOwner.address);

  const printIx = await getPrintV1InstructionAsync({
    masterEditionMint: masterMint.address,
    masterTokenAccountOwner: masterOwner,
    editionMint: editionMint,
    editionTokenAccountOwner: editionOwner.address,
    editionNumber: 1n,
    tokenStandard: TokenStandard.NonFungible,
    payer: editionOwner,
    updateAuthority: masterOwner.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, printIx, [editionMint, editionOwner, masterOwner]);

  // Verify the master edition supply was incremented
  const [masterEditionAddress] = await findMasterEditionPda({
    mint: masterMint.address,
  });
  const masterEdition = await fetchMasterEdition(rpc, masterEditionAddress);

  t.is(masterEdition.data.supply, 1n);
  t.deepEqual(masterEdition.data.maxSupply, { __option: 'Some', value: 10n });

  // Verify the edition metadata was created
  const [editionMetadataAddress] = await findMetadataPda({
    mint: editionMint.address,
  });
  const editionMetadata = await fetchMetadata(rpc, editionMetadataAddress);

  t.is(editionMetadata.data.name, 'My Master NFT');
  t.is(editionMetadata.data.uri, 'https://example.com/master-nft.json');
  t.is(editionMetadata.data.sellerFeeBasisPoints, 542);
});

/**
 * Test: Print a new edition from a ProgrammableNonFungible master edition
 */
test('it can print a new edition from a ProgrammableNonFungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();

  // Create master edition
  const masterMint = await createKeypair();
  const masterOwner = await createKeypair();

  await airdrop(rpc, masterOwner.address);

  // Create ProgrammableNonFungible master edition with limited print supply
  const createIx = await getCreateV1InstructionAsync({
    mint: masterMint,
    authority: masterOwner,
    payer: masterOwner,
    name: 'My Master PNFT',
    uri: 'https://example.com/master-pnft.json',
    sellerFeeBasisPoints: basisPoints(5.42),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    printSupply: { __kind: 'Limited', fields: [10n] } as PrintSupply,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [masterMint, masterOwner]);

  // Mint the master edition token
  const [masterTokenAddress] = await findAssociatedTokenPda({
    mint: masterMint.address,
    owner: masterOwner.address,
  });

  const mintIx = await getMintV1InstructionAsync({
    mint: masterMint.address,
    authority: masterOwner,
    payer: masterOwner,
    token: masterTokenAddress,
    tokenOwner: masterOwner.address,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    amount: 1n,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintIx, [masterOwner]);

  // Print a new edition
  const editionMint = await createKeypair();
  const editionOwner = await createKeypair();

  await airdrop(rpc, editionOwner.address);

  const printIx = await getPrintV1InstructionAsync({
    masterEditionMint: masterMint.address,
    masterTokenAccountOwner: masterOwner,
    editionMint: editionMint,
    editionTokenAccountOwner: editionOwner.address,
    editionNumber: 1n,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    payer: editionOwner,
    updateAuthority: masterOwner.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, printIx, [editionMint, editionOwner, masterOwner]);

  // Verify the master edition supply was incremented
  const [masterEditionAddress] = await findMasterEditionPda({
    mint: masterMint.address,
  });
  const masterEdition = await fetchMasterEdition(rpc, masterEditionAddress);

  t.is(masterEdition.data.supply, 1n);
  t.deepEqual(masterEdition.data.maxSupply, { __option: 'Some', value: 10n });

  // Verify the edition metadata was created with ProgrammableNonFungibleEdition standard
  const [editionMetadataAddress] = await findMetadataPda({
    mint: editionMint.address,
  });
  const editionMetadata = await fetchMetadata(rpc, editionMetadataAddress);

  t.is(editionMetadata.data.name, 'My Master PNFT');
  t.is(editionMetadata.data.uri, 'https://example.com/master-pnft.json');
  t.is(editionMetadata.data.sellerFeeBasisPoints, 542);
  t.deepEqual(editionMetadata.data.tokenStandard, {
    __option: 'Some',
    value: TokenStandard.ProgrammableNonFungibleEdition,
  });
});
