import { generateSigner, transactionBuilder } from '@lorisleiva/js-test';
import test from 'ava';
import { createMint, createToken, fetchToken, mintTokensTo } from '../src';
import { createMetaplex } from './_setup';

test('it can mint tokens to an existing token account', async (t) => {
  // Given an empty token account.
  const metaplex = await createMetaplex();
  const mintAuthority = generateSigner(metaplex);
  const mint = generateSigner(metaplex);
  const token = generateSigner(metaplex);
  await transactionBuilder(metaplex)
    .add(createMint(metaplex, { mint, mintAuthority: mintAuthority.publicKey }))
    .add(createToken(metaplex, { token, mint: mint.publicKey }))
    .sendAndConfirm();
  t.is((await fetchToken(metaplex, token.publicKey)).amount, 0n);

  // When we mint tokens to the account.
  await transactionBuilder(metaplex)
    .add(
      mintTokensTo(metaplex, {
        mintAuthority,
        mint: mint.publicKey,
        token: token.publicKey,
        amount: 42,
      })
    )
    .sendAndConfirm();

  // Then the account has the correct amount of tokens.
  t.is((await fetchToken(metaplex, token.publicKey)).amount, 42n);
});
