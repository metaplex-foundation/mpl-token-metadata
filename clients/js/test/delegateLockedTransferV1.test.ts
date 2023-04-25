import { generateSigner, publicKey, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  DigitalAssetWithToken,
  TokenDelegateRole,
  TokenStandard,
  TokenState,
  delegateLockedTransferV1,
  fetchDigitalAssetWithAssociatedToken,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can approve a locked transfer delegate for a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // When we approve a locked transfer delegate.
  const lockedTransferDelegate = generateSigner(umi).publicKey;
  const lockedAddress = generateSigner(umi).publicKey;
  await delegateLockedTransferV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: lockedTransferDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    lockedAddress,
  }).sendAndConfirm(umi);

  // Then the locked transfer delegate was successfully stored.
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      mint: { publicKey: publicKey(mint), supply: 1n },
      token: { owner: owner.publicKey, amount: 1n },
      tokenRecord: {
        delegate: some(lockedTransferDelegate),
        delegateRole: some(TokenDelegateRole.LockedTransfer),
        lockedTransfer: some(lockedAddress),
        state: TokenState.Unlocked,
      },
    }
  );
});

test('it cannot approve a locked transfer delegate for a NonFungible', async (t) => {
  // Given a NonFungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  });

  // When we try to approve a locked transfer delegate.
  const lockedTransferDelegate = generateSigner(umi).publicKey;
  const lockedAddress = generateSigner(umi).publicKey;
  const promise = delegateLockedTransferV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: lockedTransferDelegate,
    tokenStandard: TokenStandard.NonFungible,
    lockedAddress,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});

test('it cannot approve a locked transfer delegate for a Fungible', async (t) => {
  // Given a Fungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.Fungible,
  });

  // When we try to approve a locked transfer delegate.
  const lockedTransferDelegate = generateSigner(umi).publicKey;
  const lockedAddress = generateSigner(umi).publicKey;
  const promise = delegateLockedTransferV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: lockedTransferDelegate,
    tokenStandard: TokenStandard.Fungible,
    lockedAddress,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});

test('it cannot approve a locked transfer delegate for a FungibleAsset', async (t) => {
  // Given a FungibleAsset.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  // When we try to approve a locked transfer delegate.
  const lockedTransferDelegate = generateSigner(umi).publicKey;
  const lockedAddress = generateSigner(umi).publicKey;
  const promise = delegateLockedTransferV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: lockedTransferDelegate,
    tokenStandard: TokenStandard.FungibleAsset,
    lockedAddress,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});
