import {
  base58PublicKey,
  generateSigner,
  publicKey,
  some,
} from '@lorisleiva/js-test';
import test from 'ava';
import {
  DigitalAsset,
  fetchAllDigitalAsset,
  fetchAllDigitalAssetByUpdateAuthority,
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

test('it can fetch all DigitalAssets by update authority', async (t) => {
  // Given two update authorities A and B.
  const mx = await createMetaplex();
  const updateAuthorityA = generateSigner(mx);
  const updateAuthorityB = generateSigner(mx);

  // And three NFTs such that 2 are maintained by A and 1 is maintained by B.
  const mintA1 = await createDigitalAsset(mx, {
    authority: updateAuthorityA,
    updateAuthority: updateAuthorityA.publicKey,
  });
  const mintA2 = await createDigitalAsset(mx, {
    authority: updateAuthorityA,
    updateAuthority: updateAuthorityA.publicKey,
  });
  const mintB1 = await createDigitalAsset(mx, {
    authority: updateAuthorityB,
    updateAuthority: updateAuthorityB.publicKey,
  });

  // When we fetch all digital assets such that their update authority is A.
  const digitalAssets = await fetchAllDigitalAssetByUpdateAuthority(
    mx,
    updateAuthorityA.publicKey
  );

  // Then we get the two NFTs maintained by A.
  t.is(digitalAssets.length, 2);
  const mints = digitalAssets.map((da) => base58PublicKey(da.mint));
  t.true(mints.includes(base58PublicKey(mintA1.publicKey)));
  t.true(mints.includes(base58PublicKey(mintA2.publicKey)));

  // And we don't get the NFT maintained by B.
  t.false(mints.includes(base58PublicKey(mintB1.publicKey)));
});
