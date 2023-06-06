import {
  approveTokenDelegate,
  findAssociatedTokenPda,
} from '@metaplex-foundation/mpl-toolbox';
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
  delegateLockedTransferV1,
  fetchDigitalAssetWithAssociatedToken,
  revokeLockedTransferV1,
} from '../src';
import {
  OG_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

test('it can revoke a locked transfer delegate for a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible with an approved locked transfer delegate.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const lockedTransferDelegate = generateSigner(umi).publicKey;
  const lockedAddress = generateSigner(umi).publicKey;
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });
  await delegateLockedTransferV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: lockedTransferDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    lockedAddress,
  }).sendAndConfirm(umi);
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      token: { delegate: some(publicKey(lockedTransferDelegate)) },
      tokenRecord: {
        delegate: some(publicKey(lockedTransferDelegate)),
        delegateRole: some(TokenDelegateRole.LockedTransfer),
        lockedTransfer: some(lockedAddress),
        state: TokenState.Unlocked,
      },
    }
  );

  // When we revoke the locked transfer delegate.
  await revokeLockedTransferV1(umi, {
    mint,
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: lockedTransferDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then the token and token record acconts were successfully updated.
  t.like(
    await fetchDigitalAssetWithAssociatedToken(umi, mint, owner.publicKey),
    <DigitalAssetWithToken>{
      token: { delegate: none() },
      tokenRecord: {
        delegate: none(),
        delegateRole: none(),
        lockedTransfer: none(),
        state: TokenState.Unlocked,
      },
    }
  );
});

OG_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it cannot revoke a locked transfer delegate for a ${tokenStandard}`, async (t) => {
    // Given an asset with an SPL delegate.
    const umi = await createUmi();
    const owner = generateSigner(umi);
    const lockedTransferDelegate = generateSigner(umi).publicKey;
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      tokenOwner: owner.publicKey,
      tokenStandard: TokenStandard[tokenStandard],
    });
    await approveTokenDelegate(umi, {
      source: findAssociatedTokenPda(umi, { mint, owner: owner.publicKey }),
      delegate: lockedTransferDelegate,
      owner,
      amount: 1,
    }).sendAndConfirm(umi);

    // When we try to revoke it as the locked transfer delegate.
    const promise = revokeLockedTransferV1(umi, {
      mint,
      tokenOwner: owner.publicKey,
      authority: owner,
      delegate: lockedTransferDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // Then we expect a program error.
    await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
  });
});
