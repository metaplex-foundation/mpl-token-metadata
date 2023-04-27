import { generateSigner, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  Metadata,
  TokenStandard,
  fetchMetadata,
  findMetadataPda,
  unverifyCreatorV1,
  verifyCreatorV1,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can unverify the creator of a NonFungible', async (t) => {
  // Given a NonFungible with an verified creator.
  const umi = await createUmi();
  const creator = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    creators: some([
      { address: creator.publicKey, verified: false, share: 100 },
    ]),
  });
  const metadata = findMetadataPda(umi, { mint });
  await verifyCreatorV1(umi, {
    metadata,
    authority: creator,
  }).sendAndConfirm(umi);
  t.like(await fetchMetadata(umi, metadata), <Metadata>{
    creators: some([
      { address: creator.publicKey, verified: true, share: 100 },
    ]),
  });

  // When the creator unverifies themselves on the asset.
  await unverifyCreatorV1(umi, {
    metadata,
    authority: creator,
  }).sendAndConfirm(umi);

  // Then the creator is now marked as unverified on the asset.
  t.like(await fetchMetadata(umi, metadata), <Metadata>{
    creators: some([
      { address: creator.publicKey, verified: false, share: 100 },
    ]),
  });
});

test('it can unverify the creator of a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible with an verified creator.
  const umi = await createUmi();
  const creator = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    creators: some([
      { address: creator.publicKey, verified: false, share: 100 },
    ]),
  });
  const metadata = findMetadataPda(umi, { mint });
  await verifyCreatorV1(umi, {
    metadata,
    authority: creator,
  }).sendAndConfirm(umi);
  t.like(await fetchMetadata(umi, metadata), <Metadata>{
    creators: some([
      { address: creator.publicKey, verified: true, share: 100 },
    ]),
  });

  // When the creator unverifies themselves on the asset.
  await unverifyCreatorV1(umi, {
    metadata,
    authority: creator,
  }).sendAndConfirm(umi);

  // Then the creator is now marked as unverified on the asset.
  t.like(await fetchMetadata(umi, metadata), <Metadata>{
    creators: some([
      { address: creator.publicKey, verified: false, share: 100 },
    ]),
  });
});

test('it can unverify the creator of a Fungible', async (t) => {
  // Given a Fungible with an verified creator.
  const umi = await createUmi();
  const creator = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenStandard: TokenStandard.Fungible,
    creators: some([
      { address: creator.publicKey, verified: false, share: 100 },
    ]),
  });
  const metadata = findMetadataPda(umi, { mint });
  await verifyCreatorV1(umi, {
    metadata,
    authority: creator,
  }).sendAndConfirm(umi);
  t.like(await fetchMetadata(umi, metadata), <Metadata>{
    creators: some([
      { address: creator.publicKey, verified: true, share: 100 },
    ]),
  });

  // When the creator unverifies themselves on the asset.
  await unverifyCreatorV1(umi, {
    metadata,
    authority: creator,
  }).sendAndConfirm(umi);

  // Then the creator is now marked as unverified on the asset.
  t.like(await fetchMetadata(umi, metadata), <Metadata>{
    creators: some([
      { address: creator.publicKey, verified: false, share: 100 },
    ]),
  });
});

test('it can unverify the creator of a FungibleAsset', async (t) => {
  // Given a FungibleAsset with an verified creator.
  const umi = await createUmi();
  const creator = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenStandard: TokenStandard.FungibleAsset,
    creators: some([
      { address: creator.publicKey, verified: false, share: 100 },
    ]),
  });
  const metadata = findMetadataPda(umi, { mint });
  await verifyCreatorV1(umi, {
    metadata,
    authority: creator,
  }).sendAndConfirm(umi);
  t.like(await fetchMetadata(umi, metadata), <Metadata>{
    creators: some([
      { address: creator.publicKey, verified: true, share: 100 },
    ]),
  });

  // When the creator unverifies themselves on the asset.
  await unverifyCreatorV1(umi, {
    metadata,
    authority: creator,
  }).sendAndConfirm(umi);

  // Then the creator is now marked as unverified on the asset.
  t.like(await fetchMetadata(umi, metadata), <Metadata>{
    creators: some([
      { address: creator.publicKey, verified: false, share: 100 },
    ]),
  });
});
