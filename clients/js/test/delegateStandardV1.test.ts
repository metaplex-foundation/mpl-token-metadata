import { generateSigner, publicKey, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  DigitalAssetWithToken,
  TokenStandard,
  delegateStandardV1,
  fetchDigitalAssetWithAssociatedToken,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can approve a standard delegate for a NonFungible', async (t) => {
  // Given a NonFungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
  });

  // When we approve a standard delegate.
  const standardDelegate = generateSigner(umi).publicKey;
  await delegateStandardV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: standardDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then the standard delegate was successfully stored.
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      mint: { publicKey: publicKey(mint), supply: 1n },
      token: {
        owner: owner.publicKey,
        amount: 1n,
        delegate: some(standardDelegate),
        delegatedAmount: 1n,
      },
      tokenRecord: undefined,
    }
  );
});

test('it cannot approve a standard delegate for a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // When we try to approve a standard delegate.
  const standardDelegate = generateSigner(umi).publicKey;
  const promise = delegateStandardV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: standardDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});

test('it can approve a standard delegate for a Fungible', async (t) => {
  // Given a Fungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.Fungible,
  });

  // When we approve a standard delegate.
  const standardDelegate = generateSigner(umi).publicKey;
  await delegateStandardV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: standardDelegate,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  // Then the standard delegate was successfully stored.
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      mint: { publicKey: publicKey(mint), supply: 1n },
      token: {
        owner: owner.publicKey,
        amount: 1n,
        delegate: some(standardDelegate),
        delegatedAmount: 1n,
      },
      tokenRecord: undefined,
    }
  );
});

test('it can approve a standard delegate for a FungibleAsset', async (t) => {
  // Given a FungibleAsset.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  // When we approve a standard delegate.
  const standardDelegate = generateSigner(umi).publicKey;
  await delegateStandardV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: standardDelegate,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);

  // Then the standard delegate was successfully stored.
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      mint: { publicKey: publicKey(mint), supply: 1n },
      token: {
        owner: owner.publicKey,
        amount: 1n,
        delegate: some(standardDelegate),
        delegatedAmount: 1n,
      },
      tokenRecord: undefined,
    }
  );
});
