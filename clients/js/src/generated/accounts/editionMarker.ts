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
  array,
  mapSerializer,
  publicKey as publicKeySerializer,
  string,
  struct,
  u8,
} from '@metaplex-foundation/umi/serializers';
import { Key, KeyArgs, getKeySerializer } from '../types';

export type EditionMarker = Account<EditionMarkerAccountData>;

export type EditionMarkerAccountData = { key: Key; ledger: Array<number> };

export type EditionMarkerAccountDataArgs = { ledger: Array<number> };

/** @deprecated Use `getEditionMarkerAccountDataSerializer()` without any argument instead. */
export function getEditionMarkerAccountDataSerializer(
  _context: object
): Serializer<EditionMarkerAccountDataArgs, EditionMarkerAccountData>;
export function getEditionMarkerAccountDataSerializer(): Serializer<
  EditionMarkerAccountDataArgs,
  EditionMarkerAccountData
>;
export function getEditionMarkerAccountDataSerializer(
  _context: object = {}
): Serializer<EditionMarkerAccountDataArgs, EditionMarkerAccountData> {
  return mapSerializer<
    EditionMarkerAccountDataArgs,
    any,
    EditionMarkerAccountData
  >(
    struct<EditionMarkerAccountData>(
      [
        ['key', getKeySerializer()],
        ['ledger', array(u8(), { size: 31 })],
      ],
      { description: 'EditionMarkerAccountData' }
    ),
    (value) => ({ ...value, key: Key.EditionMarker })
  ) as Serializer<EditionMarkerAccountDataArgs, EditionMarkerAccountData>;
}

/** @deprecated Use `deserializeEditionMarker(rawAccount)` without any context instead. */
export function deserializeEditionMarker(
  context: object,
  rawAccount: RpcAccount
): EditionMarker;
export function deserializeEditionMarker(rawAccount: RpcAccount): EditionMarker;
export function deserializeEditionMarker(
  context: RpcAccount | object,
  rawAccount?: RpcAccount
): EditionMarker {
  return deserializeAccount(
    rawAccount ?? (context as RpcAccount),
    getEditionMarkerAccountDataSerializer()
  );
}

export async function fetchEditionMarker(
  context: Pick<Context, 'rpc'>,
  publicKey: PublicKey | Pda,
  options?: RpcGetAccountOptions
): Promise<EditionMarker> {
  const maybeAccount = await context.rpc.getAccount(
    toPublicKey(publicKey, false),
    options
  );
  assertAccountExists(maybeAccount, 'EditionMarker');
  return deserializeEditionMarker(maybeAccount);
}

export async function safeFetchEditionMarker(
  context: Pick<Context, 'rpc'>,
  publicKey: PublicKey | Pda,
  options?: RpcGetAccountOptions
): Promise<EditionMarker | null> {
  const maybeAccount = await context.rpc.getAccount(
    toPublicKey(publicKey, false),
    options
  );
  return maybeAccount.exists ? deserializeEditionMarker(maybeAccount) : null;
}

export async function fetchAllEditionMarker(
  context: Pick<Context, 'rpc'>,
  publicKeys: Array<PublicKey | Pda>,
  options?: RpcGetAccountsOptions
): Promise<EditionMarker[]> {
  const maybeAccounts = await context.rpc.getAccounts(
    publicKeys.map((key) => toPublicKey(key, false)),
    options
  );
  return maybeAccounts.map((maybeAccount) => {
    assertAccountExists(maybeAccount, 'EditionMarker');
    return deserializeEditionMarker(maybeAccount);
  });
}

export async function safeFetchAllEditionMarker(
  context: Pick<Context, 'rpc'>,
  publicKeys: Array<PublicKey | Pda>,
  options?: RpcGetAccountsOptions
): Promise<EditionMarker[]> {
  const maybeAccounts = await context.rpc.getAccounts(
    publicKeys.map((key) => toPublicKey(key, false)),
    options
  );
  return maybeAccounts
    .filter((maybeAccount) => maybeAccount.exists)
    .map((maybeAccount) =>
      deserializeEditionMarker(maybeAccount as RpcAccount)
    );
}

export function getEditionMarkerGpaBuilder(
  context: Pick<Context, 'rpc' | 'programs'>
) {
  const programId = context.programs.getPublicKey(
    'mplTokenMetadata',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  );
  return gpaBuilder(context, programId)
    .registerFields<{ key: KeyArgs; ledger: Array<number> }>({
      key: [0, getKeySerializer()],
      ledger: [1, array(u8(), { size: 31 })],
    })
    .deserializeUsing<EditionMarker>((account) =>
      deserializeEditionMarker(account)
    )
    .whereField('key', Key.EditionMarker);
}

export function getEditionMarkerSize(): number {
  return 32;
}

export function findEditionMarkerPda(
  context: Pick<Context, 'eddsa' | 'programs'>,
  seeds: {
    /** The address of the mint account */
    mint: PublicKey;
    /** The floor of the edition number divided by 248 as a string. I.e. ⌊edition/248⌋. */
    editionMarker: string;
  }
): Pda {
  const programId = context.programs.getPublicKey(
    'mplTokenMetadata',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  );
  return context.eddsa.findPda(programId, [
    string({ size: 'variable' }).serialize('metadata'),
    publicKeySerializer().serialize(programId),
    publicKeySerializer().serialize(seeds.mint),
    string({ size: 'variable' }).serialize('edition'),
    string({ size: 'variable' }).serialize(seeds.editionMarker),
  ]);
}

export async function fetchEditionMarkerFromSeeds(
  context: Pick<Context, 'eddsa' | 'programs' | 'rpc'>,
  seeds: Parameters<typeof findEditionMarkerPda>[1],
  options?: RpcGetAccountOptions
): Promise<EditionMarker> {
  return fetchEditionMarker(
    context,
    findEditionMarkerPda(context, seeds),
    options
  );
}

export async function safeFetchEditionMarkerFromSeeds(
  context: Pick<Context, 'eddsa' | 'programs' | 'rpc'>,
  seeds: Parameters<typeof findEditionMarkerPda>[1],
  options?: RpcGetAccountOptions
): Promise<EditionMarker | null> {
  return safeFetchEditionMarker(
    context,
    findEditionMarkerPda(context, seeds),
    options
  );
}
