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

export type VerifyArgs = {
  __kind: 'V1';
  authorization_data: Option<AuthorizationData>;
};

export type VerifyArgsArgs = {
  __kind: 'V1';
  authorization_data: Option<AuthorizationDataArgs>;
};

export function getVerifyArgsSerializer(
  context: Pick<Context, 'serializer'>
): Serializer<VerifyArgsArgs, VerifyArgs> {
  const s = context.serializer;
  return s.dataEnum<VerifyArgs>(
    [
      [
        'V1',
        s.struct<GetDataEnumKindContent<VerifyArgs, 'V1'>>(
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
    'VerifyArgs'
  ) as Serializer<VerifyArgsArgs, VerifyArgs>;
}

// Data Enum Helpers.
export function verifyArgs(
  kind: 'V1',
  data: GetDataEnumKindContent<VerifyArgs, 'V1'>
): GetDataEnumKind<VerifyArgs, 'V1'>;
export function verifyArgs<K extends VerifyArgs['__kind']>(
  kind: K,
  data?: any
): VerifyArgs & { __kind: K } {
  return Array.isArray(data)
    ? { __kind: kind, fields: data }
    : { __kind: kind, ...(data ?? {}) };
}
export function isVerifyArgs<K extends VerifyArgs['__kind']>(
  kind: K,
  value: VerifyArgs
): value is VerifyArgs & { __kind: K } {
  return value.__kind === kind;
}
