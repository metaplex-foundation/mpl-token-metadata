import { generateSigner, publicKey, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  Metadata,
  TokenStandard,
  fetchMetadata,
  findMetadataPda,
  verifyCreatorV1,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can verify the creator of a NonFungible', async (t) => {
  // Given a NonFungible with an unverified creator.
  const umi = await createUmi();
  const creator = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    creators: some([
      { address: creator.publicKey, verified: false, share: 100 },
    ]),
  });

  // When the creator verifies themselves on the asset.
  const metadata = findMetadataPda(umi, { mint });
  await verifyCreatorV1(umi, {
    metadata,
    authority: creator,
  }).sendAndConfirm(umi);

  // Then the creator is now marked as verified on the asset.
  t.like(await fetchMetadata(umi, metadata), <Metadata>{
    publicKey: publicKey(metadata),
    creators: some([
      { address: creator.publicKey, verified: true, share: 100 },
    ]),
  });
});

test('it can verify the creator of a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible with an unverified creator.
  const umi = await createUmi();
  const creator = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    creators: some([
      { address: creator.publicKey, verified: false, share: 100 },
    ]),
  });

  // When the creator verifies themselves on the asset.
  const metadata = findMetadataPda(umi, { mint });
  await verifyCreatorV1(umi, {
    metadata,
    authority: creator,
  }).sendAndConfirm(umi);

  // Then the creator is now marked as verified on the asset.
  t.like(await fetchMetadata(umi, metadata), <Metadata>{
    publicKey: publicKey(metadata),
    creators: some([
      { address: creator.publicKey, verified: true, share: 100 },
    ]),
  });
});

test('it can verify the creator of a Fungible', async (t) => {
  // Given a Fungible with an unverified creator.
  const umi = await createUmi();
  const creator = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenStandard: TokenStandard.Fungible,
    creators: some([
      { address: creator.publicKey, verified: false, share: 100 },
    ]),
  });

  // When the creator verifies themselves on the asset.
  const metadata = findMetadataPda(umi, { mint });
  await verifyCreatorV1(umi, {
    metadata,
    authority: creator,
  }).sendAndConfirm(umi);

  // Then the creator is now marked as verified on the asset.
  t.like(await fetchMetadata(umi, metadata), <Metadata>{
    publicKey: publicKey(metadata),
    creators: some([
      { address: creator.publicKey, verified: true, share: 100 },
    ]),
  });
});

test('it can verify the creator of a FungibleAsset', async (t) => {
  // Given a FungibleAsset with an unverified creator.
  const umi = await createUmi();
  const creator = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenStandard: TokenStandard.FungibleAsset,
    creators: some([
      { address: creator.publicKey, verified: false, share: 100 },
    ]),
  });

  // When the creator verifies themselves on the asset.
  const metadata = findMetadataPda(umi, { mint });
  await verifyCreatorV1(umi, {
    metadata,
    authority: creator,
  }).sendAndConfirm(umi);

  // Then the creator is now marked as verified on the asset.
  t.like(await fetchMetadata(umi, metadata), <Metadata>{
    publicKey: publicKey(metadata),
    creators: some([
      { address: creator.publicKey, verified: true, share: 100 },
    ]),
  });
});
