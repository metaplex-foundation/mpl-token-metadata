import { generateSigner } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  TokenStandard,
  burnV1,
  fetchDigitalAssetWithAssociatedToken,
} from '../src';
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
  const da = await fetchDigitalAssetWithAssociatedToken(
    umi,
    mint,
    owner.publicKey
  );

  // When the owner burns the asset.
  await burnV1(umi, {
    mint,
    authority: owner,
    tokenOwner: owner.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then the following accounts have been deleted.
  t.false(await umi.rpc.accountExists(da.metadata.publicKey));
  t.false(await umi.rpc.accountExists(da.edition!.publicKey));
  t.false(await umi.rpc.accountExists(da.token.publicKey));

  // But the mint account still exists.
  t.true(await umi.rpc.accountExists(mint));
});

test.skip('it can burn a ProgrammableNonFungible', async (t) => {
  // ...
});

FUNGIBLE_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test.skip(`it can burn a ${tokenStandard}`, async (t) => {
    // ...
  });
});
