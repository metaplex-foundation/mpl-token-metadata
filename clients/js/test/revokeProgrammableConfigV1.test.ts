import { generateSigner } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  MetadataDelegateRole,
  TokenStandard,
  delegateProgrammableConfigV1,
  findMetadataDelegateRecordPda,
  revokeProgrammableConfigV1,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can revoke a programmable config delegate for a NonFungible', async (t) => {
  // Given a NonFungible with an approved programmable config delegate.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
  });
  const programmableConfigDelegate = generateSigner(umi).publicKey;
  await delegateProgrammableConfigV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: programmableConfigDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);
  const metadataDelegateRecord = findMetadataDelegateRecordPda(umi, {
    mint,
    delegateRole: MetadataDelegateRole.ProgrammableConfig,
    delegate: programmableConfigDelegate,
    updateAuthority: updateAuthority.publicKey,
  });
  t.true(await umi.rpc.accountExists(metadataDelegateRecord));

  // When we revoke the programmable config delegate.
  await revokeProgrammableConfigV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: programmableConfigDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then the metadata delegate record was deleted.
  t.false(await umi.rpc.accountExists(metadataDelegateRecord));
});

test('it can revoke a programmable config delegate for a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible with an approved programmable config delegate.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });
  const programmableConfigDelegate = generateSigner(umi).publicKey;
  await delegateProgrammableConfigV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: programmableConfigDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);
  const metadataDelegateRecord = findMetadataDelegateRecordPda(umi, {
    mint,
    delegateRole: MetadataDelegateRole.ProgrammableConfig,
    delegate: programmableConfigDelegate,
    updateAuthority: updateAuthority.publicKey,
  });
  t.true(await umi.rpc.accountExists(metadataDelegateRecord));

  // When we revoke the programmable config delegate.
  await revokeProgrammableConfigV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: programmableConfigDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then the metadata delegate record was deleted.
  t.false(await umi.rpc.accountExists(metadataDelegateRecord));
});

test('it can revoke a programmable config delegate for a Fungible', async (t) => {
  // Given a Fungible with an approved programmable config delegate.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
    tokenStandard: TokenStandard.Fungible,
  });
  const programmableConfigDelegate = generateSigner(umi).publicKey;
  await delegateProgrammableConfigV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: programmableConfigDelegate,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);
  const metadataDelegateRecord = findMetadataDelegateRecordPda(umi, {
    mint,
    delegateRole: MetadataDelegateRole.ProgrammableConfig,
    delegate: programmableConfigDelegate,
    updateAuthority: updateAuthority.publicKey,
  });
  t.true(await umi.rpc.accountExists(metadataDelegateRecord));

  // When we revoke the programmable config delegate.
  await revokeProgrammableConfigV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: programmableConfigDelegate,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  // Then the metadata delegate record was deleted.
  t.false(await umi.rpc.accountExists(metadataDelegateRecord));
});

test('it can revoke a programmable config delegate for a FungibleAsset', async (t) => {
  // Given a FungibleAsset with an approved programmable config delegate.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
    tokenStandard: TokenStandard.FungibleAsset,
  });
  const programmableConfigDelegate = generateSigner(umi).publicKey;
  await delegateProgrammableConfigV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: programmableConfigDelegate,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);
  const metadataDelegateRecord = findMetadataDelegateRecordPda(umi, {
    mint,
    delegateRole: MetadataDelegateRole.ProgrammableConfig,
    delegate: programmableConfigDelegate,
    updateAuthority: updateAuthority.publicKey,
  });
  t.true(await umi.rpc.accountExists(metadataDelegateRecord));

  // When we revoke the programmable config delegate.
  await revokeProgrammableConfigV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: programmableConfigDelegate,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);

  // Then the metadata delegate record was deleted.
  t.false(await umi.rpc.accountExists(metadataDelegateRecord));
});
