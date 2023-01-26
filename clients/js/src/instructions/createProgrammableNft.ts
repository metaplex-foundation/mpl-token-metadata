import { none, publicKey, some, WrappedInstruction } from '@lorisleiva/js-core';
import {
  collectionDetails,
  findMasterEditionPda,
  printSupply,
  PrintSupplyArgs,
  TokenStandard,
} from '../generated';
import { createHelper, CreateHelperArgs } from './_createHelper';

// Inputs.
export type CreateProgrammableNftArgs = Omit<
  CreateHelperArgs,
  'tokenStandard' | 'collectionDetails' | 'decimals' | 'printSupply'
> & {
  /** @defaultValue `false` */
  isCollection?: boolean;
  /** @defaultValue `printSupply('Zero')` */
  printSupply?: PrintSupplyArgs;
};

export const createProgrammableNft = (
  context: Parameters<typeof createHelper>[0],
  input: CreateProgrammableNftArgs
): WrappedInstruction =>
  createHelper(context, {
    masterEdition: findMasterEditionPda(context, {
      mint: publicKey(input.mint),
    }),
    ...input,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    collectionDetails: input.isCollection
      ? some(collectionDetails('V1', { size: 0 }))
      : none(),
    decimals: none(),
    printSupply: some(input.printSupply ?? printSupply('Zero')),
  });
