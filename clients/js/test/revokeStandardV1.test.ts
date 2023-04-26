import { generateSigner, none, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  DigitalAssetWithToken,
  TokenStandard,
  delegateStandardV1,
  delegateUtilityV1,
  fetchDigitalAssetWithAssociatedToken,
  revokeStandardV1,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can revoke a standard delegate for a NonFungible', async (t) => {
  // Given a NonFungible with a standard delegate.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const standardDelegate = generateSigner(umi).publicKey;
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
  });
  await delegateStandardV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: standardDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      token: { delegate: some(standardDelegate), delegatedAmount: 1n },
      tokenRecord: undefined,
    }
  );

  // When we revoke the standard delegate.
  await revokeStandardV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: standardDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then the token account was successfully updated.
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      token: { delegate: none(), delegatedAmount: 0n },
      tokenRecord: undefined,
    }
  );
});

test('it cannot revoke a standard delegate for a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible with any token delegate.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const utilityDelegate = generateSigner(umi).publicKey;
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });
  await delegateUtilityV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: utilityDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // When we try to revoke the delegate using a standard revoke.
  const promise = revokeStandardV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: utilityDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
});

test('it can revoke a standard delegate for a Fungible', async (t) => {
  // Given a Fungible with a standard delegate.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const standardDelegate = generateSigner(umi).publicKey;
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.Fungible,
  });
  await delegateStandardV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: standardDelegate,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      token: { delegate: some(standardDelegate), delegatedAmount: 1n },
      tokenRecord: undefined,
    }
  );

  // When we revoke the standard delegate.
  await revokeStandardV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: standardDelegate,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  // Then the token account was successfully updated.
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      token: { delegate: none(), delegatedAmount: 0n },
      tokenRecord: undefined,
    }
  );
});

test('it can revoke a standard delegate for a FungibleAsset', async (t) => {
  // Given a FungibleAsset with a standard delegate.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const standardDelegate = generateSigner(umi).publicKey;
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.FungibleAsset,
  });
  await delegateStandardV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: standardDelegate,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      token: { delegate: some(standardDelegate), delegatedAmount: 1n },
      tokenRecord: undefined,
    }
  );

  // When we revoke the standard delegate.
  await revokeStandardV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: standardDelegate,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);

  // Then the token account was successfully updated.
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      token: { delegate: none(), delegatedAmount: 0n },
      tokenRecord: undefined,
    }
  );
});
