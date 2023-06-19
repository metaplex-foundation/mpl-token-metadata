/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import { Serializer, scalarEnum } from '@metaplex-foundation/umi/serializers';

export enum PayloadKey {
  Amount,
  Authority,
  AuthoritySeeds,
  Delegate,
  DelegateSeeds,
  Destination,
  DestinationSeeds,
  Holder,
  Source,
  SourceSeeds,
}

export type PayloadKeyArgs = PayloadKey;

/** @deprecated Use `getPayloadKeySerializer()` without any argument instead. */
export function getPayloadKeySerializer(
  _context: object
): Serializer<PayloadKeyArgs, PayloadKey>;
export function getPayloadKeySerializer(): Serializer<
  PayloadKeyArgs,
  PayloadKey
>;
export function getPayloadKeySerializer(
  _context: object = {}
): Serializer<PayloadKeyArgs, PayloadKey> {
  return scalarEnum<PayloadKey>(PayloadKey, {
    description: 'PayloadKey',
  }) as Serializer<PayloadKeyArgs, PayloadKey>;
}
