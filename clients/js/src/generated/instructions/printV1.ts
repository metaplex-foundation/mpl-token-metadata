/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
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
  u64,
  u8,
} from '@metaplex-foundation/umi/serializers';
import { findEditionMarkerFromEditionNumberPda } from '../../hooked';
import {
  findEditionMarkerV2Pda,
  findMasterEditionPda,
  findMetadataPda,
  findTokenRecordPda,
} from '../accounts';
import {
  ResolvedAccount,
  ResolvedAccountsWithIndices,
  expectPublicKey,
  expectSome,
  getAccountMetasAndSigners,
} from '../shared';
import { TokenStandard, TokenStandardArgs } from '../types';

// Accounts.
export type PrintV1InstructionAccounts = {
  /** New Metadata key (pda of ['metadata', program id, mint id]) */
  editionMetadata?: PublicKey | Pda;
  /** New Edition (pda of ['metadata', program id, mint id, 'edition']) */
  edition?: PublicKey | Pda;
  /** Mint of new token - THIS WILL TRANSFER AUTHORITY AWAY FROM THIS KEY */
  editionMint: PublicKey | Pda | Signer;
  /** Owner of the token account of new token */
  editionTokenAccountOwner?: PublicKey | Pda;
  /** Token account of new token */
  editionTokenAccount?: PublicKey | Pda;
  /** Mint authority of new mint */
  editionMintAuthority?: Signer;
  /** Token record account */
  editionTokenRecord?: PublicKey | Pda;
  /** Master Record Edition V2 (pda of ['metadata', program id, master metadata mint id, 'edition']) */
  masterEdition?: PublicKey | Pda;
  /** Edition pda to mark creation - will be checked for pre-existence. (pda of ['metadata', program id, master metadata mint id, 'edition', edition_number]) where edition_number is NOT the edition number you pass in args but actually edition_number = floor(edition/EDITION_MARKER_BIT_SIZE). */
  editionMarkerPda?: PublicKey | Pda;
  /** payer */
  payer?: Signer;
  /** owner of token account containing master token */
  masterTokenAccountOwner?: Signer;
  /** token account containing token from master metadata mint */
  masterTokenAccount?: PublicKey | Pda;
  /** Master record metadata account */
  masterMetadata?: PublicKey | Pda;
  /** The update authority of the master edition. */
  updateAuthority?: PublicKey | Pda;
  /** Token program */
  splTokenProgram?: PublicKey | Pda;
  /** SPL Associated Token Account program */
  splAtaProgram?: PublicKey | Pda;
  /** Instructions sysvar account */
  sysvarInstructions?: PublicKey | Pda;
  /** System program */
  systemProgram?: PublicKey | Pda;
};

// Data.
export type PrintV1InstructionData = {
  discriminator: number;
  printV1Discriminator: number;
  editionNumber: bigint;
};

export type PrintV1InstructionDataArgs = { editionNumber: number | bigint };

export function getPrintV1InstructionDataSerializer(): Serializer<
  PrintV1InstructionDataArgs,
  PrintV1InstructionData
> {
  return mapSerializer<PrintV1InstructionDataArgs, any, PrintV1InstructionData>(
    struct<PrintV1InstructionData>(
      [
        ['discriminator', u8()],
        ['printV1Discriminator', u8()],
        ['editionNumber', u64()],
      ],
      { description: 'PrintV1InstructionData' }
    ),
    (value) => ({ ...value, discriminator: 55, printV1Discriminator: 0 })
  ) as Serializer<PrintV1InstructionDataArgs, PrintV1InstructionData>;
}

// Extra Args.
export type PrintV1InstructionExtraArgs = {
  masterEditionMint: PublicKey;
  tokenStandard: TokenStandardArgs;
};

// Args.
export type PrintV1InstructionArgs = PrintV1InstructionDataArgs &
  PrintV1InstructionExtraArgs;

// Instruction.
export function printV1(
  context: Pick<Context, 'eddsa' | 'identity' | 'payer' | 'programs'>,
  input: PrintV1InstructionAccounts & PrintV1InstructionArgs
): TransactionBuilder {
  // Program ID.
  const programId = context.programs.getPublicKey(
    'mplTokenMetadata',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  );

  // Accounts.
  const resolvedAccounts: ResolvedAccountsWithIndices = {
    editionMetadata: {
      index: 0,
      isWritable: true,
      value: input.editionMetadata ?? null,
    },
    edition: { index: 1, isWritable: true, value: input.edition ?? null },
    editionMint: {
      index: 2,
      isWritable: true,
      value: input.editionMint ?? null,
    },
    editionTokenAccountOwner: {
      index: 3,
      isWritable: false,
      value: input.editionTokenAccountOwner ?? null,
    },
    editionTokenAccount: {
      index: 4,
      isWritable: true,
      value: input.editionTokenAccount ?? null,
    },
    editionMintAuthority: {
      index: 5,
      isWritable: false,
      value: input.editionMintAuthority ?? null,
    },
    editionTokenRecord: {
      index: 6,
      isWritable: true,
      value: input.editionTokenRecord ?? null,
    },
    masterEdition: {
      index: 7,
      isWritable: true,
      value: input.masterEdition ?? null,
    },
    editionMarkerPda: {
      index: 8,
      isWritable: true,
      value: input.editionMarkerPda ?? null,
    },
    payer: { index: 9, isWritable: true, value: input.payer ?? null },
    masterTokenAccountOwner: {
      index: 10,
      isWritable: false,
      value: input.masterTokenAccountOwner ?? null,
    },
    masterTokenAccount: {
      index: 11,
      isWritable: false,
      value: input.masterTokenAccount ?? null,
    },
    masterMetadata: {
      index: 12,
      isWritable: false,
      value: input.masterMetadata ?? null,
    },
    updateAuthority: {
      index: 13,
      isWritable: false,
      value: input.updateAuthority ?? null,
    },
    splTokenProgram: {
      index: 14,
      isWritable: false,
      value: input.splTokenProgram ?? null,
    },
    splAtaProgram: {
      index: 15,
      isWritable: false,
      value: input.splAtaProgram ?? null,
    },
    sysvarInstructions: {
      index: 16,
      isWritable: false,
      value: input.sysvarInstructions ?? null,
    },
    systemProgram: {
      index: 17,
      isWritable: false,
      value: input.systemProgram ?? null,
    },
  };

  // Arguments.
  const resolvedArgs: PrintV1InstructionArgs = { ...input };

  // Default values.
  if (!resolvedAccounts.editionMetadata.value) {
    resolvedAccounts.editionMetadata.value = findMetadataPda(context, {
      mint: expectPublicKey(resolvedAccounts.editionMint.value),
    });
  }
  if (!resolvedAccounts.edition.value) {
    resolvedAccounts.edition.value = findMasterEditionPda(context, {
      mint: expectPublicKey(resolvedAccounts.editionMint.value),
    });
  }
  if (!resolvedAccounts.editionTokenAccountOwner.value) {
    resolvedAccounts.editionTokenAccountOwner.value =
      context.identity.publicKey;
  }
  if (!resolvedAccounts.editionTokenAccount.value) {
    resolvedAccounts.editionTokenAccount.value = findAssociatedTokenPda(
      context,
      {
        mint: expectPublicKey(resolvedAccounts.editionMint.value),
        owner: expectPublicKey(resolvedAccounts.editionTokenAccountOwner.value),
      }
    );
  }
  if (!resolvedAccounts.masterTokenAccountOwner.value) {
    resolvedAccounts.masterTokenAccountOwner.value = context.identity;
  }
  if (!resolvedAccounts.editionMintAuthority.value) {
    resolvedAccounts.editionMintAuthority.value = expectSome(
      resolvedAccounts.masterTokenAccountOwner.value
    );
  }
  if (!resolvedAccounts.editionTokenRecord.value) {
    if (resolvedArgs.tokenStandard === TokenStandard.ProgrammableNonFungible) {
      resolvedAccounts.editionTokenRecord.value = findTokenRecordPda(context, {
        mint: expectPublicKey(resolvedAccounts.editionMint.value),
        token: expectPublicKey(resolvedAccounts.editionTokenAccount.value),
      });
    }
  }
  if (!resolvedAccounts.masterEdition.value) {
    resolvedAccounts.masterEdition.value = findMasterEditionPda(context, {
      mint: expectSome(resolvedArgs.masterEditionMint),
    });
  }
  if (!resolvedAccounts.editionMarkerPda.value) {
    if (resolvedArgs.tokenStandard === TokenStandard.ProgrammableNonFungible) {
      resolvedAccounts.editionMarkerPda.value = findEditionMarkerV2Pda(
        context,
        { mint: expectPublicKey(resolvedAccounts.masterEditionMint.value) }
      );
    } else {
      resolvedAccounts.editionMarkerPda.value =
        findEditionMarkerFromEditionNumberPda(context, {
          mint: expectPublicKey(resolvedAccounts.masterEditionMint.value),
          editionNumber: expectSome(resolvedArgs.editionNumber),
        });
    }
  }
  if (!resolvedAccounts.payer.value) {
    resolvedAccounts.payer.value = context.payer;
  }
  if (!resolvedAccounts.masterTokenAccount.value) {
    resolvedAccounts.masterTokenAccount.value = findAssociatedTokenPda(
      context,
      {
        mint: expectSome(resolvedArgs.masterEditionMint),
        owner: expectPublicKey(resolvedAccounts.masterTokenAccountOwner.value),
      }
    );
  }
  if (!resolvedAccounts.masterMetadata.value) {
    resolvedAccounts.masterMetadata.value = findMetadataPda(context, {
      mint: expectSome(resolvedArgs.masterEditionMint),
    });
  }
  if (!resolvedAccounts.updateAuthority.value) {
    resolvedAccounts.updateAuthority.value = context.identity.publicKey;
  }
  if (!resolvedAccounts.splTokenProgram.value) {
    resolvedAccounts.splTokenProgram.value = context.programs.getPublicKey(
      'splToken',
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    );
    resolvedAccounts.splTokenProgram.isWritable = false;
  }
  if (!resolvedAccounts.splAtaProgram.value) {
    resolvedAccounts.splAtaProgram.value = context.programs.getPublicKey(
      'splAssociatedToken',
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
    );
    resolvedAccounts.splAtaProgram.isWritable = false;
  }
  if (!resolvedAccounts.sysvarInstructions.value) {
    resolvedAccounts.sysvarInstructions.value = publicKey(
      'Sysvar1nstructions1111111111111111111111111'
    );
  }
  if (!resolvedAccounts.systemProgram.value) {
    resolvedAccounts.systemProgram.value = context.programs.getPublicKey(
      'splSystem',
      '11111111111111111111111111111111'
    );
    resolvedAccounts.systemProgram.isWritable = false;
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
  const data = getPrintV1InstructionDataSerializer().serialize(
    resolvedArgs as PrintV1InstructionDataArgs
  );

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
