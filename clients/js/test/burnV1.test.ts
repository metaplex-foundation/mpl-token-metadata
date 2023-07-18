import {
  assertAccountExists,
  generateSigner,
  sol,
} from '@metaplex-foundation/umi';
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
  t.false(await umi.rpc.accountExists(da.edition!.publicKey));
  t.false(await umi.rpc.accountExists(da.token.publicKey));

  // And the Metadata account still exists but it was drained and is left with the create fees.
  const metadata = await umi.rpc.getAccount(da.metadata.publicKey);
  t.true(metadata.exists);
  assertAccountExists(metadata);
  t.deepEqual(metadata.lamports, sol(0.01));
  t.is(metadata.data.length, 1);
  t.is(metadata.data[0], 0);

  // But the mint account still exists.
  t.true(await umi.rpc.accountExists(mint));
});

test('it can burn a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible.
  const umi = await createUmi();
  const owner = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    tokenStandard: TokenStandard.ProgrammableNonFungible,
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
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then the following accounts have been deleted.
  t.false(await umi.rpc.accountExists(da.edition!.publicKey));
  t.false(await umi.rpc.accountExists(da.token.publicKey));
  t.false(await umi.rpc.accountExists(da.tokenRecord!.publicKey));

  // And the Metadata account still exists but it was drained and is left with the create fees.
  const metadata = await umi.rpc.getAccount(da.metadata.publicKey);
  t.true(metadata.exists);
  assertAccountExists(metadata);
  t.deepEqual(metadata.lamports, sol(0.01));
  t.is(metadata.data.length, 1);
  t.is(metadata.data[0], 0);

  // But the mint account still exists.
  t.true(await umi.rpc.accountExists(mint));
});

FUNGIBLE_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can burn the token account of a ${tokenStandard}`, async (t) => {
    // Given a fungible with 42 tokens.
    const umi = await createUmi();
    const owner = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      tokenStandard: TokenStandard[tokenStandard],
      tokenOwner: owner.publicKey,
      amount: 42,
    });
    const da = await fetchDigitalAssetWithAssociatedToken(
      umi,
      mint,
      owner.publicKey
    );

    // When the owner burns all the tokens in the asset.
    await burnV1(umi, {
      mint,
      authority: owner,
      tokenOwner: owner.publicKey,
      tokenStandard: TokenStandard[tokenStandard],
      amount: 42,
    }).sendAndConfirm(umi);

    // Then the token account has been deleted.
    t.false(await umi.rpc.accountExists(da.token.publicKey));

    // But the mint and metadata accounts still exist.
    t.true(await umi.rpc.accountExists(mint));
    t.true(await umi.rpc.accountExists(da.metadata.publicKey));
  });

  test(`it keeps the token account of a ${tokenStandard} if there are tokens left`, async (t) => {
    // Given a fungible with 42 tokens.
    const umi = await createUmi();
    const owner = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      tokenStandard: TokenStandard[tokenStandard],
      tokenOwner: owner.publicKey,
      amount: 42,
    });
    const da = await fetchDigitalAssetWithAssociatedToken(
      umi,
      mint,
      owner.publicKey
    );

    // When the owner burns only 10 tokens in the asset.
    await burnV1(umi, {
      mint,
      authority: owner,
      tokenOwner: owner.publicKey,
      tokenStandard: TokenStandard[tokenStandard],
      amount: 10,
    }).sendAndConfirm(umi);

    // Then no account was deleted.
    t.true(await umi.rpc.accountExists(mint));
    t.true(await umi.rpc.accountExists(da.metadata.publicKey));
    t.true(await umi.rpc.accountExists(da.token.publicKey));
  });
});
