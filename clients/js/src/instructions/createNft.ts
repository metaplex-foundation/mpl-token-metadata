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
export type CreateNftArgs = Omit<
  CreateHelperArgs,
  'tokenStandard' | 'collectionDetails' | 'decimals' | 'printSupply'
> & {
  /** @defaultValue `false` */
  isCollection?: boolean;
  /** @defaultValue `printSupply('Zero')` */
  printSupply?: PrintSupplyArgs;
  /** @defaultValue `TokenStandard.NonFungible` */
  tokenStandard?: TokenStandard;
};

export const createNft = (
  context: Parameters<typeof createHelper>[0],
  input: CreateNftArgs
): WrappedInstruction =>
  createHelper(context, {
    masterEdition: findMasterEditionPda(context, {
      mint: publicKey(input.mint),
    }),
    ...input,
    tokenStandard: input.tokenStandard ?? TokenStandard.NonFungible,
    collectionDetails: input.isCollection
      ? some(collectionDetails('V1', { size: 0 }))
      : none(),
    decimals: none(),
    printSupply: some(input.printSupply ?? printSupply('Zero')),
  });
