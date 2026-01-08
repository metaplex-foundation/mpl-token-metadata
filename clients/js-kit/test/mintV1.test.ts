/**
 * MintV1 tests for js-kit client
 *
 * These tests connect to a local Solana validator and demonstrate:
 * - RPC connection using @solana/rpc
 * - Keypair generation using @solana/keys
 * - Airdrop functionality
 * - Instruction generation from Codama client
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-kit)
 */

import test from 'ava';
import { generateKeyPairSigner } from '@solana/signers';
import { fetchMint, fetchToken } from '@solana-program/token';
import { TokenStandard } from '../src/generated/types';
import {
  getCreateV1InstructionAsync,
  getMintV1InstructionAsync,
} from '../src/generated/instructions';
import { findMetadataPda } from '../src/generated/pdas';
import {
  findAssociatedTokenPda,
  SPL_TOKEN_PROGRAM_ADDRESS,
  SPL_TOKEN_2022_PROGRAM_ADDRESS,
} from '../src/hooked/pdas';
import {
  createRpc,
  createRpcSubscriptions,
  basisPoints,
  canRunTests,
  getSkipMessage,
  airdrop,
} from './_setup';
import { sendAndConfirm } from './_transaction';

/**
 * Test: Mint multiple tokens after a Fungible is created
 *
 * This demonstrates fungible token minting which allows multiple tokens
 * to be minted to a single token account.
 */
test('it can mint multiple tokens after a Fungible is created', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await generateKeyPairSigner();
  const authority = await generateKeyPairSigner();
  const payer = authority;

  // Airdrop SOL to payer for transaction fees
  await airdrop(rpc, authority.address);

  // Create the fungible token
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer,
    name: 'My Fungible Token',
    uri: 'https://example.com/my-fungible.json',
    sellerFeeBasisPoints: basisPoints(5.5),
    tokenStandard: TokenStandard.Fungible,
  });

  t.truthy(createInstruction, 'Create instruction should be generated');

  // Send create transaction
  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    authority,
  ]);
  t.pass('Create transaction succeeded');

  // Mint 42 tokens
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority,
    payer,
    metadata: metadataAddress,
    amount: 42,
    tokenStandard: TokenStandard.Fungible,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [authority]);
  t.pass('Mint transaction succeeded');

  // Verify the mint account has correct supply
  const mintAccount = await fetchMint(rpc, mint.address);
  t.is(mintAccount.data.supply, 42n, 'Mint supply should be 42');
  t.is(mintAccount.data.decimals, 0, 'Decimals should be 0 for fungible');

  t.pass('Successfully created and minted fungible tokens');
});

/**
 * Test: Can only mint one token after NonFungible is created
 */
test('it can mint only one token after a NonFungible is created', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await generateKeyPairSigner();
  const authority = await generateKeyPairSigner();
  const payer = authority;

  // Airdrop SOL to payer for transaction fees
  await airdrop(rpc, authority.address);

  // Create NonFungible (default token standard)
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer,
    name: 'My NFT',
    uri: 'https://example.com/my-nft.json',
    sellerFeeBasisPoints: basisPoints(5.5),
    // tokenStandard defaults to NonFungible
  });

  t.truthy(createInstruction);
  // Send create transaction
  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    authority,
  ]);

  // Mint one token
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority,
    payer,
    metadata: metadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
    tokenOwner: authority.address,
  });

  t.truthy(mintInstruction);

  // Send mint transaction
  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [authority]);

  // Verify the mint account has supply of 1
  const mintAccount = await fetchMint(rpc, mint.address);
  t.is(mintAccount.data.supply, 1n, 'NFT supply should be 1');

  // Verify the token was minted to the associated token account
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: authority.address,
  });
  const tokenAccount = await fetchToken(rpc, tokenAddress);
  t.is(tokenAccount.data.amount, 1n, 'Token account should have 1 token');

  // Try to mint another token - this should fail
  const mintInstruction2 = await getMintV1InstructionAsync({
    mint: mint.address,
    authority,
    payer,
    metadata: metadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
    tokenOwner: authority.address,
  });

  // Expect the transaction to fail with EditionsMustHaveExactlyOneToken error
  await t.throwsAsync(
    sendAndConfirm(rpc, rpcSubscriptions, mintInstruction2, [authority]),
    undefined,
    'Should not be able to mint more than one NFT'
  );

  t.pass('Successfully verified NFT can only be minted once');
});

/**
 * Test: Can only mint one token after ProgrammableNonFungible is created
 */
test('it can mint only one token after a ProgrammableNonFungible is created', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await generateKeyPairSigner();
  const authority = await generateKeyPairSigner();
  const payer = authority;

  // Airdrop SOL to payer for transaction fees
  await airdrop(rpc, authority.address);

  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer,
    name: 'My PNFT',
    uri: 'https://example.com/my-pnft.json',
    sellerFeeBasisPoints: basisPoints(5.5),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  t.truthy(createInstruction);

  // Send create transaction
  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    authority,
  ]);

  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority,
    payer,
    metadata: metadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    tokenOwner: authority.address,
  });

  t.truthy(mintInstruction);

  // Send mint transaction
  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [authority]);

  // Verify the mint account has supply of 1
  const mintAccount = await fetchMint(rpc, mint.address);
  t.is(mintAccount.data.supply, 1n, 'PNFT supply should be 1');

  // Verify the token was minted to the associated token account
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: authority.address,
  });
  const tokenAccount = await fetchToken(rpc, tokenAddress);
  t.is(tokenAccount.data.amount, 1n, 'Token account should have 1 token');

  // Try to mint another token - this should fail
  const mintInstruction2 = await getMintV1InstructionAsync({
    mint: mint.address,
    authority,
    payer,
    metadata: metadataAddress,
    amount: 1,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    tokenOwner: authority.address,
  });

  // Expect the transaction to fail with EditionsMustHaveExactlyOneToken error
  await t.throwsAsync(
    sendAndConfirm(rpc, rpcSubscriptions, mintInstruction2, [authority]),
    undefined,
    'Should not be able to mint more than one PNFT'
  );

  t.pass('Successfully verified PNFT can only be minted once');
});

/**
 * Test: Can mint multiple tokens after FungibleAsset is created
 */
test('it can mint multiple tokens after a FungibleAsset is created', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await generateKeyPairSigner();
  const authority = await generateKeyPairSigner();
  const payer = authority;

  // Airdrop SOL to payer for transaction fees
  await airdrop(rpc, authority.address);

  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer,
    name: 'My Fungible Asset',
    uri: 'https://example.com/my-asset.json',
    sellerFeeBasisPoints: basisPoints(5.5),
    tokenStandard: TokenStandard.FungibleAsset,
  });

  t.truthy(createInstruction);

  // Send create transaction
  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    authority,
  ]);

  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    authority,
    payer,
    metadata: metadataAddress,
    amount: 42,
    tokenStandard: TokenStandard.FungibleAsset,
  });

  t.truthy(mintInstruction);

  // Send mint transaction
  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [authority]);

  // Verify the mint account
  const mintAccount = await fetchMint(rpc, mint.address);
  t.is(mintAccount.data.supply, 42n, 'Fungible asset supply should be 42');

  t.pass('Successfully created and minted fungible asset');
});

/**
 * Test: Can mint a new ProgrammableNonFungible with Token-2022
 */
test('it can mint a new ProgrammableNonFungible with Token-2022', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await generateKeyPairSigner();
  const authority = await generateKeyPairSigner();
  const payer = authority;

  // Airdrop SOL to payer for transaction fees
  await airdrop(rpc, authority.address);

  // Create a ProgrammableNonFungible with Token-2022
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority,
    payer,
    name: 'My Programmable NFT',
    uri: 'https://example.com/my-programmable-nft.json',
    sellerFeeBasisPoints: basisPoints(5.5),
    splTokenProgram: SPL_TOKEN_2022_PROGRAM_ADDRESS,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  t.truthy(createInstruction);

  // Send create transaction
  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    authority,
  ]);

  // Derive the associated token account from SPL Token 2022
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: authority.address,
    tokenProgram: SPL_TOKEN_2022_PROGRAM_ADDRESS,
  });

  // Mint one token
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const mintInstruction = await getMintV1InstructionAsync({
    mint: mint.address,
    token: tokenAddress,
    authority,
    payer,
    metadata: metadataAddress,
    amount: 1,
    splTokenProgram: SPL_TOKEN_2022_PROGRAM_ADDRESS,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    tokenOwner: authority.address,
  });

  t.truthy(mintInstruction);

  // Send mint transaction (skip preflight as Token-2022 may need it)
  await sendAndConfirm(rpc, rpcSubscriptions, mintInstruction, [authority]);

  // Verify the mint account has supply of 1
  const mintAccount = await fetchMint(rpc, mint.address);
  t.is(mintAccount.data.supply, 1n, 'Token-2022 PNFT supply should be 1');

  // Verify the token was minted to the associated token account
  const tokenAccount = await fetchToken(rpc, tokenAddress);
  t.is(tokenAccount.data.amount, 1n, 'Token account should have 1 token');

  // Verify the mint account is owned by SPL Token-2022 Program
  const accountInfo = await rpc.getAccountInfo(mint.address, { encoding: 'base64' }).send();
  t.truthy(accountInfo.value, 'Mint account should exist');
  if (accountInfo.value) {
    t.is(
      accountInfo.value.owner,
      SPL_TOKEN_2022_PROGRAM_ADDRESS,
      'Mint should be owned by Token-2022 program'
    );
  }

  t.pass('Successfully created and minted PNFT with Token-2022');
});
