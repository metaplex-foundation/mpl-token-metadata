/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import {
  Context,
  GetDataEnumKind,
  GetDataEnumKindContent,
  Option,
  Serializer,
} from '@lorisleiva/js-core';
import {
  AuthorizationData,
  AuthorizationDataArgs,
  getAuthorizationDataSerializer,
} from '.';

export type BurnArgs = {
  __kind: 'V1';
  authorization_data: Option<AuthorizationData>;
};

export type BurnArgsArgs = {
  __kind: 'V1';
  authorization_data: Option<AuthorizationDataArgs>;
};

export function getBurnArgsSerializer(
  context: Pick<Context, 'serializer'>
): Serializer<BurnArgsArgs, BurnArgs> {
  const s = context.serializer;
  return s.dataEnum<BurnArgs>(
    [
      [
        'V1',
        s.struct<GetDataEnumKindContent<BurnArgs, 'V1'>>(
          [
            [
              'authorization_data',
              s.option(getAuthorizationDataSerializer(context)),
            ],
          ],
          'V1'
        ),
      ],
    ],
    undefined,
    'BurnArgs'
  ) as Serializer<BurnArgsArgs, BurnArgs>;
}

// Data Enum Helpers.
export function burnArgs(
  kind: 'V1',
  data: GetDataEnumKindContent<BurnArgs, 'V1'>
): GetDataEnumKind<BurnArgs, 'V1'>;
export function burnArgs<K extends BurnArgs['__kind']>(
  kind: K,
  data?: any
): BurnArgs & { __kind: K } {
  return Array.isArray(data)
    ? { __kind: kind, fields: data }
    : { __kind: kind, ...(data ?? {}) };
}
export function isBurnArgs<K extends BurnArgs['__kind']>(
  kind: K,
  value: BurnArgs
): value is BurnArgs & { __kind: K } {
  return value.__kind === kind;
}
