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
  delegateTransferV1,
  fetchDigitalAssetWithAssociatedToken,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can approve a transfer delegate for a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // When we approve a transfer delegate.
  const transferDelegate = generateSigner(umi).publicKey;
  await delegateTransferV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: transferDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then the transfer delegate was successfully stored.
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      mint: { publicKey: publicKey(mint), supply: 1n },
      token: {
        owner: owner.publicKey,
        amount: 1n,
        delegate: some(publicKey(transferDelegate)),
        delegatedAmount: 1n,
      },
      tokenRecord: {
        delegate: some(publicKey(transferDelegate)),
        delegateRole: some(TokenDelegateRole.Transfer),
        lockedTransfer: none(),
        state: TokenState.Unlocked,
      },
    }
  );
});

test('it cannot approve a transfer delegate for a NonFungible', async (t) => {
  // Given a NonFungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  });

  // When we try to approve a transfer delegate.
  const transferDelegate = generateSigner(umi).publicKey;
  const promise = delegateTransferV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: transferDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});

test('it cannot approve a transfer delegate for a Fungible', async (t) => {
  // Given a Fungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.Fungible,
  });

  // When we try to approve a transfer delegate.
  const transferDelegate = generateSigner(umi).publicKey;
  const promise = delegateTransferV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: transferDelegate,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});

test('it cannot approve a transfer delegate for a FungibleAsset', async (t) => {
  // Given a FungibleAsset.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  // When we try to approve a transfer delegate.
  const transferDelegate = generateSigner(umi).publicKey;
  const promise = delegateTransferV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: transferDelegate,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});
