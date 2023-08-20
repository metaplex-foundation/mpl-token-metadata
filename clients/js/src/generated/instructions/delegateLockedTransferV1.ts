/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
import {
  AccountMeta,
  Context,
  Option,
  OptionOrNullable,
  Pda,
  PublicKey,
  Signer,
  TransactionBuilder,
  none,
  publicKey,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import {
  Serializer,
  mapSerializer,
  option,
  publicKey as publicKeySerializer,
  struct,
  u64,
  u8,
} from '@metaplex-foundation/umi/serializers';
import {
  resolveAuthorizationRulesProgram,
  resolveMasterEdition,
  resolveTokenRecord,
} from '../../hooked';
import { findMetadataPda, findTokenRecordPda } from '../accounts';
import { PickPartial, addAccountMeta, addObjectProperty } from '../shared';
import {
  AuthorizationData,
  AuthorizationDataArgs,
  TokenStandardArgs,
  getAuthorizationDataSerializer,
} from '../types';

// Accounts.
export type DelegateLockedTransferV1InstructionAccounts = {
  /** Delegate record account */
  delegateRecord?: PublicKey | Pda;
  /** Owner of the delegated account */
  delegate: PublicKey | Pda;
  /** Metadata account */
  metadata?: PublicKey | Pda;
  /** Master Edition account */
  masterEdition?: PublicKey | Pda;
  /** Token record account */
  tokenRecord?: PublicKey | Pda;
  /** Mint of metadata */
  mint: PublicKey | Pda;
  /** Token account of mint */
  token?: PublicKey | Pda;
  /** Update authority or token owner */
  authority?: Signer;
  /** Payer */
  payer?: Signer;
  /** System Program */
  systemProgram?: PublicKey | Pda;
  /** Instructions sysvar account */
  sysvarInstructions?: PublicKey | Pda;
  /** SPL Token Program */
  splTokenProgram?: PublicKey | Pda;
  /** Token Authorization Rules Program */
  authorizationRulesProgram?: PublicKey | Pda;
  /** Token Authorization Rules account */
  authorizationRules?: PublicKey | Pda;
};

// Data.
export type DelegateLockedTransferV1InstructionData = {
  discriminator: number;
  delegateLockedTransferV1Discriminator: number;
  amount: bigint;
  lockedAddress: PublicKey;
  authorizationData: Option<AuthorizationData>;
};

export type DelegateLockedTransferV1InstructionDataArgs = {
  amount?: number | bigint;
  lockedAddress: PublicKey;
  authorizationData?: OptionOrNullable<AuthorizationDataArgs>;
};

/** @deprecated Use `getDelegateLockedTransferV1InstructionDataSerializer()` without any argument instead. */
export function getDelegateLockedTransferV1InstructionDataSerializer(
  _context: object
): Serializer<
  DelegateLockedTransferV1InstructionDataArgs,
  DelegateLockedTransferV1InstructionData
>;
export function getDelegateLockedTransferV1InstructionDataSerializer(): Serializer<
  DelegateLockedTransferV1InstructionDataArgs,
  DelegateLockedTransferV1InstructionData
>;
export function getDelegateLockedTransferV1InstructionDataSerializer(
  _context: object = {}
): Serializer<
  DelegateLockedTransferV1InstructionDataArgs,
  DelegateLockedTransferV1InstructionData
> {
  return mapSerializer<
    DelegateLockedTransferV1InstructionDataArgs,
    any,
    DelegateLockedTransferV1InstructionData
  >(
    struct<DelegateLockedTransferV1InstructionData>(
      [
        ['discriminator', u8()],
        ['delegateLockedTransferV1Discriminator', u8()],
        ['amount', u64()],
        ['lockedAddress', publicKeySerializer()],
        ['authorizationData', option(getAuthorizationDataSerializer())],
      ],
      { description: 'DelegateLockedTransferV1InstructionData' }
    ),
    (value) => ({
      ...value,
      discriminator: 44,
      delegateLockedTransferV1Discriminator: 7,
      amount: value.amount ?? 1,
      authorizationData: value.authorizationData ?? none(),
    })
  ) as Serializer<
    DelegateLockedTransferV1InstructionDataArgs,
    DelegateLockedTransferV1InstructionData
  >;
}

// Extra Args.
export type DelegateLockedTransferV1InstructionExtraArgs = {
  tokenStandard: TokenStandardArgs;
  tokenOwner: PublicKey;
};

// Args.
export type DelegateLockedTransferV1InstructionArgs = PickPartial<
  DelegateLockedTransferV1InstructionDataArgs &
    DelegateLockedTransferV1InstructionExtraArgs,
  'tokenOwner'
>;

// Instruction.
export function delegateLockedTransferV1(
  context: Pick<Context, 'programs' | 'eddsa' | 'identity' | 'payer'>,
  input: DelegateLockedTransferV1InstructionAccounts &
    DelegateLockedTransferV1InstructionArgs
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
    delegate: [input.delegate, false] as const,
    mint: [input.mint, false] as const,
  };
  const resolvingArgs = {};
  addObjectProperty(
    resolvingArgs,
    'tokenOwner',
    input.tokenOwner ?? context.identity.publicKey
  );
  addObjectProperty(
    resolvedAccounts,
    'token',
    input.token
      ? ([input.token, true] as const)
      : ([
          findAssociatedTokenPda(context, {
            mint: publicKey(input.mint, false),
            owner: resolvingArgs.tokenOwner,
          }),
          true,
        ] as const)
  );
  addObjectProperty(
    resolvedAccounts,
    'delegateRecord',
    input.delegateRecord
      ? ([input.delegateRecord, true] as const)
      : ([
          findTokenRecordPda(context, {
            mint: publicKey(input.mint, false),
            token: publicKey(resolvedAccounts.token[0], false),
          }),
          true,
        ] as const)
  );
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
    'masterEdition',
    input.masterEdition
      ? ([input.masterEdition, false] as const)
      : resolveMasterEdition(
          context,
          { ...input, ...resolvedAccounts },
          { ...input, ...resolvingArgs },
          programId,
          false
        )
  );
  addObjectProperty(
    resolvedAccounts,
    'tokenRecord',
    input.tokenRecord
      ? ([input.tokenRecord, true] as const)
      : resolveTokenRecord(
          context,
          { ...input, ...resolvedAccounts },
          { ...input, ...resolvingArgs },
          programId,
          true
        )
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
    'payer',
    input.payer
      ? ([input.payer, true] as const)
      : ([context.payer, true] as const)
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
  const resolvedArgs = { ...input, ...resolvingArgs };

  addAccountMeta(keys, signers, resolvedAccounts.delegateRecord, false);
  addAccountMeta(keys, signers, resolvedAccounts.delegate, false);
  addAccountMeta(keys, signers, resolvedAccounts.metadata, false);
  addAccountMeta(keys, signers, resolvedAccounts.masterEdition, false);
  addAccountMeta(keys, signers, resolvedAccounts.tokenRecord, false);
  addAccountMeta(keys, signers, resolvedAccounts.mint, false);
  addAccountMeta(keys, signers, resolvedAccounts.token, false);
  addAccountMeta(keys, signers, resolvedAccounts.authority, false);
  addAccountMeta(keys, signers, resolvedAccounts.payer, false);
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
  const data =
    getDelegateLockedTransferV1InstructionDataSerializer().serialize(
      resolvedArgs
    );

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
