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
import { findMasterEditionPda, findMetadataPda } from '../accounts';
import { addAccountMeta, addObjectProperty } from '../shared';

// Accounts.
export type VerifyCollectionV1InstructionAccounts = {
  /** Creator to verify, collection update authority or delegate */
  authority?: Signer;
  /** Delegate record PDA */
  delegateRecord?: PublicKey | Pda;
  /** Metadata account */
  metadata: PublicKey | Pda;
  /** Mint of the Collection */
  collectionMint: PublicKey | Pda;
  /** Metadata Account of the Collection */
  collectionMetadata?: PublicKey | Pda;
  /** Master Edition Account of the Collection Token */
  collectionMasterEdition?: PublicKey | Pda;
  /** System program */
  systemProgram?: PublicKey | Pda;
  /** Instructions sysvar account */
  sysvarInstructions?: PublicKey | Pda;
};

// Data.
export type VerifyCollectionV1InstructionData = {
  discriminator: number;
  verifyCollectionV1Discriminator: number;
};

export type VerifyCollectionV1InstructionDataArgs = {};

/** @deprecated Use `getVerifyCollectionV1InstructionDataSerializer()` without any argument instead. */
export function getVerifyCollectionV1InstructionDataSerializer(
  _context: object
): Serializer<
  VerifyCollectionV1InstructionDataArgs,
  VerifyCollectionV1InstructionData
>;
export function getVerifyCollectionV1InstructionDataSerializer(): Serializer<
  VerifyCollectionV1InstructionDataArgs,
  VerifyCollectionV1InstructionData
>;
export function getVerifyCollectionV1InstructionDataSerializer(
  _context: object = {}
): Serializer<
  VerifyCollectionV1InstructionDataArgs,
  VerifyCollectionV1InstructionData
> {
  return mapSerializer<
    VerifyCollectionV1InstructionDataArgs,
    any,
    VerifyCollectionV1InstructionData
  >(
    struct<VerifyCollectionV1InstructionData>(
      [
        ['discriminator', u8()],
        ['verifyCollectionV1Discriminator', u8()],
      ],
      { description: 'VerifyCollectionV1InstructionData' }
    ),
    (value) => ({
      ...value,
      discriminator: 52,
      verifyCollectionV1Discriminator: 1,
    })
  ) as Serializer<
    VerifyCollectionV1InstructionDataArgs,
    VerifyCollectionV1InstructionData
  >;
}

// Instruction.
export function verifyCollectionV1(
  context: Pick<Context, 'programs' | 'eddsa' | 'identity'>,
  input: VerifyCollectionV1InstructionAccounts
): TransactionBuilder {
  const signers: Signer[] = [];
  const keys: AccountMeta[] = [];

  // Program ID.
  const programId = context.programs.getPublicKey(
    'mplTokenMetadata',
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
    'collectionMasterEdition',
    input.collectionMasterEdition
      ? ([input.collectionMasterEdition, false] as const)
      : ([
          findMasterEditionPda(context, {
            mint: publicKey(input.collectionMint, false),
          }),
          false,
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
  addAccountMeta(
    keys,
    signers,
    resolvedAccounts.collectionMasterEdition,
    false
  );
  addAccountMeta(keys, signers, resolvedAccounts.systemProgram, false);
  addAccountMeta(keys, signers, resolvedAccounts.sysvarInstructions, false);

  // Data.
  const data = getVerifyCollectionV1InstructionDataSerializer().serialize({});

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
