/**
 * Resolver functions for Codama-generated instructions
 * These are called by the generated instruction builders to compute default values
 */

import type { Address } from '@solana/addresses';
import type { OptionOrNullable } from '@solana/kit';
import type { TokenStandard } from '../generated/types/tokenStandard';
import type { CollectionDetailsArgs } from '../generated/types/collectionDetails';
import type { PrintSupplyArgs } from '../generated/types/printSupply';
import type { CreatorArgs } from '../generated/types/creator';
import type { ResolvedAccount } from '../generated/shared';
import { expectAddress } from '../generated/shared';

// Constants for size calculations
const MINT_SIZE = 82;
const METADATA_SIZE = 607;
const MASTER_EDITION_SIZE = 20;
const ACCOUNT_HEADER_SIZE = 128;

/**
 * Helper to check if a token standard is non-fungible
 */
export function isNonFungible(tokenStandard: TokenStandard): boolean {
  // TokenStandard enum: NonFungible=0, FungibleAsset=1, Fungible=2, NonFungibleEdition=3, ProgrammableNonFungible=4
  return (
    tokenStandard === 0 || // TokenStandard.NonFungible
    tokenStandard === 3 || // TokenStandard.NonFungibleEdition
    tokenStandard === 4    // TokenStandard.ProgrammableNonFungible
  );
}

/**
 * Accounts object passed to resolver functions
 * Contains resolved account information
 */
interface ResolverAccounts {
  authority?: ResolvedAccount;
  token?: ResolvedAccount;
  mint?: ResolvedAccount & { isSigner?: boolean };
  [key: string]: ResolvedAccount | undefined;
}

/**
 * Arguments with token standard
 */
interface TokenStandardArgs {
  tokenStandard?: TokenStandard;
}

/**
 * Arguments with isCollection flag
 */
interface IsCollectionArgs {
  isCollection?: boolean;
}

/**
 * Resolver scope object containing all context for resolvers
 * This is the single parameter passed to resolver functions
 */
interface ResolverScope<TArgs = unknown> {
  programAddress?: Address;
  accounts: ResolverAccounts;
  args: TArgs;
}

/**
 * Resolve collection details based on isCollection flag
 */
export function resolveCollectionDetails(
  scope: ResolverScope<IsCollectionArgs>
): OptionOrNullable<CollectionDetailsArgs> {
  if (scope.args.isCollection) {
    return {
      __kind: 'V2',
      padding: new Uint8Array(8),
    };
  }
  return null;
}

/**
 * Check if token standard is non-fungible
 */
export function resolveIsNonFungible(
  scope: ResolverScope<TokenStandardArgs>
): boolean {
  if (scope.args.tokenStandard === undefined) {
    throw new Error('tokenStandard is required');
  }
  return isNonFungible(scope.args.tokenStandard);
}

/**
 * Resolve decimals based on token standard
 */
export function resolveDecimals(
  scope: ResolverScope<TokenStandardArgs>
): OptionOrNullable<number> {
  if (scope.args.tokenStandard === undefined) {
    throw new Error('tokenStandard is required');
  }
  return isNonFungible(scope.args.tokenStandard) ? null : 0;
}

/**
 * Resolve print supply based on token standard
 */
export function resolvePrintSupply(
  scope: ResolverScope<TokenStandardArgs>
): OptionOrNullable<PrintSupplyArgs> {
  if (scope.args.tokenStandard === undefined) {
    throw new Error('tokenStandard is required');
  }
  return isNonFungible(scope.args.tokenStandard)
    ? { __kind: 'Zero' }
    : null;
}

/**
 * Resolve creators from authority account
 */
export function resolveCreators(
  scope: ResolverScope<unknown>
): OptionOrNullable<CreatorArgs[]> {
  const authorityAddress = expectAddress(scope.accounts.authority?.value);
  if (!authorityAddress) {
    throw new Error('authority account is required');
  }
  return [
    {
      address: authorityAddress,
      share: 100,
      verified: true,
    },
  ];
}

/**
 * Calculate byte delta for CreateV1 instruction
 */
export function resolveCreateV1Bytes(
  scope: ResolverScope<TokenStandardArgs>
): number {
  const base = MINT_SIZE + METADATA_SIZE + 2 * ACCOUNT_HEADER_SIZE;
  if (scope.args.tokenStandard !== undefined && isNonFungible(scope.args.tokenStandard)) {
    return base + MASTER_EDITION_SIZE + ACCOUNT_HEADER_SIZE;
  }
  return base;
}

/**
 * Resolve optional token owner
 * Returns the authority's address as the default token owner
 */
export function resolveOptionalTokenOwner(
  scope: ResolverScope<unknown>
): { value: Address | null } {
  // If token is provided, return null (owner will be derived from token account)
  // Otherwise, use the authority's address as the owner
  const authorityAddress = expectAddress(scope.accounts.authority?.value);
  return authorityAddress ? { value: authorityAddress } : { value: null };
}

/**
 * Check if token is non-fungible or mint is a signer
 */
export function resolveIsNonFungibleOrIsMintSigner(
  scope: ResolverScope<TokenStandardArgs>
): boolean {
  if (scope.args.tokenStandard !== undefined && isNonFungible(scope.args.tokenStandard)) {
    return true;
  }
  // Check if mint is a TransactionSigner (has an 'address' property, indicating it's an object/signer)
  // rather than just an Address string
  const mintValue = scope.accounts.mint?.value;
  return mintValue != null && typeof mintValue === 'object' && 'address' in mintValue;
}
