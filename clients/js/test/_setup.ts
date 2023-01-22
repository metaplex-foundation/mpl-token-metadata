/* eslint-disable import/no-extraneous-dependencies */
import {
  createMetaplex as baseCreateMetaplex,
  generateSigner,
  Metaplex,
  Signer,
  transactionBuilder,
} from '@lorisleiva/js-test';
import { mplEssentials, createMint as baseCreateMint } from '../src';

export const createMetaplex = async () =>
  (await baseCreateMetaplex()).use(mplEssentials());

export const createMint = async (metaplex: Metaplex): Promise<Signer> => {
  const mint = generateSigner(metaplex);
  await transactionBuilder(metaplex)
    .add(baseCreateMint(metaplex, { mint }))
    .sendAndConfirm();
  return mint;
};
