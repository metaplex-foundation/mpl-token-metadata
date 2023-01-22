import {
  generateSigner,
  generateSignerWithSol,
  sol,
  subtractAmounts,
  transactionBuilder,
} from '@lorisleiva/js-test';
import test from 'ava';
import {
  createAssociatedToken,
  createToken,
  createTokenIfMissing,
  fetchToken,
  findAssociatedTokenPda,
  getTokenSize,
  TokenState,
  TokExCannotCreateNonAssociatedTokenError,
  TokExInvalidAssociatedTokenAccountError,
  TokExInvalidAssociatedTokenProgramError,
  TokExInvalidSystemProgramError,
  TokExInvalidTokenMintError,
  TokExInvalidTokenOwnerError,
  TokExInvalidTokenProgramError,
} from '../src';
import { createMetaplex, createMint } from './_setup';

test('it creates a new associated token if missing', async (t) => {
  // Given an existing mint and owner with no associated token account.
  const metaplex = await createMetaplex();
  const mint = (await createMint(metaplex)).publicKey;
  const owner = generateSigner(metaplex).publicKey;

  // When we execute the "CreateTokenIfMissing" instruction.
  await transactionBuilder(metaplex)
    .add(createTokenIfMissing(metaplex, { mint, owner }))
    .sendAndConfirm();

  // Then a new associated token account was created.
  const ata = findAssociatedTokenPda(metaplex, { mint, owner });
  const ataAccount = await fetchToken(metaplex, ata);
  t.like(ataAccount, {
    publicKey: ata,
    mint,
    owner,
    state: TokenState.Initialized,
    amount: 0n,
  });
});

test('it defaults to the identity if no owner is provided', async (t) => {
  // Given an existing mint without an associated token account with the identity.
  const metaplex = await createMetaplex();
  const mint = (await createMint(metaplex)).publicKey;
  const identity = metaplex.identity.publicKey;

  // When we execute the "CreateTokenIfMissing" instruction without an owner.
  await transactionBuilder(metaplex)
    .add(createTokenIfMissing(metaplex, { mint }))
    .sendAndConfirm();

  // Then a new associated token account was created for the identity.
  const ata = findAssociatedTokenPda(metaplex, { mint, owner: identity });
  const ataAccount = await fetchToken(metaplex, ata);
  t.like(ataAccount, {
    publicKey: ata,
    mint,
    owner: identity,
    state: TokenState.Initialized,
    amount: 0n,
  });
});

test('the payer pays for the storage fees if a token account gets created', async (t) => {
  // Given an existing mint and a payer.
  const metaplex = await createMetaplex();
  const mint = (await createMint(metaplex)).publicKey;
  const payer = await generateSignerWithSol(metaplex, sol(100));
  const identity = metaplex.identity.publicKey;

  // When we execute the "CreateTokenIfMissing" instruction with an explicit payer.
  await transactionBuilder(metaplex)
    .add(createTokenIfMissing({ ...metaplex, payer }, { mint }))
    .sendAndConfirm();

  // Then the payer paid for the storage fee.
  const storageFee = await metaplex.rpc.getRent(getTokenSize());
  const payerBalance = await metaplex.rpc.getBalance(payer.publicKey);
  t.deepEqual(payerBalance, subtractAmounts(sol(100), storageFee));

  // And this matches the lamports on the ATA account.
  const ata = findAssociatedTokenPda(metaplex, { mint, owner: identity });
  const ataAccount = await fetchToken(metaplex, ata);
  t.deepEqual(ataAccount.header.lamports, storageFee);
});

test('it does not create an account if an associated token account already exists', async (t) => {
  // Given an existing mint, owner and associated token account.
  const metaplex = await createMetaplex();
  const mint = (await createMint(metaplex)).publicKey;
  const owner = generateSigner(metaplex).publicKey;
  const ata = findAssociatedTokenPda(metaplex, { mint, owner });
  await transactionBuilder(metaplex)
    .add(createAssociatedToken(metaplex, { mint, owner }))
    .sendAndConfirm();
  t.true(await metaplex.rpc.accountExists(ata));

  // And given an explicit payer to ensure it was not charged for the storage fee.
  const payer = await generateSignerWithSol(metaplex, sol(100));

  // When we execute the "CreateTokenIfMissing" instruction on that mint/owner pair.
  await transactionBuilder(metaplex)
    .add(createTokenIfMissing({ ...metaplex, payer }, { mint, owner }))
    .sendAndConfirm();

  // Then the ata still exists.
  t.true(await metaplex.rpc.accountExists(ata));

  // And the payer was not charged for the storage fee of a new account as no new account was created.
  const payerBalance = await metaplex.rpc.getBalance(payer.publicKey);
  t.deepEqual(payerBalance, sol(100));
});

test('it does not create an account if a regular token account already exists', async (t) => {
  // Given an existing mint, owner and a regular token account between them.
  const metaplex = await createMetaplex();
  const mint = (await createMint(metaplex)).publicKey;
  const owner = generateSigner(metaplex).publicKey;
  const token = generateSigner(metaplex);
  await transactionBuilder(metaplex)
    .add(createToken(metaplex, { mint, owner, token }))
    .sendAndConfirm();
  t.true(await metaplex.rpc.accountExists(token.publicKey));

  // And given an explicit payer to ensure it was not charged for the storage fee.
  const payer = await generateSignerWithSol(metaplex, sol(100));

  // When we execute the "CreateTokenIfMissing" instruction on that mint/owner pair
  // whilst explicitly providing the token account.
  await transactionBuilder(metaplex)
    .add(
      createTokenIfMissing(
        { ...metaplex, payer },
        { mint, owner, token: token.publicKey }
      )
    )
    .sendAndConfirm();

  // Then the token account still exists.
  t.true(await metaplex.rpc.accountExists(token.publicKey));

  // And the payer was not charged for the storage fee of a new account as no new account was created.
  const payerBalance = await metaplex.rpc.getBalance(payer.publicKey);
  t.deepEqual(payerBalance, sol(100));
});

test('it fail if we provide the wrong system program', async (t) => {
  // Given an existing mint and a wrong system program.
  const metaplex = await createMetaplex();
  const mint = (await createMint(metaplex)).publicKey;
  const systemProgram = generateSigner(metaplex).publicKey;

  // When we execute the "CreateTokenIfMissing" instruction with the wrong system program.
  const promise = transactionBuilder(metaplex)
    .add(createTokenIfMissing(metaplex, { mint, systemProgram }))
    .sendAndConfirm();

  // Then we expect a custom program error.
  await t.throwsAsync(promise, { instanceOf: TokExInvalidSystemProgramError });
});

test('it fail if we provide the wrong token program', async (t) => {
  // Given an existing mint and a wrong token program.
  const metaplex = await createMetaplex();
  const mint = (await createMint(metaplex)).publicKey;
  const tokenProgram = generateSigner(metaplex).publicKey;

  // When we execute the "CreateTokenIfMissing" instruction with the wrong token program.
  const promise = transactionBuilder(metaplex)
    .add(createTokenIfMissing(metaplex, { mint, tokenProgram }))
    .sendAndConfirm();

  // Then we expect a custom program error.
  await t.throwsAsync(promise, { instanceOf: TokExInvalidTokenProgramError });
});

test('it fail if we provide the wrong ata program', async (t) => {
  // Given an existing mint and a wrong ata program.
  const metaplex = await createMetaplex();
  const mint = (await createMint(metaplex)).publicKey;
  const ataProgram = generateSigner(metaplex).publicKey;

  // When we execute the "CreateTokenIfMissing" instruction with the wrong ata program.
  const promise = transactionBuilder(metaplex)
    .add(createTokenIfMissing(metaplex, { mint, ataProgram }))
    .sendAndConfirm();

  // Then we expect a custom program error.
  await t.throwsAsync(promise, {
    instanceOf: TokExInvalidAssociatedTokenProgramError,
  });
});

test('it fail if the ata account does not match the mint and owner', async (t) => {
  // Given a mint, an owner and an invalid ata address.
  const metaplex = await createMetaplex();
  const mint = (await createMint(metaplex)).publicKey;
  const owner = generateSigner(metaplex).publicKey;
  const invalidAta = generateSigner(metaplex).publicKey;

  // When we execute the "CreateTokenIfMissing" instruction with the wrong ata address.
  const promise = transactionBuilder(metaplex)
    .add(createTokenIfMissing(metaplex, { mint, owner, ata: invalidAta }))
    .sendAndConfirm();

  // Then we expect a custom program error.
  await t.throwsAsync(promise, {
    instanceOf: TokExInvalidAssociatedTokenAccountError,
  });
});

test('it fail if the existing token account is not associated with the given mint', async (t) => {
  // Given a mint, an owner and a token account associated with the wrong mint.
  const metaplex = await createMetaplex();
  const mint = (await createMint(metaplex)).publicKey;
  const wrongMint = (await createMint(metaplex)).publicKey;
  const owner = generateSigner(metaplex).publicKey;
  const token = generateSigner(metaplex);
  await transactionBuilder(metaplex)
    .add(createToken(metaplex, { mint: wrongMint, owner, token }))
    .sendAndConfirm();

  // When we execute the "CreateTokenIfMissing" instruction on that token account.
  const promise = transactionBuilder(metaplex)
    .add(
      createTokenIfMissing(metaplex, { mint, owner, token: token.publicKey })
    )
    .sendAndConfirm();

  // Then we expect a custom program error.
  await t.throwsAsync(promise, { instanceOf: TokExInvalidTokenMintError });
});

test('it fail if the existing token account is not associated with the given owner', async (t) => {
  // Given a mint, an owner and a token account associated with the wrong owner.
  const metaplex = await createMetaplex();
  const mint = (await createMint(metaplex)).publicKey;
  const owner = generateSigner(metaplex).publicKey;
  const wrongOwner = generateSigner(metaplex).publicKey;
  const token = generateSigner(metaplex);
  await transactionBuilder(metaplex)
    .add(createToken(metaplex, { mint, owner: wrongOwner, token }))
    .sendAndConfirm();

  // When we execute the "CreateTokenIfMissing" instruction on that token account.
  const promise = transactionBuilder(metaplex)
    .add(
      createTokenIfMissing(metaplex, { mint, owner, token: token.publicKey })
    )
    .sendAndConfirm();

  // Then we expect a custom program error.
  await t.throwsAsync(promise, { instanceOf: TokExInvalidTokenOwnerError });
});

test('it fail if the non existing token account is not an ata account', async (t) => {
  // Given an existing mint/owner pair with no token account.
  const metaplex = await createMetaplex();
  const mint = (await createMint(metaplex)).publicKey;
  const owner = generateSigner(metaplex).publicKey;

  // And given a new address for a regular (non-associated) token account.
  const token = generateSigner(metaplex).publicKey;

  // When we execute the "CreateTokenIfMissing" instruction on that token account.
  const promise = transactionBuilder(metaplex)
    .add(createTokenIfMissing(metaplex, { mint, owner, token }))
    .sendAndConfirm();

  // Then we expect a custom program error because we need the token account
  // as a Signer in order to create it.
  await t.throwsAsync(promise, {
    instanceOf: TokExCannotCreateNonAssociatedTokenError,
  });
});
