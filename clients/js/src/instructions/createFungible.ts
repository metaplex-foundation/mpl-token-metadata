import {
  ACCOUNT_HEADER_SIZE,
  none,
  Option,
  publicKey,
  some,
  WrappedInstruction,
} from '@lorisleiva/js-core';
import {
  createV1,
  Creator,
  findMasterEditionPda,
  TokenStandard,
} from '../generated';

// Inputs.
export type CreateFungibleArgs = Omit<
  Parameters<typeof createV1>[1],
  | 'tokenStandard'
  | 'collectionDetails'
  | 'decimals'
  | 'printSupply'
  | 'creators'
> & {
  /** @defaultValue `TokenStandard.Fungible` */
  tokenStandard?: TokenStandard;
  /** @defaultValue `0` */
  decimals?: number;
  /** @defaultValue Defaults to using the update authority as the only creator with 100% shares. */
  creators?: Option<Array<Creator>>;
};

export const createFungible = (
  context: Parameters<typeof createV1>[0],
  input: CreateFungibleArgs
): WrappedInstruction => ({
  ...createV1(context, {
    masterEdition: findMasterEditionPda(context, {
      mint: publicKey(input.mint),
    }),
    ...input,
    tokenStandard: input.tokenStandard ?? TokenStandard.Fungible,
    collectionDetails: none(),
    decimals: some(input.decimals ?? 0),
    printSupply: none(),
    creators:
      input.creators ??
      some([
        {
          address: input.updateAuthority ?? context.identity.publicKey,
          share: 100,
          verified: true,
        },
      ]),
  }),
  bytesCreatedOnChain:
    82 + // Mint account.
    679 + // Metadata account.
    2 * ACCOUNT_HEADER_SIZE, // 2 account headers.
});
