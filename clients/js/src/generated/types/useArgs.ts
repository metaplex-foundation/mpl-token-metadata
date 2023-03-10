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
} from '@metaplex-foundation/umi';
import {
  AuthorizationData,
  AuthorizationDataArgs,
  getAuthorizationDataSerializer,
} from '.';

export type UseArgs = {
  __kind: 'V1';
  authorizationData: Option<AuthorizationData>;
};

export type UseArgsArgs = {
  __kind: 'V1';
  authorizationData: Option<AuthorizationDataArgs>;
};

export function getUseArgsSerializer(
  context: Pick<Context, 'serializer'>
): Serializer<UseArgsArgs, UseArgs> {
  const s = context.serializer;
  return s.dataEnum<UseArgs>(
    [
      [
        'V1',
        s.struct<GetDataEnumKindContent<UseArgs, 'V1'>>(
          [
            [
              'authorizationData',
              s.option(getAuthorizationDataSerializer(context)),
            ],
          ],
          { description: 'V1' }
        ),
      ],
    ],
    { description: 'UseArgs' }
  ) as Serializer<UseArgsArgs, UseArgs>;
}

// Data Enum Helpers.
export function useArgs(
  kind: 'V1',
  data: GetDataEnumKindContent<UseArgsArgs, 'V1'>
): GetDataEnumKind<UseArgsArgs, 'V1'>;
export function useArgs<K extends UseArgsArgs['__kind']>(
  kind: K,
  data?: any
): Extract<UseArgsArgs, { __kind: K }> {
  return Array.isArray(data)
    ? { __kind: kind, fields: data }
    : { __kind: kind, ...(data ?? {}) };
}
export function isUseArgs<K extends UseArgs['__kind']>(
  kind: K,
  value: UseArgs
): value is UseArgs & { __kind: K } {
  return value.__kind === kind;
}
