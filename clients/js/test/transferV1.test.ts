import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
import { RuleSetRevisionV2, findRuleSetPda, createOrUpdateV1 } from '@metaplex-foundation/mpl-token-auth-rules';
import { generateSigner, publicKey, sol, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  DigitalAssetWithToken,
  TokenStandard,
  TokenState,
  fetchDigitalAssetWithAssociatedToken,
  transferV1,
} from '../src';
import {
  FUNGIBLE_TOKEN_STANDARDS,
  NON_EDITION_NON_FUNGIBLE_STANDARDS,
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

test('it can transfer a ProgrammableNonFungible between two wallets', async (t) => {
  // Given a ProgrammableNonFungible that belongs to owner A.
  const umi = await createUmi();
  const ownerA = generateSigner(umi);
  await umi.rpc.airdrop(ownerA.publicKey, sol(10));

  const ruleSetName = 'transfer_test';
  const revision: RuleSetRevisionV2 = {
    libVersion: 2,
    name: ruleSetName,
    owner: ownerA.publicKey,
    operations: JSON.parse('{"Transfer:Owner": {"type": "IsWallet", "field": "Destination"}}')
  };

  const ruleSetPda = findRuleSetPda(umi, { owner: ownerA.publicKey, name: ruleSetName });
  await createOrUpdateV1(umi, {
    payer: ownerA,
    ruleSetPda,
    ruleSetRevision: some(revision),
  }).sendAndConfirm(umi);

  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: ownerA.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    ruleSet: ruleSetPda[0],
  });

  // When we transfer the asset to owner B.
  const ownerB = generateSigner(umi).publicKey;

  await transferV1(umi, {
    mint,
    authority: ownerA,
    tokenOwner: ownerA.publicKey,
    destinationOwner: ownerB,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    authorizationRules: ruleSetPda,
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

test('it can\'t transfer a ProgrammableNonFungible to a program - owned wallet with isWallet', async (t) => {
  // Given a ProgrammableNonFungible that belongs to owner A.
  const umi = await createUmi();
  const ownerA = generateSigner(umi);
  await umi.rpc.airdrop(ownerA.publicKey, sol(10));

  const ruleSetName = 'transfer_test';
  const revision: RuleSetRevisionV2 = {
    libVersion: 2,
    name: ruleSetName,
    owner: ownerA.publicKey,
    operations: JSON.parse('{"Transfer:Owner": {"type": "IsWallet", "field": "Destination"}}')
  };

  const ruleSetPda = findRuleSetPda(umi, { owner: ownerA.publicKey, name: ruleSetName });
  await createOrUpdateV1(umi, {
    payer: ownerA,
    ruleSetPda,
    ruleSetRevision: some(revision),
  }).sendAndConfirm(umi);

  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: ownerA.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    ruleSet: ruleSetPda[0],
  });

  // When we transfer the asset to owner B.
  const ownerB = generateSigner(umi).publicKey;

  const promise = transferV1(umi, {
    mint,
    authority: ownerA,
    tokenOwner: ownerA.publicKey,
    destinationOwner: mint,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    authorizationRules: ruleSetPda,
  }).sendAndConfirm(umi);

  await t.throwsAsync(promise, { name: 'AuthorizationTokenAccountOwnerMismatch' });

  // Then the asset is now owned by owner B.
  const da = await fetchDigitalAssetWithAssociatedToken(umi, mint, ownerA.publicKey);
  t.like(da, <DigitalAssetWithToken>{
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
});

NON_EDITION_NON_FUNGIBLE_STANDARDS.forEach((tokenStandard) => {
  test(`it cannot transfer a ${tokenStandard} with an amount of 0`, async (t) => {
    // Given a NonFungible that is owned by owner A.
    const umi = await createUmi();
    const ownerA = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      tokenOwner: ownerA.publicKey,
      tokenStandard: TokenStandard[tokenStandard],
    });

    // When we try to transfer an amount of 0.
    const ownerB = generateSigner(umi).publicKey;
    const promise = transferV1(umi, {
      mint,
      authority: ownerA,
      tokenOwner: ownerA.publicKey,
      destinationOwner: ownerB,
      tokenStandard: TokenStandard[tokenStandard],
      amount: 0,
    }).sendAndConfirm(umi);

    // Then we expect a program error.
    await t.throwsAsync(promise, { name: 'InvalidAmount' });
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
