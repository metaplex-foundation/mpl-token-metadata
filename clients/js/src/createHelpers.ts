import { publicKey, WrappedInstruction } from '@metaplex-foundation/umi-core';
import { TokenStandard } from './generated';
import {
  createV1,
  CreateV1InstructionInput,
  mintV1,
  MintV1InstructionInput,
} from './instructions';

export const createAndMint = (
  context: Parameters<typeof createV1>[0],
  input: CreateV1InstructionInput & Omit<MintV1InstructionInput, 'mint'>
): WrappedInstruction[] => [
  createV1(context, input),
  mintV1(context, { ...input, mint: publicKey(input.mint) }),
];

export const createNft = (
  context: Parameters<typeof createAndMint>[0],
  input: Omit<Parameters<typeof createAndMint>[1], 'amount' | 'tokenStandard'>
): WrappedInstruction[] =>
  createAndMint(context, {
    ...input,
    tokenStandard: TokenStandard.NonFungible,
    amount: 1,
  });

export const createProgrammableNft = (
  context: Parameters<typeof createAndMint>[0],
  input: Omit<Parameters<typeof createAndMint>[1], 'amount' | 'tokenStandard'>
): WrappedInstruction[] =>
  createAndMint(context, {
    ...input,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    amount: 1,
  });

export const createFungible = (
  context: Parameters<typeof createV1>[0],
  input: Omit<Parameters<typeof createV1>[1], 'tokenStandard'>
): WrappedInstruction =>
  createV1(context, {
    ...input,
    tokenStandard: TokenStandard.Fungible,
  });

export const createFungibleAsset = (
  context: Parameters<typeof createV1>[0],
  input: Omit<Parameters<typeof createV1>[1], 'tokenStandard'>
): WrappedInstruction =>
  createV1(context, {
    ...input,
    tokenStandard: TokenStandard.FungibleAsset,
  });
