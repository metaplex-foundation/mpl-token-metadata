import { generateSigner, publicKey, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  Metadata,
  MetadataDelegateRole,
  TokenStandard,
  delegateCollectionV1,
  fetchMetadata,
  findMetadataDelegateRecordPda,
  findMetadataPda,
  verifyCollectionV1,
} from '../src';
import {
  NON_EDITION_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can verify the collection of a ${tokenStandard}`, async (t) => {
    // Given an asset with an unverified collection.
    const umi = await createUmi();
    const collectionAuthority = generateSigner(umi);
    const { publicKey: collectionMint } = await createDigitalAssetWithToken(
      umi,
      { isCollection: true, authority: collectionAuthority }
    );
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      collection: some({ key: collectionMint, verified: false }),
      tokenStandard: TokenStandard[tokenStandard],
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

  test(`it can verify the collection of a ${tokenStandard} as a delegate`, async (t) => {
    // Given an asset with an unverified collection that as a delegate.
    const umi = await createUmi();
    const collectionDelegate = generateSigner(umi);
    const { publicKey: collectionMint } = await createDigitalAssetWithToken(
      umi,
      { isCollection: true }
    );
    await delegateCollectionV1(umi, {
      mint: collectionMint,
      delegate: collectionDelegate.publicKey,
      tokenStandard: TokenStandard.NonFungible,
    }).sendAndConfirm(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      collection: some({ key: collectionMint, verified: false }),
      tokenStandard: TokenStandard[tokenStandard],
    });

    // When the collection delegate verifies the collection on the asset.
    const metadata = findMetadataPda(umi, { mint });
    await verifyCollectionV1(umi, {
      metadata,
      collectionMint,
      authority: collectionDelegate,
      delegateRecord: findMetadataDelegateRecordPda(umi, {
        mint: collectionMint,
        delegateRole: MetadataDelegateRole.Collection,
        delegate: collectionDelegate.publicKey,
        updateAuthority: umi.identity.publicKey,
      }),
    }).sendAndConfirm(umi);

    // Then the collection is now marked as verified on the asset.
    t.like(await fetchMetadata(umi, metadata), <Metadata>{
      publicKey: publicKey(metadata),
      collection: some({ key: collectionMint, verified: true }),
    });
  });
});
