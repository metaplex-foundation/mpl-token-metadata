import {
  publicKey,
  transactionBuilder,
  TransactionBuilder,
} from '@metaplex-foundation/umi';
import { TokenStandard, createV1, mintV1 } from './generated';

export const createAndMint = (
  context: Parameters<typeof createV1>[0],
  input: Parameters<typeof createV1>[1] &
    Omit<Parameters<typeof mintV1>[1], 'mint'>
): TransactionBuilder =>
  transactionBuilder()
    .add(createV1(context, input))
    .add(mintV1(context, { ...input, mint: publicKey(input.mint) }));

export const createNft = (
  context: Parameters<typeof createAndMint>[0],
  input: Omit<Parameters<typeof createAndMint>[1], 'amount' | 'tokenStandard'>
): TransactionBuilder =>
  createAndMint(context, {
    ...input,
    tokenStandard: TokenStandard.NonFungible,
    amount: 1,
  });

export const createProgrammableNft = (
  context: Parameters<typeof createAndMint>[0],
  input: Omit<Parameters<typeof createAndMint>[1], 'amount' | 'tokenStandard'>
): TransactionBuilder =>
  createAndMint(context, {
    ...input,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    amount: 1,
  });

export const createFungible = (
  context: Parameters<typeof createV1>[0],
  input: Omit<Parameters<typeof createV1>[1], 'tokenStandard'>
): TransactionBuilder =>
  createV1(context, {
    ...input,
    tokenStandard: TokenStandard.Fungible,
  });

export const createFungibleAsset = (
  context: Parameters<typeof createV1>[0],
  input: Omit<Parameters<typeof createV1>[1], 'tokenStandard'>
): TransactionBuilder =>
  createV1(context, {
    ...input,
    tokenStandard: TokenStandard.FungibleAsset,
  });
