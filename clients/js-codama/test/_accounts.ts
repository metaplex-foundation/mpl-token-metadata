/**
 * Minimal SPL Token account fetchers for tests
 *
 * NOTE: These should be replaced with @solana-program/token once it's
 * updated to support @solana/* v5.x dependencies
 */

import type { Address } from '@solana/addresses';
import { getAddressDecoder } from '@solana/addresses';
import type { Rpc } from '@solana/rpc';
import type { SolanaRpcApi } from '@solana/rpc';
import { fetchEncodedAccount } from '@solana/accounts';
import {
  getU64Decoder,
  getStructDecoder,
  getU8Decoder,
  getU32Decoder,
  getBooleanDecoder,
} from '@solana/codecs';

// Mint account data structure (SPL Token Mint layout)
const getMintDecoder = () => getStructDecoder([
  ['mintAuthorityOption', getU32Decoder()],
  ['mintAuthority', getAddressDecoder()],
  ['supply', getU64Decoder()],
  ['decimals', getU8Decoder()],
  ['isInitialized', getBooleanDecoder()],
  ['freezeAuthorityOption', getU32Decoder()],
  ['freezeAuthority', getAddressDecoder()],
]);

// Token account data structure (SPL Token Account layout)
const getTokenDecoder = () => getStructDecoder([
  ['mint', getAddressDecoder()],
  ['owner', getAddressDecoder()],
  ['amount', getU64Decoder()],
]);

export async function fetchMint(rpc: Rpc<SolanaRpcApi>, address: Address) {
  const account = await fetchEncodedAccount(rpc, address);
  if (!account.exists) {
    throw new Error(`Mint account not found: ${address}`);
  }
  const decoded = getMintDecoder().decode(account.data);
  return {
    address,
    supply: decoded.supply,
    decimals: decoded.decimals,
  };
}

export async function fetchToken(rpc: Rpc<SolanaRpcApi>, address: Address) {
  const account = await fetchEncodedAccount(rpc, address);
  if (!account.exists) {
    throw new Error(`Token account not found: ${address}`);
  }
  const decoded = getTokenDecoder().decode(account.data);
  return {
    address,
    amount: decoded.amount,
  };
}
