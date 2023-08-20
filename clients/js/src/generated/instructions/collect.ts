/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import {
  AccountMeta,
  Context,
  Pda,
  PublicKey,
  Signer,
  TransactionBuilder,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import {
  Serializer,
  mapSerializer,
  struct,
  u8,
} from '@metaplex-foundation/umi/serializers';
import { addAccountMeta, addObjectProperty } from '../shared';

// Accounts.
export type CollectInstructionAccounts = {
  /** Authority to collect fees */
  authority?: Signer;
  /** PDA to retrieve fees from */
  pdaAccount: PublicKey | Pda;
};

// Data.
export type CollectInstructionData = { discriminator: number };

export type CollectInstructionDataArgs = {};

/** @deprecated Use `getCollectInstructionDataSerializer()` without any argument instead. */
export function getCollectInstructionDataSerializer(
  _context: object
): Serializer<CollectInstructionDataArgs, CollectInstructionData>;
export function getCollectInstructionDataSerializer(): Serializer<
  CollectInstructionDataArgs,
  CollectInstructionData
>;
export function getCollectInstructionDataSerializer(
  _context: object = {}
): Serializer<CollectInstructionDataArgs, CollectInstructionData> {
  return mapSerializer<CollectInstructionDataArgs, any, CollectInstructionData>(
    struct<CollectInstructionData>([['discriminator', u8()]], {
      description: 'CollectInstructionData',
    }),
    (value) => ({ ...value, discriminator: 54 })
  ) as Serializer<CollectInstructionDataArgs, CollectInstructionData>;
}

// Instruction.
export function collect(
  context: Pick<Context, 'programs' | 'identity'>,
  input: CollectInstructionAccounts
): TransactionBuilder {
  const signers: Signer[] = [];
  const keys: AccountMeta[] = [];

  // Program ID.
  const programId = context.programs.getPublicKey(
    'tokenMetadata',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  );

  // Resolved inputs.
  const resolvedAccounts = {
    pdaAccount: [input.pdaAccount, false] as const,
  };
  addObjectProperty(
    resolvedAccounts,
    'authority',
    input.authority
      ? ([input.authority, false] as const)
      : ([context.identity, false] as const)
  );

  addAccountMeta(keys, signers, resolvedAccounts.authority, false);
  addAccountMeta(keys, signers, resolvedAccounts.pdaAccount, false);

  // Data.
  const data = getCollectInstructionDataSerializer().serialize({});

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
