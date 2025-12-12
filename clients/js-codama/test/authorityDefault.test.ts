/**
 * Authority Default tests for js-codama client
 *
 * These tests verify that authority defaults to payer when not explicitly provided.
 * This is a quality-of-life improvement that reduces redundant parameters.
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-codama)
 */

import test from 'ava';
import { TokenStandard } from '../src/generated/types';
import {
  getCreateV1InstructionAsync,
  getMintV1InstructionAsync,
  getDelegateSaleV1InstructionAsync,
  getTransferV1InstructionAsync,
} from '../src/generated/instructions';
import { findMetadataPda } from '../src/generated/pdas';
import { fetchMetadata, fetchMasterEdition } from '../src/generated/accounts';
import {
  createKeypair,
  createRpc,
  createRpcSubscriptions,
  basisPoints,
  canRunTests,
  getSkipMessage,
  airdrop,
  sendAndConfirm,
  fetchMint,
  findAssociatedTokenPda,
  fetchToken,
} from './_setup';

/**
 * Test: createV1 - authority defaults to payer
 */
test('createV1 - authority defaults to payer', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const payer = await createKeypair();

  await airdrop(rpc, payer.address);

  // Create a NonFungible NFT WITHOUT specifying authority - it should default to payer
  const createIx = await getCreateV1InstructionAsync({
    mint: mint,
    payer: payer, // authority is NOT specified - should default to payer
    name: 'Default Authority Test',
    uri: 'https://example.com/default-authority.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, payer]);

  // Verify metadata was created with payer as update authority
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const metadata = await fetchMetadata(rpc, metadataAddress);

  t.is(metadata.data.mint, mint.address);
  t.is(metadata.data.name, 'Default Authority Test');
  t.is(metadata.data.updateAuthority, payer.address, 'Update authority should be the payer');

  // Verify master edition was created
  const [masterEditionAddress] = await findMasterEditionPda({
    mint: mint.address,
  });
  const masterEdition = await fetchMasterEdition(rpc, masterEditionAddress);
  t.is(masterEdition.data.supply, 0n);
});

/**
 * Test: mintV1 - authority defaults to payer
 */
test('mintV1 - authority defaults to payer', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const payer = await createKeypair();

  await airdrop(rpc, payer.address);

  // First create the NFT (using default authority)
  const createIx = await getCreateV1InstructionAsync({
    mint: mint,
    payer: payer,
    name: 'Mint Authority Default Test',
    uri: 'https://example.com/mint-default.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, payer]);

  // Now mint WITHOUT specifying authority - it should default to payer
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintIx = await getMintV1InstructionAsync({
    mint: mint.address,
    payer: payer, // authority is NOT specified - should default to payer
    metadata: metadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
    tokenOwner: payer.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintIx, [payer]);

  // Verify the mint succeeded
  const mintAccount = await fetchMint(rpc, mint.address);
  t.is(mintAccount.data.supply, 1n, 'Mint supply should be 1');

  // Verify token account
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: payer.address,
  });
  const tokenAccount = await fetchToken(rpc, tokenAddress);
  t.is(tokenAccount.data.amount, 1n, 'Token account should have 1 token');
});

/**
 * Test: delegateSaleV1 - authority defaults to payer
 */
test('delegateSaleV1 - authority defaults to payer', async (t) => {
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

  // Create and mint a ProgrammableNonFungible
  const createIx = await getCreateV1InstructionAsync({
    mint: mint,
    payer: owner,
    name: 'Delegate Authority Default Test',
    uri: 'https://example.com/delegate-default.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, owner]);

  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintIx = await getMintV1InstructionAsync({
    mint: mint.address,
    payer: owner,
    metadata: metadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    tokenOwner: owner.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintIx, [owner]);

  // Delegate WITHOUT specifying authority - it should default to payer
  const saleDelegate = await createKeypair();
  const delegateIx = await getDelegateSaleV1InstructionAsync({
    mint: mint.address,
    tokenOwner: owner.address,
    payer: owner, // authority is NOT specified - should default to payer (owner)
    delegate: saleDelegate.address,
    amount: 1,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, delegateIx, [owner]);

  // Verify the delegate was set by checking token account
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });
  const tokenAccount = await fetchToken(rpc, tokenAddress);

  if (tokenAccount.data.delegate.__option === 'Some') {
    t.is(tokenAccount.data.delegate.value, saleDelegate.address, 'Delegate should be set');
  } else {
    t.fail('Expected delegate to be set on token');
  }
});

/**
 * Test: transferV1 - authority defaults to payer
 */
test('transferV1 - authority defaults to payer', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const ownerA = await createKeypair();
  const ownerB = await createKeypair();

  await airdrop(rpc, ownerA.address);

  // Create and mint a NonFungible
  const createIx = await getCreateV1InstructionAsync({
    mint: mint,
    payer: ownerA,
    name: 'Transfer Authority Default Test',
    uri: 'https://example.com/transfer-default.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, ownerA]);

  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintIx = await getMintV1InstructionAsync({
    mint: mint.address,
    payer: ownerA,
    metadata: metadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
    tokenOwner: ownerA.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintIx, [ownerA]);

  // Transfer WITHOUT specifying authority - it should default to payer
  const transferIx = await getTransferV1InstructionAsync({
    mint: mint.address,
    tokenOwner: ownerA.address,
    destinationOwner: ownerB.address,
    payer: ownerA, // authority is NOT specified - should default to payer
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, transferIx, [ownerA]);

  // Verify the transfer succeeded
  const [tokenAddressB] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: ownerB.address,
  });
  const tokenAccountB = await fetchToken(rpc, tokenAddressB);
  t.is(tokenAccountB.data.amount, 1n, 'Owner B should have the token');
});

/**
 * Test: Explicit authority still works and takes precedence
 */
test('explicit authority takes precedence over default', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const payer = await createKeypair();
  const explicitAuthority = await createKeypair();

  await airdrop(rpc, payer.address);
  await airdrop(rpc, explicitAuthority.address);

  // Create with explicit authority different from payer
  const createIx = await getCreateV1InstructionAsync({
    mint: mint,
    payer: payer,
    authority: explicitAuthority, // Explicit authority - should NOT use payer
    name: 'Explicit Authority Test',
    uri: 'https://example.com/explicit-authority.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createIx, [mint, payer, explicitAuthority]);

  // Verify metadata was created with explicit authority as update authority
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const metadata = await fetchMetadata(rpc, metadataAddress);

  t.is(metadata.data.updateAuthority, explicitAuthority.address, 'Update authority should be the explicit authority, not payer');
});

// Import for master edition
import { findMasterEditionPda } from '../src/generated/pdas';
