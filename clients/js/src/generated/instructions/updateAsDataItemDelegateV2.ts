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
  array,
  mapSerializer,
  option,
  string,
  struct,
  u16,
  u8,
} from '@metaplex-foundation/umi/serializers';
import { resolveAuthorizationRulesProgram } from '../../hooked';
import { findMetadataDelegateRecordPda, findMetadataPda } from '../accounts';
import { PickPartial, addAccountMeta, addObjectProperty } from '../shared';
import {
  AuthorizationData,
  AuthorizationDataArgs,
  Creator,
  CreatorArgs,
  MetadataDelegateRole,
  getAuthorizationDataSerializer,
  getCreatorSerializer,
} from '../types';

// Accounts.
export type UpdateAsDataItemDelegateV2InstructionAccounts = {
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
export type UpdateAsDataItemDelegateV2InstructionData = {
  discriminator: number;
  updateAsDataItemDelegateV2Discriminator: number;
  data: Option<{
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: Option<Array<Creator>>;
  }>;
  authorizationData: Option<AuthorizationData>;
};

export type UpdateAsDataItemDelegateV2InstructionDataArgs = {
  data?: OptionOrNullable<{
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: OptionOrNullable<Array<CreatorArgs>>;
  }>;
  authorizationData?: OptionOrNullable<AuthorizationDataArgs>;
};

/** @deprecated Use `getUpdateAsDataItemDelegateV2InstructionDataSerializer()` without any argument instead. */
export function getUpdateAsDataItemDelegateV2InstructionDataSerializer(
  _context: object
): Serializer<
  UpdateAsDataItemDelegateV2InstructionDataArgs,
  UpdateAsDataItemDelegateV2InstructionData
>;
export function getUpdateAsDataItemDelegateV2InstructionDataSerializer(): Serializer<
  UpdateAsDataItemDelegateV2InstructionDataArgs,
  UpdateAsDataItemDelegateV2InstructionData
>;
export function getUpdateAsDataItemDelegateV2InstructionDataSerializer(
  _context: object = {}
): Serializer<
  UpdateAsDataItemDelegateV2InstructionDataArgs,
  UpdateAsDataItemDelegateV2InstructionData
> {
  return mapSerializer<
    UpdateAsDataItemDelegateV2InstructionDataArgs,
    any,
    UpdateAsDataItemDelegateV2InstructionData
  >(
    struct<UpdateAsDataItemDelegateV2InstructionData>(
      [
        ['discriminator', u8()],
        ['updateAsDataItemDelegateV2Discriminator', u8()],
        [
          'data',
          option(
            struct<any>([
              ['name', string()],
              ['symbol', string()],
              ['uri', string()],
              ['sellerFeeBasisPoints', u16()],
              ['creators', option(array(getCreatorSerializer()))],
            ])
          ),
        ],
        ['authorizationData', option(getAuthorizationDataSerializer())],
      ],
      { description: 'UpdateAsDataItemDelegateV2InstructionData' }
    ),
    (value) => ({
      ...value,
      discriminator: 50,
      updateAsDataItemDelegateV2Discriminator: 6,
      data: value.data ?? none(),
      authorizationData: value.authorizationData ?? none(),
    })
  ) as Serializer<
    UpdateAsDataItemDelegateV2InstructionDataArgs,
    UpdateAsDataItemDelegateV2InstructionData
  >;
}

// Extra Args.
export type UpdateAsDataItemDelegateV2InstructionExtraArgs = {
  updateAuthority: PublicKey;
};

// Args.
export type UpdateAsDataItemDelegateV2InstructionArgs = PickPartial<
  UpdateAsDataItemDelegateV2InstructionDataArgs &
    UpdateAsDataItemDelegateV2InstructionExtraArgs,
  'updateAuthority'
>;

// Instruction.
export function updateAsDataItemDelegateV2(
  context: Pick<Context, 'programs' | 'eddsa' | 'identity' | 'payer'>,
  input: UpdateAsDataItemDelegateV2InstructionAccounts &
    UpdateAsDataItemDelegateV2InstructionArgs
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
    'updateAuthority',
    input.updateAuthority ?? context.identity.publicKey
  );
  addObjectProperty(
    resolvedAccounts,
    'delegateRecord',
    input.delegateRecord
      ? ([input.delegateRecord, false] as const)
      : ([
          findMetadataDelegateRecordPda(context, {
            mint: publicKey(input.mint, false),
            delegateRole: MetadataDelegateRole.DataItem,
            updateAuthority: resolvingArgs.updateAuthority,
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
    getUpdateAsDataItemDelegateV2InstructionDataSerializer().serialize(
      resolvedArgs
    );

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
