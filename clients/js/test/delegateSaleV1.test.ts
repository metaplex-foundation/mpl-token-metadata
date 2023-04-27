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
import {
  OG_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

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
      token: {
        owner: owner.publicKey,
        amount: 1n,
        delegate: some(publicKey(saleDelegate)),
        delegatedAmount: 1n,
      },
      tokenRecord: {
        delegate: some(publicKey(saleDelegate)),
        delegateRole: some(TokenDelegateRole.Sale),
        state: TokenState.Listed,
      },
    }
  );
});

OG_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it cannot approve a sale delegate for a ${tokenStandard}`, async (t) => {
    // Given a non-programmable asset.
    const umi = await createUmi();
    const owner = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      tokenOwner: owner.publicKey,
      tokenStandard: TokenStandard[tokenStandard],
    });

    // When we try to approve a sale delegate.
    const saleDelegate = generateSigner(umi).publicKey;
    const promise = delegateSaleV1(umi, {
      mint,
      tokenOwner: owner.publicKey,
      authority: owner,
      delegate: saleDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // Then we expect a program error.
    await t.throwsAsync(promise, { name: 'InvalidDelegateRole' });
  });
});
