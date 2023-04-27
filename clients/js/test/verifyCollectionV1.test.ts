import { generateSigner, publicKey, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  Metadata,
  fetchMetadata,
  findMetadataPda,
  verifyCollectionV1,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can verify the collection of a NonFungible', async (t) => {
  // Given a NonFungible with an unverified collection.
  const umi = await createUmi();
  const collectionAuthority = generateSigner(umi);
  const { publicKey: collectionMint } = await createDigitalAssetWithToken(umi, {
    isCollection: true,
    authority: collectionAuthority,
  });
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    collection: some({ key: collectionMint, verified: false }),
  });

  // When the collection authority verifies the collection on the asset.
  const metadata = findMetadataPda(umi, { mint });
  await verifyCollectionV1(umi, {
    metadata,
    collectionMint,
    authority: collectionAuthority,
  }).sendAndConfirm(umi);

  // Then the collection is now marked as verified on the asset.
  t.like(await fetchMetadata(umi, metadata), <Metadata>{
    publicKey: publicKey(metadata),
    collection: some({ key: collectionMint, verified: true }),
  });
});
