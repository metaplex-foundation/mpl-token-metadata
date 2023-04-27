import { generateSigner, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  Metadata,
  MetadataDelegateRole,
  TokenStandard,
  delegateCollectionV1,
  fetchMetadata,
  findMetadataDelegateRecordPda,
  findMetadataPda,
  unverifyCollectionV1,
  verifyCollectionV1,
} from '../src';
import {
  NON_EDITION_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can unverify the collection of a ${tokenStandard}`, async (t) => {
    // Given a collection.
    const umi = await createUmi();
    const collectionAuthority = generateSigner(umi);
    const { publicKey: collectionMint } = await createDigitalAssetWithToken(
      umi,
      { isCollection: true, authority: collectionAuthority }
    );

    // And an asset verified as part of that collection.
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      collection: some({ key: collectionMint, verified: false }),
      tokenStandard: TokenStandard[tokenStandard],
    });
    const metadata = findMetadataPda(umi, { mint });
    await verifyCollectionV1(umi, {
      metadata,
      collectionMint,
      authority: collectionAuthority,
    }).sendAndConfirm(umi);
    t.like(await fetchMetadata(umi, metadata), <Metadata>{
      collection: some({ key: collectionMint, verified: true }),
    });

    // When the collection authority unverifies the collection on the asset.
    await unverifyCollectionV1(umi, {
      metadata,
      collectionMint,
      authority: collectionAuthority,
    }).sendAndConfirm(umi);

    // Then the collection is now marked as unverified on the asset.
    t.like(await fetchMetadata(umi, metadata), <Metadata>{
      collection: some({ key: collectionMint, verified: false }),
    });
  });

  test(`it can unverify the collection of a ${tokenStandard} as a delegate`, async (t) => {
    // Given a collection with a delegate.
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

    // And an asset verified as part of that collection.
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      collection: some({ key: collectionMint, verified: false }),
      tokenStandard: TokenStandard[tokenStandard],
    });
    const metadata = findMetadataPda(umi, { mint });
    await verifyCollectionV1(umi, {
      metadata,
      collectionMint,
    }).sendAndConfirm(umi);
    t.like(await fetchMetadata(umi, metadata), <Metadata>{
      collection: some({ key: collectionMint, verified: true }),
    });

    // When the collection delegate unverifies the collection on the asset.
    await unverifyCollectionV1(umi, {
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

    // Then the collection is now marked as unverified on the asset.
    t.like(await fetchMetadata(umi, metadata), <Metadata>{
      collection: some({ key: collectionMint, verified: false }),
    });
  });
});
