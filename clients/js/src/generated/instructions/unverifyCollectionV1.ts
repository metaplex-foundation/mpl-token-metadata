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
  publicKey,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import {
  Serializer,
  mapSerializer,
  struct,
  u8,
} from '@metaplex-foundation/umi/serializers';
import { findMetadataPda } from '../accounts';
import { addAccountMeta, addObjectProperty } from '../shared';

// Accounts.
export type UnverifyCollectionV1InstructionAccounts = {
  /** Creator to verify, collection (or metadata if parent burned) update authority or delegate */
  authority?: Signer;
  /** Delegate record PDA */
  delegateRecord?: PublicKey | Pda;
  /** Metadata account */
  metadata: PublicKey | Pda;
  /** Mint of the Collection */
  collectionMint: PublicKey | Pda;
  /** Metadata Account of the Collection */
  collectionMetadata?: PublicKey | Pda;
  /** System program */
  systemProgram?: PublicKey | Pda;
  /** Instructions sysvar account */
  sysvarInstructions?: PublicKey | Pda;
};

// Data.
export type UnverifyCollectionV1InstructionData = {
  discriminator: number;
  unverifyCollectionV1Discriminator: number;
};

export type UnverifyCollectionV1InstructionDataArgs = {};

/** @deprecated Use `getUnverifyCollectionV1InstructionDataSerializer()` without any argument instead. */
export function getUnverifyCollectionV1InstructionDataSerializer(
  _context: object
): Serializer<
  UnverifyCollectionV1InstructionDataArgs,
  UnverifyCollectionV1InstructionData
>;
export function getUnverifyCollectionV1InstructionDataSerializer(): Serializer<
  UnverifyCollectionV1InstructionDataArgs,
  UnverifyCollectionV1InstructionData
>;
export function getUnverifyCollectionV1InstructionDataSerializer(
  _context: object = {}
): Serializer<
  UnverifyCollectionV1InstructionDataArgs,
  UnverifyCollectionV1InstructionData
> {
  return mapSerializer<
    UnverifyCollectionV1InstructionDataArgs,
    any,
    UnverifyCollectionV1InstructionData
  >(
    struct<UnverifyCollectionV1InstructionData>(
      [
        ['discriminator', u8()],
        ['unverifyCollectionV1Discriminator', u8()],
      ],
      { description: 'UnverifyCollectionV1InstructionData' }
    ),
    (value) => ({
      ...value,
      discriminator: 53,
      unverifyCollectionV1Discriminator: 1,
    })
  ) as Serializer<
    UnverifyCollectionV1InstructionDataArgs,
    UnverifyCollectionV1InstructionData
  >;
}

// Instruction.
export function unverifyCollectionV1(
  context: Pick<Context, 'programs' | 'eddsa' | 'identity'>,
  input: UnverifyCollectionV1InstructionAccounts
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
    metadata: [input.metadata, true] as const,
    collectionMint: [input.collectionMint, false] as const,
  };
  addObjectProperty(
    resolvedAccounts,
    'authority',
    input.authority
      ? ([input.authority, false] as const)
      : ([context.identity, false] as const)
  );
  addObjectProperty(
    resolvedAccounts,
    'delegateRecord',
    input.delegateRecord
      ? ([input.delegateRecord, false] as const)
      : ([programId, false] as const)
  );
  addObjectProperty(
    resolvedAccounts,
    'collectionMetadata',
    input.collectionMetadata
      ? ([input.collectionMetadata, true] as const)
      : ([
          findMetadataPda(context, {
            mint: publicKey(input.collectionMint, false),
          }),
          true,
        ] as const)
  );
  addObjectProperty(
    resolvedAccounts,
    'systemProgram',
    input.systemProgram
      ? ([input.systemProgram, false] as const)
      : ([
          context.programs.getPublicKey(
            'splSystem',
            '11111111111111111111111111111111'
          ),
          false,
        ] as const)
  );
  addObjectProperty(
    resolvedAccounts,
    'sysvarInstructions',
    input.sysvarInstructions
      ? ([input.sysvarInstructions, false] as const)
      : ([
          publicKey('Sysvar1nstructions1111111111111111111111111'),
          false,
        ] as const)
  );

  addAccountMeta(keys, signers, resolvedAccounts.authority, false);
  addAccountMeta(keys, signers, resolvedAccounts.delegateRecord, false);
  addAccountMeta(keys, signers, resolvedAccounts.metadata, false);
  addAccountMeta(keys, signers, resolvedAccounts.collectionMint, false);
  addAccountMeta(keys, signers, resolvedAccounts.collectionMetadata, false);
  addAccountMeta(keys, signers, resolvedAccounts.systemProgram, false);
  addAccountMeta(keys, signers, resolvedAccounts.sysvarInstructions, false);

  // Data.
  const data = getUnverifyCollectionV1InstructionDataSerializer().serialize({});

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
