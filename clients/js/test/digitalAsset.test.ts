import {
  base58PublicKey,
  generateSigner,
  PublicKey,
  publicKey,
  some,
} from '@metaplex-foundation/umi';
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
  const umi = await createUmi();
  const mint = await createDigitalAsset(umi);

  // When we fetch a digital asset using its mint address.
  const digitalAsset = await fetchDigitalAsset(umi, mint.publicKey);

  // Then we get the expected digital asset.
  const metadata = findMetadataPda(umi, { mint: mint.publicKey });
  const edition = findMasterEditionPda(umi, { mint: mint.publicKey });
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
  const umi = await createUmi();
  const mint = await createDigitalAsset(umi);

  // When we fetch a digital asset using its metadata address.
  const metadata = findMetadataPda(umi, { mint: mint.publicKey });
  const digitalAsset = await fetchDigitalAssetByMetadata(umi, metadata);

  // Then we get the expected digital asset.
  const edition = findMasterEditionPda(umi, { mint: mint.publicKey });
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
  const umi = await createUmi();
  const mintA = await createDigitalAsset(umi);
  const mintB = await createDigitalAsset(umi);

  // When we fetch both of them using their mint addresses.
  const digitalAssets = await fetchAllDigitalAsset(umi, [
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
  const umi = await createUmi();
  const creatorA = generateSigner(umi).publicKey;
  const creatorB = generateSigner(umi).publicKey;

  // And three NFTs such that 2 are created by A and 1 is created by B.
  const mintA1 = await createDigitalAssetWithFirstCreator(umi, creatorA);
  const mintA2 = await createDigitalAssetWithFirstCreator(umi, creatorA);
  const mintB1 = await createDigitalAssetWithFirstCreator(umi, creatorB);

  // When we fetch all digital assets such that their first creator is A.
  const digitalAssets = await fetchAllDigitalAssetByCreator(umi, creatorA);

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
  const umi = await createUmi();
  const creatorA = generateSigner(umi).publicKey;
  const creatorB = generateSigner(umi).publicKey;

  // And three NFTs such that 2 are co-created by A and 1 is co-created by B.
  // Creators A and B are assigned as the second creator for each of their NFTs.
  const mintA1 = await createDigitalAssetWithSecondCreator(umi, creatorA);
  const mintA2 = await createDigitalAssetWithSecondCreator(umi, creatorA);
  const mintB1 = await createDigitalAssetWithSecondCreator(umi, creatorB);

  // When we fetch all digital assets such that their second creator is A.
  const digitalAssets = await fetchAllDigitalAssetByCreator(umi, creatorA, {
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
  const umi = await createUmi();
  const updateAuthorityA = generateSigner(umi);
  const updateAuthorityB = generateSigner(umi);

  // And three NFTs such that 2 are maintained by A and 1 is maintained by B.
  const mintA1 = await createDigitalAsset(umi, {
    authority: updateAuthorityA,
    updateAuthority: updateAuthorityA.publicKey,
  });
  const mintA2 = await createDigitalAsset(umi, {
    authority: updateAuthorityA,
    updateAuthority: updateAuthorityA.publicKey,
  });
  const mintB1 = await createDigitalAsset(umi, {
    authority: updateAuthorityB,
    updateAuthority: updateAuthorityB.publicKey,
  });

  // When we fetch all digital assets such that their update authority is A.
  const digitalAssets = await fetchAllDigitalAssetByUpdateAuthority(
    umi,
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
