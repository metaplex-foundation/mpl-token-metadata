import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  DigitalAssetWithToken,
  TokenStandard,
  TokenState,
  fetchDigitalAssetWithAssociatedToken,
  safeFetchTokenRecordFromSeeds,
  transferV1,
} from '../src';
import {
  FUNGIBLE_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

test('it can transfer a NonFungible', async (t) => {
  // Given a NonFungible that belongs to owner A.
  const umi = await createUmi();
  const ownerA = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: ownerA.publicKey,
  });

  // When we transfer the asset to owner B.
  const ownerB = generateSigner(umi).publicKey;
  await transferV1(umi, {
    mint,
    authority: ownerA,
    tokenOwner: ownerA.publicKey,
    destinationOwner: ownerB,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then the asset is now owned by owner B.
  const da = await fetchDigitalAssetWithAssociatedToken(umi, mint, ownerB);
  t.like(da, <DigitalAssetWithToken>{
    mint: {
      publicKey: publicKey(mint),
      supply: 1n,
    },
    token: {
      publicKey: findAssociatedTokenPda(umi, {
        mint,
        owner: ownerB,
      })[0],
      owner: ownerB,
      amount: 1n,
    },
  });
});

test('it can transfer a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible that belongs to owner A.
  const umi = await createUmi();
  const ownerA = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: ownerA.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // When we transfer the asset to owner B.
  const ownerB = generateSigner(umi).publicKey;
  await transferV1(umi, {
    mint,
    authority: ownerA,
    tokenOwner: ownerA.publicKey,
    destinationOwner: ownerB,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then the asset is now owned by owner B.
  const da = await fetchDigitalAssetWithAssociatedToken(umi, mint, ownerB);
  t.like(da, <DigitalAssetWithToken>{
    mint: {
      publicKey: publicKey(mint),
      supply: 1n,
    },
    token: {
      publicKey: findAssociatedTokenPda(umi, {
        mint,
        owner: ownerB,
      })[0],
      owner: ownerB,
      amount: 1n,
    },
    tokenRecord: {
      state: TokenState.Unlocked,
    },
  });
});

test('transferring a ProgrammableNonFungible with an amount of 0 does not cause side-effects', async (t) => {
  // Given a ProgrammableNonFungible that belongs to owner A.
  const umi = await createUmi();
  const ownerA = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: ownerA.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });
  
  // When we run transfer with amount 0
  const ownerB = generateSigner(umi).publicKey;
  await transferV1(umi, {
    mint,
    authority: ownerA,
    tokenOwner: ownerA.publicKey,
    destinationOwner: ownerB,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    amount: 0,
  }).sendAndConfirm(umi);

  // Then the token stays with the old owner and they keep the tokenRecord.
  const originalAsset = await fetchDigitalAssetWithAssociatedToken(umi, mint, ownerA.publicKey);
  t.like(originalAsset, <DigitalAssetWithToken>{
    mint: {
      publicKey: publicKey(mint),
      supply: 1n,
    },
    token: {
      publicKey: findAssociatedTokenPda(umi, {
        mint,
        owner: ownerA.publicKey,
      })[0],
      owner: ownerA.publicKey,
      amount: 1n,
    },
    tokenRecord: {
      state: TokenState.Unlocked,
    },
  });

  // And no additional tokenRecord is created.
  const newEmptyAsset = await fetchDigitalAssetWithAssociatedToken(umi, mint, ownerB);
  t.like(newEmptyAsset, <DigitalAssetWithToken>{
    token: {
      publicKey: findAssociatedTokenPda(umi, {
        mint,
        owner: ownerB,
      })[0],
      owner: ownerB,
      amount: 0n,
    },
    tokenRecord: undefined,
  });
});

FUNGIBLE_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can transfer a ${tokenStandard}`, async (t) => {
    // Given a fungible such that owner A owns 42 tokens.
    const umi = await createUmi();
    const ownerA = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      tokenOwner: ownerA.publicKey,
      tokenStandard: TokenStandard[tokenStandard],
      amount: 42,
    });

    // When we transfer 10 tokens to owner B.
    const ownerB = generateSigner(umi).publicKey;
    await transferV1(umi, {
      mint,
      authority: ownerA,
      tokenOwner: ownerA.publicKey,
      destinationOwner: ownerB,
      tokenStandard: TokenStandard[tokenStandard],
      amount: 10,
    }).sendAndConfirm(umi);

    // Then owner A has 32 tokens
    const assetA = await fetchDigitalAssetWithAssociatedToken(
      umi,
      mint,
      ownerA.publicKey
    );
    t.like(assetA, <DigitalAssetWithToken>{
      mint: { publicKey: publicKey(mint), supply: 42n },
      token: { owner: publicKey(ownerA), amount: 32n },
    });

    // And owner B has 10 tokens.
    const assetB = await fetchDigitalAssetWithAssociatedToken(
      umi,
      mint,
      ownerB
    );
    t.like(assetB, <DigitalAssetWithToken>{
      mint: { publicKey: publicKey(mint), supply: 42n },
      token: { owner: publicKey(ownerB), amount: 10n },
    });
  });
});
