import { generateSigner, publicKey, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  DigitalAssetWithToken,
  TokenDelegateRole,
  TokenStandard,
  TokenState,
  delegateStakingV1,
  fetchDigitalAssetWithAssociatedToken,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can approve a staking delegate for a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // When we approve a staking delegate.
  const stakingDelegate = generateSigner(umi).publicKey;
  await delegateStakingV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: stakingDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then the staking delegate was successfully stored.
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      mint: { publicKey: publicKey(mint), supply: 1n },
      token: {
        owner: owner.publicKey,
        amount: 1n,
        delegate: some(publicKey(stakingDelegate)),
        delegatedAmount: 1n,
      },
      tokenRecord: {
        delegate: some(publicKey(stakingDelegate)),
        delegateRole: some(TokenDelegateRole.Staking),
        state: TokenState.Unlocked,
      },
    }
  );
});

test('it cannot approve a staking delegate for a NonFungible', async (t) => {
  // Given a NonFungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  });

  // When we try to approve a staking delegate.
  const stakingDelegate = generateSigner(umi).publicKey;
  const promise = delegateStakingV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: stakingDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});

test('it cannot approve a staking delegate for a Fungible', async (t) => {
  // Given a Fungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.Fungible,
  });

  // When we try to approve a staking delegate.
  const stakingDelegate = generateSigner(umi).publicKey;
  const promise = delegateStakingV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: stakingDelegate,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});

test('it cannot approve a staking delegate for a FungibleAsset', async (t) => {
  // Given a FungibleAsset.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  // When we try to approve a staking delegate.
  const stakingDelegate = generateSigner(umi).publicKey;
  const promise = delegateStakingV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: stakingDelegate,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});
