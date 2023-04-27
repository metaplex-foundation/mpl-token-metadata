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

test('it can verify the collection of a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible with an unverified collection.
  const umi = await createUmi();
  const collectionAuthority = generateSigner(umi);
  const { publicKey: collectionMint } = await createDigitalAssetWithToken(umi, {
    isCollection: true,
    authority: collectionAuthority,
  });
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    collection: some({ key: collectionMint, verified: false }),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
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

test('it can verify the collection of a Fungible', async (t) => {
  // Given a Fungible with an unverified collection.
  const umi = await createUmi();
  const collectionAuthority = generateSigner(umi);
  const { publicKey: collectionMint } = await createDigitalAssetWithToken(umi, {
    isCollection: true,
    authority: collectionAuthority,
  });
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    collection: some({ key: collectionMint, verified: false }),
    tokenStandard: TokenStandard.Fungible,
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

test('it can verify the collection of a FungibleAsset', async (t) => {
  // Given a FungibleAsset with an unverified collection.
  const umi = await createUmi();
  const collectionAuthority = generateSigner(umi);
  const { publicKey: collectionMint } = await createDigitalAssetWithToken(umi, {
    isCollection: true,
    authority: collectionAuthority,
  });
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    collection: some({ key: collectionMint, verified: false }),
    tokenStandard: TokenStandard.FungibleAsset,
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

test('it can verify the collection of a NonFungible as a delegate', async (t) => {
  // Given a NonFungible with an unverified collection that as a delegate.
  const umi = await createUmi();
  const collectionDelegate = generateSigner(umi);
  const { publicKey: collectionMint } = await createDigitalAssetWithToken(umi, {
    isCollection: true,
  });
  await delegateCollectionV1(umi, {
    mint: collectionMint,
    delegate: collectionDelegate.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    collection: some({ key: collectionMint, verified: false }),
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

test('it can verify the collection of a ProgrammableNonFungible as a delegate', async (t) => {
  // Given a ProgrammableNonFungible with an unverified collection that as a delegate.
  const umi = await createUmi();
  const collectionDelegate = generateSigner(umi);
  const { publicKey: collectionMint } = await createDigitalAssetWithToken(umi, {
    isCollection: true,
  });
  await delegateCollectionV1(umi, {
    mint: collectionMint,
    delegate: collectionDelegate.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    collection: some({ key: collectionMint, verified: false }),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
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

test('it can verify the collection of a Fungible as a delegate', async (t) => {
  // Given a Fungible with an unverified collection that as a delegate.
  const umi = await createUmi();
  const collectionDelegate = generateSigner(umi);
  const { publicKey: collectionMint } = await createDigitalAssetWithToken(umi, {
    isCollection: true,
  });
  await delegateCollectionV1(umi, {
    mint: collectionMint,
    delegate: collectionDelegate.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    collection: some({ key: collectionMint, verified: false }),
    tokenStandard: TokenStandard.Fungible,
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

test('it can verify the collection of a FungibleAsset as a delegate', async (t) => {
  // Given a FungibleAsset with an unverified collection that as a delegate.
  const umi = await createUmi();
  const collectionDelegate = generateSigner(umi);
  const { publicKey: collectionMint } = await createDigitalAssetWithToken(umi, {
    isCollection: true,
  });
  await delegateCollectionV1(umi, {
    mint: collectionMint,
    delegate: collectionDelegate.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    collection: some({ key: collectionMint, verified: false }),
    tokenStandard: TokenStandard.FungibleAsset,
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
