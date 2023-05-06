import { generateSigner, none, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  collectionToggle,
  delegateCollectionV1,
  fetchMetadataFromSeeds,
  Metadata,
  TokenStandard,
  updateAsCollectionDelegateV2,
} from '../src';
import {
  createDigitalAsset,
  createUmi,
  NON_EDITION_TOKEN_STANDARDS,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can update a ${tokenStandard} as a collection delegate`, async (t) => {
    // Given a Collection NFT and an asset that does not belong to any collection.
    const umi = await createUmi();
    const { publicKey: collectionMint } = await createDigitalAsset(umi, {
      isCollection: true,
    });
    const { publicKey: mint } = await createDigitalAsset(umi, {
      tokenStandard: TokenStandard[tokenStandard],
    });

    // And a collection delegate approved on the asset.
    const collectionDelegate = generateSigner(umi);
    await delegateCollectionV1(umi, {
      mint,
      delegate: collectionDelegate.publicKey,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // When the delegate sets the collection on the asset.
    await updateAsCollectionDelegateV2(umi, {
      mint,
      authority: collectionDelegate,
      collection: collectionToggle('Set', [
        { key: collectionMint, verified: false },
      ]),
    }).sendAndConfirm(umi);

    // Then the account data was updated.
    const updatedMetadata = await fetchMetadataFromSeeds(umi, { mint });
    t.like(updatedMetadata, <Metadata>{
      collection: some({ key: collectionMint, verified: false }),
    });
  });
});

test('it can update the items of a collection as a collection delegate', async (t) => {
  // Given a Collection NFT with one Regular NFT inside it.
  const umi = await createUmi();
  const { publicKey: collectionMint } = await createDigitalAsset(umi, {
    isCollection: true,
  });
  const { publicKey: mint } = await createDigitalAsset(umi, {
    collection: some({ key: collectionMint, verified: false }),
  });

  // And a collection delegate approved on the collection.
  const collectionDelegate = generateSigner(umi);
  await delegateCollectionV1(umi, {
    mint: collectionMint,
    delegate: collectionDelegate.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // When the delegate clears the collection on the asset.
  await updateAsCollectionDelegateV2(umi, {
    mint,
    delegateMint: collectionMint,
    authority: collectionDelegate,
    collection: collectionToggle('Clear'),
  }).sendAndConfirm(umi);

  // Then the account data was updated.
  let updatedMetadata = await fetchMetadataFromSeeds(umi, { mint });
  t.like(updatedMetadata, <Metadata>{ collection: none() });

  // When we try to set the collection on the asset afterwards.
  await updateAsCollectionDelegateV2(umi, {
    mint,
    delegateMint: collectionMint,
    authority: collectionDelegate,
    collection: collectionToggle('Set', [
      { key: collectionMint, verified: false },
    ]),
  }).sendAndConfirm(umi);

  // TODO? Then it fails because the asset is no longer part of the collection that has the delegate.
  // Then the account data was updated.
  updatedMetadata = await fetchMetadataFromSeeds(umi, { mint });
  t.like(updatedMetadata, <Metadata>{
    collection: some({ key: collectionMint, verified: false }),
  });
});
