import { generateSigner } from '@metaplex-foundation/umi';
import test from 'ava';
import { TokenStandard, burnV1 } from '../src';
import {
  FUNGIBLE_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

test('it can burn a NonFungible', async (t) => {
  // Given a NonFungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenOwner: owner.publicKey,
  });

  // When the owner burns the asset.
  await burnV1(umi, {
    mint,
    authority: owner,
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then the following accounts have been deleted.
  // ...

  // But the mint account still exists.
  // ...
});

test.skip('it can burn a ProgrammableNonFungible', async (t) => {
  // ...
});

FUNGIBLE_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test.skip(`it can burn a ${tokenStandard}`, async (t) => {
    // ...
  });
});
