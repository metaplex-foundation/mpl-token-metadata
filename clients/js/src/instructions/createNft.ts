import {
  none,
  Option,
  publicKey,
  some,
  WrappedInstruction,
} from '@lorisleiva/js-core';
import {
  collectionDetails,
  createV1,
  Creator,
  findMasterEditionPda,
  printSupply,
  PrintSupplyArgs,
  TokenStandard,
} from '../generated';

// Inputs.
export type CreateNftArgs = Omit<
  Parameters<typeof createV1>[1],
  | 'tokenStandard'
  | 'collectionDetails'
  | 'decimals'
  | 'printSupply'
  | 'creators'
> & {
  /** @defaultValue `false` */
  isCollection?: boolean;
  /** @defaultValue `printSupply('Zero')` */
  printSupply?: PrintSupplyArgs;
  /** @defaultValue `TokenStandard.NonFungible` */
  tokenStandard?: TokenStandard;
  /** @defaultValue Defaults to using the update authority as the only creator with 100% shares. */
  creators?: Option<Array<Creator>>;
};

export const createNft = (
  context: Parameters<typeof createV1>[0],
  input: CreateNftArgs
): WrappedInstruction =>
  createV1(context, {
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
    creators:
      input.creators ??
      some([
        {
          address: input.updateAuthority ?? context.identity.publicKey,
          share: 100,
          verified: true,
        },
      ]),
  });
