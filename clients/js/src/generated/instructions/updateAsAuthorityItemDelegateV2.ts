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
  TokenStandard,
  TokenStandardArgs,
  getAuthorizationDataSerializer,
  getTokenStandardSerializer,
} from '../types';

// Accounts.
export type UpdateAsAuthorityItemDelegateV2InstructionAccounts = {
  /** Update authority or delegate */
  authority?: Signer;
  /** Delegate record PDA */
  delegateRecord?: PublicKey;
  /** Token account */
  token?: PublicKey;
  /** Mint account */
  mint: PublicKey;
  /** Metadata account */
  metadata?: PublicKey;
  /** Edition account */
  edition?: PublicKey;
  /** Payer */
  payer?: Signer;
  /** System program */
  systemProgram?: PublicKey;
  /** Instructions sysvar account */
  sysvarInstructions?: PublicKey;
  /** Token Authorization Rules Program */
  authorizationRulesProgram?: PublicKey;
  /** Token Authorization Rules account */
  authorizationRules?: PublicKey;
};

// Data.
export type UpdateAsAuthorityItemDelegateV2InstructionData = {
  discriminator: number;
  updateAsAuthorityItemDelegateV2Discriminator: number;
  newUpdateAuthority: Option<PublicKey>;
  primarySaleHappened: Option<boolean>;
  isMutable: Option<boolean>;
  tokenStandard: Option<TokenStandard>;
  authorizationData: Option<AuthorizationData>;
};

export type UpdateAsAuthorityItemDelegateV2InstructionDataArgs = {
  newUpdateAuthority: Option<PublicKey>;
  primarySaleHappened: Option<boolean>;
  isMutable: Option<boolean>;
  tokenStandard: Option<TokenStandardArgs>;
  authorizationData?: Option<AuthorizationDataArgs>;
};

export function getUpdateAsAuthorityItemDelegateV2InstructionDataSerializer(
  context: Pick<Context, 'serializer'>
): Serializer<
  UpdateAsAuthorityItemDelegateV2InstructionDataArgs,
  UpdateAsAuthorityItemDelegateV2InstructionData
> {
  const s = context.serializer;
  return mapSerializer<
    UpdateAsAuthorityItemDelegateV2InstructionDataArgs,
    any,
    UpdateAsAuthorityItemDelegateV2InstructionData
  >(
    s.struct<UpdateAsAuthorityItemDelegateV2InstructionData>(
      [
        ['discriminator', s.u8()],
        ['updateAsAuthorityItemDelegateV2Discriminator', s.u8()],
        ['newUpdateAuthority', s.option(s.publicKey())],
        ['primarySaleHappened', s.option(s.bool())],
        ['isMutable', s.option(s.bool())],
        ['tokenStandard', s.option(getTokenStandardSerializer(context))],
        [
          'authorizationData',
          s.option(getAuthorizationDataSerializer(context)),
        ],
      ],
      { description: 'UpdateAsAuthorityItemDelegateV2InstructionData' }
    ),
    (value) => ({
      ...value,
      discriminator: 50,
      updateAsAuthorityItemDelegateV2Discriminator: 2,
      authorizationData: value.authorizationData ?? none(),
    })
  ) as Serializer<
    UpdateAsAuthorityItemDelegateV2InstructionDataArgs,
    UpdateAsAuthorityItemDelegateV2InstructionData
  >;
}

// Args.
export type UpdateAsAuthorityItemDelegateV2InstructionArgs =
  UpdateAsAuthorityItemDelegateV2InstructionDataArgs;

// Instruction.
export function updateAsAuthorityItemDelegateV2(
  context: Pick<
    Context,
    'serializer' | 'programs' | 'eddsa' | 'identity' | 'payer'
  >,
  input: UpdateAsAuthorityItemDelegateV2InstructionAccounts &
    UpdateAsAuthorityItemDelegateV2InstructionArgs
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
    'delegateRecord',
    input.delegateRecord ?? programId
  );
  addObjectProperty(resolvingAccounts, 'token', input.token ?? programId);
  addObjectProperty(
    resolvingAccounts,
    'metadata',
    input.metadata ?? findMetadataPda(context, { mint: publicKey(input.mint) })
  );
  addObjectProperty(resolvingAccounts, 'edition', input.edition ?? programId);
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

  // Delegate Record.
  keys.push({
    pubkey: resolvedAccounts.delegateRecord,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.delegateRecord, false),
  });

  // Token.
  keys.push({
    pubkey: resolvedAccounts.token,
    isSigner: false,
    isWritable: isWritable(resolvedAccounts.token, false),
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
    getUpdateAsAuthorityItemDelegateV2InstructionDataSerializer(
      context
    ).serialize(resolvedArgs);

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
