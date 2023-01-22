import { generateSigner } from '@lorisleiva/js-core';
import {
  generateSignerWithSol,
  isEqualToAmount,
  isLessThanAmount,
  sol,
  transactionBuilder,
} from '@lorisleiva/js-test';
import test from 'ava';
import { transferSol } from '../src';
import { createMetaplex } from './_setup';

test('it can create transfer SOLs', async (t) => {
  // Given two wallets A and B with 50 SOL each.
  const metaplex = await createMetaplex();
  const walletA = await generateSignerWithSol(metaplex, sol(50));
  const walletB = await generateSignerWithSol(metaplex, sol(50));
  const payerBalance = await metaplex.rpc.getBalance(metaplex.payer.publicKey);

  // When wallet A transfers 10 SOL to wallet B.
  await transactionBuilder(metaplex)
    .add(
      transferSol(metaplex, {
        source: walletA,
        destination: walletB.publicKey,
        amount: sol(10),
      })
    )
    .sendAndConfirm();

  // Then wallet A now has 40 SOL.
  const balanceA = await metaplex.rpc.getBalance(walletA.publicKey);
  t.true(isEqualToAmount(balanceA, sol(40)));

  // And wallet B has 60 SOL.
  const balanceB = await metaplex.rpc.getBalance(walletB.publicKey);
  t.true(isEqualToAmount(balanceB, sol(60)));

  // And the metaplet payer paid for the transaction.
  const newPayerBalance = await metaplex.rpc.getBalance(
    metaplex.payer.publicKey
  );
  t.true(isLessThanAmount(newPayerBalance, payerBalance));
});

test('it defaults to transferring from the identity', async (t) => {
  // Given a destination wallet with no SOL.
  const metaplex = await createMetaplex();
  const destination = generateSigner(metaplex);

  // And an identity wallet with 100 SOL.
  const identityBalance = await metaplex.rpc.getBalance(
    metaplex.identity.publicKey
  );
  t.true(isEqualToAmount(identityBalance, sol(100)));

  // When we transfer 10 SOL to the destination without specifying a source.
  await transactionBuilder(metaplex)
    .add(
      transferSol(metaplex, {
        destination: destination.publicKey,
        amount: sol(10),
      })
    )
    .sendAndConfirm();

  // Then the destination now has 10 SOL.
  const destinationBalance = await metaplex.rpc.getBalance(
    destination.publicKey
  );
  t.true(isEqualToAmount(destinationBalance, sol(10)));

  // And the identity now has 90 SOL minus the transaction fee.
  const newIdentityBalance = await metaplex.rpc.getBalance(
    metaplex.identity.publicKey
  );
  t.true(isEqualToAmount(newIdentityBalance, sol(90), sol(0.01)));
});
