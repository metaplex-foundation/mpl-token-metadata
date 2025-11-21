/**
 * Transaction sending utilities for tests
 *
 * Minimal wrapper around @solana/kit's sendAndConfirmTransactionFactory
 */

import type { Rpc } from '@solana/rpc';
import type { SolanaRpcApi } from '@solana/rpc';
import type { RpcSubscriptions } from '@solana/rpc-subscriptions';
import type { SolanaRpcSubscriptionsApi } from '@solana/rpc-subscriptions';
import type { TransactionSigner } from '@solana/signers';
import { isKeyPairSigner } from '@solana/signers';
import type { Instruction } from '@solana/instructions';
import { sendAndConfirmTransactionFactory } from '@solana/kit';
import {
  appendTransactionMessageInstruction,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/transaction-messages';
import {
  compileTransaction,
  signTransaction,
  assertIsTransactionWithinSizeLimit,
  assertIsTransactionWithBlockhashLifetime,
} from '@solana/transactions';

/**
 * Send and confirm a single instruction
 */
export async function sendAndConfirm(
  rpc: Rpc<SolanaRpcApi>,
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>,
  instruction: Instruction,
  signers: TransactionSigner[]
): Promise<void> {
  return sendAndConfirmInstructions(rpc, rpcSubscriptions, [instruction], signers);
}

/**
 * Send and confirm multiple instructions in one transaction
 */
export async function sendAndConfirmInstructions(
  rpc: Rpc<SolanaRpcApi>,
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>,
  instructions: readonly Instruction[],
  signers: TransactionSigner[]
): Promise<void> {
  // Get latest blockhash
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  // Build transaction message
  let message: any = createTransactionMessage({ version: 0 });
  message = setTransactionMessageFeePayer(signers[signers.length - 1].address, message);
  message = setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message);

  // Add all instructions
  for (const instruction of instructions) {
    message = appendTransactionMessageInstruction(instruction, message);
  }

  // Compile transaction
  const transaction = compileTransaction(message);

  // Assert it has blockhash lifetime (we used setTransactionMessageLifetimeUsingBlockhash)
  assertIsTransactionWithBlockhashLifetime(transaction);

  // Sign transaction
  const keyPairs = signers.map((signer) => {
    if (!isKeyPairSigner(signer)) {
      throw new Error('All signers must be KeyPairSigners');
    }
    return signer.keyPair;
  });
  const signedTransaction = await signTransaction(keyPairs, transaction);

  // Assert size limit (narrows type to SendableTransaction)
  assertIsTransactionWithinSizeLimit(signedTransaction);

  // Send and confirm
  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  await sendAndConfirmTransaction(signedTransaction, {
    commitment: 'confirmed',
  });
}
