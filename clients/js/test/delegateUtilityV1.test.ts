import { generateSigner, publicKey, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  DigitalAssetWithToken,
  TokenDelegateRole,
  TokenStandard,
  TokenState,
  delegateUtilityV1,
  fetchDigitalAssetWithAssociatedToken,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can approve a utility delegate for a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // When we approve a utility delegate.
  const utilityDelegate = generateSigner(umi).publicKey;
  await delegateUtilityV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: utilityDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then the utility delegate was successfully stored.
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      mint: { publicKey: publicKey(mint), supply: 1n },
      token: {
        owner: owner.publicKey,
        amount: 1n,
        delegate: some(publicKey(utilityDelegate)),
        delegatedAmount: 1n,
      },
      tokenRecord: {
        delegate: some(publicKey(utilityDelegate)),
        delegateRole: some(TokenDelegateRole.Utility),
        state: TokenState.Unlocked,
      },
    }
  );
});

test('it cannot approve a utility delegate for a NonFungible', async (t) => {
  // Given a NonFungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  });

  // When we try to approve a utility delegate.
  const utilityDelegate = generateSigner(umi).publicKey;
  const promise = delegateUtilityV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: utilityDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});

test('it cannot approve a utility delegate for a Fungible', async (t) => {
  // Given a Fungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.Fungible,
  });

  // When we try to approve a utility delegate.
  const utilityDelegate = generateSigner(umi).publicKey;
  const promise = delegateUtilityV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: utilityDelegate,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});

test('it cannot approve a utility delegate for a FungibleAsset', async (t) => {
  // Given a FungibleAsset.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  // When we try to approve a utility delegate.
  const utilityDelegate = generateSigner(umi).publicKey;
  const promise = delegateUtilityV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: utilityDelegate,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});
