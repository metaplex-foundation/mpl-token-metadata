import {
  ACCOUNT_HEADER_SIZE,
  none,
  publicKey,
  some,
  WrappedInstruction,
} from '@lorisleiva/js-core';
import { findMasterEditionPda, TokenStandard } from '../generated';
import { createHelper, CreateHelperArgs } from './_createHelper';

// Inputs.
export type CreateFungibleArgs = Omit<
  CreateHelperArgs,
  'tokenStandard' | 'collectionDetails' | 'decimals' | 'printSupply'
> & {
  /** @defaultValue `TokenStandard.Fungible` */
  tokenStandard?: TokenStandard;
  /** @defaultValue `0` */
  decimals?: number;
};

export const createFungible = (
  context: Parameters<typeof createHelper>[0],
  input: CreateFungibleArgs
): WrappedInstruction => ({
  ...createHelper(context, {
    masterEdition: findMasterEditionPda(context, {
      mint: publicKey(input.mint),
    }),
    ...input,
    tokenStandard: input.tokenStandard ?? TokenStandard.Fungible,
    collectionDetails: none(),
    decimals: some(input.decimals ?? 0),
    printSupply: none(),
  }),
  bytesCreatedOnChain:
    82 + // Mint account.
    679 + // Metadata account.
    2 * ACCOUNT_HEADER_SIZE, // 2 account headers.
});
