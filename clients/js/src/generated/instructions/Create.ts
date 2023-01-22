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
  PublicKey,
  Serializer,
  Signer,
  WrappedInstruction,
  checkForIsWritableOverride as isWritable,
  mapSerializer,
  publicKey,
} from '@lorisleiva/js-core';
import { CreateArgs, CreateArgsArgs, getCreateArgsSerializer } from '../types';

// Accounts.
export type CreateInstructionAccounts = {
  /** Unallocated metadata account with address as pda of ['metadata', program id, mint id] */
  metadata: PublicKey;
  /** Unallocated edition account with address as pda of ['metadata', program id, mint, 'edition'] */
  masterEdition?: PublicKey;
  /** Mint of token asset */
  mint: PublicKey;
  /** Mint authority */
  authority?: Signer;
  /** Payer */
  payer?: Signer;
  /** Update authority for the metadata account */
  updateAuthority: PublicKey;
  /** System program */
  systemProgram?: PublicKey;
  /** Instructions sysvar account */
  sysvarInstructions?: PublicKey;
  /** SPL Token program */
  splTokenProgram?: PublicKey;
};

// Arguments.
export type CreateInstructionData = {
  discriminator: number;
  createArgs: CreateArgs;
};

export type CreateInstructionArgs = { createArgs: CreateArgsArgs };

export function getCreateInstructionDataSerializer(
  context: Pick<Context, 'serializer'>
): Serializer<CreateInstructionArgs, CreateInstructionData> {
  const s = context.serializer;
  return mapSerializer<
    CreateInstructionArgs,
    CreateInstructionData,
    CreateInstructionData
  >(
    s.struct<CreateInstructionData>(
      [
        ['discriminator', s.u8],
        ['createArgs', getCreateArgsSerializer(context)],
      ],
      'CreateInstructionArgs'
    ),
    (value) => ({ discriminator: 42, ...value } as CreateInstructionData)
  ) as Serializer<CreateInstructionArgs, CreateInstructionData>;
}

// Instruction.
export function create(
  context: Pick<Context, 'serializer' | 'programs' | 'identity' | 'payer'>,
  input: CreateInstructionAccounts & CreateInstructionArgs
): WrappedInstruction {
  const signers: Signer[] = [];
  const keys: AccountMeta[] = [];

  // Program ID.
  const programId: PublicKey =
    context.programs.get('mplTokenMetadata').publicKey;

  // Resolved accounts.
  const metadataAccount = input.metadata;
  const masterEditionAccount = input.masterEdition;
  const mintAccount = input.mint;
  const authorityAccount = input.authority ?? context.identity;
  const payerAccount = input.payer ?? context.payer;
  const updateAuthorityAccount = input.updateAuthority;
  const systemProgramAccount = input.systemProgram ?? {
    ...context.programs.get('splSystem').publicKey,
    isWritable: false,
  };
  const sysvarInstructionsAccount =
    input.sysvarInstructions ??
    publicKey('Sysvar1nstructions1111111111111111111111111');
  const splTokenProgramAccount = input.splTokenProgram ?? {
    ...context.programs.get('splToken').publicKey,
    isWritable: false,
  };

  // Metadata.
  keys.push({
    pubkey: metadataAccount,
    isSigner: false,
    isWritable: isWritable(metadataAccount, true),
  });

  // Master Edition (optional).
  if (masterEditionAccount) {
    keys.push({
      pubkey: masterEditionAccount,
      isSigner: false,
      isWritable: isWritable(masterEditionAccount, true),
    });
  }

  // Mint.
  keys.push({
    pubkey: mintAccount,
    isSigner: false,
    isWritable: isWritable(mintAccount, true),
  });

  // Authority.
  signers.push(authorityAccount);
  keys.push({
    pubkey: authorityAccount.publicKey,
    isSigner: true,
    isWritable: isWritable(authorityAccount, false),
  });

  // Payer.
  signers.push(payerAccount);
  keys.push({
    pubkey: payerAccount.publicKey,
    isSigner: true,
    isWritable: isWritable(payerAccount, true),
  });

  // Update Authority.
  keys.push({
    pubkey: updateAuthorityAccount,
    isSigner: false,
    isWritable: isWritable(updateAuthorityAccount, false),
  });

  // System Program.
  keys.push({
    pubkey: systemProgramAccount,
    isSigner: false,
    isWritable: isWritable(systemProgramAccount, false),
  });

  // Sysvar Instructions.
  keys.push({
    pubkey: sysvarInstructionsAccount,
    isSigner: false,
    isWritable: isWritable(sysvarInstructionsAccount, false),
  });

  // Spl Token Program.
  keys.push({
    pubkey: splTokenProgramAccount,
    isSigner: false,
    isWritable: isWritable(splTokenProgramAccount, false),
  });

  // Data.
  const data = getCreateInstructionDataSerializer(context).serialize(input);

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return {
    instruction: { keys, programId, data },
    signers,
    bytesCreatedOnChain,
  };
}
