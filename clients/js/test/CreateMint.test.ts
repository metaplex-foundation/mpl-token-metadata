import {
  generateSigner,
  isEqualToAmount,
  none,
  sol,
  some,
  subtractAmounts,
  transactionBuilder,
} from '@lorisleiva/js-test';
import test from 'ava';
import { createMint, fetchMint, getMintSize, Mint } from '../src';
import { createMetaplex } from './_setup';

test('it can create new mint accounts with minimum configuration', async (t) => {
  // Given a payer and an account signer.
  const metaplex = await createMetaplex();
  const payerBalance = await metaplex.rpc.getBalance(metaplex.payer.publicKey);
  const newAccount = generateSigner(metaplex);

  // When we create a new mint account at this address with no additional configuration.
  await transactionBuilder(metaplex)
    .add(createMint(metaplex, { mint: newAccount }))
    .sendAndConfirm();

  // Then the account was created with the correct data.
  const mintAccount = await fetchMint(metaplex, newAccount.publicKey);
  const rentExemptBalance = await metaplex.rpc.getRent(getMintSize());
  t.like(mintAccount, <Mint>{
    publicKey: newAccount.publicKey,
    header: {
      owner: metaplex.programs.get('splToken').publicKey,
      lamports: rentExemptBalance,
    },
    mintAuthority: some({ ...metaplex.identity.publicKey }),
    supply: 0n,
    decimals: 0,
    isInitialized: true,
    freezeAuthority: some({ ...metaplex.identity.publicKey }),
  });

  // And the payer was charged for the creation of the account.
  const newPayerBalance = await metaplex.rpc.getBalance(
    metaplex.payer.publicKey
  );
  t.true(
    isEqualToAmount(
      newPayerBalance,
      subtractAmounts(payerBalance, rentExemptBalance),
      sol(0.0001) // (tolerance) Plus a bit more for the transaction fee.
    )
  );
});

test('it can create new mint accounts with maximum configuration', async (t) => {
  // Given an account signer and a mint authority.
  const metaplex = await createMetaplex();
  const newAccount = generateSigner(metaplex);
  const mintAuthority = generateSigner(metaplex).publicKey;

  // When we create a new mint account with all configuration options.
  await transactionBuilder(metaplex)
    .add(
      createMint(metaplex, {
        mint: newAccount,
        decimals: 9,
        mintAuthority,
        freezeAuthority: none(),
      })
    )
    .sendAndConfirm();

  // Then the account was created with the correct data.
  const mintAccount = await fetchMint(metaplex, newAccount.publicKey);
  const rentExemptBalance = await metaplex.rpc.getRent(getMintSize());
  t.like(mintAccount, <Mint>{
    publicKey: newAccount.publicKey,
    header: {
      owner: metaplex.programs.get('splToken').publicKey,
      lamports: rentExemptBalance,
    },
    mintAuthority: some(mintAuthority),
    supply: 0n,
    decimals: 9,
    isInitialized: true,
    freezeAuthority: none(),
  });
});
