import { Address } from '@solana/kit';
import { findEditionMarkerPda } from '../generated';

export async function findEditionMarkerFromEditionNumberPda(
  seeds: {
    /** The address of the mint account */
    mint: Address;
    /** The edition number. */
    editionNumber: number | bigint;
  },
  config?: { programAddress?: Address }
): Promise<ReturnType<typeof findEditionMarkerPda>> {
  return findEditionMarkerPda({
    mint: seeds.mint,
    editionMarker: (BigInt(seeds.editionNumber) / 248n).toString(10),
  }, config);
}
