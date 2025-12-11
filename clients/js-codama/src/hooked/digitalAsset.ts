/**
 * Digital Asset utilities for fetching and deserializing NFTs and tokens
 *
 * These functions provide a high-level API for working with digital assets
 * that combines mint, metadata, and edition account data into a single object.
 */

import type { Address } from '@solana/addresses';
import type {
  Account,
  EncodedAccount,
  FetchAccountConfig,
  FetchAccountsConfig,
  Rpc,
} from '@solana/kit';
import {
  assertAccountExists,
  fetchEncodedAccounts,
  decodeAccount,
} from '@solana/kit';
import type { Mint } from '@solana-program/token';
import { getMintDecoder } from '@solana-program/token';
import {
  fetchMetadata,
  decodeMetadata,
  type Metadata,
} from '../generated/accounts/metadata';
import {
  decodeMasterEdition,
  type MasterEdition,
} from '../generated/accounts/masterEdition';
import {
  decodeEdition,
  type Edition,
} from '../generated/accounts/edition';
import { findMetadataPda, findMasterEditionPda } from '../generated/pdas';
import { Key, getKeyDecoder } from '../generated/types';

/**
 * A digital asset combines mint, metadata, and optional edition data
 */
export type DigitalAsset<TMint extends string = string> = {
  /** The mint address (serves as the primary identifier) */
  address: Address<TMint>;
  /** The mint account data */
  mint: Mint;
  /** The metadata account data */
  metadata: Metadata;
  /** The edition account data (if present) */
  edition?:
    | ({ isOriginal: true } & MasterEdition)
    | ({ isOriginal: false } & Edition);
};

/**
 * Fetches a digital asset by its mint address
 *
 * This function fetches the mint, metadata, and edition accounts in a single RPC call
 * and combines them into a DigitalAsset object.
 *
 * @param rpc - The RPC client
 * @param mint - The mint address
 * @param config - Optional fetch configuration
 * @returns The digital asset
 *
 * @example
 * ```ts
 * const digitalAsset = await fetchDigitalAsset(rpc, mintAddress);
 * console.log(digitalAsset.metadata.name);
 * ```
 */
export async function fetchDigitalAsset<TMint extends string = string>(
  rpc: Rpc<any>,
  mint: Address<TMint>,
  config?: FetchAccountConfig
): Promise<DigitalAsset<TMint>> {
  const [metadataAddress] = await findMetadataPda({ mint });
  const [editionAddress] = await findMasterEditionPda({ mint });

  const [mintAccount, metadataAccount, editionAccount] = await fetchEncodedAccounts(
    rpc,
    [mint, metadataAddress, editionAddress],
    config
  );

  assertAccountExists(mintAccount);
  assertAccountExists(metadataAccount);

  return deserializeDigitalAsset(
    mint,
    mintAccount,
    metadataAccount,
    editionAccount.exists ? editionAccount : undefined
  );
}

/**
 * Fetches a digital asset by its metadata address
 *
 * This is useful when you have the metadata PDA but not the mint address.
 *
 * @param rpc - The RPC client
 * @param metadataAddress - The metadata account address
 * @param config - Optional fetch configuration
 * @returns The digital asset
 */
export async function fetchDigitalAssetByMetadata(
  rpc: Rpc<any>,
  metadataAddress: Address,
  config?: FetchAccountConfig
): Promise<DigitalAsset> {
  const metadata = await fetchMetadata(rpc, metadataAddress, config);
  return fetchDigitalAsset(rpc, metadata.data.mint, config);
}

/**
 * Fetches multiple digital assets by their mint addresses
 *
 * This function efficiently fetches all accounts in batches and combines them
 * into DigitalAsset objects. Failed fetches are silently skipped.
 *
 * @param rpc - The RPC client
 * @param mints - Array of mint addresses
 * @param config - Optional fetch configuration
 * @returns Array of digital assets (excluding any that failed to fetch)
 *
 * @example
 * ```ts
 * const assets = await fetchAllDigitalAsset(rpc, [mint1, mint2, mint3]);
 * assets.forEach(asset => console.log(asset.metadata.name));
 * ```
 */
export async function fetchAllDigitalAsset(
  rpc: Rpc<any>,
  mints: Address[],
  config?: FetchAccountsConfig
): Promise<DigitalAsset[]> {
  if (mints.length === 0) {
    return [];
  }

  // Build list of all accounts to fetch: [mint1, metadata1, edition1, mint2, metadata2, edition2, ...]
  const accountsToFetch: Address[] = [];

  for (const mint of mints) {
    const [metadataAddress] = await findMetadataPda({ mint });
    const [editionAddress] = await findMasterEditionPda({ mint });

    accountsToFetch.push(mint, metadataAddress, editionAddress);
  }

  // Fetch all accounts in one RPC call
  const allAccounts = await fetchEncodedAccounts(rpc, accountsToFetch, config);

  // Process accounts in groups of 3 (mint, metadata, edition)
  const digitalAssets: DigitalAsset[] = [];
  for (let i = 0; i < mints.length; i++) {
    const mintAccount = allAccounts[i * 3];
    const metadataAccount = allAccounts[i * 3 + 1];
    const editionAccount = allAccounts[i * 3 + 2];

    try {
      if (!mintAccount.exists || !metadataAccount.exists) {
        continue;
      }

      const asset = deserializeDigitalAsset(
        mints[i],
        mintAccount,
        metadataAccount,
        editionAccount.exists ? editionAccount : undefined
      );
      digitalAssets.push(asset);
    } catch (error) {
      // Skip assets that fail to deserialize
      continue;
    }
  }

  return digitalAssets;
}

/**
 * Deserializes a digital asset from raw account data
 *
 * This is a low-level function that takes encoded account data and decodes it
 * into a DigitalAsset object.
 *
 * @param mintAddress - The mint address
 * @param mintAccount - The encoded mint account
 * @param metadataAccount - The encoded metadata account
 * @param editionAccount - The encoded edition account (optional)
 * @returns The deserialized digital asset
 */
export function deserializeDigitalAsset<TMint extends string = string>(
  mintAddress: Address<TMint>,
  mintAccount: EncodedAccount,
  metadataAccount: EncodedAccount,
  editionAccount?: EncodedAccount
): DigitalAsset<TMint> {
  // Decode mint account
  const mint = decodeAccount(mintAccount, getMintDecoder()) as Account<Mint, TMint>;

  // Decode metadata account
  const metadataDecoded = decodeMetadata(metadataAccount);
  const metadata = metadataDecoded.data;

  // Build base digital asset
  const digitalAsset: DigitalAsset<TMint> = {
    address: mintAddress,
    mint: mint.data,
    metadata,
  };

  // Return early if no edition account
  if (!editionAccount) {
    return digitalAsset;
  }

  // Decode edition account based on its key
  const keyDecoder = getKeyDecoder();
  const editionKey = keyDecoder.decode(editionAccount.data)[0];

  let edition: DigitalAsset<TMint>['edition'];

  if (editionKey === Key.MasterEditionV1 || editionKey === Key.MasterEditionV2) {
    const masterEdition = decodeMasterEdition(editionAccount);
    edition = {
      isOriginal: true,
      ...masterEdition.data,
    };
  } else if (editionKey === Key.EditionV1) {
    const printEdition = decodeEdition(editionAccount);
    edition = {
      isOriginal: false,
      ...printEdition.data,
    };
  } else {
    // Invalid edition key - skip edition data
    return digitalAsset;
  }

  return { ...digitalAsset, edition };
}
