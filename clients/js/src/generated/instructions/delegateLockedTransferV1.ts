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
  Option,
  PublicKey,
  Serializer,
  Signer,
  TransactionBuilder,
  mapSerializer,
  publicKey,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import { resolveAuthorizationRulesProgram } from '../../hooked';
import { findMetadataPda } from '../accounts';
import { addObjectProperty, isWritable } from '../shared';
import {
  AuthorizationData,
  AuthorizationDataArgs,
  getAuthorizationDataSerializer,
} from '../types';

// Accounts.
export type DelegateLockedTransferV1InstructionAccounts = {
  /** Delegate record account */
  delegateRecord?: PublicKey;
  /** Owner of the delegated account */
  delegate: PublicKey;
  /** Metadata account */
  metadata?: PublicKey;
  /** Master Edition account */
  masterEdition?: PublicKey;
  /** Token record account */
  tokenRecord?: PublicKey;
  /** Mint of metadata */
  mint: PublicKey;
  /** Token account of mint */
  token?: PublicKey;
  /** Update authority or token owner */
  authority?: Signer;
  /** Payer */
  payer?: Signer;
  /** System Program */
  systemProgram?: PublicKey;
  /** Instructions sysvar account */
  sysvarInstructions?: PublicKey;
  /** SPL Token Program */
  splTokenProgram?: PublicKey;
  /** Token Authorization Rules Program */
  authorizationRulesProgram?: PublicKey;
  /** Token Authorization Rules account */
  authorizationRules?: PublicKey;
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
  amount: number | bigint;
  lockedAddress: PublicKey;
  authorizationData: Option<AuthorizationDataArgs>;
};

export function getDelegateLockedTransferV1InstructionDataSerializer(
  context: Pick<Context, 'serializer'>
): Serializer<
  DelegateLockedTransferV1InstructionDataArgs,
  DelegateLockedTransferV1InstructionData
> {
  const s = context.serializer;
  return mapSerializer<
    DelegateLockedTransferV1InstructionDataArgs,
    DelegateLockedTransferV1InstructionData,
    DelegateLockedTransferV1InstructionData
  >(
    s.struct<DelegateLockedTransferV1InstructionData>(
      [
        ['discriminator', s.u8()],
        ['delegateLockedTransferV1Discriminator', s.u8()],
        ['amount', s.u64()],
        ['lockedAddress', s.publicKey()],
        [
          'authorizationData',
          s.option(getAuthorizationDataSerializer(context)),
        ],
      ],
      { description: 'DelegateLockedTransferV1InstructionData' }
    ),
    (value) =>
      ({
        ...value,
        discriminator: 44,
        delegateLockedTransferV1Discriminator: 7,
      } as DelegateLockedTransferV1InstructionData)
  ) as Serializer<
    DelegateLockedTransferV1InstructionDataArgs,
    DelegateLockedTransferV1InstructionData
  >;
}

// Args.
export type DelegateLockedTransferV1InstructionArgs =
  DelegateLockedTransferV1InstructionDataArgs;

// Instruction.
export function delegateLockedTransferV1(
  context: Pick<
    Context,
    'serializer' | 'programs' | 'eddsa' | 'identity' | 'payer'
  >,
  input: DelegateLockedTransferV1InstructionAccounts &
    DelegateLockedTransferV1InstructionArgs
): TransactionBuilder {
  const signers: Signer[] = [];
  const keys: AccountMeta[] = [];

  // Program ID.
  const programId = {
    ...context.programs.getPublicKey(
      'mplTokenMetadata',
      'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
    ),
    isWritable: false,
  };

  // Resolved inputs.
  const resolvingAccounts = {};
  const resolvingArgs = {};
  addObjectProperty(
    resolvingAccounts,
    'delegateRecord',
    input.delegateRecord ?? programId
  );
  addObjectProperty(
    resolvingAccounts,
    'metadata',
    input.metadata ?? findMetadataPda(context, { mint: publicKey(input.mint) })
  );
  addObjectProperty(
    resolvingAccounts,
    'masterEdition',
    input.masterEdition ?? programId
  );
  addObjectProperty(
    resolvingAccounts,
    'tokenRecord',
    input.tokenRecord ?? programId
  );
  addObjectProperty(resolvingAccounts, 'token', input.token ?? programId);
  addObjectProperty(
    resolvingAccounts,
    'authority',
    input.authority ?? context.identity
  );
  addObjectProperty(resolvingAccounts, 'payer', input.payer ?? context.payer);
  addObjectProperty(
    resolvingAccounts,
    'systemProgram',
    input.systemProgram ?? {
      ...context.programs.getPublicKey(
        'splSystem',
        '11111111111111111111111111111111'
      ),
      isWritable: false,
    }
  );
  addObjectProperty(
    resolvingAccounts,
    'sysvarInstructions',
    input.sysvarInstructions ??
      publicKey('Sysvar1nstructions1111111111111111111111111')
  );
  addObjectProperty(
    resolvingAccounts,
    'splTokenProgram',
    input.splTokenProgram ?? programId
  );
  addObjectProperty(
    resolvingAccounts,
    'authorizationRules',
    input.authorizationRules ?? programId
  );
  addObjectProperty(
    resolvingAccounts,
    'authorizationRulesProgram',
    input.authorizationRulesProgram ??
      resolveAuthorizationRulesProgram(
        context,
        { ...input, ...resolvingAccounts },
        { ...input, ...resolvingArgs },
        programId
      )
  );
  const resolvedAccounts = { ...input, ...resolvingAccounts };
  const resolvedArgs = { ...input, ...resolvingArgs };

  // Delegate Record.
  keys.push({
    pubkey: resolvedAccounts.delegateRecord,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.delegateRecord, true),
  });

  // Delegate.
  keys.push({
    pubkey: resolvedAccounts.delegate,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.delegate, false),
  });

  // Metadata.
  keys.push({
    pubkey: resolvedAccounts.metadata,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.metadata, true),
  });

  // Master Edition.
  keys.push({
    pubkey: resolvedAccounts.masterEdition,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.masterEdition, false),
  });

  // Token Record.
  keys.push({
    pubkey: resolvedAccounts.tokenRecord,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.tokenRecord, true),
  });

  // Mint.
  keys.push({
    pubkey: resolvedAccounts.mint,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.mint, false),
  });

  // Token.
  keys.push({
    pubkey: resolvedAccounts.token,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.token, true),
  });

  // Authority.
  signers.push(resolvedAccounts.authority);
  keys.push({
    pubkey: resolvedAccounts.authority.publicKey,
    isSigner: true,
    isWritable: isWritable(resolvedAccounts.authority, false),
  });

  // Payer.
  signers.push(resolvedAccounts.payer);
  keys.push({
    pubkey: resolvedAccounts.payer.publicKey,
    isSigner: true,
    isWritable: isWritable(resolvedAccounts.payer, true),
  });

  // System Program.
  keys.push({
    pubkey: resolvedAccounts.systemProgram,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.systemProgram, false),
  });

  // Sysvar Instructions.
  keys.push({
    pubkey: resolvedAccounts.sysvarInstructions,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.sysvarInstructions, false),
  });

  // Spl Token Program.
  keys.push({
    pubkey: resolvedAccounts.splTokenProgram,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.splTokenProgram, false),
  });

  // Authorization Rules Program.
  keys.push({
    pubkey: resolvedAccounts.authorizationRulesProgram,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.authorizationRulesProgram, false),
  });

  // Authorization Rules.
  keys.push({
    pubkey: resolvedAccounts.authorizationRules,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.authorizationRules, false),
  });

  // Data.
  const data =
    getDelegateLockedTransferV1InstructionDataSerializer(context).serialize(
      resolvedArgs
    );

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
