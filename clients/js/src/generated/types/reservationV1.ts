/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import { Context, PublicKey, Serializer } from '@metaplex-foundation/umi';

export type ReservationV1 = {
  address: PublicKey;
  spotsRemaining: number;
  totalSpots: number;
};

export type ReservationV1Args = ReservationV1;

export function getReservationV1Serializer(
  context: Pick<Context, 'serializer'>
): Serializer<ReservationV1Args, ReservationV1> {
  const s = context.serializer;
  return s.struct<ReservationV1>(
    [
      ['address', s.publicKey()],
      ['spotsRemaining', s.u8()],
      ['totalSpots', s.u8()],
    ],
    { description: 'ReservationV1' }
  ) as Serializer<ReservationV1Args, ReservationV1>;
}
