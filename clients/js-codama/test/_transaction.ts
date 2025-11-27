/**
 * Transaction sending utilities for tests
 *
 * Provides a simplified interface for sending instructions to the network.
 * Handles the full transaction lifecycle: build, sign, send, and confirm.
 */

import type { Rpc } from '@solana/rpc';
import type { SolanaRpcApi } from '@solana/rpc';
import type { RpcSubscriptions } from '@solana/rpc-subscriptions';
import type { SolanaRpcSubscriptionsApi } from '@solana/rpc-subscriptions';
import type { TransactionSigner } from '@solana/signers';
import { isKeyPairSigner } from '@solana/signers';
import { sendAndConfirmTransactionFactory, type Instruction } from '@solana/kit';
import {
  appendTransactionMessageInstructions,
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
  if (signers.length === 0) {
    throw new Error('At least one signer is required');
  }

  if (instructions.length === 0) {
    throw new Error('At least one instruction is required');
  }

  // Get latest blockhash
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  // Build transaction message - last signer is the fee payer
  const feePayer = signers[signers.length - 1].address;

  // Create transaction message with all instructions
  const message = appendTransactionMessageInstructions(
    instructions,
    setTransactionMessageLifetimeUsingBlockhash(
      latestBlockhash,
      setTransactionMessageFeePayer(
        feePayer,
        createTransactionMessage({ version: 0 })
      )
    )
  );

  // Compile transaction
  const transaction = compileTransaction(message);

  // Validate that the transaction has the expected blockhash lifetime
  assertIsTransactionWithBlockhashLifetime(transaction);

  // Sign transaction - all signers must be KeyPairSigners in test environment
  const keyPairs = signers.map((signer) => {
    if (!isKeyPairSigner(signer)) {
      throw new Error(
        `Expected KeyPairSigner but got ${typeof signer}. ` +
        'All signers in tests must be KeyPairSigners from generateKeyPairSigner().'
      );
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
