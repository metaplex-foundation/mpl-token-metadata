import { TokenState as SplTokenState } from '@metaplex-foundation/mpl-essentials';
import { generateSigner } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  DigitalAssetWithToken,
  TokenStandard,
  TokenState,
  delegateStandardV1,
  delegateUtilityV1,
  fetchDigitalAssetWithAssociatedToken,
  lockV1,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can lock a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible with a utility delegate.
  const umi = await createUmi();
  const owner = umi.identity.publicKey;
  const utilityDelegate = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });
  await delegateUtilityV1(umi, {
    mint,
    delegate: utilityDelegate.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);
  t.like(await fetchDigitalAssetWithAssociatedToken(umi, mint, owner), <
    DigitalAssetWithToken
  >{ tokenRecord: { state: TokenState.Unlocked } });

  // When the utility delegate locks the asset.
  await lockV1(umi, {
    mint,
    authority: utilityDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then the token state was successfully updated.
  t.like(await fetchDigitalAssetWithAssociatedToken(umi, mint, owner), <
    DigitalAssetWithToken
  >{ tokenRecord: { state: TokenState.Locked } });
});

test('it can freeze a NonFungible', async (t) => {
  // Given a NonFungible with a standard delegate.
  const umi = await createUmi();
  const owner = umi.identity.publicKey;
  const standardDelegate = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi);
  await delegateStandardV1(umi, {
    mint,
    delegate: standardDelegate.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);
  t.like(await fetchDigitalAssetWithAssociatedToken(umi, mint, owner), <
    DigitalAssetWithToken
  >{ token: { state: SplTokenState.Initialized }, tokenRecord: undefined });

  // When the standard delegate locks the asset.
  await lockV1(umi, {
    mint,
    authority: standardDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then the token state of the token account was successfully updated.
  t.like(await fetchDigitalAssetWithAssociatedToken(umi, mint, owner), <
    DigitalAssetWithToken
  >{ token: { state: SplTokenState.Frozen }, tokenRecord: undefined });
});

test('it can freeze a Fungible', async (t) => {
  // Given a Fungible asset with the identity as the freeze authority of the mint.
  const umi = await createUmi();
  const freezeAuthority = umi.identity;
  const owner = umi.identity.publicKey;
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenStandard: TokenStandard.Fungible,
  });
  t.like(await fetchDigitalAssetWithAssociatedToken(umi, mint, owner), <
    DigitalAssetWithToken
  >{ token: { state: SplTokenState.Initialized }, tokenRecord: undefined });

  // When the freeze authority locks the asset.
  await lockV1(umi, {
    mint,
    authority: freezeAuthority,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  // Then the token state of the token account was successfully updated.
  t.like(await fetchDigitalAssetWithAssociatedToken(umi, mint, owner), <
    DigitalAssetWithToken
  >{ token: { state: SplTokenState.Frozen }, tokenRecord: undefined });
});

test('it can freeze a FungibleAsset', async (t) => {
  // Given a FungibleAsset asset with the identity as the freeze authority of the mint.
  const umi = await createUmi();
  const freezeAuthority = umi.identity;
  const owner = umi.identity.publicKey;
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenStandard: TokenStandard.FungibleAsset,
  });
  t.like(await fetchDigitalAssetWithAssociatedToken(umi, mint, owner), <
    DigitalAssetWithToken
  >{ token: { state: SplTokenState.Initialized }, tokenRecord: undefined });

  // When the freeze authority locks the asset.
  await lockV1(umi, {
    mint,
    authority: freezeAuthority,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);

  // Then the token state of the token account was successfully updated.
  t.like(await fetchDigitalAssetWithAssociatedToken(umi, mint, owner), <
    DigitalAssetWithToken
  >{ token: { state: SplTokenState.Frozen }, tokenRecord: undefined });
});
