import {
  approveTokenDelegate,
  findAssociatedTokenPda,
} from '@metaplex-foundation/mpl-essentials';
import {
  generateSigner,
  none,
  publicKey,
  some,
} from '@metaplex-foundation/umi';
import test from 'ava';
import {
  DigitalAssetWithToken,
  TokenDelegateRole,
  TokenStandard,
  TokenState,
  delegateStakingV1,
  fetchDigitalAssetWithAssociatedToken,
  revokeStakingV1,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can revoke a staking delegate for a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible with an approved staking delegate.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const stakingDelegate = generateSigner(umi).publicKey;
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });
  await delegateStakingV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: stakingDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      token: { delegate: some(publicKey(stakingDelegate)) },
      tokenRecord: {
        delegate: some(publicKey(stakingDelegate)),
        delegateRole: some(TokenDelegateRole.Staking),
        state: TokenState.Unlocked,
      },
    }
  );

  // When we revoke the staking delegate.
  await revokeStakingV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: stakingDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then the token and token record acconts were successfully updated.
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      token: { delegate: none() },
      tokenRecord: {
        delegate: none(),
        delegateRole: none(),
        state: TokenState.Unlocked,
      },
    }
  );
});

test('it cannot revoke a staking delegate for a NonFungible', async (t) => {
  // Given a NonFungible with an SPL delegate.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const stakingDelegate = generateSigner(umi).publicKey;
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
  });
  await approveTokenDelegate(umi, {
    source: findAssociatedTokenPda(umi, { mint, owner: owner.publicKey }),
    delegate: stakingDelegate,
    owner,
    amount: 1,
  }).sendAndConfirm(umi);

  // When we try to revoke the staking delegate.
  const promise = revokeStakingV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: stakingDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});

test('it cannot revoke a staking delegate for a Fungible', async (t) => {
  // Given a Fungible with an SPL delegate.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const stakingDelegate = generateSigner(umi).publicKey;
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.Fungible,
  });
  await approveTokenDelegate(umi, {
    source: findAssociatedTokenPda(umi, { mint, owner: owner.publicKey }),
    delegate: stakingDelegate,
    owner,
    amount: 1,
  }).sendAndConfirm(umi);

  // When we try to revoke the staking delegate.
  const promise = revokeStakingV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: stakingDelegate,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});

test('it cannot revoke a staking delegate for a FungibleAsset', async (t) => {
  // Given a FungibleAsset with an SPL delegate.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const stakingDelegate = generateSigner(umi).publicKey;
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.FungibleAsset,
  });
  await approveTokenDelegate(umi, {
    source: findAssociatedTokenPda(umi, { mint, owner: owner.publicKey }),
    delegate: stakingDelegate,
    owner,
    amount: 1,
  }).sendAndConfirm(umi);

  // When we try to revoke the staking delegate.
  const promise = revokeStakingV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: stakingDelegate,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});
