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
  createDigitalAssetWithVerifiedCreators,
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

test('it can fetch all DigitalAssets by verified collection no matter the creator length', async (t) => {
  const umi = await createUmi();
  const creatorA = generateSigner(umi);
  const creatorB = generateSigner(umi);
  const creatorC = generateSigner(umi);
  const creatorD = generateSigner(umi);
  const creatorE = generateSigner(umi);

  const collectionCreator = {
    address: creatorA.publicKey,
    share: 100,
    verified: false,
  };

  const oneCreatorsArray = [creatorA.publicKey];

  const twoCreatorsArray = [creatorA.publicKey, creatorB.publicKey];

  const threeCreatorsArray = [
    creatorA.publicKey,
    creatorB.publicKey,
    creatorC.publicKey,
  ];

  const fourCreatorsArray = [
    creatorA.publicKey,
    creatorB.publicKey,
    creatorC.publicKey,
    creatorD.publicKey,
  ];

  const fiveCreatorsArray = [
    creatorA.publicKey,
    creatorB.publicKey,
    creatorC.publicKey,
    creatorD.publicKey,
    creatorE.publicKey,
  ];

  // Collection with 1 creators
  const collectionA = await createDigitalAssetWithToken(umi, {
    isCollection: true,
    authority: creatorA,
    creators: [collectionCreator],
  });

  const mintA1 = await createDigitalAssetWithVerifiedCollectionAndCreators(
    umi,
    {
      collection: {
        key: collectionA.publicKey,
      },
      collectionAuthority: creatorA,
      creators: oneCreatorsArray,
    }
  );

  const mintA2 = await createDigitalAssetWithVerifiedCollectionAndCreators(
    umi,
    {
      collection: {
        key: collectionA.publicKey,
      },
      collectionAuthority: creatorA,
      creators: oneCreatorsArray,
    }
  );

  // Collection with 2 Creators
  const collectionB = await createDigitalAssetWithToken(umi, {
    isCollection: true,
    authority: creatorA,
    creators: [collectionCreator],
  });

  const mintB1 = await createDigitalAssetWithVerifiedCollectionAndCreators(
    umi,
    {
      collection: {
        key: collectionB.publicKey,
      },
      collectionAuthority: creatorA,
      creators: twoCreatorsArray,
    }
  );

  const mintB2 = await createDigitalAssetWithVerifiedCollectionAndCreators(
    umi,
    {
      collection: {
        key: collectionB.publicKey,
      },
      collectionAuthority: creatorA,
      creators: twoCreatorsArray,
    }
  );

  // Collection with 3 Creators
  const collectionC = await createDigitalAssetWithToken(umi, {
    isCollection: true,
    authority: creatorA,
    creators: [collectionCreator],
  });

  const mintC1 = await createDigitalAssetWithVerifiedCollectionAndCreators(
    umi,
    {
      collection: {
        key: collectionC.publicKey,
      },
      collectionAuthority: creatorA,
      creators: threeCreatorsArray,
    }
  );

  const mintC2 = await createDigitalAssetWithVerifiedCollectionAndCreators(
    umi,
    {
      collection: {
        key: collectionC.publicKey,
      },
      collectionAuthority: creatorA,
      creators: threeCreatorsArray,
    }
  );

  // Collection with 4 Creators
  const collectionD = await createDigitalAssetWithToken(umi, {
    isCollection: true,
    authority: creatorA,
    creators: [collectionCreator],
  });

  const mintD1 = await createDigitalAssetWithVerifiedCollectionAndCreators(
    umi,
    {
      collection: {
        key: collectionD.publicKey,
      },
      creators: fourCreatorsArray,
      collectionAuthority: creatorA,
    }
  );

  const mintD2 = await createDigitalAssetWithVerifiedCollectionAndCreators(
    umi,
    {
      collection: {
        key: collectionD.publicKey,
      },
      creators: fourCreatorsArray,
      collectionAuthority: creatorA,
    }
  );

  // Collection with 5 Creators
  const collectionE = await createDigitalAssetWithToken(umi, {
    isCollection: true,
    authority: creatorA,
    creators: [collectionCreator],
  });

  const mintE1 = await createDigitalAssetWithVerifiedCollectionAndCreators(
    umi,
    {
      collection: {
        key: collectionE.publicKey,
      },
      creators: fiveCreatorsArray,
      collectionAuthority: creatorA,
    }
  );

  const mintE2 = await createDigitalAssetWithVerifiedCollectionAndCreators(
    umi,
    {
      collection: {
        key: collectionE.publicKey,
      },
      creators: fiveCreatorsArray,
      collectionAuthority: creatorA,
    }
  );

  // Collection with mixed creators count
  const collectionF = await createDigitalAssetWithToken(umi, {
    isCollection: true,
    authority: creatorA,
    creators: [collectionCreator],
  });

  const mintF1 = await createDigitalAssetWithVerifiedCollectionAndCreators(
    umi,
    {
      collection: {
        key: collectionF.publicKey,
      },
      creators: twoCreatorsArray,
      collectionAuthority: creatorA,
    }
  );

  const mintF2 = await createDigitalAssetWithVerifiedCollectionAndCreators(
    umi,
    {
      collection: {
        key: collectionF.publicKey,
      },
      creators: threeCreatorsArray,
      collectionAuthority: creatorA,
    }
  );

  const mintF3 = await createDigitalAssetWithVerifiedCollectionAndCreators(
    umi,
    {
      collection: {
        key: collectionF.publicKey,
      },
      creators: fiveCreatorsArray,
      collectionAuthority: creatorA,
    }
  );

  // Then we fetch all digital assets
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

  const digitalAssetsE = await fetchAllDigitalAssetByVerifiedCollection(
    umi,
    collectionE.publicKey
  );

  const digitalAssetsF = await fetchAllDigitalAssetByVerifiedCollection(
    umi,
    collectionF.publicKey
  );

  t.is(digitalAssetsA.length, 2);
  t.is(digitalAssetsB.length, 2);
  t.is(digitalAssetsC.length, 2);
  t.is(digitalAssetsD.length, 2);
  t.is(digitalAssetsE.length, 2);
  t.is(digitalAssetsF.length, 3);

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

  const mintsE = digitalAssetsE.map((da) => base58PublicKey(da.mint));
  t.true(mintsE.includes(base58PublicKey(mintE1.publicKey)));
  t.true(mintsE.includes(base58PublicKey(mintE2.publicKey)));

  const mintsF = digitalAssetsF.map((da) => base58PublicKey(da.mint));
  t.true(mintsF.includes(base58PublicKey(mintF1.publicKey)));
  t.true(mintsF.includes(base58PublicKey(mintF2.publicKey)));
  t.true(mintsF.includes(base58PublicKey(mintF3.publicKey)));
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

const prepareShare = (creatorsLength: number, index: number) => {
  const share = 100 / creatorsLength;

  // If the share is a whole number, return it
  if (share % 1 === 0) return share;

  // If the share is not a whole number, we need to round it up or down depending if it's the first index or not
  if (index === 0) return Math.ceil(share);

  return Math.floor(share);
};

async function createDigitalAssetWithVerifiedCollectionAndCreators(
  context: Parameters<typeof createDigitalAssetWithToken>[0],
  input: Omit<
    Parameters<typeof createDigitalAssetWithToken>[1],
    'collection' | 'creators'
  > & {
    collection: Omit<CollectionArgs, 'verified'>;
    collectionAuthority: Signer;
    creators?: PublicKey[];
  }
) {
  const mint = await createDigitalAssetWithVerifiedCreators(context, {
    ...input,
    collection: {
      key: input.collection.key,
      verified: false,
    },
    updateAuthority: input.collectionAuthority,
    creators: input.creators
      ? some(
          input.creators.map((address, index) => ({
            address,
            verified: false,
            share: prepareShare(input.creators?.length ?? 0, index),
          }))
        )
      : undefined,
    creatorAuthority: input.collectionAuthority,
  });

  const metadata = findMetadataPda(context, { mint: mint.publicKey });
  await verifyCollectionV1(context, {
    metadata,
    collectionMint: input.collection.key,
    authority: input.collectionAuthority,
  }).sendAndConfirm(context);

  return mint;
}
