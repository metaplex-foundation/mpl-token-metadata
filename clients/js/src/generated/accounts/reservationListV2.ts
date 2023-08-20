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
  OptionOrNullable,
  Pda,
  PublicKey,
  RpcAccount,
  RpcGetAccountOptions,
  RpcGetAccountsOptions,
  assertAccountExists,
  deserializeAccount,
  gpaBuilder,
  publicKey as toPublicKey,
} from '@metaplex-foundation/umi';
import {
  Serializer,
  array,
  option,
  publicKey as publicKeySerializer,
  struct,
  u64,
} from '@metaplex-foundation/umi/serializers';
import {
  Key,
  KeyArgs,
  Reservation,
  ReservationArgs,
  getKeySerializer,
  getReservationSerializer,
} from '../types';

export type ReservationListV2 = Account<ReservationListV2AccountData>;

export type ReservationListV2AccountData = {
  key: Key;
  masterEdition: PublicKey;
  supplySnapshot: Option<bigint>;
  reservations: Array<Reservation>;
  totalReservationSpots: bigint;
  currentReservationSpots: bigint;
};

export type ReservationListV2AccountDataArgs = {
  key: KeyArgs;
  masterEdition: PublicKey;
  supplySnapshot: OptionOrNullable<number | bigint>;
  reservations: Array<ReservationArgs>;
  totalReservationSpots: number | bigint;
  currentReservationSpots: number | bigint;
};

/** @deprecated Use `getReservationListV2AccountDataSerializer()` without any argument instead. */
export function getReservationListV2AccountDataSerializer(
  _context: object
): Serializer<ReservationListV2AccountDataArgs, ReservationListV2AccountData>;
export function getReservationListV2AccountDataSerializer(): Serializer<
  ReservationListV2AccountDataArgs,
  ReservationListV2AccountData
>;
export function getReservationListV2AccountDataSerializer(
  _context: object = {}
): Serializer<ReservationListV2AccountDataArgs, ReservationListV2AccountData> {
  return struct<ReservationListV2AccountData>(
    [
      ['key', getKeySerializer()],
      ['masterEdition', publicKeySerializer()],
      ['supplySnapshot', option(u64())],
      ['reservations', array(getReservationSerializer())],
      ['totalReservationSpots', u64()],
      ['currentReservationSpots', u64()],
    ],
    { description: 'ReservationListV2AccountData' }
  ) as Serializer<
    ReservationListV2AccountDataArgs,
    ReservationListV2AccountData
  >;
}

/** @deprecated Use `deserializeReservationListV2(rawAccount)` without any context instead. */
export function deserializeReservationListV2(
  context: object,
  rawAccount: RpcAccount
): ReservationListV2;
export function deserializeReservationListV2(
  rawAccount: RpcAccount
): ReservationListV2;
export function deserializeReservationListV2(
  context: RpcAccount | object,
  rawAccount?: RpcAccount
): ReservationListV2 {
  return deserializeAccount(
    rawAccount ?? (context as RpcAccount),
    getReservationListV2AccountDataSerializer()
  );
}

export async function fetchReservationListV2(
  context: Pick<Context, 'rpc'>,
  publicKey: PublicKey | Pda,
  options?: RpcGetAccountOptions
): Promise<ReservationListV2> {
  const maybeAccount = await context.rpc.getAccount(
    toPublicKey(publicKey, false),
    options
  );
  assertAccountExists(maybeAccount, 'ReservationListV2');
  return deserializeReservationListV2(maybeAccount);
}

export async function safeFetchReservationListV2(
  context: Pick<Context, 'rpc'>,
  publicKey: PublicKey | Pda,
  options?: RpcGetAccountOptions
): Promise<ReservationListV2 | null> {
  const maybeAccount = await context.rpc.getAccount(
    toPublicKey(publicKey, false),
    options
  );
  return maybeAccount.exists
    ? deserializeReservationListV2(maybeAccount)
    : null;
}

export async function fetchAllReservationListV2(
  context: Pick<Context, 'rpc'>,
  publicKeys: Array<PublicKey | Pda>,
  options?: RpcGetAccountsOptions
): Promise<ReservationListV2[]> {
  const maybeAccounts = await context.rpc.getAccounts(
    publicKeys.map((key) => toPublicKey(key, false)),
    options
  );
  return maybeAccounts.map((maybeAccount) => {
    assertAccountExists(maybeAccount, 'ReservationListV2');
    return deserializeReservationListV2(maybeAccount);
  });
}

export async function safeFetchAllReservationListV2(
  context: Pick<Context, 'rpc'>,
  publicKeys: Array<PublicKey | Pda>,
  options?: RpcGetAccountsOptions
): Promise<ReservationListV2[]> {
  const maybeAccounts = await context.rpc.getAccounts(
    publicKeys.map((key) => toPublicKey(key, false)),
    options
  );
  return maybeAccounts
    .filter((maybeAccount) => maybeAccount.exists)
    .map((maybeAccount) =>
      deserializeReservationListV2(maybeAccount as RpcAccount)
    );
}

export function getReservationListV2GpaBuilder(
  context: Pick<Context, 'rpc' | 'programs'>
) {
  const programId = context.programs.getPublicKey(
    'tokenMetadata',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  );
  return gpaBuilder(context, programId)
    .registerFields<{
      key: KeyArgs;
      masterEdition: PublicKey;
      supplySnapshot: OptionOrNullable<number | bigint>;
      reservations: Array<ReservationArgs>;
      totalReservationSpots: number | bigint;
      currentReservationSpots: number | bigint;
    }>({
      key: [0, getKeySerializer()],
      masterEdition: [1, publicKeySerializer()],
      supplySnapshot: [33, option(u64())],
      reservations: [null, array(getReservationSerializer())],
      totalReservationSpots: [null, u64()],
      currentReservationSpots: [null, u64()],
    })
    .deserializeUsing<ReservationListV2>((account) =>
      deserializeReservationListV2(account)
    );
}
