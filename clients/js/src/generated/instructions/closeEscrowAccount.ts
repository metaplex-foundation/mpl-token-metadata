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
import { findMasterEditionPda, findMetadataPda } from '../accounts';
import {
  ResolvedAccount,
  ResolvedAccountsWithIndices,
  expectPublicKey,
  getAccountMetasAndSigners,
} from '../shared';

// Accounts.
export type CloseEscrowAccountInstructionAccounts = {
  /** Escrow account */
  escrow: PublicKey | Pda;
  /** Metadata account */
  metadata?: PublicKey | Pda;
  /** Mint account */
  mint: PublicKey | Pda;
  /** Token account */
  tokenAccount: PublicKey | Pda;
  /** Edition account */
  edition?: PublicKey | Pda;
  /** Wallet paying for the transaction and new account */
  payer?: Signer;
  /** System program */
  systemProgram?: PublicKey | Pda;
  /** Instructions sysvar account */
  sysvarInstructions?: PublicKey | Pda;
};

// Data.
export type CloseEscrowAccountInstructionData = { discriminator: number };

export type CloseEscrowAccountInstructionDataArgs = {};

export function getCloseEscrowAccountInstructionDataSerializer(): Serializer<
  CloseEscrowAccountInstructionDataArgs,
  CloseEscrowAccountInstructionData
> {
  return mapSerializer<
    CloseEscrowAccountInstructionDataArgs,
    any,
    CloseEscrowAccountInstructionData
  >(
    struct<CloseEscrowAccountInstructionData>([['discriminator', u8()]], {
      description: 'CloseEscrowAccountInstructionData',
    }),
    (value) => ({ ...value, discriminator: 39 })
  ) as Serializer<
    CloseEscrowAccountInstructionDataArgs,
    CloseEscrowAccountInstructionData
  >;
}

// Instruction.
export function closeEscrowAccount(
  context: Pick<Context, 'eddsa' | 'payer' | 'programs'>,
  input: CloseEscrowAccountInstructionAccounts
): TransactionBuilder {
  // Program ID.
  const programId = context.programs.getPublicKey(
    'mplTokenMetadata',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  );

  // Accounts.
  const resolvedAccounts = {
    escrow: {
      index: 0,
      isWritable: true as boolean,
      value: input.escrow ?? null,
    },
    metadata: {
      index: 1,
      isWritable: true as boolean,
      value: input.metadata ?? null,
    },
    mint: { index: 2, isWritable: false as boolean, value: input.mint ?? null },
    tokenAccount: {
      index: 3,
      isWritable: false as boolean,
      value: input.tokenAccount ?? null,
    },
    edition: {
      index: 4,
      isWritable: false as boolean,
      value: input.edition ?? null,
    },
    payer: {
      index: 5,
      isWritable: true as boolean,
      value: input.payer ?? null,
    },
    systemProgram: {
      index: 6,
      isWritable: false as boolean,
      value: input.systemProgram ?? null,
    },
    sysvarInstructions: {
      index: 7,
      isWritable: false as boolean,
      value: input.sysvarInstructions ?? null,
    },
  } satisfies ResolvedAccountsWithIndices;

  // Default values.
  if (!resolvedAccounts.metadata.value) {
    resolvedAccounts.metadata.value = findMetadataPda(context, {
      mint: expectPublicKey(resolvedAccounts.mint.value),
    });
  }
  if (!resolvedAccounts.edition.value) {
    resolvedAccounts.edition.value = findMasterEditionPda(context, {
      mint: expectPublicKey(resolvedAccounts.mint.value),
    });
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
  const data = getCloseEscrowAccountInstructionDataSerializer().serialize({});

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
