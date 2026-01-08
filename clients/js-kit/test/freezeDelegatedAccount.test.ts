/**
 * FreezeDelegatedAccount tests for js-kit client
 *
 * FreezeDelegatedAccount is a legacy instruction that allows a delegate
 * to freeze a token account. This only works for NonFungible tokens
 * (not ProgrammableNonFungible which use lockV1).
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-kit)
 */

import test from 'ava';
import { TokenStandard } from '../src/generated/types';
import {
  getDelegateStandardV1InstructionAsync,
  getFreezeDelegatedAccountInstructionAsync,
} from '../src/generated/instructions';
import { createNft } from '../src/hooked/createHelpers';
import { findAssociatedTokenPda } from './_setup';
import {
  createKeypair,
  createRpc,
  createRpcSubscriptions,
  basisPoints,
  canRunTests,
  getSkipMessage,
  airdrop,
  sendAndConfirm,
  sendAndConfirmInstructions,
  fetchToken,
} from './_setup';
import { AccountState } from '@solana-program/token';

/**
 * Test: Freeze a NonFungible token as delegate
 */
test('it can freeze a NonFungible token as delegate', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const owner = await createKeypair();

  await airdrop(rpc, owner.address);

  // Create a NonFungible NFT
  const [createIx, mintIx] = await createNft({
    mint,
    authority: owner,
    payer: owner,
    name: 'Test NFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenOwner: owner.address,
  });

  await sendAndConfirmInstructions(rpc, rpcSubscriptions, [createIx, mintIx], [
    mint,
    owner,
  ]);

  // Derive the token address
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });

  // Verify token is not frozen initially
  let tokenAccount = await fetchToken(rpc, tokenAddress);
  t.is(tokenAccount.data.state, AccountState.Initialized);

  // Approve a standard delegate for the token
  const delegate = await createKeypair();
  await airdrop(rpc, delegate.address);

  const delegateInstruction = await getDelegateStandardV1InstructionAsync({
    mint: mint.address,
    tokenOwner: owner.address,
    authority: owner,
    payer: owner,
    delegate: delegate.address,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [owner]);

  // Verify delegate is set
  tokenAccount = await fetchToken(rpc, tokenAddress);
  if (tokenAccount.data.delegate.__option === 'Some') {
    t.is(tokenAccount.data.delegate.value, delegate.address);
  } else {
    t.fail('Expected delegate to be set');
  }

  // Freeze the token account as the delegate
  const freezeInstruction = await getFreezeDelegatedAccountInstructionAsync({
    delegate: delegate,
    tokenAccount: tokenAddress,
    mint: mint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, freezeInstruction, [delegate]);

  // Verify token is now frozen
  tokenAccount = await fetchToken(rpc, tokenAddress);
  t.is(tokenAccount.data.state, AccountState.Frozen);
});

/**
 * Test: Cannot freeze without being delegate
 */
test('it cannot freeze a token without being delegate', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const owner = await createKeypair();

  await airdrop(rpc, owner.address);

  // Create a NonFungible NFT
  const [createIx, mintIx] = await createNft({
    mint,
    authority: owner,
    payer: owner,
    name: 'Test NFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenOwner: owner.address,
  });

  await sendAndConfirmInstructions(rpc, rpcSubscriptions, [createIx, mintIx], [
    mint,
    owner,
  ]);

  // Derive the token address
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });

  // Try to freeze without being delegate (should fail)
  const notDelegate = await createKeypair();
  await airdrop(rpc, notDelegate.address);

  const freezeInstruction = await getFreezeDelegatedAccountInstructionAsync({
    delegate: notDelegate,
    tokenAccount: tokenAddress,
    mint: mint.address,
  });

  await t.throwsAsync(
    sendAndConfirm(rpc, rpcSubscriptions, freezeInstruction, [notDelegate])
  );
});
