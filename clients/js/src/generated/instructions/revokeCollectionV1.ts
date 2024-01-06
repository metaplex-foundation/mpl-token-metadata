/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import {
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
import { resolveIsNonFungible } from '../../hooked';
import {
  findMasterEditionPda,
  findMetadataDelegateRecordPda,
  findMetadataPda,
} from '../accounts';
import {
  PickPartial,
  ResolvedAccount,
  ResolvedAccountsWithIndices,
  expectPublicKey,
  expectSome,
  getAccountMetasAndSigners,
} from '../shared';
import { MetadataDelegateRole, TokenStandardArgs } from '../types';

// Accounts.
export type RevokeCollectionV1InstructionAccounts = {
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
export type RevokeCollectionV1InstructionData = {
  discriminator: number;
  revokeCollectionV1Discriminator: number;
};

export type RevokeCollectionV1InstructionDataArgs = {};

export function getRevokeCollectionV1InstructionDataSerializer(): Serializer<
  RevokeCollectionV1InstructionDataArgs,
  RevokeCollectionV1InstructionData
> {
  return mapSerializer<
    RevokeCollectionV1InstructionDataArgs,
    any,
    RevokeCollectionV1InstructionData
  >(
    struct<RevokeCollectionV1InstructionData>(
      [
        ['discriminator', u8()],
        ['revokeCollectionV1Discriminator', u8()],
      ],
      { description: 'RevokeCollectionV1InstructionData' }
    ),
    (value) => ({
      ...value,
      discriminator: 45,
      revokeCollectionV1Discriminator: 0,
    })
  ) as Serializer<
    RevokeCollectionV1InstructionDataArgs,
    RevokeCollectionV1InstructionData
  >;
}

// Extra Args.
export type RevokeCollectionV1InstructionExtraArgs = {
  tokenStandard: TokenStandardArgs;
  updateAuthority: PublicKey;
};

// Args.
export type RevokeCollectionV1InstructionArgs = PickPartial<
  RevokeCollectionV1InstructionExtraArgs,
  'updateAuthority'
>;

// Instruction.
export function revokeCollectionV1(
  context: Pick<Context, 'eddsa' | 'identity' | 'payer' | 'programs'>,
  input: RevokeCollectionV1InstructionAccounts &
    RevokeCollectionV1InstructionArgs
): TransactionBuilder {
  // Program ID.
  const programId = context.programs.getPublicKey(
    'mplTokenMetadata',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  );

  // Accounts.
  const resolvedAccounts = {
    delegateRecord: {
      index: 0,
      isWritable: true as boolean,
      value: input.delegateRecord ?? null,
    },
    delegate: {
      index: 1,
      isWritable: false as boolean,
      value: input.delegate ?? null,
    },
    metadata: {
      index: 2,
      isWritable: true as boolean,
      value: input.metadata ?? null,
    },
    masterEdition: {
      index: 3,
      isWritable: false as boolean,
      value: input.masterEdition ?? null,
    },
    tokenRecord: {
      index: 4,
      isWritable: true as boolean,
      value: input.tokenRecord ?? null,
    },
    mint: { index: 5, isWritable: false as boolean, value: input.mint ?? null },
    token: {
      index: 6,
      isWritable: true as boolean,
      value: input.token ?? null,
    },
    authority: {
      index: 7,
      isWritable: false as boolean,
      value: input.authority ?? null,
    },
    payer: {
      index: 8,
      isWritable: true as boolean,
      value: input.payer ?? null,
    },
    systemProgram: {
      index: 9,
      isWritable: false as boolean,
      value: input.systemProgram ?? null,
    },
    sysvarInstructions: {
      index: 10,
      isWritable: false as boolean,
      value: input.sysvarInstructions ?? null,
    },
    splTokenProgram: {
      index: 11,
      isWritable: false as boolean,
      value: input.splTokenProgram ?? null,
    },
    authorizationRulesProgram: {
      index: 12,
      isWritable: false as boolean,
      value: input.authorizationRulesProgram ?? null,
    },
    authorizationRules: {
      index: 13,
      isWritable: false as boolean,
      value: input.authorizationRules ?? null,
    },
  } satisfies ResolvedAccountsWithIndices;

  // Arguments.
  const resolvedArgs: RevokeCollectionV1InstructionArgs = { ...input };

  // Default values.
  if (!resolvedAccounts.authority.value) {
    resolvedAccounts.authority.value = context.identity;
  }
  if (!resolvedArgs.updateAuthority) {
    resolvedArgs.updateAuthority = expectPublicKey(
      resolvedAccounts.authority.value
    );
  }
  if (!resolvedAccounts.delegateRecord.value) {
    resolvedAccounts.delegateRecord.value = findMetadataDelegateRecordPda(
      context,
      {
        delegateRole: MetadataDelegateRole.Collection,
        updateAuthority: expectSome(resolvedArgs.updateAuthority),
        mint: expectPublicKey(resolvedAccounts.mint.value),
        delegate: expectPublicKey(resolvedAccounts.delegate.value),
      }
    );
  }
  if (!resolvedAccounts.metadata.value) {
    resolvedAccounts.metadata.value = findMetadataPda(context, {
      mint: expectPublicKey(resolvedAccounts.mint.value),
    });
  }
  if (!resolvedAccounts.masterEdition.value) {
    if (
      resolveIsNonFungible(
        context,
        resolvedAccounts,
        resolvedArgs,
        programId,
        false
      )
    ) {
      resolvedAccounts.masterEdition.value = findMasterEditionPda(context, {
        mint: expectPublicKey(resolvedAccounts.mint.value),
      });
    }
  }
  if (!resolvedAccounts.payer.value) {
    resolvedAccounts.payer.value = context.payer;
  }
  if (!resolvedAccounts.systemProgram.value) {
    resolvedAccounts.systemProgram.value = publicKey(
      '11111111111111111111111111111111'
    );
  }
  if (!resolvedAccounts.sysvarInstructions.value) {
    resolvedAccounts.sysvarInstructions.value = publicKey(
      'Sysvar1nstructions1111111111111111111111111'
    );
  }
  if (!resolvedAccounts.authorizationRulesProgram.value) {
    if (resolvedAccounts.authorizationRules.value) {
      resolvedAccounts.authorizationRulesProgram.value = publicKey(
        'auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg'
      );
    }
  }

  // Accounts in order.
  const orderedAccounts: ResolvedAccount[] = Object.values(
    resolvedAccounts
  ).sort((a, b) => a.index - b.index);

  // Keys and Signers.
  const [keys, signers] = getAccountMetasAndSigners(
    orderedAccounts,
    'programId',
    programId
  );

  // Data.
  const data = getRevokeCollectionV1InstructionDataSerializer().serialize({});

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
