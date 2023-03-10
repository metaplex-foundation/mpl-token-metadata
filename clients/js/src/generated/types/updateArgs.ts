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
  mapSerializer,
  none,
} from '@metaplex-foundation/umi';
import {
  AuthorizationData,
  AuthorizationDataArgs,
  CollectionDetailsToggle,
  CollectionDetailsToggleArgs,
  CollectionToggle,
  CollectionToggleArgs,
  Creator,
  CreatorArgs,
  RuleSetToggle,
  RuleSetToggleArgs,
  UsesToggle,
  UsesToggleArgs,
  collectionDetailsToggle,
  collectionToggle,
  getAuthorizationDataSerializer,
  getCollectionDetailsToggleSerializer,
  getCollectionToggleSerializer,
  getCreatorSerializer,
  getRuleSetToggleSerializer,
  getUsesToggleSerializer,
  ruleSetToggle,
  usesToggle,
} from '.';

export type UpdateArgs = {
  __kind: 'V1';
  newUpdateAuthority: Option<PublicKey>;
  data: Option<{
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: Option<Array<Creator>>;
  }>;
  primarySaleHappened: Option<boolean>;
  isMutable: Option<boolean>;
  collection: CollectionToggle;
  collectionDetails: CollectionDetailsToggle;
  uses: UsesToggle;
  ruleSet: RuleSetToggle;
  authorizationData: Option<AuthorizationData>;
};

export type UpdateArgsArgs = {
  __kind: 'V1';
  newUpdateAuthority?: Option<PublicKey>;
  data?: Option<{
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: Option<Array<CreatorArgs>>;
  }>;
  primarySaleHappened?: Option<boolean>;
  isMutable?: Option<boolean>;
  collection?: CollectionToggleArgs;
  collectionDetails?: CollectionDetailsToggleArgs;
  uses?: UsesToggleArgs;
  ruleSet?: RuleSetToggleArgs;
  authorizationData?: Option<AuthorizationDataArgs>;
};

export function getUpdateArgsSerializer(
  context: Pick<Context, 'serializer'>
): Serializer<UpdateArgsArgs, UpdateArgs> {
  const s = context.serializer;
  return s.dataEnum<UpdateArgs>(
    [
      [
        'V1',
        mapSerializer<
          GetDataEnumKindContent<UpdateArgsArgs, 'V1'>,
          GetDataEnumKindContent<UpdateArgs, 'V1'>,
          GetDataEnumKindContent<UpdateArgs, 'V1'>
        >(
          s.struct<GetDataEnumKindContent<UpdateArgs, 'V1'>>(
            [
              ['newUpdateAuthority', s.option(s.publicKey())],
              [
                'data',
                s.option(
                  s.struct<any>(
                    [
                      ['name', s.string()],
                      ['symbol', s.string()],
                      ['uri', s.string()],
                      ['sellerFeeBasisPoints', s.u16()],
                      [
                        'creators',
                        s.option(s.array(getCreatorSerializer(context))),
                      ],
                    ],
                    { description: 'Data' }
                  )
                ),
              ],
              ['primarySaleHappened', s.option(s.bool())],
              ['isMutable', s.option(s.bool())],
              ['collection', getCollectionToggleSerializer(context)],
              [
                'collectionDetails',
                getCollectionDetailsToggleSerializer(context),
              ],
              ['uses', getUsesToggleSerializer(context)],
              ['ruleSet', getRuleSetToggleSerializer(context)],
              [
                'authorizationData',
                s.option(getAuthorizationDataSerializer(context)),
              ],
            ],
            { description: 'V1' }
          ),
          (value) =>
            ({
              ...value,
              newUpdateAuthority: value.newUpdateAuthority ?? none(),
              data: value.data ?? none(),
              primarySaleHappened: value.primarySaleHappened ?? none(),
              isMutable: value.isMutable ?? none(),
              collection: value.collection ?? collectionToggle('None'),
              collectionDetails:
                value.collectionDetails ?? collectionDetailsToggle('None'),
              uses: value.uses ?? usesToggle('None'),
              ruleSet: value.ruleSet ?? ruleSetToggle('None'),
              authorizationData: value.authorizationData ?? none(),
            } as GetDataEnumKindContent<UpdateArgs, 'V1'>)
        ),
      ],
    ],
    { description: 'UpdateArgs' }
  ) as Serializer<UpdateArgsArgs, UpdateArgs>;
}

// Data Enum Helpers.
export function updateArgs(
  kind: 'V1',
  data: GetDataEnumKindContent<UpdateArgsArgs, 'V1'>
): GetDataEnumKind<UpdateArgsArgs, 'V1'>;
export function updateArgs<K extends UpdateArgsArgs['__kind']>(
  kind: K,
  data?: any
): Extract<UpdateArgsArgs, { __kind: K }> {
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
