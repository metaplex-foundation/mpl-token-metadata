/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import { Context, PublicKey, Serializer } from '@metaplex-foundation/umi';

export type Collection = { verified: boolean; key: PublicKey };

export type CollectionArgs = Collection;

export function getCollectionSerializer(
  context: Pick<Context, 'serializer'>
): Serializer<CollectionArgs, Collection> {
  const s = context.serializer;
  return s.struct<Collection>(
    [
      ['verified', s.bool()],
      ['key', s.publicKey()],
    ],
    { description: 'Collection' }
  ) as Serializer<CollectionArgs, Collection>;
}
