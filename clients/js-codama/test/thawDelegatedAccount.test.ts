/**
 * ThawDelegatedAccount tests for js-codama client
 *
 * ThawDelegatedAccount is a legacy instruction that allows a delegate
 * to thaw a frozen token account. This only works for NonFungible tokens
 * (not ProgrammableNonFungible which use unlockV1).
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-codama)
 */

import test from 'ava';
import { TokenStandard } from '../src/generated/types';
import {
  getDelegateStandardV1InstructionAsync,
  getFreezeDelegatedAccountInstructionAsync,
  getThawDelegatedAccountInstructionAsync,
} from '../src/generated/instructions';
import { createNft } from '../src/hooked/createHelpers';
import { findAssociatedTokenPda, SPL_TOKEN_PROGRAM_ADDRESS } from './_setup';
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
 * Test: Thaw a frozen NonFungible token as delegate
 */
test('it can thaw a frozen NonFungible token as delegate', async (t) => {
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
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
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
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [owner]);

  // Freeze the token account as the delegate
  const freezeInstruction = await getFreezeDelegatedAccountInstructionAsync({
    delegate: delegate,
    tokenAccount: tokenAddress,
    mint: mint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, freezeInstruction, [delegate]);

  // Verify token is frozen
  let tokenAccount = await fetchToken(rpc, tokenAddress);
  t.is(tokenAccount.data.state, AccountState.Frozen);

  // Thaw the token account as the delegate
  const thawInstruction = await getThawDelegatedAccountInstructionAsync({
    delegate: delegate,
    tokenAccount: tokenAddress,
    mint: mint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, thawInstruction, [delegate]);

  // Verify token is now thawed
  tokenAccount = await fetchToken(rpc, tokenAddress);
  t.is(tokenAccount.data.state, AccountState.Initialized);
});

/**
 * Test: Freeze and thaw cycle
 */
test('it can freeze and thaw a token multiple times', async (t) => {
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
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
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
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [owner]);

  // First freeze
  const freezeInstruction1 = await getFreezeDelegatedAccountInstructionAsync({
    delegate: delegate,
    tokenAccount: tokenAddress,
    mint: mint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, freezeInstruction1, [delegate]);

  let tokenAccount = await fetchToken(rpc, tokenAddress);
  t.is(tokenAccount.data.state, AccountState.Frozen);

  // First thaw
  const thawInstruction1 = await getThawDelegatedAccountInstructionAsync({
    delegate: delegate,
    tokenAccount: tokenAddress,
    mint: mint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, thawInstruction1, [delegate]);

  tokenAccount = await fetchToken(rpc, tokenAddress);
  t.is(tokenAccount.data.state, AccountState.Initialized);

  // Second freeze
  const freezeInstruction2 = await getFreezeDelegatedAccountInstructionAsync({
    delegate: delegate,
    tokenAccount: tokenAddress,
    mint: mint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, freezeInstruction2, [delegate]);

  tokenAccount = await fetchToken(rpc, tokenAddress);
  t.is(tokenAccount.data.state, AccountState.Frozen);

  // Second thaw
  const thawInstruction2 = await getThawDelegatedAccountInstructionAsync({
    delegate: delegate,
    tokenAccount: tokenAddress,
    mint: mint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, thawInstruction2, [delegate]);

  tokenAccount = await fetchToken(rpc, tokenAddress);
  t.is(tokenAccount.data.state, AccountState.Initialized);
});

/**
 * Test: Cannot thaw without being delegate
 */
test('it cannot thaw a token without being delegate', async (t) => {
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
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
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
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateInstruction, [owner]);

  // Freeze the token account as the delegate
  const freezeInstruction = await getFreezeDelegatedAccountInstructionAsync({
    delegate: delegate,
    tokenAccount: tokenAddress,
    mint: mint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, freezeInstruction, [delegate]);

  // Try to thaw without being delegate (should fail)
  const notDelegate = await createKeypair();
  await airdrop(rpc, notDelegate.address);

  const thawInstruction = await getThawDelegatedAccountInstructionAsync({
    delegate: notDelegate,
    tokenAccount: tokenAddress,
    mint: mint.address,
  });

  await t.throwsAsync(
    sendAndConfirm(rpc, rpcSubscriptions, thawInstruction, [notDelegate])
  );
});
