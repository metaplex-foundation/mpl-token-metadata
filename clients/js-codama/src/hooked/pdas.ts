/**
 * Manual PDA implementations for external programs
 * These are not auto-generated and supplement the Codama-generated PDAs
 */

import type { Address, ProgramDerivedAddress } from '@solana/addresses';
import { getAddressEncoder, getAddressDecoder, getProgramDerivedAddress } from '@solana/addresses';
import { getU64Encoder, getU64Decoder } from '@solana/codecs';

/**
 * SPL Token Program ID (original SPL Token program)
 */
export const SPL_TOKEN_PROGRAM_ADDRESS =
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address;

/**
 * SPL Token 2022 Program ID (Token Extensions program)
 */
export const SPL_TOKEN_2022_PROGRAM_ADDRESS =
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb' as Address;

/**
 * SPL Associated Token Program ID
 */
export const SPL_ASSOCIATED_TOKEN_PROGRAM_ADDRESS =
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' as Address;

/**
 * Find Associated Token Account PDA
 * This is a standard SPL Token PDA for associated token accounts
 *
 * @param owner - The wallet address that owns the token account
 * @param mint - The mint address of the token
 * @returns The PDA address and bump seed
 */
export async function findAssociatedTokenPda(params: {
  owner: Address;
  mint: Address;
  tokenProgram?: Address;
}): Promise<ProgramDerivedAddress> {
  const tokenProgram = params.tokenProgram ?? SPL_TOKEN_PROGRAM_ADDRESS;

  return await getProgramDerivedAddress({
    programAddress: SPL_ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
    seeds: [
      getAddressEncoder().encode(params.owner),
      getAddressEncoder().encode(tokenProgram),
      getAddressEncoder().encode(params.mint),
    ],
  });
}

/**
 * Find Edition Marker PDA from edition number
 * This computes which edition marker PDA holds the data for a specific edition number
 *
 * @param mint - The mint address of the master edition
 * @param editionNumber - The edition number (number or bigint)
 * @returns The PDA address and bump seed
 */
export async function findEditionMarkerFromEditionNumberPda(params: {
  mint: Address;
  editionNumber: number | bigint;
  programAddress?: Address;
}): Promise<ProgramDerivedAddress> {
  const programAddress = params.programAddress ??
    ('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s' as Address);

  // Convert number to bigint if needed
  const editionNum = typeof params.editionNumber === 'number'
    ? BigInt(params.editionNumber)
    : params.editionNumber;

  // Edition markers are grouped in sets of 248
  // Calculate which marker this edition belongs to
  const editionMarkerNumber = editionNum / 248n;

  const textEncoder = new TextEncoder();

  return await getProgramDerivedAddress({
    programAddress,
    seeds: [
      textEncoder.encode('metadata'),
      getAddressEncoder().encode(programAddress),
      getAddressEncoder().encode(params.mint),
      textEncoder.encode('edition'),
      getU64Encoder().encode(editionMarkerNumber),
    ],
  });
}
