import {
  Mint,
  SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  fetchMint,
  fetchToken,
  findAssociatedTokenPda,
} from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  percentAmount,
  publicKey,
} from '@metaplex-foundation/umi';
import { publicKey as publicKeySerializer } from '@metaplex-foundation/umi/serializers';
import test from 'ava';
import { TokenStandard, createV1, mintV1 } from '../src';
import { SPL_TOKEN_2022_PROGRAM_ID, createUmi } from './_setup';

test('it can mint only one token after a NonFungible is created', async (t) => {
  // Given a created NonFungible.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  await createV1(umi, {
    mint,
    name: 'My NFT',
    uri: 'https://example.com/my-nft.json',
    sellerFeeBasisPoints: percentAmount(5.5),
  }).sendAndConfirm(umi);

  // When we mint one token.
  await mintV1(umi, {
    mint: mint.publicKey,
    tokenOwner: umi.identity.publicKey,
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then a token was minted to the associated token account.
  const mintAccount = await fetchMint(umi, mint.publicKey);
  t.like(mintAccount, <Mint>{ publicKey: publicKey(mint), supply: 1n });
  const token = findAssociatedTokenPda(umi, {
    mint: mint.publicKey,
    owner: umi.identity.publicKey,
  });
  const tokenAccount = await fetchToken(umi, token);
  t.like(tokenAccount, <Token>{ publicKey: publicKey(token), amount: 1n });

  // But when we try to mint another token.
  const promise = mintV1(umi, {
    mint: mint.publicKey,
    tokenOwner: umi.identity.publicKey,
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'EditionsMustHaveExactlyOneToken' });
});

test('it can mint only one token after a ProgrammableNonFungible is created', async (t) => {
  // Given a created ProgrammableNonFungible.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  await createV1(umi, {
    mint,
    name: 'My NFT',
    uri: 'https://example.com/my-nft.json',
    sellerFeeBasisPoints: percentAmount(5.5),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // When we mint one token.
  await mintV1(umi, {
    mint: mint.publicKey,
    tokenOwner: umi.identity.publicKey,
    amount: 1,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then a token was minted to the associated token account.
  const mintAccount = await fetchMint(umi, mint.publicKey);
  t.like(mintAccount, <Mint>{ publicKey: publicKey(mint), supply: 1n });
  const token = findAssociatedTokenPda(umi, {
    mint: mint.publicKey,
    owner: umi.identity.publicKey,
  });
  const tokenAccount = await fetchToken(umi, token);
  t.like(tokenAccount, <Token>{ publicKey: publicKey(token), amount: 1n });

  // But when we try to mint another token.
  const promise = mintV1(umi, {
    mint: mint.publicKey,
    tokenOwner: umi.identity.publicKey,
    amount: 1,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'EditionsMustHaveExactlyOneToken' });
});

test('it can mint multiple tokens after a Fungible is created', async (t) => {
  // Given a created Fungible.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  await createV1(umi, {
    mint,
    name: 'My NFT',
    uri: 'https://example.com/my-nft.json',
    sellerFeeBasisPoints: percentAmount(5.5),
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  // When we mint 42 token.
  await mintV1(umi, {
    mint: mint.publicKey,
    tokenOwner: umi.identity.publicKey,
    amount: 42,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  // Then the tokens were minted to the associated token account.
  const mintAccount = await fetchMint(umi, mint.publicKey);
  t.like(mintAccount, <Mint>{ publicKey: publicKey(mint), supply: 42n });
  const token = findAssociatedTokenPda(umi, {
    mint: mint.publicKey,
    owner: umi.identity.publicKey,
  });
  const tokenAccount = await fetchToken(umi, token);
  t.like(tokenAccount, <Token>{ publicKey: publicKey(token), amount: 42n });
});

test('it can mint multiple tokens after a FungibleAsset is created', async (t) => {
  // Given a created FungibleAsset.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  await createV1(umi, {
    mint,
    name: 'My NFT',
    uri: 'https://example.com/my-nft.json',
    sellerFeeBasisPoints: percentAmount(5.5),
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);

  // When we mint 42 token.
  await mintV1(umi, {
    mint: mint.publicKey,
    tokenOwner: umi.identity.publicKey,
    amount: 42,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);

  // Then the tokens were minted to the associated token account.
  const mintAccount = await fetchMint(umi, mint.publicKey);
  t.like(mintAccount, <Mint>{ publicKey: publicKey(mint), supply: 42n });
  const token = findAssociatedTokenPda(umi, {
    mint: mint.publicKey,
    owner: umi.identity.publicKey,
  });
  const tokenAccount = await fetchToken(umi, token);
  t.like(tokenAccount, <Token>{ publicKey: publicKey(token), amount: 42n });
});

test.only('it can mint a new ProgrammableNonFungible with Token-2022', async (t) => {
  // Given a new mint Signer.
  const umi = await createUmi();
  const mint = generateSigner(umi);

  // And we create a new ProgrammableNonFungible at this address.
  await createV1(umi, {
    mint,
    name: 'My Programmable NFT',
    uri: 'https://example.com/my-programmable-nft.json',
    sellerFeeBasisPoints: percentAmount(5.5),
    splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // And we derive the associated token account from SPL Token 2022.
  const [token] = umi.eddsa.findPda(SPL_ASSOCIATED_TOKEN_PROGRAM_ID, [
    publicKeySerializer().serialize(umi.identity.publicKey),
    publicKeySerializer().serialize(SPL_TOKEN_2022_PROGRAM_ID),
    publicKeySerializer().serialize(mint.publicKey),
  ]);

  // When we mint one token.
  await mintV1(umi, {
    mint: mint.publicKey,
    token,
    tokenOwner: umi.identity.publicKey,
    amount: 1,
    splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  // Then a token was minted to the associated token account.
  const mintAccount = await fetchMint(umi, mint.publicKey);
  t.like(mintAccount, <Mint>{ publicKey: publicKey(mint), supply: 1n });
  const tokenAccount = await fetchToken(umi, token);
  t.like(tokenAccount, <Token>{ publicKey: publicKey(token), amount: 1n });

  // And the SPL Token-2022 Program is the owner of the mint account.
  const account = await umi.rpc.getAccount(mint.publicKey);
  t.true(account.exists);

  if (account.exists) {
    t.is(account.owner, SPL_TOKEN_2022_PROGRAM_ID);
  }
});
