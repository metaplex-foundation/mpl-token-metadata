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
import {
  OG_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

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

OG_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can revoke a standard delegate for a ${tokenStandard}`, async (t) => {
    // Given an asset with a standard delegate.
    const umi = await createUmi();
    const owner = generateSigner(umi);
    const standardDelegate = generateSigner(umi).publicKey;
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      tokenOwner: owner.publicKey,
      tokenStandard: TokenStandard[tokenStandard],
    });
    await delegateStandardV1(umi, {
      mint,
      tokenOwner: owner.publicKey,
      authority: owner,
      delegate: standardDelegate,
      tokenStandard: TokenStandard[tokenStandard],
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
      tokenStandard: TokenStandard[tokenStandard],
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
});
