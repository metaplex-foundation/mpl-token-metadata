import { transactionBuilder } from '@lorisleiva/js-test';
import test from 'ava';
import { addMemo } from '../src';
import { createMetaplex } from './_setup';

test('it can add a memo to a transaction', async (t) => {
  // Given a Metaplex context.
  const metaplex = await createMetaplex();

  // When we add a memo to a transaction.
  const { signature } = await transactionBuilder(metaplex)
    .add(addMemo(metaplex, { memo: 'Hello world!' }))
    .sendAndConfirm();

  // Then the instruction data contains our memo.
  const transaction = await metaplex.rpc.getTransaction(signature);
  const firstInstructionData =
    transaction?.message.instructions[0].data ?? new Uint8Array();
  const firstInstructionDataString = metaplex.serializer
    .string()
    .deserialize(firstInstructionData)[0];
  t.is(firstInstructionDataString, 'Hello world!');
});
