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
  none,
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
export type LockV1InstructionAccounts = {
  /** Delegate or freeze authority */
  authority?: Signer;
  /** Token owner account */
  tokenOwner?: PublicKey;
  /** Token account */
  token: PublicKey;
  /** Mint account */
  mint: PublicKey;
  /** Metadata account */
  metadata?: PublicKey;
  /** Edition account */
  edition?: PublicKey;
  /** Token record account */
  tokenRecord?: PublicKey;
  /** Payer */
  payer?: Signer;
  /** System program */
  systemProgram?: PublicKey;
  /** System program */
  sysvarInstructions?: PublicKey;
  /** SPL Token Program */
  splTokenProgram?: PublicKey;
  /** Token Authorization Rules Program */
  authorizationRulesProgram?: PublicKey;
  /** Token Authorization Rules account */
  authorizationRules?: PublicKey;
};

// Data.
export type LockV1InstructionData = {
  discriminator: number;
  lockV1Discriminator: number;
  authorizationData: Option<AuthorizationData>;
};

export type LockV1InstructionDataArgs = {
  authorizationData?: Option<AuthorizationDataArgs>;
};

export function getLockV1InstructionDataSerializer(
  context: Pick<Context, 'serializer'>
): Serializer<LockV1InstructionDataArgs, LockV1InstructionData> {
  const s = context.serializer;
  return mapSerializer<
    LockV1InstructionDataArgs,
    LockV1InstructionData,
    LockV1InstructionData
  >(
    s.struct<LockV1InstructionData>(
      [
        ['discriminator', s.u8()],
        ['lockV1Discriminator', s.u8()],
        [
          'authorizationData',
          s.option(getAuthorizationDataSerializer(context)),
        ],
      ],
      { description: 'LockV1InstructionData' }
    ),
    (value) =>
      ({
        ...value,
        discriminator: 46,
        lockV1Discriminator: 0,
        authorizationData: value.authorizationData ?? none(),
      } as LockV1InstructionData)
  ) as Serializer<LockV1InstructionDataArgs, LockV1InstructionData>;
}

// Args.
export type LockV1InstructionArgs = LockV1InstructionDataArgs;

// Instruction.
export function lockV1(
  context: Pick<
    Context,
    'serializer' | 'programs' | 'eddsa' | 'identity' | 'payer'
  >,
  input: LockV1InstructionAccounts & LockV1InstructionArgs
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
    'authority',
    input.authority ?? context.identity
  );
  addObjectProperty(
    resolvingAccounts,
    'tokenOwner',
    input.tokenOwner ?? programId
  );
  addObjectProperty(
    resolvingAccounts,
    'metadata',
    input.metadata ?? findMetadataPda(context, { mint: publicKey(input.mint) })
  );
  addObjectProperty(resolvingAccounts, 'edition', input.edition ?? programId);
  addObjectProperty(
    resolvingAccounts,
    'tokenRecord',
    input.tokenRecord ?? programId
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

  // Authority.
  signers.push(resolvedAccounts.authority);
  keys.push({
    pubkey: resolvedAccounts.authority.publicKey,
    isSigner: true,
    isWritable: isWritable(resolvedAccounts.authority, false),
  });

  // Token Owner.
  keys.push({
    pubkey: resolvedAccounts.tokenOwner,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.tokenOwner, false),
  });

  // Token.
  keys.push({
    pubkey: resolvedAccounts.token,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.token, true),
  });

  // Mint.
  keys.push({
    pubkey: resolvedAccounts.mint,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.mint, false),
  });

  // Metadata.
  keys.push({
    pubkey: resolvedAccounts.metadata,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.metadata, true),
  });

  // Edition.
  keys.push({
    pubkey: resolvedAccounts.edition,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.edition, false),
  });

  // Token Record.
  keys.push({
    pubkey: resolvedAccounts.tokenRecord,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.tokenRecord, true),
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
    getLockV1InstructionDataSerializer(context).serialize(resolvedArgs);

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
