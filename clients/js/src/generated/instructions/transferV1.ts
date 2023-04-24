/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-essentials';
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
import {
  resolveAuthorizationRulesProgram,
  resolveDestinationTokenRecord,
  resolveMasterEditionForProgrammables,
  resolveTokenRecord,
} from '../../hooked';
import { findMetadataPda } from '../accounts';
import { addObjectProperty, isWritable } from '../shared';
import {
  AuthorizationData,
  AuthorizationDataArgs,
  TokenStandardArgs,
  getAuthorizationDataSerializer,
} from '../types';

// Accounts.
export type TransferV1InstructionAccounts = {
  /** Token account */
  token?: PublicKey;
  /** Token account owner */
  tokenOwner?: PublicKey;
  /** Destination token account */
  destinationToken?: PublicKey;
  /** Destination token account owner */
  destinationOwner: PublicKey;
  /** Mint of token asset */
  mint: PublicKey;
  /** Metadata (pda of ['metadata', program id, mint id]) */
  metadata?: PublicKey;
  /** Edition of token asset */
  edition?: PublicKey;
  /** Owner token record account */
  tokenRecord?: PublicKey;
  /** Destination token record account */
  destinationTokenRecord?: PublicKey;
  /** Transfer authority (token owner or delegate) */
  authority?: Signer;
  /** Payer */
  payer?: Signer;
  /** System Program */
  systemProgram?: PublicKey;
  /** Instructions sysvar account */
  sysvarInstructions?: PublicKey;
  /** SPL Token Program */
  splTokenProgram?: PublicKey;
  /** SPL Associated Token Account program */
  splAtaProgram?: PublicKey;
  /** Token Authorization Rules Program */
  authorizationRulesProgram?: PublicKey;
  /** Token Authorization Rules account */
  authorizationRules?: PublicKey;
};

// Data.
export type TransferV1InstructionData = {
  discriminator: number;
  transferV1Discriminator: number;
  amount: bigint;
  authorizationData: Option<AuthorizationData>;
};

export type TransferV1InstructionDataArgs = {
  amount?: number | bigint;
  authorizationData?: Option<AuthorizationDataArgs>;
};

export function getTransferV1InstructionDataSerializer(
  context: Pick<Context, 'serializer'>
): Serializer<TransferV1InstructionDataArgs, TransferV1InstructionData> {
  const s = context.serializer;
  return mapSerializer<
    TransferV1InstructionDataArgs,
    TransferV1InstructionData,
    TransferV1InstructionData
  >(
    s.struct<TransferV1InstructionData>(
      [
        ['discriminator', s.u8()],
        ['transferV1Discriminator', s.u8()],
        ['amount', s.u64()],
        [
          'authorizationData',
          s.option(getAuthorizationDataSerializer(context)),
        ],
      ],
      { description: 'TransferV1InstructionData' }
    ),
    (value) =>
      ({
        ...value,
        discriminator: 49,
        transferV1Discriminator: 0,
        amount: value.amount ?? 1,
        authorizationData: value.authorizationData ?? none(),
      } as TransferV1InstructionData)
  ) as Serializer<TransferV1InstructionDataArgs, TransferV1InstructionData>;
}

// Extra Args.
export type TransferV1InstructionExtraArgs = {
  tokenStandard: TokenStandardArgs;
};

// Args.
export type TransferV1InstructionArgs = TransferV1InstructionDataArgs &
  TransferV1InstructionExtraArgs;

// Instruction.
export function transferV1(
  context: Pick<
    Context,
    'serializer' | 'programs' | 'eddsa' | 'identity' | 'payer'
  >,
  input: TransferV1InstructionAccounts & TransferV1InstructionArgs
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
    'tokenOwner',
    input.tokenOwner ?? context.identity.publicKey
  );
  addObjectProperty(
    resolvingAccounts,
    'token',
    input.token ??
      findAssociatedTokenPda(context, {
        mint: publicKey(input.mint),
        owner: publicKey(resolvingAccounts.tokenOwner),
      })
  );
  addObjectProperty(
    resolvingAccounts,
    'destinationToken',
    input.destinationToken ??
      findAssociatedTokenPda(context, {
        mint: publicKey(input.mint),
        owner: publicKey(input.destinationOwner),
      })
  );
  addObjectProperty(
    resolvingAccounts,
    'metadata',
    input.metadata ?? findMetadataPda(context, { mint: publicKey(input.mint) })
  );
  addObjectProperty(
    resolvingAccounts,
    'edition',
    input.edition ??
      resolveMasterEditionForProgrammables(
        context,
        { ...input, ...resolvingAccounts },
        { ...input, ...resolvingArgs },
        programId
      )
  );
  addObjectProperty(
    resolvingAccounts,
    'tokenRecord',
    input.tokenRecord ??
      resolveTokenRecord(
        context,
        { ...input, ...resolvingAccounts },
        { ...input, ...resolvingArgs },
        programId
      )
  );
  addObjectProperty(
    resolvingAccounts,
    'destinationTokenRecord',
    input.destinationTokenRecord ??
      resolveDestinationTokenRecord(
        context,
        { ...input, ...resolvingAccounts },
        { ...input, ...resolvingArgs },
        programId
      )
  );
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
    input.splTokenProgram ?? {
      ...context.programs.getPublicKey(
        'splToken',
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
      ),
      isWritable: false,
    }
  );
  addObjectProperty(
    resolvingAccounts,
    'splAtaProgram',
    input.splAtaProgram ?? {
      ...context.programs.getPublicKey(
        'splAssociatedToken',
        'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
      ),
      isWritable: false,
    }
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

  // Token.
  keys.push({
    pubkey: resolvedAccounts.token,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.token, true),
  });

  // Token Owner.
  keys.push({
    pubkey: resolvedAccounts.tokenOwner,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.tokenOwner, false),
  });

  // Destination Token.
  keys.push({
    pubkey: resolvedAccounts.destinationToken,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.destinationToken, true),
  });

  // Destination Owner.
  keys.push({
    pubkey: resolvedAccounts.destinationOwner,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.destinationOwner, false),
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

  // Destination Token Record.
  keys.push({
    pubkey: resolvedAccounts.destinationTokenRecord,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.destinationTokenRecord, true),
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

  // Spl Ata Program.
  keys.push({
    pubkey: resolvedAccounts.splAtaProgram,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.splAtaProgram, false),
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
    getTransferV1InstructionDataSerializer(context).serialize(resolvedArgs);

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
