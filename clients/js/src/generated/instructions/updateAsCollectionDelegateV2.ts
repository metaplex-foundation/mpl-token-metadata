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
  struct,
  u8,
} from '@metaplex-foundation/umi/serializers';
import { resolveAuthorizationRulesProgram } from '../../hooked';
import { findMetadataDelegateRecordPda, findMetadataPda } from '../accounts';
import { PickPartial, addAccountMeta, addObjectProperty } from '../shared';
import {
  AuthorizationData,
  AuthorizationDataArgs,
  CollectionToggle,
  CollectionToggleArgs,
  MetadataDelegateRole,
  collectionToggle,
  getAuthorizationDataSerializer,
  getCollectionToggleSerializer,
} from '../types';

// Accounts.
export type UpdateAsCollectionDelegateV2InstructionAccounts = {
  /** Update authority or delegate */
  authority?: Signer;
  /** Delegate record PDA */
  delegateRecord?: PublicKey | Pda;
  /** Token account */
  token?: PublicKey | Pda;
  /** Mint account */
  mint: PublicKey | Pda;
  /** Metadata account */
  metadata?: PublicKey | Pda;
  /** Edition account */
  edition?: PublicKey | Pda;
  /** Payer */
  payer?: Signer;
  /** System program */
  systemProgram?: PublicKey | Pda;
  /** Instructions sysvar account */
  sysvarInstructions?: PublicKey | Pda;
  /** Token Authorization Rules Program */
  authorizationRulesProgram?: PublicKey | Pda;
  /** Token Authorization Rules account */
  authorizationRules?: PublicKey | Pda;
};

// Data.
export type UpdateAsCollectionDelegateV2InstructionData = {
  discriminator: number;
  updateAsCollectionDelegateV2Discriminator: number;
  collection: CollectionToggle;
  authorizationData: Option<AuthorizationData>;
};

export type UpdateAsCollectionDelegateV2InstructionDataArgs = {
  collection?: CollectionToggleArgs;
  authorizationData?: OptionOrNullable<AuthorizationDataArgs>;
};

/** @deprecated Use `getUpdateAsCollectionDelegateV2InstructionDataSerializer()` without any argument instead. */
export function getUpdateAsCollectionDelegateV2InstructionDataSerializer(
  _context: object
): Serializer<
  UpdateAsCollectionDelegateV2InstructionDataArgs,
  UpdateAsCollectionDelegateV2InstructionData
>;
export function getUpdateAsCollectionDelegateV2InstructionDataSerializer(): Serializer<
  UpdateAsCollectionDelegateV2InstructionDataArgs,
  UpdateAsCollectionDelegateV2InstructionData
>;
export function getUpdateAsCollectionDelegateV2InstructionDataSerializer(
  _context: object = {}
): Serializer<
  UpdateAsCollectionDelegateV2InstructionDataArgs,
  UpdateAsCollectionDelegateV2InstructionData
> {
  return mapSerializer<
    UpdateAsCollectionDelegateV2InstructionDataArgs,
    any,
    UpdateAsCollectionDelegateV2InstructionData
  >(
    struct<UpdateAsCollectionDelegateV2InstructionData>(
      [
        ['discriminator', u8()],
        ['updateAsCollectionDelegateV2Discriminator', u8()],
        ['collection', getCollectionToggleSerializer()],
        ['authorizationData', option(getAuthorizationDataSerializer())],
      ],
      { description: 'UpdateAsCollectionDelegateV2InstructionData' }
    ),
    (value) => ({
      ...value,
      discriminator: 50,
      updateAsCollectionDelegateV2Discriminator: 3,
      collection: value.collection ?? collectionToggle('None'),
      authorizationData: value.authorizationData ?? none(),
    })
  ) as Serializer<
    UpdateAsCollectionDelegateV2InstructionDataArgs,
    UpdateAsCollectionDelegateV2InstructionData
  >;
}

// Extra Args.
export type UpdateAsCollectionDelegateV2InstructionExtraArgs = {
  delegateMint: PublicKey;
  delegateUpdateAuthority: PublicKey;
};

// Args.
export type UpdateAsCollectionDelegateV2InstructionArgs = PickPartial<
  UpdateAsCollectionDelegateV2InstructionDataArgs &
    UpdateAsCollectionDelegateV2InstructionExtraArgs,
  'delegateMint' | 'delegateUpdateAuthority'
>;

// Instruction.
export function updateAsCollectionDelegateV2(
  context: Pick<Context, 'programs' | 'eddsa' | 'identity' | 'payer'>,
  input: UpdateAsCollectionDelegateV2InstructionAccounts &
    UpdateAsCollectionDelegateV2InstructionArgs
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
    mint: [input.mint, false] as const,
  };
  const resolvingArgs = {};
  addObjectProperty(
    resolvedAccounts,
    'authority',
    input.authority
      ? ([input.authority, false] as const)
      : ([context.identity, false] as const)
  );
  addObjectProperty(
    resolvingArgs,
    'delegateMint',
    input.delegateMint ?? publicKey(input.mint, false)
  );
  addObjectProperty(
    resolvingArgs,
    'delegateUpdateAuthority',
    input.delegateUpdateAuthority ?? context.identity.publicKey
  );
  addObjectProperty(
    resolvedAccounts,
    'delegateRecord',
    input.delegateRecord
      ? ([input.delegateRecord, false] as const)
      : ([
          findMetadataDelegateRecordPda(context, {
            mint: resolvingArgs.delegateMint,
            delegateRole: MetadataDelegateRole.Collection,
            updateAuthority: resolvingArgs.delegateUpdateAuthority,
            delegate: publicKey(resolvedAccounts.authority[0], false),
          }),
          false,
        ] as const)
  );
  addObjectProperty(
    resolvedAccounts,
    'token',
    input.token
      ? ([input.token, false] as const)
      : ([programId, false] as const)
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
    'edition',
    input.edition
      ? ([input.edition, false] as const)
      : ([programId, false] as const)
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

  addAccountMeta(keys, signers, resolvedAccounts.authority, false);
  addAccountMeta(keys, signers, resolvedAccounts.delegateRecord, false);
  addAccountMeta(keys, signers, resolvedAccounts.token, false);
  addAccountMeta(keys, signers, resolvedAccounts.mint, false);
  addAccountMeta(keys, signers, resolvedAccounts.metadata, false);
  addAccountMeta(keys, signers, resolvedAccounts.edition, false);
  addAccountMeta(keys, signers, resolvedAccounts.payer, false);
  addAccountMeta(keys, signers, resolvedAccounts.systemProgram, false);
  addAccountMeta(keys, signers, resolvedAccounts.sysvarInstructions, false);
  addAccountMeta(
    keys,
    signers,
    resolvedAccounts.authorizationRulesProgram,
    false
  );
  addAccountMeta(keys, signers, resolvedAccounts.authorizationRules, false);

  // Data.
  const data =
    getUpdateAsCollectionDelegateV2InstructionDataSerializer().serialize(
      resolvedArgs
    );

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
