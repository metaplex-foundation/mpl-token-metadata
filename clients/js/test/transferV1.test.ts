import {
  Mint,
  Token,
  fetchMint,
  fetchToken,
  findAssociatedTokenPda,
} from '@metaplex-foundation/mpl-essentials';
import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import test from 'ava';
import { TokenStandard, mintV1, transferV1 } from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can transfer a NonFungible to another wallet', async (t) => {
  // Given a NonFungible that belongs to owner A.
  const umi = await createUmi();
  const ownerA = generateSigner(umi).publicKey;
  const mint = await createDigitalAssetWithToken(umi, { tokenOwner: ownerA });

  // When we transfer the NonFungible to owner B.
  const ownerB = generateSigner(umi).publicKey;
  await transferV1(umi, {
    mint: mint.publicKey,
    amount: 1,
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
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'EditionsMustHaveExactlyOneToken' });
});
