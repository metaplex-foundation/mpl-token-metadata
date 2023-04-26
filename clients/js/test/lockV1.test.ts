import { generateSigner } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  DigitalAssetWithToken,
  TokenStandard,
  TokenState,
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
