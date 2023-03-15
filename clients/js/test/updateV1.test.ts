import { some } from '@metaplex-foundation/umi';
import test from 'ava';
import { fetchMetadata, findMetadataPda, Metadata, updateV1 } from '../src';
import { createDigitalAsset, createUmi } from './_setup';

test('it can update a NonFungible', async (t) => {
  // Given an existing NFT.
  const umi = await createUmi();
  const mint = await createDigitalAsset(umi, { name: 'NFT #1' });
  const initialMetadata = findMetadataPda(umi, { mint: mint.publicKey });
  const initialMetadataAccount = await fetchMetadata(umi, initialMetadata);

  // When we update the name of the NFT.
  await updateV1(umi, {
    mint: mint.publicKey,
    data: some({ ...initialMetadataAccount, name: 'NFT #2' }),
  }).sendAndConfirm(umi);

  // Then the account data was updated.
  const updatedMetadataAccount = await fetchMetadata(umi, initialMetadata);
  t.like(updatedMetadataAccount, <Metadata>{ name: 'NFT #2' });
});
