import {
  Amount,
  Option,
  PublicKey,
  some,
  WrappedInstruction,
} from '@lorisleiva/js-core';
import {
  Collection,
  CreateInstructionAccounts,
  Creator,
  create,
  createArgs,
  PrintSupplyArgs,
  TokenStandard,
  UsesArgs,
  CollectionDetailsArgs,
} from '../generated';

// Inputs.
export type CreateHelperArgs = CreateInstructionAccounts & {
  name: string;
  symbol?: string;
  uri: string;
  sellerFeeBasisPoints: Amount<'%', 2>;
  creators?: Array<Creator>;
  primarySaleHappened?: boolean;
  isMutable?: boolean;
  tokenStandard: TokenStandard;
  collection?: Option<Collection>;
  uses?: Option<UsesArgs>;
  collectionDetails?: Option<CollectionDetailsArgs>;
  ruleSet?: Option<PublicKey>;
  decimals?: Option<number>;
  printSupply?: Option<PrintSupplyArgs>;
};

export const createHelper = (
  context: Parameters<typeof create>[0],
  input: CreateHelperArgs
): WrappedInstruction => {
  const {
    name,
    symbol,
    uri,
    sellerFeeBasisPoints,
    creators,
    primarySaleHappened,
    isMutable,
    tokenStandard,
    collection,
    uses,
    collectionDetails,
    ruleSet,
    decimals,
    printSupply,
    ...accounts
  } = input;
  return create(context, {
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
      tokenStandard,
      collection,
      uses,
      collectionDetails,
      ruleSet,
      decimals,
      printSupply,
    }),
  });
};
