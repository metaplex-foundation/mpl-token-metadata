import {
  base58PublicKey,
  generateSigner,
  PublicKey,
  publicKey,
  Signer,
  some,
} from '@metaplex-foundation/umi';
import test from 'ava';
import {
  CollectionArgs,
  DigitalAsset,
  fetchAllDigitalAsset,
  fetchAllDigitalAssetByCreator,
  fetchAllDigitalAssetByOwner,
  fetchAllDigitalAssetByUpdateAuthority,
  fetchAllDigitalAssetByVerifiedCollection,
  fetchAllMetadataByOwner,
  fetchDigitalAsset,
  fetchDigitalAssetByMetadata,
  findMasterEditionPda,
  findMetadataPda,
  TokenStandard,
  verifyCollectionV1,
} from '../src';
import {
  createDigitalAsset,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

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

test('it can fetch all DigitalAssets by owner', async (t) => {
  // Given two owners A and B.
  const umi = await createUmi();
  const ownerA = generateSigner(umi).publicKey;
  const ownerB = generateSigner(umi).publicKey;

  // And three NFTs such that 2 are owned by A and 1 is owned by B.
  const mintA1 = await createDigitalAssetWithToken(umi, { tokenOwner: ownerA });
  const mintA2 = await createDigitalAssetWithToken(umi, { tokenOwner: ownerA });
  const mintB1 = await createDigitalAssetWithToken(umi, { tokenOwner: ownerB });

  // When we fetch all digital assets owned by A.
  const digitalAssets = await fetchAllDigitalAssetByOwner(umi, ownerA);

  // Then we get the two NFTs owned by A.
  t.is(digitalAssets.length, 2);
  const mints = digitalAssets.map((da) => base58PublicKey(da.mint));
  t.true(mints.includes(base58PublicKey(mintA1.publicKey)));
  t.true(mints.includes(base58PublicKey(mintA2.publicKey)));

  // And we don't get the NFT owned by B.
  t.false(mints.includes(base58PublicKey(mintB1.publicKey)));
});

test('it can fetch all Metadata accounts by owner', async (t) => {
  // Given two owners A and B.
  const umi = await createUmi();
  const ownerA = generateSigner(umi).publicKey;
  const ownerB = generateSigner(umi).publicKey;

  // And three NFTs such that 2 are owned by A and 1 is owned by B.
  const mintA1 = await createDigitalAssetWithToken(umi, { tokenOwner: ownerA });
  const mintA2 = await createDigitalAssetWithToken(umi, { tokenOwner: ownerA });
  const mintB1 = await createDigitalAssetWithToken(umi, { tokenOwner: ownerB });

  // When we fetch all Metadata accounts owned by A.
  const metadatas = await fetchAllMetadataByOwner(umi, ownerA);

  // Then we get the two Metadata accounts owned by A.
  t.is(metadatas.length, 2);
  const mints = metadatas.map((da) => base58PublicKey(da.mint));
  t.true(mints.includes(base58PublicKey(mintA1.publicKey)));
  t.true(mints.includes(base58PublicKey(mintA2.publicKey)));

  // And we don't get the Metadata account owned by B.
  t.false(mints.includes(base58PublicKey(mintB1.publicKey)));
});

test('it can fetch all DigitalAssets by verified collection', async (t) => {
  const umi = await createUmi();
  const collectionAuthority = generateSigner(umi);

  const collectionA = await createDigitalAssetWithToken(umi, {
    isCollection: true,
    authority: collectionAuthority,
  });

  const collectionB = await createDigitalAssetWithToken(umi, {
    isCollection: true,
    authority: collectionAuthority,
  });

  const mintA1 = await createDigitalAssetWithVerifiedCollection(umi, {
    collection: {
      key: collectionA.publicKey,
    },
    collectionAuthority,
  });

  const mintA2 = await createDigitalAssetWithVerifiedCollection(umi, {
    collection: {
      key: collectionA.publicKey,
    },
    collectionAuthority,
  });

  const mintA3 = await createDigitalAssetWithToken(umi, {
    collection: {
      key: collectionA.publicKey,
      verified: false,
    },
  });

  const mintB1 = await createDigitalAssetWithVerifiedCollection(umi, {
    collection: {
      key: collectionB.publicKey,
    },
    collectionAuthority,
  });

  // When we fetch all digital assets in collection A.
  const digitalAssets = await fetchAllDigitalAssetByVerifiedCollection(
    umi,
    collectionA.publicKey
  );

  // Then we get the two NFTs in collection A.
  t.is(digitalAssets.length, 2);
  const mints = digitalAssets.map((da) => base58PublicKey(da.mint));
  t.true(mints.includes(base58PublicKey(mintA1.publicKey)));
  t.true(mints.includes(base58PublicKey(mintA2.publicKey)));

  // And we don't get the NFT in collection A but not verified.
  t.false(mints.includes(base58PublicKey(mintA3.publicKey)));
  // And we don't get the NFT in collection B.
  t.false(mints.includes(base58PublicKey(mintB1.publicKey)));
});

test('it can fetch all DigitalAssets by verified collection no matter the creator length', async (t) => {
  const umi = await createUmi();
  const collectionAuthorityA = generateSigner(umi);
  const collectionAuthorityB = generateSigner(umi);
  const collectionAuthorityC = generateSigner(umi);
  const collectionAuthorityD = generateSigner(umi);
  const collectionAuthorityE = generateSigner(umi);

  // Collection with 2 creators
  const collectionA = await createDigitalAssetWithToken(umi, {
    isCollection: true,
    authority: collectionAuthorityA,
    creators: [
      {
        address: collectionAuthorityA.publicKey,
        verified: true,
        share: 50,
      },
      {
        address: collectionAuthorityB.publicKey,
        verified: false,
        share: 50,
      },
    ],
  });

  const mintA1 = await createDigitalAssetWithVerifiedCollection(umi, {
    collection: {
      key: collectionA.publicKey,
    },
    collectionAuthority: collectionAuthorityA,
  });

  const mintA2 = await createDigitalAssetWithVerifiedCollection(umi, {
    collection: {
      key: collectionA.publicKey,
    },
    collectionAuthority: collectionAuthorityA,
  });

  // Collection with 3 Creators
  const collectionB = await createDigitalAssetWithToken(umi, {
    isCollection: true,
    authority: collectionAuthorityA,
    creators: [
      {
        address: collectionAuthorityA.publicKey,
        verified: true,
        share: 34,
      },
      {
        address: collectionAuthorityB.publicKey,
        verified: false,
        share: 33,
      },
      {
        address: collectionAuthorityC.publicKey,
        verified: false,
        share: 33,
      },
    ],
  });

  const mintB1 = await createDigitalAssetWithVerifiedCollection(umi, {
    collection: {
      key: collectionB.publicKey,
    },
    collectionAuthority: collectionAuthorityA,
  });

  const mintB2 = await createDigitalAssetWithVerifiedCollection(umi, {
    collection: {
      key: collectionB.publicKey,
    },
    collectionAuthority: collectionAuthorityA,
  });

  // Collection with 4 Creators
  const collectionC = await createDigitalAssetWithToken(umi, {
    isCollection: true,
    authority: collectionAuthorityA,
    creators: [
      {
        address: collectionAuthorityA.publicKey,
        verified: true,
        share: 25,
      },
      {
        address: collectionAuthorityB.publicKey,
        verified: false,
        share: 25,
      },
      {
        address: collectionAuthorityC.publicKey,
        verified: false,
        share: 25,
      },
      {
        address: collectionAuthorityD.publicKey,
        verified: false,
        share: 25,
      },
    ],
  });

  const mintC1 = await createDigitalAssetWithVerifiedCollection(umi, {
    collection: {
      key: collectionC.publicKey,
    },
    collectionAuthority: collectionAuthorityA,
  });

  const mintC2 = await createDigitalAssetWithVerifiedCollection(umi, {
    collection: {
      key: collectionC.publicKey,
    },
    collectionAuthority: collectionAuthorityA,
  });

  // Collection with 5 Creators
  const collectionD = await createDigitalAssetWithToken(umi, {
    isCollection: true,
    authority: collectionAuthorityA,
    creators: [
      {
        address: collectionAuthorityA.publicKey,
        verified: true,
        share: 20,
      },
      {
        address: collectionAuthorityB.publicKey,
        verified: false,
        share: 20,
      },
      {
        address: collectionAuthorityC.publicKey,
        verified: false,
        share: 20,
      },
      {
        address: collectionAuthorityD.publicKey,
        verified: false,
        share: 20,
      },
      {
        address: collectionAuthorityE.publicKey,
        verified: false,
        share: 20,
      },
    ],
  });

  const mintD1 = await createDigitalAssetWithVerifiedCollection(umi, {
    collection: {
      key: collectionD.publicKey,
    },
    collectionAuthority: collectionAuthorityA,
  });

  const mintD2 = await createDigitalAssetWithVerifiedCollection(umi, {
    collection: {
      key: collectionD.publicKey,
    },
    collectionAuthority: collectionAuthorityA,
  });

  // When we fetch all digital assets in collection A.
  const digitalAssetsA = await fetchAllDigitalAssetByVerifiedCollection(
    umi,
    collectionA.publicKey
  );

  const digitalAssetsB = await fetchAllDigitalAssetByVerifiedCollection(
    umi,
    collectionB.publicKey
  );

  const digitalAssetsC = await fetchAllDigitalAssetByVerifiedCollection(
    umi,
    collectionC.publicKey
  );

  const digitalAssetsD = await fetchAllDigitalAssetByVerifiedCollection(
    umi,
    collectionD.publicKey
  );

  // Each collection should have 2 items
  t.is(digitalAssetsA.length, 2);
  t.is(digitalAssetsB.length, 2);
  t.is(digitalAssetsC.length, 2);
  t.is(digitalAssetsD.length, 2);

  const mintsA = digitalAssetsA.map((da) => base58PublicKey(da.mint));
  t.true(mintsA.includes(base58PublicKey(mintA1.publicKey)));
  t.true(mintsA.includes(base58PublicKey(mintA2.publicKey)));

  const mintsB = digitalAssetsB.map((da) => base58PublicKey(da.mint));
  t.true(mintsB.includes(base58PublicKey(mintB1.publicKey)));
  t.true(mintsB.includes(base58PublicKey(mintB2.publicKey)));

  const mintsC = digitalAssetsC.map((da) => base58PublicKey(da.mint));
  t.true(mintsC.includes(base58PublicKey(mintC1.publicKey)));
  t.true(mintsC.includes(base58PublicKey(mintC2.publicKey)));

  const mintsD = digitalAssetsD.map((da) => base58PublicKey(da.mint));
  t.true(mintsD.includes(base58PublicKey(mintD1.publicKey)));
  t.true(mintsD.includes(base58PublicKey(mintD2.publicKey)));
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

async function createDigitalAssetWithVerifiedCollection(
  context: Parameters<typeof createDigitalAssetWithToken>[0],
  input: Omit<
    Parameters<typeof createDigitalAssetWithToken>[1],
    'collection'
  > & {
    collection: Omit<CollectionArgs, 'verified'>;
    collectionAuthority: Signer;
  }
) {
  const mint = await createDigitalAssetWithToken(context, {
    ...input,
    collection: {
      key: input.collection.key,
      verified: false,
    },
  });

  const metadata = findMetadataPda(context, { mint: mint.publicKey });
  await verifyCollectionV1(context, {
    metadata,
    collectionMint: input.collection.key,
    authority: input.collectionAuthority,
  }).sendAndConfirm(context);

  return mint;
}
