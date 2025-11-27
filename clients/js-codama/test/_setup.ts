/**
 * Test setup utilities for js-codama client
 */

import type { Address } from '@solana/addresses';
import { createSolanaRpc, type Rpc } from '@solana/rpc';
import type { SolanaRpcApi } from '@solana/rpc';
import { createSolanaRpcSubscriptions, type RpcSubscriptions } from '@solana/rpc-subscriptions';
import type { SolanaRpcSubscriptionsApi } from '@solana/rpc-subscriptions';
import type { Lamports } from '@solana/rpc-types';

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
  const signature = await rpc
    .requestAirdrop(recipient, amount as Lamports)
    .send();

  await new Promise((resolve) => setTimeout(resolve, 500));

  for (let i = 0; i < 60; i++) {
    try {
      const { value: statuses } = await rpc.getSignatureStatuses([signature]).send();
      const status = statuses[0];

      if (status) {
        if (status.err) {
          throw new Error(`Airdrop failed: ${JSON.stringify(status.err)}`);
        }

        if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
          const balance = await rpc.getBalance(recipient).send();
          if (balance.value >= amount) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return;
          }
        }
      }
    } catch (error) {
      if (i === 59) {
        console.error(`Airdrop timeout after ${i + 1} attempts`);
        throw error;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Airdrop confirmation timeout for ${recipient}`);
}
