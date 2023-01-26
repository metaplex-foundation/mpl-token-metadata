import { WrappedInstruction } from '@lorisleiva/js-core';
import { TokenStandard } from '../generated';
import { createFungible, CreateFungibleArgs } from './createFungible';

// Inputs.
export type CreateFungibleAssetArgs = Omit<CreateFungibleArgs, 'tokenStandard'>;

export const createFungibleAsset = (
  context: Parameters<typeof createFungible>[0],
  input: CreateFungibleAssetArgs
): WrappedInstruction =>
  createFungible(context, {
    ...input,
    tokenStandard: TokenStandard.FungibleAsset,
  });
