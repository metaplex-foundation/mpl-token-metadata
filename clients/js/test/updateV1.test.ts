import { some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  fetchMetadata,
  findMetadataPda,
  Metadata,
  TokenStandard,
  updateV1,
} from '../src';
import { createDigitalAsset, createUmi } from './_setup';

test('it can update a NonFungible', async (t) => {
  // Given an existing NonFungible.
  const umi = await createUmi();
  const mint = await createDigitalAsset(umi, { name: 'NonFungible #1' });
  const initialMetadata = findMetadataPda(umi, { mint: mint.publicKey });
  const initialMetadataAccount = await fetchMetadata(umi, initialMetadata);

  // When we update the name of the NonFungible.
  await updateV1(umi, {
    mint: mint.publicKey,
    data: some({ ...initialMetadataAccount, name: 'NonFungible #2' }),
  }).sendAndConfirm(umi);

  // Then the account data was updated.
  const updatedMetadataAccount = await fetchMetadata(umi, initialMetadata);
  t.like(updatedMetadataAccount, <Metadata>{ name: 'NonFungible #2' });
});

test('it can update a ProgrammableNonFungible', async (t) => {
  // Given an existing ProgrammableNonFungible.
  const umi = await createUmi();
  const mint = await createDigitalAsset(umi, {
    name: 'ProgrammableNonFungible #1',
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });
  const initialMetadata = findMetadataPda(umi, { mint: mint.publicKey });
  const initialMetadataAccount = await fetchMetadata(umi, initialMetadata);

  // When we update the name of the PNFT.
  await updateV1(umi, {
    mint: mint.publicKey,
    data: some({
      ...initialMetadataAccount,
      name: 'ProgrammableNonFungible #2',
    }),
  }).sendAndConfirm(umi);

  // Then the account data was updated.
  const updatedMetadataAccount = await fetchMetadata(umi, initialMetadata);
  t.like(updatedMetadataAccount, <Metadata>{
    name: 'ProgrammableNonFungible #2',
  });
});

test('it can update a Fungible', async (t) => {
  // Given an existing Fungible.
  const umi = await createUmi();
  const mint = await createDigitalAsset(umi, {
    name: 'Fungible #1',
    tokenStandard: TokenStandard.Fungible,
  });
  const initialMetadata = findMetadataPda(umi, { mint: mint.publicKey });
  const initialMetadataAccount = await fetchMetadata(umi, initialMetadata);

  // When we update the name of the Fungible.
  await updateV1(umi, {
    mint: mint.publicKey,
    data: some({ ...initialMetadataAccount, name: 'Fungible #2' }),
  }).sendAndConfirm(umi);

  // Then the account data was updated.
  const updatedMetadataAccount = await fetchMetadata(umi, initialMetadata);
  t.like(updatedMetadataAccount, <Metadata>{ name: 'Fungible #2' });
});

test('it can update a FungibleAsset', async (t) => {
  // Given an existing FungibleAsset.
  const umi = await createUmi();
  const mint = await createDigitalAsset(umi, {
    name: 'FungibleAsset #1',
    tokenStandard: TokenStandard.FungibleAsset,
  });
  const initialMetadata = findMetadataPda(umi, { mint: mint.publicKey });
  const initialMetadataAccount = await fetchMetadata(umi, initialMetadata);

  // When we update the name of the FungibleAsset.
  await updateV1(umi, {
    mint: mint.publicKey,
    data: some({ ...initialMetadataAccount, name: 'FungibleAsset #2' }),
  }).sendAndConfirm(umi);

  // Then the account data was updated.
  const updatedMetadataAccount = await fetchMetadata(umi, initialMetadata);
  t.like(updatedMetadataAccount, <Metadata>{ name: 'FungibleAsset #2' });
});
