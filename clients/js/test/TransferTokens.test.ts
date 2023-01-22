import { generateSigner, transactionBuilder } from '@lorisleiva/js-test';
import test from 'ava';
import { createToken, fetchToken, mintTokensTo, transferTokens } from '../src';
import { createMetaplex, createMint } from './_setup';

test('it can transfer tokens from one account to another', async (t) => {
  // Given an existing mint.
  const metaplex = await createMetaplex();
  const mint = (await createMint(metaplex)).publicKey;

  // And a token account A from owner A with 50 tokens.
  const ownerA = generateSigner(metaplex);
  const ownerAPublicKey = ownerA.publicKey;
  const tokenA = generateSigner(metaplex);
  await transactionBuilder(metaplex)
    .add(createToken(metaplex, { mint, token: tokenA, owner: ownerAPublicKey }))
    .add(mintTokensTo(metaplex, { mint, token: tokenA.publicKey, amount: 50 }))
    .sendAndConfirm();

  // And a token account B from owner B with 10 tokens.
  const ownerB = generateSigner(metaplex).publicKey;
  const tokenB = generateSigner(metaplex);
  await transactionBuilder(metaplex)
    .add(createToken(metaplex, { mint, token: tokenB, owner: ownerB }))
    .add(mintTokensTo(metaplex, { mint, token: tokenB.publicKey, amount: 10 }))
    .sendAndConfirm();

  // When owner A transfers 30 tokens to owner B.
  await transactionBuilder(metaplex)
    .add(
      transferTokens(metaplex, {
        source: tokenA.publicKey,
        destination: tokenB.publicKey,
        authority: ownerA,
        amount: 30,
      })
    )
    .sendAndConfirm();

  // Then token account A now has 20 tokens.
  t.is((await fetchToken(metaplex, tokenA.publicKey)).amount, 20n);

  // And token account B now has 40 tokens.
  t.is((await fetchToken(metaplex, tokenB.publicKey)).amount, 40n);
});
