import {
  ACCOUNT_HEADER_SIZE,
  none,
  Option,
  publicKey,
  some,
  WrappedInstruction,
} from '@lorisleiva/js-core';
import { isFungible } from '../digitalAsset';
import {
  CollectionDetails,
  collectionDetails,
  Creator,
  findMasterEditionPda,
  PrintSupply,
  printSupply,
  TokenStandard,
} from '../generated';
import {
  createV1 as baseCreateV1,
  CreateV1InstructionAccounts,
  CreateV1InstructionData,
  CreateV1InstructionArgs,
  getCreateV1InstructionDataSerializer,
} from '../generated/instructions/createV1';

export {
  CreateV1InstructionAccounts,
  CreateV1InstructionData,
  CreateV1InstructionArgs,
  getCreateV1InstructionDataSerializer,
};

// Inputs.
export type CreateV1InstructionInput = Omit<
  Parameters<typeof baseCreateV1>[1],
  'tokenStandard' | 'creators'
> & {
  /** @defaultValue `false` */
  isCollection?: boolean;
  /** @defaultValue `TokenStandard.NonFungible` */
  tokenStandard?: TokenStandard;
  /** @defaultValue Defaults to using the update authority as the only creator with 100% shares. */
  creators?: Option<Array<Creator>>;
};

export const createV1 = (
  context: Parameters<typeof baseCreateV1>[0],
  input: CreateV1InstructionInput
): WrappedInstruction => {
  const tokenStandard = input.tokenStandard ?? TokenStandard.NonFungible;
  const defaultCollectionDetails =
    input.isCollection ?? false
      ? some(collectionDetails('V1', { size: 0 }))
      : none<CollectionDetails>();
  const defaultMasterEdition = isFungible(tokenStandard)
    ? undefined
    : findMasterEditionPda(context, { mint: publicKey(input.mint) });
  const defaultPrintSupply = isFungible(tokenStandard)
    ? none<PrintSupply>()
    : some(printSupply('Zero'));
  const defaultDecimals = isFungible(tokenStandard) ? some(0) : none<number>();
  const defaultCreators = some([
    {
      address: input.updateAuthority ?? context.identity.publicKey,
      share: 100,
      verified: true,
    },
  ]);

  const ix = baseCreateV1(context, {
    masterEdition: input.masterEdition ?? defaultMasterEdition,
    ...input,
    tokenStandard,
    collectionDetails: input.collectionDetails ?? defaultCollectionDetails,
    decimals: input.decimals ?? defaultDecimals,
    printSupply: input.printSupply ?? defaultPrintSupply,
    creators: input.creators ?? defaultCreators,
  });

  if (isFungible(tokenStandard)) {
    ix.bytesCreatedOnChain =
      82 + // Mint account.
      679 + // Metadata account.
      2 * ACCOUNT_HEADER_SIZE; // 2 account headers.
  }

  return ix;
};
