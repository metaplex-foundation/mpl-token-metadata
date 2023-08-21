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
  bytes,
  struct,
  u32,
} from '@metaplex-foundation/umi/serializers';
import { Key, KeyArgs, getKeySerializer } from '../types';

export type EditionMarkerV2 = Account<EditionMarkerV2AccountData>;

export type EditionMarkerV2AccountData = { key: Key; ledger: Uint8Array };

export type EditionMarkerV2AccountDataArgs = {
  key: KeyArgs;
  ledger: Uint8Array;
};

/** @deprecated Use `getEditionMarkerV2AccountDataSerializer()` without any argument instead. */
export function getEditionMarkerV2AccountDataSerializer(
  _context: object
): Serializer<EditionMarkerV2AccountDataArgs, EditionMarkerV2AccountData>;
export function getEditionMarkerV2AccountDataSerializer(): Serializer<
  EditionMarkerV2AccountDataArgs,
  EditionMarkerV2AccountData
>;
export function getEditionMarkerV2AccountDataSerializer(
  _context: object = {}
): Serializer<EditionMarkerV2AccountDataArgs, EditionMarkerV2AccountData> {
  return struct<EditionMarkerV2AccountData>(
    [
      ['key', getKeySerializer()],
      ['ledger', bytes({ size: u32() })],
    ],
    { description: 'EditionMarkerV2AccountData' }
  ) as Serializer<EditionMarkerV2AccountDataArgs, EditionMarkerV2AccountData>;
}

/** @deprecated Use `deserializeEditionMarkerV2(rawAccount)` without any context instead. */
export function deserializeEditionMarkerV2(
  context: object,
  rawAccount: RpcAccount
): EditionMarkerV2;
export function deserializeEditionMarkerV2(
  rawAccount: RpcAccount
): EditionMarkerV2;
export function deserializeEditionMarkerV2(
  context: RpcAccount | object,
  rawAccount?: RpcAccount
): EditionMarkerV2 {
  return deserializeAccount(
    rawAccount ?? (context as RpcAccount),
    getEditionMarkerV2AccountDataSerializer()
  );
}

export async function fetchEditionMarkerV2(
  context: Pick<Context, 'rpc'>,
  publicKey: PublicKey | Pda,
  options?: RpcGetAccountOptions
): Promise<EditionMarkerV2> {
  const maybeAccount = await context.rpc.getAccount(
    toPublicKey(publicKey, false),
    options
  );
  assertAccountExists(maybeAccount, 'EditionMarkerV2');
  return deserializeEditionMarkerV2(maybeAccount);
}

export async function safeFetchEditionMarkerV2(
  context: Pick<Context, 'rpc'>,
  publicKey: PublicKey | Pda,
  options?: RpcGetAccountOptions
): Promise<EditionMarkerV2 | null> {
  const maybeAccount = await context.rpc.getAccount(
    toPublicKey(publicKey, false),
    options
  );
  return maybeAccount.exists ? deserializeEditionMarkerV2(maybeAccount) : null;
}

export async function fetchAllEditionMarkerV2(
  context: Pick<Context, 'rpc'>,
  publicKeys: Array<PublicKey | Pda>,
  options?: RpcGetAccountsOptions
): Promise<EditionMarkerV2[]> {
  const maybeAccounts = await context.rpc.getAccounts(
    publicKeys.map((key) => toPublicKey(key, false)),
    options
  );
  return maybeAccounts.map((maybeAccount) => {
    assertAccountExists(maybeAccount, 'EditionMarkerV2');
    return deserializeEditionMarkerV2(maybeAccount);
  });
}

export async function safeFetchAllEditionMarkerV2(
  context: Pick<Context, 'rpc'>,
  publicKeys: Array<PublicKey | Pda>,
  options?: RpcGetAccountsOptions
): Promise<EditionMarkerV2[]> {
  const maybeAccounts = await context.rpc.getAccounts(
    publicKeys.map((key) => toPublicKey(key, false)),
    options
  );
  return maybeAccounts
    .filter((maybeAccount) => maybeAccount.exists)
    .map((maybeAccount) =>
      deserializeEditionMarkerV2(maybeAccount as RpcAccount)
    );
}

export function getEditionMarkerV2GpaBuilder(
  context: Pick<Context, 'rpc' | 'programs'>
) {
  const programId = context.programs.getPublicKey(
    'mplTokenMetadata',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  );
  return gpaBuilder(context, programId)
    .registerFields<{ key: KeyArgs; ledger: Uint8Array }>({
      key: [0, getKeySerializer()],
      ledger: [1, bytes({ size: u32() })],
    })
    .deserializeUsing<EditionMarkerV2>((account) =>
      deserializeEditionMarkerV2(account)
    );
}
