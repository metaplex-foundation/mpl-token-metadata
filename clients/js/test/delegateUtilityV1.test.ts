import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-essentials';
import { PublicKey, generateSigner, publicKey } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  DigitalAssetWithToken,
  TokenStandard,
  fetchDigitalAssetWithAssociatedToken,
  transferV1,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can delegate a NonFungible', async (t) => {
  // Given a NonFungible that belongs to owner A.
  const umi = await createUmi();
  const ownerA = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: ownerA.publicKey,
  });

  // When we transfer the asset to owner B.
  const ownerB = generateSigner(umi).publicKey;
  await transferV1(umi, {
    mint,
    authority: ownerA,
    tokenOwner: ownerA.publicKey,
    destinationOwner: ownerB,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then the asset is now owned by owner B.
  const da = await fetchDigitalAssetWithAssociatedToken(umi, mint, ownerB);
  t.like(da, <DigitalAssetWithToken>{
    mint: {
      publicKey: publicKey(mint),
      supply: 1n,
    },
    token: {
      publicKey: findAssociatedTokenPda(umi, {
        mint,
        owner: ownerB,
      }) as PublicKey,
      owner: ownerB,
      amount: 1n,
    },
  });
});
