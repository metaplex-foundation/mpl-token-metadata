/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import { Context, Serializer } from '@metaplex-foundation/umi';

export type MintNewEditionFromMasterEditionViaTokenArgs = { edition: bigint };

export type MintNewEditionFromMasterEditionViaTokenArgsArgs = {
  edition: number | bigint;
};

export function getMintNewEditionFromMasterEditionViaTokenArgsSerializer(
  context: Pick<Context, 'serializer'>
): Serializer<
  MintNewEditionFromMasterEditionViaTokenArgsArgs,
  MintNewEditionFromMasterEditionViaTokenArgs
> {
  const s = context.serializer;
  return s.struct<MintNewEditionFromMasterEditionViaTokenArgs>(
    [['edition', s.u64()]],
    { description: 'MintNewEditionFromMasterEditionViaTokenArgs' }
  ) as Serializer<
    MintNewEditionFromMasterEditionViaTokenArgsArgs,
    MintNewEditionFromMasterEditionViaTokenArgs
  >;
}
