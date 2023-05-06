import { generateSigner, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  collectionToggle,
  delegateCollectionItemV1,
  fetchMetadataFromSeeds,
  Metadata,
  TokenStandard,
  updateAsCollectionItemDelegateV2,
} from '../src';
import {
  createDigitalAsset,
  createUmi,
  NON_EDITION_TOKEN_STANDARDS,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can update a ${tokenStandard} as a collection item delegate`, async (t) => {
    // Given a Collection NFT and an asset that does not belong to any collection.
    const umi = await createUmi();
    const { publicKey: collectionMint } = await createDigitalAsset(umi, {
      isCollection: true,
    });
    const { publicKey: mint } = await createDigitalAsset(umi, {
      tokenStandard: TokenStandard[tokenStandard],
    });

    // And a collection item delegate approved on the asset.
    const collectionItemDelegate = generateSigner(umi);
    await delegateCollectionItemV1(umi, {
      mint,
      delegate: collectionItemDelegate.publicKey,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // When the delegate sets the collection on the asset.
    await updateAsCollectionItemDelegateV2(umi, {
      mint,
      authority: collectionItemDelegate,
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
