import { generateSigner, publicKey, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  DigitalAssetWithToken,
  TokenDelegateRole,
  TokenStandard,
  TokenState,
  delegateSaleV1,
  fetchDigitalAssetWithAssociatedToken,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can approve a sale delegate for a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // When we approve a sale delegate.
  const saleDelegate = generateSigner(umi).publicKey;
  await delegateSaleV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: saleDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then the sale delegate was successfully stored
  // and the token state was set to Listed.
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      mint: { publicKey: publicKey(mint), supply: 1n },
      token: { owner: owner.publicKey, amount: 1n },
      tokenRecord: {
        delegate: some(saleDelegate),
        delegateRole: some(TokenDelegateRole.Sale),
        state: TokenState.Listed,
      },
    }
  );
});

test('it cannot approve a sale delegate for a NonFungible', async (t) => {
  // Given a NonFungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  });

  // When we try to approve a sale delegate.
  const saleDelegate = generateSigner(umi).publicKey;
  const promise = delegateSaleV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: saleDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});

test('it cannot approve a sale delegate for a Fungible', async (t) => {
  // Given a Fungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.Fungible,
  });

  // When we try to approve a sale delegate.
  const saleDelegate = generateSigner(umi).publicKey;
  const promise = delegateSaleV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: saleDelegate,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});

test('it cannot approve a sale delegate for a FungibleAsset', async (t) => {
  // Given a FungibleAsset.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  // When we try to approve a sale delegate.
  const saleDelegate = generateSigner(umi).publicKey;
  const promise = delegateSaleV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: saleDelegate,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});
