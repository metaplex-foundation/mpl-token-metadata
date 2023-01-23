import { generateSigner, transactionBuilder } from '@lorisleiva/js-test';
import test from 'ava';
import { create } from '../src';
import { createMetaplex } from './_setup';

test('it TODO', async (t) => {
  //
  const mx = await createMetaplex();
  const mint = generateSigner(mx);

  // When
  await transactionBuilder(mx).add(create(mx, { mint })).sendAndConfirm();
});
