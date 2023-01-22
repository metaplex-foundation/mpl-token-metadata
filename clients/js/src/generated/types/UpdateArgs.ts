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
  PublicKey,
  Serializer,
} from '@lorisleiva/js-core';
import {
  AuthorizationData,
  AuthorizationDataArgs,
  CollectionDetailsToggle,
  CollectionDetailsToggleArgs,
  CollectionToggle,
  Data,
  RuleSetToggle,
  UsesToggle,
  UsesToggleArgs,
  getAuthorizationDataSerializer,
  getCollectionDetailsToggleSerializer,
  getCollectionToggleSerializer,
  getDataSerializer,
  getRuleSetToggleSerializer,
  getUsesToggleSerializer,
} from '.';

export type UpdateArgs = {
  __kind: 'V1';
  new_update_authority: Option<PublicKey>;
  data: Option<Data>;
  primary_sale_happened: Option<boolean>;
  is_mutable: Option<boolean>;
  collection: CollectionToggle;
  collection_details: CollectionDetailsToggle;
  uses: UsesToggle;
  rule_set: RuleSetToggle;
  authorization_data: Option<AuthorizationData>;
};

export type UpdateArgsArgs = {
  __kind: 'V1';
  new_update_authority: Option<PublicKey>;
  data: Option<Data>;
  primary_sale_happened: Option<boolean>;
  is_mutable: Option<boolean>;
  collection: CollectionToggle;
  collection_details: CollectionDetailsToggleArgs;
  uses: UsesToggleArgs;
  rule_set: RuleSetToggle;
  authorization_data: Option<AuthorizationDataArgs>;
};

export function getUpdateArgsSerializer(
  context: Pick<Context, 'serializer'>
): Serializer<UpdateArgsArgs, UpdateArgs> {
  const s = context.serializer;
  return s.dataEnum<UpdateArgs>(
    [
      [
        'V1',
        s.struct<GetDataEnumKindContent<UpdateArgs, 'V1'>>(
          [
            ['new_update_authority', s.option(s.publicKey)],
            ['data', s.option(getDataSerializer(context))],
            ['primary_sale_happened', s.option(s.bool())],
            ['is_mutable', s.option(s.bool())],
            ['collection', getCollectionToggleSerializer(context)],
            [
              'collection_details',
              getCollectionDetailsToggleSerializer(context),
            ],
            ['uses', getUsesToggleSerializer(context)],
            ['rule_set', getRuleSetToggleSerializer(context)],
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
    'UpdateArgs'
  ) as Serializer<UpdateArgsArgs, UpdateArgs>;
}

// Data Enum Helpers.
export function updateArgs(
  kind: 'V1',
  data: GetDataEnumKindContent<UpdateArgs, 'V1'>
): GetDataEnumKind<UpdateArgs, 'V1'>;
export function updateArgs<K extends UpdateArgs['__kind']>(
  kind: K,
  data?: any
): UpdateArgs & { __kind: K } {
  return Array.isArray(data)
    ? { __kind: kind, fields: data }
    : { __kind: kind, ...(data ?? {}) };
}
export function isUpdateArgs<K extends UpdateArgs['__kind']>(
  kind: K,
  value: UpdateArgs
): value is UpdateArgs & { __kind: K } {
  return value.__kind === kind;
}
