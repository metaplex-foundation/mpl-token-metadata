import { none, Option, some } from '@solana/kit';
import {
  CollectionDetailsArgs,
  CreatorArgs,
  PrintSupplyArgs,
  TokenStandard,
  collectionDetails,
  printSupply,
} from '../generated';
import { isNonFungible } from 'src/digitalAsset';
import { expectAddress, expectSome } from 'src/generated/shared';

const METADATA_SIZE: number = 607;

const MASTER_EDITION_SIZE: number = 20;

export const resolveCollectionDetails = (
  contextOrScope: any,
  accountsOrUnused?: any,
  argsOrUnused?: any,
  ...rest: any[]
): Option<CollectionDetailsArgs> => {
  // Handle both direct arguments and resolverScope
  const args = argsOrUnused?.isCollection !== undefined 
    ? argsOrUnused 
    : contextOrScope?.args;
  
  return args?.isCollection
    ? some(collectionDetails('V2', { padding: new Uint8Array(8) }))
    : none();
};

export const resolveIsNonFungible = (
  contextOrScope: any,
  accountsOrUnused?: any,
  argsOrUnused?: any,
  ...rest: any[]
): boolean => {
  const args = argsOrUnused?.tokenStandard !== undefined 
    ? argsOrUnused 
    : contextOrScope?.args;
  
  return isNonFungible(expectSome(args?.tokenStandard));
};

export const resolveDecimals = (
  contextOrScope: any,
  accountsOrUnused?: any,
  argsOrUnused?: any,
  ...rest: any[]
): Option<number> => {
  const args = argsOrUnused?.tokenStandard !== undefined 
    ? argsOrUnused 
    : contextOrScope?.args;
  
  return isNonFungible(expectSome(args?.tokenStandard)) ? none() : some(0);
};

export const resolvePrintSupply = (
  contextOrScope: any,
  accountsOrUnused?: any,
  argsOrUnused?: any,
  ...rest: any[]
): Option<PrintSupplyArgs> => {
  const args = argsOrUnused?.tokenStandard !== undefined 
    ? argsOrUnused 
    : contextOrScope?.args;
  
  return isNonFungible(expectSome(args?.tokenStandard))
    ? some(printSupply('Zero'))
    : none();
};

export const resolveCreators = (
  contextOrScope: any,
  accountsOrUnused?: any,
  ...rest: any[]
): Option<CreatorArgs[]> => {
  const accounts = accountsOrUnused || contextOrScope?.accounts;
  
  if (!accounts?.authority?.value) return none();
  
  return some([
    {
      address: accounts.authority.value,
      share: 100,
      verified: true,
    },
  ] as CreatorArgs[]);
};

// export const resolveCreateV1Bytes = (
//   context: any,
//   accounts: any,
//   args: { tokenStandard?: TokenStandard },
//   ...rest: any[]
// ): number => {
//   const base = getMintSize() + METADATA_SIZE + 2 * ACCOUNT_HEADER_SIZE;
//   if (isNonFungible(expectSome(args.tokenStandard))) {
//     return base + MASTER_EDITION_SIZE + ACCOUNT_HEADER_SIZE;
//   }
//   return base;
// };

// export const resolveOptionalTokenOwner = (
//   context: Pick<Context, 'identity'>,
//   accounts: ResolvedAccountsWithIndices,
//   ...rest: any[]
// ) =>
//   accounts.token.value
//     ? { value: null }
//     : { value: context.identity.publicKey };

export const resolveIsNonFungibleOrIsMintSigner = (
  contextOrScope: any,
  accountsOrUnused?: any,
  argsOrUnused?: any,
  ...rest: any[]
): boolean => {
  const args = argsOrUnused?.tokenStandard !== undefined 
    ? argsOrUnused 
    : contextOrScope?.args;
  
  const accounts = accountsOrUnused || contextOrScope?.accounts;
  
  return isNonFungible(expectSome(args?.tokenStandard)) ||
    (accounts?.mint?.value && accounts.mint.value.__kind === 'signer');
};
