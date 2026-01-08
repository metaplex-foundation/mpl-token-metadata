/**
 * Helper functions for creating NFTs and tokens
 *
 * These functions provide convenient wrappers around createV1 and mintV1
 * for common token creation patterns.
 */

import type { Address } from '@solana/addresses';
import type { Instruction } from '@solana/kit';
import type { TransactionSigner } from '@solana/signers';
import {
  getCreateV1InstructionAsync,
  getMintV1InstructionAsync,
  type CreateV1AsyncInput,
  type MintV1AsyncInput,
} from '../generated/instructions';
import { TokenStandard } from '../generated/types';

/**
 * Input for createAndMint helper
 * Combines createV1 and mintV1 parameters
 */
export type CreateAndMintInput = CreateV1AsyncInput &
  Omit<MintV1AsyncInput, 'mint' | 'metadata'>;

/**
 * Creates and mints a token in one step
 *
 * This helper combines createV1 and mintV1 instructions, returning both
 * so they can be sent in a single transaction.
 *
 * @param input - Combined create and mint parameters
 * @returns Array containing [createInstruction, mintInstruction]
 *
 * @example
 * ```ts
 * const [createIx, mintIx] = await createAndMint({
 *   mint,
 *   authority,
 *   payer,
 *   name: 'My NFT',
 *   uri: 'https://example.com/nft.json',
 *   sellerFeeBasisPoints: 500,
 *   tokenStandard: TokenStandard.NonFungible,
 *   amount: 1,
 *   tokenOwner: owner.address,
 * });
 *
 * await sendAndConfirm(rpc, rpcSubscriptions, [createIx, mintIx], [mint, authority]);
 * ```
 */
export async function createAndMint(
  input: CreateAndMintInput
): Promise<[Instruction, Instruction]> {
  const createInstruction = await getCreateV1InstructionAsync(input);

  // Extract mint address - it could be a TransactionSigner or an Address
  const mintAddress =
    typeof input.mint === 'object' && 'address' in input.mint
      ? (input.mint.address as Address)
      : (input.mint as Address);

  const mintInstruction = await getMintV1InstructionAsync({
    ...input,
    mint: mintAddress,
    tokenStandard: input.tokenStandard!,
  });

  return [createInstruction, mintInstruction];
}

/**
 * Creates and mints a NonFungible NFT
 *
 * Convenience wrapper that sets tokenStandard to NonFungible and amount to 1.
 *
 * @param input - Create parameters without tokenStandard and amount
 * @returns Array containing [createInstruction, mintInstruction]
 *
 * @example
 * ```ts
 * const [createIx, mintIx] = await createNft({
 *   mint,
 *   authority,
 *   payer,
 *   name: 'My NFT',
 *   uri: 'https://example.com/nft.json',
 *   sellerFeeBasisPoints: 500,
 *   tokenOwner: owner.address,
 * });
 * ```
 */
export async function createNft(
  input: Omit<CreateAndMintInput, 'amount' | 'tokenStandard'>
): Promise<[Instruction, Instruction]> {
  return createAndMint({
    ...input,
    tokenStandard: TokenStandard.NonFungible,
    amount: 1,
  });
}

/**
 * Creates and mints a ProgrammableNonFungible NFT
 *
 * Convenience wrapper that sets tokenStandard to ProgrammableNonFungible and amount to 1.
 *
 * @param input - Create parameters without tokenStandard and amount
 * @returns Array containing [createInstruction, mintInstruction]
 *
 * @example
 * ```ts
 * const [createIx, mintIx] = await createProgrammableNft({
 *   mint,
 *   authority,
 *   payer,
 *   name: 'My PNFT',
 *   uri: 'https://example.com/pnft.json',
 *   sellerFeeBasisPoints: 500,
 *   tokenOwner: owner.address,
 * });
 * ```
 */
export async function createProgrammableNft(
  input: Omit<CreateAndMintInput, 'amount' | 'tokenStandard'>
): Promise<[Instruction, Instruction]> {
  return createAndMint({
    ...input,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    amount: 1,
  });
}

/**
 * Creates a Fungible token (without minting)
 *
 * Use this for fungible tokens where you'll mint the supply later.
 *
 * @param input - Create parameters without tokenStandard
 * @returns Create instruction
 *
 * @example
 * ```ts
 * const createIx = await createFungible({
 *   mint,
 *   authority,
 *   payer,
 *   name: 'My Token',
 *   uri: 'https://example.com/token.json',
 *   sellerFeeBasisPoints: 100,
 * });
 *
 * // Later, mint tokens separately
 * const mintIx = await getMintV1InstructionAsync({
 *   mint: mint.address,
 *   amount: 1000000,
 *   tokenStandard: TokenStandard.Fungible,
 *   // ...
 * });
 * ```
 */
export async function createFungible(
  input: Omit<CreateV1AsyncInput, 'tokenStandard'>
): Promise<Instruction> {
  return getCreateV1InstructionAsync({
    ...input,
    tokenStandard: TokenStandard.Fungible,
  });
}

/**
 * Creates a FungibleAsset token (without minting)
 *
 * Use this for fungible assets where you'll mint the supply later.
 *
 * @param input - Create parameters without tokenStandard
 * @returns Create instruction
 *
 * @example
 * ```ts
 * const createIx = await createFungibleAsset({
 *   mint,
 *   authority,
 *   payer,
 *   name: 'My Asset',
 *   uri: 'https://example.com/asset.json',
 *   sellerFeeBasisPoints: 200,
 * });
 * ```
 */
export async function createFungibleAsset(
  input: Omit<CreateV1AsyncInput, 'tokenStandard'>
): Promise<Instruction> {
  return getCreateV1InstructionAsync({
    ...input,
    tokenStandard: TokenStandard.FungibleAsset,
  });
}
