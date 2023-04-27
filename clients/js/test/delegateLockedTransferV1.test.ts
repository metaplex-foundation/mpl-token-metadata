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
import {
  OG_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

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
      token: {
        owner: owner.publicKey,
        amount: 1n,
        delegate: some(publicKey(lockedTransferDelegate)),
        delegatedAmount: 1n,
      },
      tokenRecord: {
        delegate: some(publicKey(lockedTransferDelegate)),
        delegateRole: some(TokenDelegateRole.LockedTransfer),
        lockedTransfer: some(lockedAddress),
        state: TokenState.Unlocked,
      },
    }
  );
});

OG_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it cannot approve a locked transfer delegate for a ${tokenStandard}`, async (t) => {
    // Given a non-programmable asset.
    const umi = await createUmi();
    const owner = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      tokenOwner: owner.publicKey,
      tokenStandard: TokenStandard[tokenStandard],
    });

    // When we try to approve a locked transfer delegate.
    const lockedTransferDelegate = generateSigner(umi).publicKey;
    const lockedAddress = generateSigner(umi).publicKey;
    const promise = delegateLockedTransferV1(umi, {
      mint,
      tokenOwner: owner.publicKey,
      authority: owner,
      delegate: lockedTransferDelegate,
      tokenStandard: TokenStandard[tokenStandard],
      lockedAddress,
    }).sendAndConfirm(umi);

    // Then we expect a program error.
    await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
  });
});
