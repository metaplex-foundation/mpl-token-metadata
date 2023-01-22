import {
  generateSigner,
  generateSignerWithSol,
  none,
  subtractAmounts,
  transactionBuilder,
} from '@lorisleiva/js-test';
import test from 'ava';
import {
  createMint,
  createToken,
  fetchToken,
  getTokenSize,
  Token,
  TokenState,
} from '../src';
import { createMetaplex } from './_setup';

test('it can create new token accounts with minimum configuration', async (t) => {
  // Given a payer, an account signer and an existing mint.
  const metaplex = await createMetaplex();
  const payer = await generateSignerWithSol(metaplex);
  const payerBalance = await metaplex.rpc.getBalance(payer.publicKey);
  const newMint = generateSigner(metaplex);
  const newToken = generateSigner(metaplex);
  await transactionBuilder(metaplex)
    .add(createMint(metaplex, { mint: newMint }))
    .sendAndConfirm();

  // When we create a new token account with minimum configuration.
  await transactionBuilder(metaplex)
    .add(
      createToken(
        { ...metaplex, payer }, // <- Our custom payer only pays for the Token storage.
        { token: newToken, mint: newMint.publicKey }
      )
    )
    .sendAndConfirm();

  // Then the account was created with the correct data.
  const tokenAccount = await fetchToken(metaplex, newToken.publicKey);
  const rentExemptBalance = await metaplex.rpc.getRent(getTokenSize());
  t.like(tokenAccount, <Token>{
    publicKey: newToken.publicKey,
    header: {
      owner: metaplex.programs.get('splToken').publicKey,
      lamports: rentExemptBalance,
    },
    mint: newMint.publicKey,
    owner: metaplex.identity.publicKey,
    amount: 0n,
    delegate: none(),
    state: TokenState.Initialized,
    isNative: none(),
    delegatedAmount: 0n,
    closeAuthority: none(),
  });

  // And the payer was charged for the creation of the account.
  const newPayerBalance = await metaplex.rpc.getBalance(payer.publicKey);
  t.deepEqual(
    newPayerBalance,
    subtractAmounts(payerBalance, rentExemptBalance)
  );
});

test('it can create new token accounts with maximum configuration', async (t) => {
  // Given an existing mint account and new owner and token signers.
  const metaplex = await createMetaplex();
  const newOwner = generateSigner(metaplex);
  const newMint = generateSigner(metaplex);
  const newToken = generateSigner(metaplex);
  await transactionBuilder(metaplex)
    .add(createMint(metaplex, { mint: newMint }))
    .sendAndConfirm();

  // When we create a new token account with maximum configuration.
  await transactionBuilder(metaplex)
    .add(
      createToken(metaplex, {
        token: newToken,
        mint: newMint.publicKey,
        owner: newOwner.publicKey,
      })
    )
    .sendAndConfirm();

  // Then the account was created with the correct data.
  const tokenAccount = await fetchToken(metaplex, newToken.publicKey);
  const rentExemptBalance = await metaplex.rpc.getRent(getTokenSize());
  t.like(tokenAccount, <Token>{
    publicKey: newToken.publicKey,
    header: {
      owner: metaplex.programs.get('splToken').publicKey,
      lamports: rentExemptBalance,
    },
    mint: newMint.publicKey,
    owner: newOwner.publicKey,
    amount: 0n,
    delegate: none(),
    state: TokenState.Initialized,
    isNative: none(),
    delegatedAmount: 0n,
    closeAuthority: none(),
  });
});
