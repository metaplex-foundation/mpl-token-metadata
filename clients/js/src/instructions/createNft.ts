import {
  Amount,
  none,
  Option,
  publicKey,
  PublicKey,
  some,
  WrappedInstruction,
} from '@lorisleiva/js-core';
import {
  Collection,
  collectionDetails,
  printSupply,
  CreateInstructionAccounts,
  Creator,
  create,
  createArgs,
  PrintSupplyArgs,
  TokenStandard,
  UsesArgs,
  findMasterEditionPda,
} from '../generated';

// Inputs.
export type CreateNftArgs = CreateInstructionAccounts & {
  /** @defaultValue `false` */
  isCollection?: boolean;
  name: string;
  symbol?: string;
  uri: string;
  sellerFeeBasisPoints: Amount<'%', 2>;
  creators?: Array<Creator>;
  primarySaleHappened?: boolean;
  isMutable?: boolean;
  collection?: Option<Collection>;
  uses?: Option<UsesArgs>;
  ruleSet?: Option<PublicKey>;
  printSupply?: PrintSupplyArgs;
};

export const createNft = (
  context: Parameters<typeof create>[0],
  input: CreateNftArgs
): WrappedInstruction => {
  const {
    isCollection = false,
    name,
    symbol,
    uri,
    sellerFeeBasisPoints,
    creators,
    primarySaleHappened,
    isMutable,
    collection,
    uses,
    ruleSet,
    printSupply: printSupplyArg = printSupply('Zero'),
    ...accounts
  } = input;
  return create(context, {
    masterEdition: findMasterEditionPda(context, {
      mint: publicKey(accounts.mint),
    }),
    ...accounts,
    createArgs: createArgs('V1', {
      name,
      symbol,
      uri,
      sellerFeeBasisPoints,
      creators: some(
        creators ?? [
          {
            address: accounts.updateAuthority ?? context.identity.publicKey,
            share: 100,
            verified: true,
          },
        ]
      ),
      primarySaleHappened,
      isMutable,
      tokenStandard: TokenStandard.NonFungible,
      collection,
      uses,
      collectionDetails: isCollection
        ? some(collectionDetails('V1', { size: 0 }))
        : none(),
      ruleSet,
      decimals: none(),
      printSupply: some(printSupplyArg),
    }),
  });
};
