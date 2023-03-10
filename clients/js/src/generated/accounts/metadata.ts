/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import {
  Account,
  Context,
  Option,
  Pda,
  PublicKey,
  RpcAccount,
  RpcGetAccountOptions,
  RpcGetAccountsOptions,
  Serializer,
  assertAccountExists,
  deserializeAccount,
  gpaBuilder,
  mapSerializer,
} from '@metaplex-foundation/umi';
import {
  Collection,
  CollectionArgs,
  CollectionDetails,
  CollectionDetailsArgs,
  Creator,
  CreatorArgs,
  Key,
  KeyArgs,
  ProgrammableConfig,
  ProgrammableConfigArgs,
  TokenStandard,
  TokenStandardArgs,
  Uses,
  UsesArgs,
  getCollectionDetailsSerializer,
  getCollectionSerializer,
  getCreatorSerializer,
  getKeySerializer,
  getProgrammableConfigSerializer,
  getTokenStandardSerializer,
  getUsesSerializer,
} from '../types';

export type Metadata = Account<MetadataAccountData>;

export type MetadataAccountData = {
  key: Key;
  updateAuthority: PublicKey;
  mint: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: Option<Array<Creator>>;
  primarySaleHappened: boolean;
  isMutable: boolean;
  editionNonce: Option<number>;
  tokenStandard: Option<TokenStandard>;
  collection: Option<Collection>;
  uses: Option<Uses>;
  collectionDetails: Option<CollectionDetails>;
  programmableConfig: Option<ProgrammableConfig>;
};

export type MetadataAccountDataArgs = {
  updateAuthority: PublicKey;
  mint: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: Option<Array<CreatorArgs>>;
  primarySaleHappened: boolean;
  isMutable: boolean;
  editionNonce: Option<number>;
  tokenStandard: Option<TokenStandardArgs>;
  collection: Option<CollectionArgs>;
  uses: Option<UsesArgs>;
  collectionDetails: Option<CollectionDetailsArgs>;
  programmableConfig: Option<ProgrammableConfigArgs>;
};

export function getMetadataAccountDataSerializer(
  context: Pick<Context, 'serializer'>
): Serializer<MetadataAccountDataArgs, MetadataAccountData> {
  const s = context.serializer;
  return mapSerializer<
    MetadataAccountDataArgs,
    MetadataAccountData,
    MetadataAccountData
  >(
    s.struct<MetadataAccountData>(
      [
        ['key', getKeySerializer(context)],
        ['updateAuthority', s.publicKey()],
        ['mint', s.publicKey()],
        ['name', s.string()],
        ['symbol', s.string()],
        ['uri', s.string()],
        ['sellerFeeBasisPoints', s.u16()],
        ['creators', s.option(s.array(getCreatorSerializer(context)))],
        ['primarySaleHappened', s.bool()],
        ['isMutable', s.bool()],
        ['editionNonce', s.option(s.u8())],
        ['tokenStandard', s.option(getTokenStandardSerializer(context))],
        ['collection', s.option(getCollectionSerializer(context))],
        ['uses', s.option(getUsesSerializer(context))],
        [
          'collectionDetails',
          s.option(getCollectionDetailsSerializer(context)),
        ],
        [
          'programmableConfig',
          s.option(getProgrammableConfigSerializer(context)),
        ],
      ],
      { description: 'Metadata' }
    ),
    (value) => ({ ...value, key: Key.MetadataV1 } as MetadataAccountData)
  ) as Serializer<MetadataAccountDataArgs, MetadataAccountData>;
}

export function deserializeMetadata(
  context: Pick<Context, 'serializer'>,
  rawAccount: RpcAccount
): Metadata {
  return deserializeAccount(
    rawAccount,
    getMetadataAccountDataSerializer(context)
  );
}

export async function fetchMetadata(
  context: Pick<Context, 'rpc' | 'serializer'>,
  publicKey: PublicKey,
  options?: RpcGetAccountOptions
): Promise<Metadata> {
  const maybeAccount = await context.rpc.getAccount(publicKey, options);
  assertAccountExists(maybeAccount, 'Metadata');
  return deserializeMetadata(context, maybeAccount);
}

export async function safeFetchMetadata(
  context: Pick<Context, 'rpc' | 'serializer'>,
  publicKey: PublicKey,
  options?: RpcGetAccountOptions
): Promise<Metadata | null> {
  const maybeAccount = await context.rpc.getAccount(publicKey, options);
  return maybeAccount.exists
    ? deserializeMetadata(context, maybeAccount)
    : null;
}

export async function fetchAllMetadata(
  context: Pick<Context, 'rpc' | 'serializer'>,
  publicKeys: PublicKey[],
  options?: RpcGetAccountsOptions
): Promise<Metadata[]> {
  const maybeAccounts = await context.rpc.getAccounts(publicKeys, options);
  return maybeAccounts.map((maybeAccount) => {
    assertAccountExists(maybeAccount, 'Metadata');
    return deserializeMetadata(context, maybeAccount);
  });
}

export async function safeFetchAllMetadata(
  context: Pick<Context, 'rpc' | 'serializer'>,
  publicKeys: PublicKey[],
  options?: RpcGetAccountsOptions
): Promise<Metadata[]> {
  const maybeAccounts = await context.rpc.getAccounts(publicKeys, options);
  return maybeAccounts
    .filter((maybeAccount) => maybeAccount.exists)
    .map((maybeAccount) =>
      deserializeMetadata(context, maybeAccount as RpcAccount)
    );
}

export function getMetadataGpaBuilder(
  context: Pick<Context, 'rpc' | 'serializer' | 'programs'>
) {
  const s = context.serializer;
  const programId = context.programs.getPublicKey(
    'mplTokenMetadata',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  );
  return gpaBuilder(context, programId)
    .registerFields<{
      key: KeyArgs;
      updateAuthority: PublicKey;
      mint: PublicKey;
      name: string;
      symbol: string;
      uri: string;
      sellerFeeBasisPoints: number;
      creators: Option<Array<CreatorArgs>>;
      primarySaleHappened: boolean;
      isMutable: boolean;
      editionNonce: Option<number>;
      tokenStandard: Option<TokenStandardArgs>;
      collection: Option<CollectionArgs>;
      uses: Option<UsesArgs>;
      collectionDetails: Option<CollectionDetailsArgs>;
      programmableConfig: Option<ProgrammableConfigArgs>;
    }>({
      key: [0, getKeySerializer(context)],
      updateAuthority: [1, s.publicKey()],
      mint: [33, s.publicKey()],
      name: [65, s.string()],
      symbol: [null, s.string()],
      uri: [null, s.string()],
      sellerFeeBasisPoints: [null, s.u16()],
      creators: [null, s.option(s.array(getCreatorSerializer(context)))],
      primarySaleHappened: [null, s.bool()],
      isMutable: [null, s.bool()],
      editionNonce: [null, s.option(s.u8())],
      tokenStandard: [null, s.option(getTokenStandardSerializer(context))],
      collection: [null, s.option(getCollectionSerializer(context))],
      uses: [null, s.option(getUsesSerializer(context))],
      collectionDetails: [
        null,
        s.option(getCollectionDetailsSerializer(context)),
      ],
      programmableConfig: [
        null,
        s.option(getProgrammableConfigSerializer(context)),
      ],
    })
    .deserializeUsing<Metadata>((account) =>
      deserializeMetadata(context, account)
    )
    .whereField('key', Key.MetadataV1);
}

export function getMetadataSize(): number {
  return 679;
}

export function findMetadataPda(
  context: Pick<Context, 'eddsa' | 'programs' | 'serializer'>,
  seeds: {
    /** The address of the mint account */
    mint: PublicKey;
  }
): Pda {
  const s = context.serializer;
  const programId = context.programs.getPublicKey(
    'mplTokenMetadata',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  );
  return context.eddsa.findPda(programId, [
    s.string({ size: 'variable' }).serialize('metadata'),
    programId.bytes,
    s.publicKey().serialize(seeds.mint),
  ]);
}
