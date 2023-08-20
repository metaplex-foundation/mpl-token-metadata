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
  u64,
  u8,
} from '@metaplex-foundation/umi/serializers';
import { addAccountMeta, addObjectProperty } from '../shared';

// Accounts.
export type TransferOutOfEscrowInstructionAccounts = {
  /** Escrow account */
  escrow: PublicKey | Pda;
  /** Metadata account */
  metadata: PublicKey | Pda;
  /** Wallet paying for the transaction and new account */
  payer?: Signer;
  /** Mint account for the new attribute */
  attributeMint: PublicKey | Pda;
  /** Token account source for the new attribute */
  attributeSrc: PublicKey | Pda;
  /** Token account, owned by TM, destination for the new attribute */
  attributeDst: PublicKey | Pda;
  /** Mint account that the escrow is attached */
  escrowMint: PublicKey | Pda;
  /** Token account that holds the token the escrow is attached to */
  escrowAccount: PublicKey | Pda;
  /** System program */
  systemProgram?: PublicKey | Pda;
  /** Associated Token program */
  ataProgram?: PublicKey | Pda;
  /** Token program */
  tokenProgram?: PublicKey | Pda;
  /** Instructions sysvar account */
  sysvarInstructions?: PublicKey | Pda;
  /** Authority/creator of the escrow account */
  authority?: Signer;
};

// Data.
export type TransferOutOfEscrowInstructionData = {
  discriminator: number;
  amount: bigint;
};

export type TransferOutOfEscrowInstructionDataArgs = {
  amount?: number | bigint;
};

/** @deprecated Use `getTransferOutOfEscrowInstructionDataSerializer()` without any argument instead. */
export function getTransferOutOfEscrowInstructionDataSerializer(
  _context: object
): Serializer<
  TransferOutOfEscrowInstructionDataArgs,
  TransferOutOfEscrowInstructionData
>;
export function getTransferOutOfEscrowInstructionDataSerializer(): Serializer<
  TransferOutOfEscrowInstructionDataArgs,
  TransferOutOfEscrowInstructionData
>;
export function getTransferOutOfEscrowInstructionDataSerializer(
  _context: object = {}
): Serializer<
  TransferOutOfEscrowInstructionDataArgs,
  TransferOutOfEscrowInstructionData
> {
  return mapSerializer<
    TransferOutOfEscrowInstructionDataArgs,
    any,
    TransferOutOfEscrowInstructionData
  >(
    struct<TransferOutOfEscrowInstructionData>(
      [
        ['discriminator', u8()],
        ['amount', u64()],
      ],
      { description: 'TransferOutOfEscrowInstructionData' }
    ),
    (value) => ({ ...value, discriminator: 40, amount: value.amount ?? 1 })
  ) as Serializer<
    TransferOutOfEscrowInstructionDataArgs,
    TransferOutOfEscrowInstructionData
  >;
}

// Args.
export type TransferOutOfEscrowInstructionArgs =
  TransferOutOfEscrowInstructionDataArgs;

// Instruction.
export function transferOutOfEscrow(
  context: Pick<Context, 'programs' | 'payer'>,
  input: TransferOutOfEscrowInstructionAccounts &
    TransferOutOfEscrowInstructionArgs
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
    escrow: [input.escrow, false] as const,
    metadata: [input.metadata, true] as const,
    attributeMint: [input.attributeMint, false] as const,
    attributeSrc: [input.attributeSrc, true] as const,
    attributeDst: [input.attributeDst, true] as const,
    escrowMint: [input.escrowMint, false] as const,
    escrowAccount: [input.escrowAccount, false] as const,
  };
  const resolvingArgs = {};
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
    'ataProgram',
    input.ataProgram
      ? ([input.ataProgram, false] as const)
      : ([
          context.programs.getPublicKey(
            'splAssociatedToken',
            'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
          ),
          false,
        ] as const)
  );
  addObjectProperty(
    resolvedAccounts,
    'tokenProgram',
    input.tokenProgram
      ? ([input.tokenProgram, false] as const)
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
    'authority',
    input.authority
      ? ([input.authority, false] as const)
      : ([programId, false] as const)
  );
  const resolvedArgs = { ...input, ...resolvingArgs };

  addAccountMeta(keys, signers, resolvedAccounts.escrow, false);
  addAccountMeta(keys, signers, resolvedAccounts.metadata, false);
  addAccountMeta(keys, signers, resolvedAccounts.payer, false);
  addAccountMeta(keys, signers, resolvedAccounts.attributeMint, false);
  addAccountMeta(keys, signers, resolvedAccounts.attributeSrc, false);
  addAccountMeta(keys, signers, resolvedAccounts.attributeDst, false);
  addAccountMeta(keys, signers, resolvedAccounts.escrowMint, false);
  addAccountMeta(keys, signers, resolvedAccounts.escrowAccount, false);
  addAccountMeta(keys, signers, resolvedAccounts.systemProgram, false);
  addAccountMeta(keys, signers, resolvedAccounts.ataProgram, false);
  addAccountMeta(keys, signers, resolvedAccounts.tokenProgram, false);
  addAccountMeta(keys, signers, resolvedAccounts.sysvarInstructions, false);
  addAccountMeta(keys, signers, resolvedAccounts.authority, false);

  // Data.
  const data =
    getTransferOutOfEscrowInstructionDataSerializer().serialize(resolvedArgs);

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
