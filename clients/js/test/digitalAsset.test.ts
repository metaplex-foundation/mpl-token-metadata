import { base58PublicKey, publicKey, some } from '@lorisleiva/js-test';
import test from 'ava';
import {
  DigitalAsset,
  fetchAllDigitalAsset,
  fetchDigitalAsset,
  fetchDigitalAssetByMetadata,
  findMasterEditionPda,
  findMetadataPda,
  TokenStandard,
} from '../src';
import { createDigitalAsset, createMetaplex } from './_setup';

test('it can fetch a DigitalAsset by mint', async (t) => {
  // Given an existing NFT.
  const mx = await createMetaplex();
  const mint = await createDigitalAsset(mx);

  // When we fetch a digital asset using its mint address.
  const digitalAsset = await fetchDigitalAsset(mx, mint.publicKey);

  // Then we get the expected digital asset.
  const metadata = findMetadataPda(mx, { mint: mint.publicKey });
  const edition = findMasterEditionPda(mx, { mint: mint.publicKey });
  t.like(digitalAsset, <DigitalAsset>{
    publicKey: publicKey(mint.publicKey),
    mint: { publicKey: publicKey(mint.publicKey) },
    metadata: {
      publicKey: publicKey(metadata),
      mint: publicKey(mint.publicKey),
      tokenStandard: some(TokenStandard.NonFungible),
    },
    edition: {
      isOriginal: true,
      publicKey: publicKey(edition),
    },
  });
});

test('it can fetch a DigitalAsset by metadata', async (t) => {
  // Given an existing NFT.
  const mx = await createMetaplex();
  const mint = await createDigitalAsset(mx);

  // When we fetch a digital asset using its metadata address.
  const metadata = findMetadataPda(mx, { mint: mint.publicKey });
  const digitalAsset = await fetchDigitalAssetByMetadata(mx, metadata);

  // Then we get the expected digital asset.
  const edition = findMasterEditionPda(mx, { mint: mint.publicKey });
  t.like(digitalAsset, <DigitalAsset>{
    publicKey: publicKey(mint.publicKey),
    mint: { publicKey: publicKey(mint.publicKey) },
    metadata: {
      publicKey: publicKey(metadata),
      mint: publicKey(mint.publicKey),
      tokenStandard: some(TokenStandard.NonFungible),
    },
    edition: {
      isOriginal: true,
      publicKey: publicKey(edition),
    },
  });
});

test('it can fetch all DigitalAssets by mint list', async (t) => {
  // Given two existing NFTs.
  const mx = await createMetaplex();
  const mintA = await createDigitalAsset(mx);
  const mintB = await createDigitalAsset(mx);

  // When we fetch both of them using their mint addresses.
  const digitalAssets = await fetchAllDigitalAsset(mx, [
    mintA.publicKey,
    mintB.publicKey,
  ]);

  // Then we get the expected digital assets.
  t.is(digitalAssets.length, 2);
  const mints = digitalAssets.map((da) => base58PublicKey(da.mint));
  t.true(mints.includes(base58PublicKey(mintA.publicKey)));
  t.true(mints.includes(base58PublicKey(mintB.publicKey)));
});
