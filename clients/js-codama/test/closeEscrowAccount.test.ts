/**
 * CloseEscrowAccount tests for js-codama client
 *
 * Escrow accounts can be closed by the token owner (for TokenOwner authority)
 * or by the creator (for Creator authority). This returns the rent to the payer.
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-codama)
 */

import test from 'ava';
import {
  getProgramDerivedAddress,
  getUtf8Encoder,
  getAddressEncoder,
  getU8Encoder,
  type Address,
} from '@solana/kit';
import {
  getCreateEscrowAccountInstructionAsync,
  getCloseEscrowAccountInstructionAsync,
} from '../src/generated/instructions';
import { fetchTokenOwnedEscrow, fetchMaybeTokenOwnedEscrow } from '../src/generated/accounts';
import { createNft } from '../src/hooked/createHelpers';
import { findAssociatedTokenPda } from './_setup';
import { MPL_TOKEN_METADATA_PROGRAM_ADDRESS } from '../src/generated/programs';
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
} from './_setup';

/**
 * Helper to derive the escrow PDA address for TokenOwner authority
 */
async function findTokenOwnerEscrowPda(
  mint: Address
): Promise<[Address, number]> {
  const result = await getProgramDerivedAddress({
    programAddress: MPL_TOKEN_METADATA_PROGRAM_ADDRESS,
    seeds: [
      getUtf8Encoder().encode('metadata'),
      getAddressEncoder().encode(MPL_TOKEN_METADATA_PROGRAM_ADDRESS),
      getAddressEncoder().encode(mint),
      getU8Encoder().encode(0), // TokenOwner authority type
      getUtf8Encoder().encode('escrow'),
    ],
  });
  return [result[0] as Address, result[1]];
}

/**
 * Helper to derive the escrow PDA address for Creator authority
 */
async function findCreatorEscrowPda(
  mint: Address,
  creator: Address
): Promise<[Address, number]> {
  const result = await getProgramDerivedAddress({
    programAddress: MPL_TOKEN_METADATA_PROGRAM_ADDRESS,
    seeds: [
      getUtf8Encoder().encode('metadata'),
      getAddressEncoder().encode(MPL_TOKEN_METADATA_PROGRAM_ADDRESS),
      getAddressEncoder().encode(mint),
      getU8Encoder().encode(1), // Creator authority type
      getAddressEncoder().encode(creator),
      getUtf8Encoder().encode('escrow'),
    ],
  });
  return [result[0] as Address, result[1]];
}

/**
 * Test: Close escrow account with TokenOwner authority
 */
test('it can close an escrow account with TokenOwner authority', async (t) => {
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

  // Derive the token account address
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });

  // Derive the escrow PDA
  const [escrowAddress] = await findTokenOwnerEscrowPda(mint.address);

  // Create escrow account
  const createEscrowIx = await getCreateEscrowAccountInstructionAsync({
    escrow: escrowAddress,
    mint: mint.address,
    tokenAccount: tokenAddress,
    payer: owner,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createEscrowIx, [owner]);

  // Verify the escrow account was created
  let escrowAccount = await fetchTokenOwnedEscrow(rpc, escrowAddress);
  t.truthy(escrowAccount.data.baseToken); // baseToken is set

  // Close the escrow account
  const closeEscrowIx = await getCloseEscrowAccountInstructionAsync({
    escrow: escrowAddress,
    mint: mint.address,
    tokenAccount: tokenAddress,
    payer: owner,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, closeEscrowIx, [owner]);

  // Verify the escrow account was closed
  const maybeEscrow = await fetchMaybeTokenOwnedEscrow(rpc, escrowAddress);
  t.is(maybeEscrow.exists, false);
});

/**
 * Test: Close escrow account with Creator authority
 */
test('it can close an escrow account with Creator authority', async (t) => {
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
  const creator = await createKeypair();

  await airdrop(rpc, owner.address);
  await airdrop(rpc, creator.address);

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

  // Derive the token account address
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });

  // Derive the escrow PDA with creator authority
  const [escrowAddress] = await findCreatorEscrowPda(mint.address, creator.address);

  // Create escrow account with Creator authority
  const createEscrowIx = await getCreateEscrowAccountInstructionAsync({
    escrow: escrowAddress,
    mint: mint.address,
    tokenAccount: tokenAddress,
    payer: creator,
    authority: creator,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createEscrowIx, [creator]);

  // Verify the escrow account was created
  let escrowAccount = await fetchTokenOwnedEscrow(rpc, escrowAddress);
  t.truthy(escrowAccount.data.baseToken); // baseToken is set
  t.is(escrowAccount.data.authority.__kind, 'Creator');

  // Close the escrow account (creator must close)
  const closeEscrowIx = await getCloseEscrowAccountInstructionAsync({
    escrow: escrowAddress,
    mint: mint.address,
    tokenAccount: tokenAddress,
    payer: creator,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, closeEscrowIx, [creator]);

  // Verify the escrow account was closed
  const maybeEscrow = await fetchMaybeTokenOwnedEscrow(rpc, escrowAddress);
  t.is(maybeEscrow.exists, false);
});

/**
 * Test: Create and close escrow cycle
 */
test('it can create, close, and recreate an escrow account', async (t) => {
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

  // Derive the token account address
  const [tokenAddress] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: owner.address,
  });

  // Derive the escrow PDA
  const [escrowAddress] = await findTokenOwnerEscrowPda(mint.address);

  // First create
  const createEscrowIx1 = await getCreateEscrowAccountInstructionAsync({
    escrow: escrowAddress,
    mint: mint.address,
    tokenAccount: tokenAddress,
    payer: owner,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createEscrowIx1, [owner]);

  let escrowAccount = await fetchTokenOwnedEscrow(rpc, escrowAddress);
  t.truthy(escrowAccount.data.baseToken); // baseToken is set

  // First close
  const closeEscrowIx1 = await getCloseEscrowAccountInstructionAsync({
    escrow: escrowAddress,
    mint: mint.address,
    tokenAccount: tokenAddress,
    payer: owner,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, closeEscrowIx1, [owner]);

  let maybeEscrow = await fetchMaybeTokenOwnedEscrow(rpc, escrowAddress);
  t.is(maybeEscrow.exists, false);

  // Second create
  const createEscrowIx2 = await getCreateEscrowAccountInstructionAsync({
    escrow: escrowAddress,
    mint: mint.address,
    tokenAccount: tokenAddress,
    payer: owner,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createEscrowIx2, [owner]);

  escrowAccount = await fetchTokenOwnedEscrow(rpc, escrowAddress);
  t.truthy(escrowAccount.data.baseToken); // baseToken is set
});
