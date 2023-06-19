/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import {
  Amount,
  Option,
  OptionOrNullable,
  PublicKey,
  mapAmountSerializer,
  none,
} from '@metaplex-foundation/umi';
import {
  GetDataEnumKind,
  GetDataEnumKindContent,
  Serializer,
  array,
  bool,
  dataEnum,
  mapSerializer,
  option,
  publicKey as publicKeySerializer,
  string,
  struct,
  u16,
  u8,
} from '@metaplex-foundation/umi/serializers';
import {
  Collection,
  CollectionArgs,
  CollectionDetails,
  CollectionDetailsArgs,
  Creator,
  CreatorArgs,
  PrintSupply,
  PrintSupplyArgs,
  TokenStandard,
  TokenStandardArgs,
  Uses,
  UsesArgs,
  getCollectionDetailsSerializer,
  getCollectionSerializer,
  getCreatorSerializer,
  getPrintSupplySerializer,
  getTokenStandardSerializer,
  getUsesSerializer,
} from '.';

export type CreateArgs = {
  __kind: 'V1';
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: Amount<'%', 2>;
  creators: Option<Array<Creator>>;
  primarySaleHappened: boolean;
  isMutable: boolean;
  tokenStandard: TokenStandard;
  collection: Option<Collection>;
  uses: Option<Uses>;
  collectionDetails: Option<CollectionDetails>;
  ruleSet: Option<PublicKey>;
  decimals: Option<number>;
  printSupply: Option<PrintSupply>;
};

export type CreateArgsArgs = {
  __kind: 'V1';
  name: string;
  symbol?: string;
  uri: string;
  sellerFeeBasisPoints: Amount<'%', 2>;
  creators: OptionOrNullable<Array<CreatorArgs>>;
  primarySaleHappened?: boolean;
  isMutable?: boolean;
  tokenStandard: TokenStandardArgs;
  collection?: OptionOrNullable<CollectionArgs>;
  uses?: OptionOrNullable<UsesArgs>;
  collectionDetails?: OptionOrNullable<CollectionDetailsArgs>;
  ruleSet?: OptionOrNullable<PublicKey>;
  decimals?: OptionOrNullable<number>;
  printSupply?: OptionOrNullable<PrintSupplyArgs>;
};

/** @deprecated Use `getCreateArgsSerializer()` without any argument instead. */
export function getCreateArgsSerializer(
  _context: object
): Serializer<CreateArgsArgs, CreateArgs>;
export function getCreateArgsSerializer(): Serializer<
  CreateArgsArgs,
  CreateArgs
>;
export function getCreateArgsSerializer(
  _context: object = {}
): Serializer<CreateArgsArgs, CreateArgs> {
  return dataEnum<CreateArgs>(
    [
      [
        'V1',
        mapSerializer<
          GetDataEnumKindContent<CreateArgsArgs, 'V1'>,
          any,
          GetDataEnumKindContent<CreateArgs, 'V1'>
        >(
          struct<GetDataEnumKindContent<CreateArgs, 'V1'>>([
            ['name', string()],
            ['symbol', string()],
            ['uri', string()],
            ['sellerFeeBasisPoints', mapAmountSerializer(u16(), '%', 2)],
            ['creators', option(array(getCreatorSerializer()))],
            ['primarySaleHappened', bool()],
            ['isMutable', bool()],
            ['tokenStandard', getTokenStandardSerializer()],
            ['collection', option(getCollectionSerializer())],
            ['uses', option(getUsesSerializer())],
            ['collectionDetails', option(getCollectionDetailsSerializer())],
            ['ruleSet', option(publicKeySerializer())],
            ['decimals', option(u8())],
            ['printSupply', option(getPrintSupplySerializer())],
          ]),
          (value) => ({
            ...value,
            symbol: value.symbol ?? '',
            primarySaleHappened: value.primarySaleHappened ?? false,
            isMutable: value.isMutable ?? true,
            collection: value.collection ?? none(),
            uses: value.uses ?? none(),
            collectionDetails: value.collectionDetails ?? none(),
            ruleSet: value.ruleSet ?? none(),
            decimals: value.decimals ?? none(),
            printSupply: value.printSupply ?? none(),
          })
        ),
      ],
    ],
    { description: 'CreateArgs' }
  ) as Serializer<CreateArgsArgs, CreateArgs>;
}

// Data Enum Helpers.
export function createArgs(
  kind: 'V1',
  data: GetDataEnumKindContent<CreateArgsArgs, 'V1'>
): GetDataEnumKind<CreateArgsArgs, 'V1'>;
export function createArgs<K extends CreateArgsArgs['__kind']>(
  kind: K,
  data?: any
): Extract<CreateArgsArgs, { __kind: K }> {
  return Array.isArray(data)
    ? { __kind: kind, fields: data }
    : { __kind: kind, ...(data ?? {}) };
}
export function isCreateArgs<K extends CreateArgs['__kind']>(
  kind: K,
  value: CreateArgs
): value is CreateArgs & { __kind: K } {
  return value.__kind === kind;
}
