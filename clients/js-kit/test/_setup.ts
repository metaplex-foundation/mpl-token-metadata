/**
 * Test setup utilities for js-kit client
 */

import type { Address } from '@solana/addresses';
import { createSolanaRpc, type Rpc } from '@solana/rpc';
import type { SolanaRpcApi } from '@solana/rpc';
import { createSolanaRpcSubscriptions, type RpcSubscriptions } from '@solana/rpc-subscriptions';
import type { SolanaRpcSubscriptionsApi } from '@solana/rpc-subscriptions';
import { airdropFactory, lamports } from '@solana/kit';

// Re-export transaction utilities
export { sendAndConfirm, sendAndConfirmInstructions } from './_transaction';
// Re-export account fetchers from official package
export { fetchMint, fetchToken } from '@solana-program/token';
// Re-export program addresses and PDAs from hooked folder
export {
  findAssociatedTokenPda,
  SPL_TOKEN_PROGRAM_ADDRESS,
  SPL_TOKEN_2022_PROGRAM_ADDRESS,
  SPL_ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
} from '../src/hooked/pdas';
// Re-export signer generation
export { generateKeyPairSigner as createKeypair };

const LOCAL_VALIDATOR_URL = 'http://127.0.0.1:8899';
const LOCAL_VALIDATOR_WS_URL = 'ws://127.0.0.1:8900';

export function createRpc(): Rpc<SolanaRpcApi> {
  return createSolanaRpc(LOCAL_VALIDATOR_URL);
}

export function createRpcSubscriptions(): RpcSubscriptions<SolanaRpcSubscriptionsApi> {
  return createSolanaRpcSubscriptions(LOCAL_VALIDATOR_WS_URL);
}

export function basisPoints(percent: number): number {
  return Math.round(percent * 100);
}

export async function canRunTests(): Promise<boolean> {
  try {
    const rpc = createRpc();
    await rpc.getVersion().send();
    return true;
  } catch {
    return false;
  }
}

export function getSkipMessage(): string {
  return `
Local Solana validator is not running.

To run these tests:
1. Start the local validator from the repository root:
   pnpm validator

2. Run the tests:
   pnpm test

The validator should be running at ${LOCAL_VALIDATOR_URL}
`.trim();
}

export async function airdrop(
  rpc: Rpc<SolanaRpcApi>,
  recipient: Address,
  amount: bigint = 10_000_000_000n
): Promise<void> {
  const rpcSubscriptions = createRpcSubscriptions();
  const airdropFn = airdropFactory({ rpc, rpcSubscriptions });

  await airdropFn({
    recipientAddress: recipient,
    lamports: lamports(amount),
    commitment: 'confirmed',
  });
}
