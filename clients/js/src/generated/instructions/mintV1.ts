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
  resolveMasterEdition,
  resolveMintTokenOwner,
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
export type MintV1InstructionAccounts = {
  /** Token or Associated Token account */
  token?: PublicKey;
  /** Owner of the token account */
  tokenOwner?: PublicKey;
  /** Metadata account (pda of ['metadata', program id, mint id]) */
  metadata?: PublicKey;
  /** Master Edition account */
  masterEdition?: PublicKey;
  /** Token record account */
  tokenRecord?: PublicKey;
  /** Mint of token asset */
  mint: PublicKey;
  /** (Mint or Update) authority */
  authority?: Signer;
  /** Metadata delegate record */
  delegateRecord?: PublicKey;
  /** Payer */
  payer?: Signer;
  /** System program */
  systemProgram?: PublicKey;
  /** Instructions sysvar account */
  sysvarInstructions?: PublicKey;
  /** SPL Token program */
  splTokenProgram?: PublicKey;
  /** SPL Associated Token Account program */
  splAtaProgram?: PublicKey;
  /** Token Authorization Rules program */
  authorizationRulesProgram?: PublicKey;
  /** Token Authorization Rules account */
  authorizationRules?: PublicKey;
};

// Data.
export type MintV1InstructionData = {
  discriminator: number;
  mintV1Discriminator: number;
  amount: bigint;
  authorizationData: Option<AuthorizationData>;
};

export type MintV1InstructionDataArgs = {
  amount: number | bigint;
  authorizationData?: Option<AuthorizationDataArgs>;
};

export function getMintV1InstructionDataSerializer(
  context: Pick<Context, 'serializer'>
): Serializer<MintV1InstructionDataArgs, MintV1InstructionData> {
  const s = context.serializer;
  return mapSerializer<
    MintV1InstructionDataArgs,
    MintV1InstructionData,
    MintV1InstructionData
  >(
    s.struct<MintV1InstructionData>(
      [
        ['discriminator', s.u8()],
        ['mintV1Discriminator', s.u8()],
        ['amount', s.u64()],
        [
          'authorizationData',
          s.option(getAuthorizationDataSerializer(context)),
        ],
      ],
      { description: 'MintV1InstructionData' }
    ),
    (value) =>
      ({
        ...value,
        discriminator: 43,
        mintV1Discriminator: 0,
        authorizationData: value.authorizationData ?? none(),
      } as MintV1InstructionData)
  ) as Serializer<MintV1InstructionDataArgs, MintV1InstructionData>;
}

// Extra Args.
export type MintV1InstructionExtraArgs = { tokenStandard: TokenStandardArgs };

// Args.
export type MintV1InstructionArgs = MintV1InstructionDataArgs &
  MintV1InstructionExtraArgs;

// Instruction.
export function mintV1(
  context: Pick<
    Context,
    'serializer' | 'programs' | 'eddsa' | 'identity' | 'payer'
  >,
  input: MintV1InstructionAccounts & MintV1InstructionArgs
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
    input.tokenOwner ??
      resolveMintTokenOwner(
        context,
        { ...input, ...resolvingAccounts },
        { ...input, ...resolvingArgs },
        programId
      )
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
    'metadata',
    input.metadata ?? findMetadataPda(context, { mint: publicKey(input.mint) })
  );
  addObjectProperty(
    resolvingAccounts,
    'masterEdition',
    input.masterEdition ??
      resolveMasterEdition(
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
    'authority',
    input.authority ?? context.identity
  );
  addObjectProperty(
    resolvingAccounts,
    'delegateRecord',
    input.delegateRecord ?? programId
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

  // Metadata.
  keys.push({
    pubkey: resolvedAccounts.metadata,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.metadata, false),
  });

  // Master Edition.
  keys.push({
    pubkey: resolvedAccounts.masterEdition,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.masterEdition, true),
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
    isWritable: isWritable(resolvedAccounts.mint, true),
  });

  // Authority.
  signers.push(resolvedAccounts.authority);
  keys.push({
    pubkey: resolvedAccounts.authority.publicKey,
    isSigner: true,
    isWritable: isWritable(resolvedAccounts.authority, false),
  });

  // Delegate Record.
  keys.push({
    pubkey: resolvedAccounts.delegateRecord,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.delegateRecord, false),
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
    getMintV1InstructionDataSerializer(context).serialize(resolvedArgs);

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 468;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
