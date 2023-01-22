import {
  generateSigner,
  generateSignerWithSol,
  none,
  subtractAmounts,
  transactionBuilder,
} from '@lorisleiva/js-test';
import test from 'ava';
import {
  createAssociatedToken,
  createMint,
  fetchToken,
  findAssociatedTokenPda,
  getTokenSize,
  Token,
  TokenState,
} from '../src';
import { createMetaplex } from './_setup';

test('it can create new associated token accounts with minimum configuration', async (t) => {
  // Given an existing mint.
  const metaplex = await createMetaplex();
  const newMint = generateSigner(metaplex);
  await transactionBuilder(metaplex)
    .add(createMint(metaplex, { mint: newMint }))
    .sendAndConfirm();

  // When we create a new associated token account with minimum configuration.
  await transactionBuilder(metaplex)
    .add(createAssociatedToken(metaplex, { mint: newMint.publicKey }))
    .sendAndConfirm();

  // Then the account was created with the correct data
  // And the token account is associated to the identity.
  const ata = findAssociatedTokenPda(metaplex, {
    mint: newMint.publicKey,
    owner: metaplex.identity.publicKey,
  });
  const tokenAccount = await fetchToken(metaplex, ata);
  t.like(tokenAccount, <Token>{
    publicKey: ata,
    header: {
      owner: metaplex.programs.get('splToken').publicKey,
      lamports: await metaplex.rpc.getRent(getTokenSize()),
      executable: false,
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
});

test('it can create new associated token accounts with maximum configuration', async (t) => {
  // Given an existing mint account and various signers.
  const metaplex = await createMetaplex();
  const payer = await generateSignerWithSol(metaplex);
  const payerBalance = await metaplex.rpc.getBalance(payer.publicKey);
  const newOwner = generateSigner(metaplex);
  const newMint = generateSigner(metaplex);
  const ata = findAssociatedTokenPda(metaplex, {
    mint: newMint.publicKey,
    owner: newOwner.publicKey,
  });
  await transactionBuilder(metaplex)
    .add(createMint(metaplex, { mint: newMint }))
    .sendAndConfirm();

  // When we create a new associated token account with maximum configuration.
  await transactionBuilder(metaplex)
    .add(
      createAssociatedToken(metaplex, {
        payer,
        mint: newMint.publicKey,
        owner: newOwner.publicKey,
        ata,
      })
    )
    .sendAndConfirm();

  // Then the account was created with the correct data.
  const tokenAccount = await fetchToken(metaplex, ata);
  const rentExemptBalance = await metaplex.rpc.getRent(getTokenSize());
  t.like(tokenAccount, <Token>{
    publicKey: ata,
    header: {
      owner: metaplex.programs.get('splToken').publicKey,
      lamports: rentExemptBalance,
      executable: false,
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

  // And the payer was charged for the creation of the account.
  const newPayerBalance = await metaplex.rpc.getBalance(payer.publicKey);
  t.deepEqual(
    newPayerBalance,
    subtractAmounts(payerBalance, rentExemptBalance)
  );
});
