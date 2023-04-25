import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import test from 'ava';
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
    tokenOwner: owner.publicKey,
    authority: owner,
    delegate: utilityDelegate,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then
  const da = await fetchDigitalAssetWithAssociatedToken(
    umi,
    mint,
    owner.publicKey
  );
  console.log(da);
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
