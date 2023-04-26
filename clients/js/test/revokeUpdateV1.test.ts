import { generateSigner } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  MetadataDelegateRole,
  TokenStandard,
  delegateUpdateV1,
  findMetadataDelegateRecordPda,
  revokeUpdateV1,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can revoke a update delegate for a NonFungible', async (t) => {
  // Given a NonFungible with an approved update delegate.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
  });
  const updateDelegate = generateSigner(umi).publicKey;
  await delegateUpdateV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: updateDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);
  const metadataDelegateRecord = findMetadataDelegateRecordPda(umi, {
    mint,
    delegateRole: MetadataDelegateRole.Update,
    delegate: updateDelegate,
    updateAuthority: updateAuthority.publicKey,
  });
  t.true(await umi.rpc.accountExists(metadataDelegateRecord));

  // When we revoke the update delegate.
  await revokeUpdateV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: updateDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then the metadata delegate record was deleted.
  t.false(await umi.rpc.accountExists(metadataDelegateRecord));
});

test('it can revoke a update delegate for a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible with an approved update delegate.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });
  const updateDelegate = generateSigner(umi).publicKey;
  await delegateUpdateV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: updateDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);
  const metadataDelegateRecord = findMetadataDelegateRecordPda(umi, {
    mint,
    delegateRole: MetadataDelegateRole.Update,
    delegate: updateDelegate,
    updateAuthority: updateAuthority.publicKey,
  });
  t.true(await umi.rpc.accountExists(metadataDelegateRecord));

  // When we revoke the update delegate.
  await revokeUpdateV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: updateDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then the metadata delegate record was deleted.
  t.false(await umi.rpc.accountExists(metadataDelegateRecord));
});

test('it can revoke a update delegate for a Fungible', async (t) => {
  // Given a Fungible with an approved update delegate.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
    tokenStandard: TokenStandard.Fungible,
  });
  const updateDelegate = generateSigner(umi).publicKey;
  await delegateUpdateV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: updateDelegate,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);
  const metadataDelegateRecord = findMetadataDelegateRecordPda(umi, {
    mint,
    delegateRole: MetadataDelegateRole.Update,
    delegate: updateDelegate,
    updateAuthority: updateAuthority.publicKey,
  });
  t.true(await umi.rpc.accountExists(metadataDelegateRecord));

  // When we revoke the update delegate.
  await revokeUpdateV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: updateDelegate,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  // Then the metadata delegate record was deleted.
  t.false(await umi.rpc.accountExists(metadataDelegateRecord));
});

test('it can revoke a update delegate for a FungibleAsset', async (t) => {
  // Given a FungibleAsset with an approved update delegate.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
    tokenStandard: TokenStandard.FungibleAsset,
  });
  const updateDelegate = generateSigner(umi).publicKey;
  await delegateUpdateV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: updateDelegate,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);
  const metadataDelegateRecord = findMetadataDelegateRecordPda(umi, {
    mint,
    delegateRole: MetadataDelegateRole.Update,
    delegate: updateDelegate,
    updateAuthority: updateAuthority.publicKey,
  });
  t.true(await umi.rpc.accountExists(metadataDelegateRecord));

  // When we revoke the update delegate.
  await revokeUpdateV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: updateDelegate,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);

  // Then the metadata delegate record was deleted.
  t.false(await umi.rpc.accountExists(metadataDelegateRecord));
});
