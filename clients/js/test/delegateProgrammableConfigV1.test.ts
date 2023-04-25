import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  MetadataDelegateRecord,
  MetadataDelegateRole,
  TokenStandard,
  delegateProgrammableConfigV1,
  fetchMetadataDelegateRecord,
  findMetadataDelegateRecordPda,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can approve a programmable config delegate for a NonFungible', async (t) => {
  // Given a NonFungible.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
  });

  // When we approve a programmable config delegate.
  const programmableConfigDelegate = generateSigner(umi).publicKey;
  await delegateProgrammableConfigV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: programmableConfigDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then a new metadata delegate record was created.
  const delegateRecord = await fetchMetadataDelegateRecord(
    umi,
    findMetadataDelegateRecordPda(umi, {
      mint,
      delegateRole: MetadataDelegateRole.ProgrammableConfig,
      delegate: programmableConfigDelegate,
      updateAuthority: updateAuthority.publicKey,
    })
  );
  t.like(delegateRecord, <MetadataDelegateRecord>{
    mint: publicKey(mint),
    updateAuthority: publicKey(updateAuthority),
    delegate: publicKey(programmableConfigDelegate),
  });
});

test('it can approve a programmable config delegate for a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // When we approve a programmable config delegate.
  const programmableConfigDelegate = generateSigner(umi).publicKey;
  await delegateProgrammableConfigV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: programmableConfigDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then a new metadata delegate record was created.
  const delegateRecord = await fetchMetadataDelegateRecord(
    umi,
    findMetadataDelegateRecordPda(umi, {
      mint,
      delegateRole: MetadataDelegateRole.ProgrammableConfig,
      delegate: programmableConfigDelegate,
      updateAuthority: updateAuthority.publicKey,
    })
  );
  t.like(delegateRecord, <MetadataDelegateRecord>{
    mint: publicKey(mint),
    updateAuthority: publicKey(updateAuthority),
    delegate: publicKey(programmableConfigDelegate),
  });
});

test('it can approve a programmable config delegate for a Fungible', async (t) => {
  // Given a Fungible.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
    tokenStandard: TokenStandard.Fungible,
  });

  // When we approve a programmable config delegate.
  const programmableConfigDelegate = generateSigner(umi).publicKey;
  await delegateProgrammableConfigV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: programmableConfigDelegate,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  // Then a new metadata delegate record was created.
  const delegateRecord = await fetchMetadataDelegateRecord(
    umi,
    findMetadataDelegateRecordPda(umi, {
      mint,
      delegateRole: MetadataDelegateRole.ProgrammableConfig,
      delegate: programmableConfigDelegate,
      updateAuthority: updateAuthority.publicKey,
    })
  );
  t.like(delegateRecord, <MetadataDelegateRecord>{
    mint: publicKey(mint),
    updateAuthority: publicKey(updateAuthority),
    delegate: publicKey(programmableConfigDelegate),
  });
});

test('it can approve a programmable config delegate for a FungibleAsset', async (t) => {
  // Given a FungibleAsset.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  // When we approve a programmable config delegate.
  const programmableConfigDelegate = generateSigner(umi).publicKey;
  await delegateProgrammableConfigV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: programmableConfigDelegate,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);

  // Then a new metadata delegate record was created.
  const delegateRecord = await fetchMetadataDelegateRecord(
    umi,
    findMetadataDelegateRecordPda(umi, {
      mint,
      delegateRole: MetadataDelegateRole.ProgrammableConfig,
      delegate: programmableConfigDelegate,
      updateAuthority: updateAuthority.publicKey,
    })
  );
  t.like(delegateRecord, <MetadataDelegateRecord>{
    mint: publicKey(mint),
    updateAuthority: publicKey(updateAuthority),
    delegate: publicKey(programmableConfigDelegate),
  });
});
