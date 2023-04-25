import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import test from 'ava';
import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-essentials';
import {
  DigitalAssetWithToken,
  TokenStandard,
  delegateUtilityV1,
  fetchDigitalAssetWithAssociatedToken,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can approve a utility delegate for a NonFungible', async (t) => {
  // Given a NonFungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
  });

  // When we approve a utility delegate.
  const utilityDelegate = generateSigner(umi).publicKey;
  await delegateUtilityV1(umi, {
    mint,
    token: findAssociatedTokenPda(umi, { mint, owner: owner.publicKey }),
    authority: owner,
    delegate: utilityDelegate,
    tokenStandard: TokenStandard.NonFungible,
    amount: 1,
  }).sendAndConfirm(umi);

  // Then the asset is now owned by owner B.
  const da = await fetchDigitalAssetWithAssociatedToken(
    umi,
    mint,
    owner.publicKey
  );
  t.like(da, <DigitalAssetWithToken>{
    mint: {
      publicKey: publicKey(mint),
      supply: 1n,
    },
    token: {
      owner: owner.publicKey,
      amount: 1n,
    },
  });
});
