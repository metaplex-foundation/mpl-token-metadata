import { WrappedInstruction } from '@lorisleiva/js-core';
import { TokenStandard } from '../generated';
import { createNft, CreateNftArgs } from './createNft';

// Inputs.
export type CreateProgrammableNftArgs = Omit<CreateNftArgs, 'tokenStandard'>;

export const createProgrammableNft = (
  context: Parameters<typeof createNft>[0],
  input: CreateProgrammableNftArgs
): WrappedInstruction =>
  createNft(context, {
    ...input,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });
