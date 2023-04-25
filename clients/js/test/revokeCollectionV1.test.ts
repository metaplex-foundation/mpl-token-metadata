import { generateSigner } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  MetadataDelegateRole,
  TokenStandard,
  delegateCollectionV1,
  findMetadataDelegateRecordPda,
  revokeCollectionV1,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can revoke a collection delegate for a NonFungible', async (t) => {
  // Given a NonFungible with an approved collection delegate.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
  });
  const collectionDelegate = generateSigner(umi).publicKey;
  await delegateCollectionV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: collectionDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);
  const metadataDelegateRecord = findMetadataDelegateRecordPda(umi, {
    mint,
    delegateRole: MetadataDelegateRole.Collection,
    delegate: collectionDelegate,
    updateAuthority: updateAuthority.publicKey,
  });
  t.true(await umi.rpc.accountExists(metadataDelegateRecord));

  // When we revoke the collection delegate.
  await revokeCollectionV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: collectionDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then the metadata delegate record was deleted.
  t.false(await umi.rpc.accountExists(metadataDelegateRecord));
});

test('it can revoke a collection delegate for a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible with an approved collection delegate.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });
  const collectionDelegate = generateSigner(umi).publicKey;
  await delegateCollectionV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: collectionDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);
  const metadataDelegateRecord = findMetadataDelegateRecordPda(umi, {
    mint,
    delegateRole: MetadataDelegateRole.Collection,
    delegate: collectionDelegate,
    updateAuthority: updateAuthority.publicKey,
  });
  t.true(await umi.rpc.accountExists(metadataDelegateRecord));

  // When we revoke the collection delegate.
  await revokeCollectionV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: collectionDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then the metadata delegate record was deleted.
  t.false(await umi.rpc.accountExists(metadataDelegateRecord));
});

test('it can revoke a collection delegate for a Fungible', async (t) => {
  // Given a Fungible with an approved collection delegate.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
    tokenStandard: TokenStandard.Fungible,
  });
  const collectionDelegate = generateSigner(umi).publicKey;
  await delegateCollectionV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: collectionDelegate,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);
  const metadataDelegateRecord = findMetadataDelegateRecordPda(umi, {
    mint,
    delegateRole: MetadataDelegateRole.Collection,
    delegate: collectionDelegate,
    updateAuthority: updateAuthority.publicKey,
  });
  t.true(await umi.rpc.accountExists(metadataDelegateRecord));

  // When we revoke the collection delegate.
  await revokeCollectionV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: collectionDelegate,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  // Then the metadata delegate record was deleted.
  t.false(await umi.rpc.accountExists(metadataDelegateRecord));
});

test('it can revoke a collection delegate for a FungibleAsset', async (t) => {
  // Given a FungibleAsset with an approved collection delegate.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
    tokenStandard: TokenStandard.FungibleAsset,
  });
  const collectionDelegate = generateSigner(umi).publicKey;
  await delegateCollectionV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: collectionDelegate,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);
  const metadataDelegateRecord = findMetadataDelegateRecordPda(umi, {
    mint,
    delegateRole: MetadataDelegateRole.Collection,
    delegate: collectionDelegate,
    updateAuthority: updateAuthority.publicKey,
  });
  t.true(await umi.rpc.accountExists(metadataDelegateRecord));

  // When we revoke the collection delegate.
  await revokeCollectionV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: collectionDelegate,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);

  // Then the metadata delegate record was deleted.
  t.false(await umi.rpc.accountExists(metadataDelegateRecord));
});
