import {
  Pda,
  PublicKey,
  TransactionBuilder,
  publicKey,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import { findHolderDelegateRecordPda, printV1 } from './generated';

export const printAsDelegate = (
  context: Parameters<typeof printV1>[0],
  input: Omit<Parameters<typeof printV1>[1], 'masterTokenAccountOwner'> & {
    masterTokenAccountOwner: Pda | PublicKey;
    holderDelegateRecord?: Pda;
  }
): TransactionBuilder => {
  const holderDelegateRecord =
    input.holderDelegateRecord ??
    findHolderDelegateRecordPda(context, {
      mint: input.masterEditionMint,
      delegateRole: 'print_delegate',
      owner: publicKey(input.masterTokenAccountOwner),
      delegate: publicKey(input.payer ?? context.identity.publicKey),
    });

  return transactionBuilder()
    .add(printV1(context, input))
    .addRemainingAccounts({
      pubkey: publicKey(holderDelegateRecord),
      isSigner: false,
      isWritable: true,
    });
};
