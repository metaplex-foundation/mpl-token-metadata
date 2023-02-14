import {
  base58PublicKey,
  generateSigner,
  PublicKey,
  publicKey,
  some,
} from '@metaplex-foundation/umi-test';
import test from 'ava';
import {
  DigitalAsset,
  fetchAllDigitalAsset,
  fetchAllDigitalAssetByCreator,
  fetchAllDigitalAssetByUpdateAuthority,
  fetchDigitalAsset,
  fetchDigitalAssetByMetadata,
  findMasterEditionPda,
  findMetadataPda,
  TokenStandard,
} from '../src';
import { createDigitalAsset, createUmi } from './_setup';

test('it can fetch a DigitalAsset by mint', async (t) => {
  // Given an existing NFT.
  const mx = await createUmi();
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
  const mx = await createUmi();
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
  const mx = await createUmi();
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

test('it can fetch all DigitalAssets by creators', async (t) => {
  // Given two creators A and B.
  const mx = await createUmi();
  const creatorA = generateSigner(mx).publicKey;
  const creatorB = generateSigner(mx).publicKey;

  // And three NFTs such that 2 are created by A and 1 is created by B.
  const mintA1 = await createDigitalAssetWithFirstCreator(mx, creatorA);
  const mintA2 = await createDigitalAssetWithFirstCreator(mx, creatorA);
  const mintB1 = await createDigitalAssetWithFirstCreator(mx, creatorB);

  // When we fetch all digital assets such that their first creator is A.
  const digitalAssets = await fetchAllDigitalAssetByCreator(mx, creatorA);

  // Then we get the two NFTs created by A.
  t.is(digitalAssets.length, 2);
  const mints = digitalAssets.map((da) => base58PublicKey(da.mint));
  t.true(mints.includes(base58PublicKey(mintA1.publicKey)));
  t.true(mints.includes(base58PublicKey(mintA2.publicKey)));

  // And we don't get the NFT created by B.
  t.false(mints.includes(base58PublicKey(mintB1.publicKey)));
});

test('it can fetch all DigitalAssets by creators in different positions', async (t) => {
  // Given two creators A and B.
  const mx = await createUmi();
  const creatorA = generateSigner(mx).publicKey;
  const creatorB = generateSigner(mx).publicKey;

  // And three NFTs such that 2 are co-created by A and 1 is co-created by B.
  // Creators A and B are assigned as the second creator for each of their NFTs.
  const mintA1 = await createDigitalAssetWithSecondCreator(mx, creatorA);
  const mintA2 = await createDigitalAssetWithSecondCreator(mx, creatorA);
  const mintB1 = await createDigitalAssetWithSecondCreator(mx, creatorB);

  // When we fetch all digital assets such that their second creator is A.
  const digitalAssets = await fetchAllDigitalAssetByCreator(mx, creatorA, {
    position: 2,
  });

  // Then we get the two NFTs co-created by A.
  t.is(digitalAssets.length, 2);
  const mints = digitalAssets.map((da) => base58PublicKey(da.mint));
  t.true(mints.includes(base58PublicKey(mintA1.publicKey)));
  t.true(mints.includes(base58PublicKey(mintA2.publicKey)));

  // And we don't get the NFT co-created by B.
  t.false(mints.includes(base58PublicKey(mintB1.publicKey)));
});

test('it can fetch all DigitalAssets by update authority', async (t) => {
  // Given two update authorities A and B.
  const mx = await createUmi();
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

function createDigitalAssetWithFirstCreator(
  context: Parameters<typeof createDigitalAsset>[0],
  creator: PublicKey
) {
  return createDigitalAsset(context, {
    creators: some([
      { address: creator, share: 50, verified: false },
      { address: context.identity.publicKey, share: 50, verified: false },
    ]),
  });
}

function createDigitalAssetWithSecondCreator(
  context: Parameters<typeof createDigitalAsset>[0],
  creator: PublicKey
) {
  return createDigitalAsset(context, {
    creators: some([
      { address: context.identity.publicKey, share: 50, verified: false },
      { address: creator, share: 50, verified: false },
    ]),
  });
}
