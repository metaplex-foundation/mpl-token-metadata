/**
 * Digital Asset with Token utilities
 *
 * These functions extend DigitalAsset to include token account and token record data.
 * This is useful when working with owned NFTs or tokens where you need information
 * about a specific token account holding the asset.
 */

import type { Address } from '@solana/addresses';
import type {
  EncodedAccount,
  FetchAccountConfig,
  Rpc,
} from '@solana/kit';
import {
  assertAccountExists,
  fetchEncodedAccounts,
  decodeAccount,
} from '@solana/kit';
import type { Token } from '@solana-program/token';
import { getTokenDecoder } from '@solana-program/token';
import {
  deserializeDigitalAsset,
  type DigitalAsset,
} from './digitalAsset';
import {
  decodeTokenRecord,
  type TokenRecord,
} from '../generated/accounts/tokenRecord';
import {
  findMetadataPda,
  findMasterEditionPda,
  findTokenRecordPda,
} from '../generated/pdas';
import { findAssociatedTokenPda } from './pdas';

/**
 * A digital asset with token account information
 *
 * Extends DigitalAsset to include:
 * - token: The SPL token account data
 * - tokenRecord: Optional token record (for Programmable NFTs)
 */
export type DigitalAssetWithToken<TMint extends string = string> = DigitalAsset<TMint> & {
  /** The SPL token account */
  token: Token;
  /** The token record (for Programmable NFTs) */
  tokenRecord?: TokenRecord;
};

/**
 * Fetches a digital asset along with a specific token account
 *
 * This function fetches the mint, metadata, edition, token account, and
 * token record (if applicable) in a single RPC call.
 *
 * @param rpc - The RPC client
 * @param mint - The mint address
 * @param tokenAddress - The token account address
 * @param config - Optional fetch configuration
 * @returns The digital asset with token data
 *
 * @example
 * ```ts
 * const asset = await fetchDigitalAssetWithToken(rpc, mintAddress, tokenAddress);
 * console.log('Owner:', asset.token.owner);
 * console.log('Amount:', asset.token.amount);
 * ```
 */
export async function fetchDigitalAssetWithToken<TMint extends string = string>(
  rpc: Rpc<any>,
  mint: Address<TMint>,
  tokenAddress: Address,
  config?: FetchAccountConfig
): Promise<DigitalAssetWithToken<TMint>> {
  const [metadataAddress] = await findMetadataPda({ mint });
  const [editionAddress] = await findMasterEditionPda({ mint });
  const [tokenRecordAddress] = await findTokenRecordPda({
    mint,
    token: tokenAddress,
  });

  const [
    mintAccount,
    metadataAccount,
    editionAccount,
    tokenAccount,
    tokenRecordAccount,
  ] = await fetchEncodedAccounts(
    rpc,
    [mint, metadataAddress, editionAddress, tokenAddress, tokenRecordAddress],
    config
  );

  assertAccountExists(mintAccount);
  assertAccountExists(metadataAccount);
  assertAccountExists(tokenAccount);

  return deserializeDigitalAssetWithToken(
    mint,
    mintAccount,
    metadataAccount,
    tokenAccount,
    editionAccount.exists ? editionAccount : undefined,
    tokenRecordAccount.exists ? tokenRecordAccount : undefined
  );
}

/**
 * Fetches a digital asset with its associated token account
 *
 * This is a convenience function that automatically derives the associated
 * token account (ATA) for the given owner.
 *
 * @param rpc - The RPC client
 * @param mint - The mint address
 * @param owner - The token owner address
 * @param config - Optional fetch configuration
 * @returns The digital asset with token data
 *
 * @example
 * ```ts
 * const asset = await fetchDigitalAssetWithAssociatedToken(
 *   rpc,
 *   mintAddress,
 *   walletAddress
 * );
 * console.log('Balance:', asset.token.amount);
 * ```
 */
export async function fetchDigitalAssetWithAssociatedToken<
  TMint extends string = string
>(
  rpc: Rpc<any>,
  mint: Address<TMint>,
  owner: Address,
  config?: FetchAccountConfig
): Promise<DigitalAssetWithToken<TMint>> {
  const [tokenAddress] = await findAssociatedTokenPda({ mint, owner });
  return fetchDigitalAssetWithToken(rpc, mint, tokenAddress, config);
}

/**
 * Deserializes a digital asset with token from raw account data
 *
 * This is a low-level function that takes encoded account data and decodes it
 * into a DigitalAssetWithToken object.
 *
 * @param mintAddress - The mint address
 * @param mintAccount - The encoded mint account
 * @param metadataAccount - The encoded metadata account
 * @param tokenAccount - The encoded token account
 * @param editionAccount - The encoded edition account (optional)
 * @param tokenRecordAccount - The encoded token record account (optional)
 * @returns The deserialized digital asset with token
 */
export function deserializeDigitalAssetWithToken<TMint extends string = string>(
  mintAddress: Address<TMint>,
  mintAccount: EncodedAccount,
  metadataAccount: EncodedAccount,
  tokenAccount: EncodedAccount,
  editionAccount?: EncodedAccount,
  tokenRecordAccount?: EncodedAccount
): DigitalAssetWithToken<TMint> {
  // Deserialize base digital asset
  const digitalAsset = deserializeDigitalAsset(
    mintAddress,
    mintAccount,
    metadataAccount,
    editionAccount
  );

  // Decode token account
  const token = decodeAccount(tokenAccount, getTokenDecoder());

  // Decode token record if present
  let tokenRecord: TokenRecord | undefined;
  if (tokenRecordAccount) {
    const decoded = decodeTokenRecord(tokenRecordAccount);
    tokenRecord = decoded.data;
  }

  return {
    ...digitalAsset,
    token: token.data,
    tokenRecord,
  };
}
