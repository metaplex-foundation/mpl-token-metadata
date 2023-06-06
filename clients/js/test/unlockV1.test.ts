import { TokenState as SplTokenState } from '@metaplex-foundation/mpl-toolbox';
import { generateSigner, transactionBuilder } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  DigitalAssetWithToken,
  TokenStandard,
  TokenState,
  delegateStandardV1,
  delegateUtilityV1,
  fetchDigitalAssetWithAssociatedToken,
  lockV1,
  unlockV1,
} from '../src';
import {
  FUNGIBLE_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

test('it can unlock a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible with a utility delegate that has locked the asset.
  const umi = await createUmi();
  const owner = umi.identity.publicKey;
  const tokenStandard = TokenStandard.ProgrammableNonFungible;
  const utilityDelegate = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenStandard,
  });
  await transactionBuilder()
    .add(
      delegateUtilityV1(umi, {
        mint,
        delegate: utilityDelegate.publicKey,
        tokenStandard,
      })
    )
    .add(lockV1(umi, { mint, authority: utilityDelegate, tokenStandard }))
    .sendAndConfirm(umi);
  t.like(await fetchDigitalAssetWithAssociatedToken(umi, mint, owner), <
    DigitalAssetWithToken
  >{ tokenRecord: { state: TokenState.Locked } });

  // When the utility delegate unlocks the asset.
  await unlockV1(umi, {
    mint,
    authority: utilityDelegate,
    tokenStandard,
  }).sendAndConfirm(umi);

  // Then the token state was successfully updated.
  t.like(await fetchDigitalAssetWithAssociatedToken(umi, mint, owner), <
    DigitalAssetWithToken
  >{ tokenRecord: { state: TokenState.Unlocked } });
});

test('it can unfreeze a NonFungible', async (t) => {
  // Given a NonFungible with a standard delegate that has locked the asset.
  const umi = await createUmi();
  const owner = umi.identity.publicKey;
  const tokenStandard = TokenStandard.NonFungible;
  const standardDelegate = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi);
  await transactionBuilder()
    .add(
      delegateStandardV1(umi, {
        mint,
        delegate: standardDelegate.publicKey,
        tokenStandard,
      })
    )
    .add(lockV1(umi, { mint, authority: standardDelegate, tokenStandard }))
    .sendAndConfirm(umi);
  t.like(await fetchDigitalAssetWithAssociatedToken(umi, mint, owner), <
    DigitalAssetWithToken
  >{ token: { state: SplTokenState.Frozen }, tokenRecord: undefined });

  // When the standard delegate unlocks the asset.
  await unlockV1(umi, {
    mint,
    authority: standardDelegate,
    tokenStandard,
  }).sendAndConfirm(umi);

  // Then the token state of the token account was successfully updated.
  t.like(await fetchDigitalAssetWithAssociatedToken(umi, mint, owner), <
    DigitalAssetWithToken
  >{ token: { state: SplTokenState.Initialized }, tokenRecord: undefined });
});

FUNGIBLE_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can unfreeze a ${tokenStandard}`, async (t) => {
    // Given an asset with the identity as the freeze authority of the mint
    const umi = await createUmi();
    const freezeAuthority = umi.identity;
    const owner = umi.identity.publicKey;
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      tokenStandard: TokenStandard[tokenStandard],
    });

    // And given the freeze authority has locked the asset.
    await lockV1(umi, {
      mint,
      authority: freezeAuthority,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);
    t.like(await fetchDigitalAssetWithAssociatedToken(umi, mint, owner), <
      DigitalAssetWithToken
    >{ token: { state: SplTokenState.Frozen }, tokenRecord: undefined });

    // When the freeze authority unlocks the asset.
    await unlockV1(umi, {
      mint,
      authority: freezeAuthority,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // Then the token state of the token account was successfully updated.
    t.like(await fetchDigitalAssetWithAssociatedToken(umi, mint, owner), <
      DigitalAssetWithToken
    >{ token: { state: SplTokenState.Initialized }, tokenRecord: undefined });
  });
});
