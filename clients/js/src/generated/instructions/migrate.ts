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
import { resolveAuthorizationRulesProgram } from '../../hooked';
import {
  findMasterEditionPda,
  findMetadataPda,
  findTokenRecordPda,
} from '../accounts';
import { addAccountMeta, addObjectProperty } from '../shared';

// Accounts.
export type MigrateInstructionAccounts = {
  /** Metadata account */
  metadata?: PublicKey | Pda;
  /** Edition account */
  edition?: PublicKey | Pda;
  /** Token account */
  token: PublicKey | Pda;
  /** Token account owner */
  tokenOwner: PublicKey | Pda;
  /** Mint account */
  mint: PublicKey | Pda;
  /** Payer */
  payer?: Signer;
  /** Update authority */
  authority?: Signer;
  /** Collection metadata account */
  collectionMetadata: PublicKey | Pda;
  /** Delegate record account */
  delegateRecord: PublicKey | Pda;
  /** Token record account */
  tokenRecord?: PublicKey | Pda;
  /** System program */
  systemProgram?: PublicKey | Pda;
  /** Instruction sysvar account */
  sysvarInstructions?: PublicKey | Pda;
  /** SPL Token Program */
  splTokenProgram?: PublicKey | Pda;
  /** Token Authorization Rules Program */
  authorizationRulesProgram?: PublicKey | Pda;
  /** Token Authorization Rules account */
  authorizationRules?: PublicKey | Pda;
};

// Data.
export type MigrateInstructionData = { discriminator: number };

export type MigrateInstructionDataArgs = {};

/** @deprecated Use `getMigrateInstructionDataSerializer()` without any argument instead. */
export function getMigrateInstructionDataSerializer(
  _context: object
): Serializer<MigrateInstructionDataArgs, MigrateInstructionData>;
export function getMigrateInstructionDataSerializer(): Serializer<
  MigrateInstructionDataArgs,
  MigrateInstructionData
>;
export function getMigrateInstructionDataSerializer(
  _context: object = {}
): Serializer<MigrateInstructionDataArgs, MigrateInstructionData> {
  return mapSerializer<MigrateInstructionDataArgs, any, MigrateInstructionData>(
    struct<MigrateInstructionData>([['discriminator', u8()]], {
      description: 'MigrateInstructionData',
    }),
    (value) => ({ ...value, discriminator: 48 })
  ) as Serializer<MigrateInstructionDataArgs, MigrateInstructionData>;
}

// Instruction.
export function migrate(
  context: Pick<Context, 'programs' | 'eddsa' | 'identity' | 'payer'>,
  input: MigrateInstructionAccounts
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
    token: [input.token, true] as const,
    tokenOwner: [input.tokenOwner, false] as const,
    mint: [input.mint, false] as const,
    collectionMetadata: [input.collectionMetadata, false] as const,
    delegateRecord: [input.delegateRecord, false] as const,
  };
  const resolvingArgs = {};
  addObjectProperty(
    resolvedAccounts,
    'metadata',
    input.metadata
      ? ([input.metadata, true] as const)
      : ([
          findMetadataPda(context, { mint: publicKey(input.mint, false) }),
          true,
        ] as const)
  );
  addObjectProperty(
    resolvedAccounts,
    'edition',
    input.edition
      ? ([input.edition, true] as const)
      : ([
          findMasterEditionPda(context, { mint: publicKey(input.mint, false) }),
          true,
        ] as const)
  );
  addObjectProperty(
    resolvedAccounts,
    'payer',
    input.payer
      ? ([input.payer, true] as const)
      : ([context.payer, true] as const)
  );
  addObjectProperty(
    resolvedAccounts,
    'authority',
    input.authority
      ? ([input.authority, false] as const)
      : ([context.identity, false] as const)
  );
  addObjectProperty(
    resolvedAccounts,
    'tokenRecord',
    input.tokenRecord
      ? ([input.tokenRecord, true] as const)
      : ([
          findTokenRecordPda(context, {
            mint: publicKey(input.mint, false),
            token: publicKey(input.token, false),
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
  addObjectProperty(
    resolvedAccounts,
    'splTokenProgram',
    input.splTokenProgram
      ? ([input.splTokenProgram, false] as const)
      : ([
          context.programs.getPublicKey(
            'splToken',
            'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
          ),
          false,
        ] as const)
  );
  addObjectProperty(
    resolvedAccounts,
    'authorizationRules',
    input.authorizationRules
      ? ([input.authorizationRules, false] as const)
      : ([programId, false] as const)
  );
  addObjectProperty(
    resolvedAccounts,
    'authorizationRulesProgram',
    input.authorizationRulesProgram
      ? ([input.authorizationRulesProgram, false] as const)
      : resolveAuthorizationRulesProgram(
          context,
          { ...input, ...resolvedAccounts },
          { ...input, ...resolvingArgs },
          programId,
          false
        )
  );

  addAccountMeta(keys, signers, resolvedAccounts.metadata, false);
  addAccountMeta(keys, signers, resolvedAccounts.edition, false);
  addAccountMeta(keys, signers, resolvedAccounts.token, false);
  addAccountMeta(keys, signers, resolvedAccounts.tokenOwner, false);
  addAccountMeta(keys, signers, resolvedAccounts.mint, false);
  addAccountMeta(keys, signers, resolvedAccounts.payer, false);
  addAccountMeta(keys, signers, resolvedAccounts.authority, false);
  addAccountMeta(keys, signers, resolvedAccounts.collectionMetadata, false);
  addAccountMeta(keys, signers, resolvedAccounts.delegateRecord, false);
  addAccountMeta(keys, signers, resolvedAccounts.tokenRecord, false);
  addAccountMeta(keys, signers, resolvedAccounts.systemProgram, false);
  addAccountMeta(keys, signers, resolvedAccounts.sysvarInstructions, false);
  addAccountMeta(keys, signers, resolvedAccounts.splTokenProgram, false);
  addAccountMeta(
    keys,
    signers,
    resolvedAccounts.authorizationRulesProgram,
    false
  );
  addAccountMeta(keys, signers, resolvedAccounts.authorizationRules, false);

  // Data.
  const data = getMigrateInstructionDataSerializer().serialize({});

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
