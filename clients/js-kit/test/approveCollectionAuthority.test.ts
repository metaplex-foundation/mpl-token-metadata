/**
 * ApproveCollectionAuthority tests for js-kit client
 *
 * These tests demonstrate approving a collection authority:
 * - Create a collection NFT
 * - Approve another wallet as a collection authority
 * - Verify the collection authority record is created
 *
 * To run against validator:
 * 1. Build program: pnpm programs:build (from repo root)
 * 2. Start validator: pnpm validator (from repo root)
 * 3. Run tests: pnpm test (from clients/js-kit)
 */

import test from 'ava';
import { TokenStandard } from '../src/generated/types';
import {
  getCreateV1InstructionAsync,
  getApproveCollectionAuthorityInstructionAsync,
} from '../src/generated/instructions';
import {
  findMetadataPda,
  findCollectionAuthorityRecordPda,
} from '../src/generated/pdas';
import { SPL_TOKEN_PROGRAM_ADDRESS } from './_setup';
import {
  fetchMaybeCollectionAuthorityRecord,
  fetchCollectionAuthorityRecord,
} from '../src/generated/accounts';
import {
  createKeypair,
  createRpc,
  createRpcSubscriptions,
  basisPoints,
  canRunTests,
  getSkipMessage,
  airdrop,
  sendAndConfirm,
} from './_setup';

/**
 * Test: Approve collection authority on NonFungible
 */
test('it can approve a collection authority on NonFungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const collectionMint = await createKeypair();
  const updateAuthority = await createKeypair();
  const newCollectionAuthority = await createKeypair();

  await airdrop(rpc, updateAuthority.address);

  // Create collection NFT
  const createInstruction = await getCreateV1InstructionAsync({
    mint: collectionMint,
    authority: updateAuthority,
    payer: updateAuthority,
    name: 'My Collection',
    uri: 'https://example.com/collection.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
    isCollection: true,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    collectionMint,
    updateAuthority,
  ]);

  // Derive the collection authority record PDA
  const [collectionAuthorityRecordAddress] = await findCollectionAuthorityRecordPda({
    mint: collectionMint.address,
    collectionAuthority: newCollectionAuthority.address,
  });

  // Verify collection authority record doesn't exist yet
  const recordBefore = await fetchMaybeCollectionAuthorityRecord(rpc, collectionAuthorityRecordAddress);
  t.false(recordBefore.exists);

  // Approve collection authority
  const approveInstruction = await getApproveCollectionAuthorityInstructionAsync({
    collectionAuthorityRecord: collectionAuthorityRecordAddress,
    newCollectionAuthority: newCollectionAuthority.address,
    updateAuthority,
    payer: updateAuthority,
    mint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, approveInstruction, [updateAuthority]);

  // Verify collection authority record now exists
  const recordAfter = await fetchCollectionAuthorityRecord(rpc, collectionAuthorityRecordAddress);
  t.truthy(recordAfter);
  t.truthy(recordAfter.data.bump);

  t.pass('Successfully approved collection authority on NonFungible');
});

/**
 * Test: Approve multiple collection authorities
 */
test('it can approve multiple collection authorities', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const collectionMint = await createKeypair();
  const updateAuthority = await createKeypair();
  const collectionAuthority1 = await createKeypair();
  const collectionAuthority2 = await createKeypair();

  await airdrop(rpc, updateAuthority.address);

  // Create collection NFT
  const createInstruction = await getCreateV1InstructionAsync({
    mint: collectionMint,
    authority: updateAuthority,
    payer: updateAuthority,
    name: 'My Collection',
    uri: 'https://example.com/collection.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
    isCollection: true,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    collectionMint,
    updateAuthority,
  ]);

  // Derive the collection authority record PDAs
  const [collectionAuthorityRecord1] = await findCollectionAuthorityRecordPda({
    mint: collectionMint.address,
    collectionAuthority: collectionAuthority1.address,
  });

  const [collectionAuthorityRecord2] = await findCollectionAuthorityRecordPda({
    mint: collectionMint.address,
    collectionAuthority: collectionAuthority2.address,
  });

  // Approve first collection authority
  const approveInstruction1 = await getApproveCollectionAuthorityInstructionAsync({
    collectionAuthorityRecord: collectionAuthorityRecord1,
    newCollectionAuthority: collectionAuthority1.address,
    updateAuthority,
    payer: updateAuthority,
    mint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, approveInstruction1, [updateAuthority]);

  // Approve second collection authority
  const approveInstruction2 = await getApproveCollectionAuthorityInstructionAsync({
    collectionAuthorityRecord: collectionAuthorityRecord2,
    newCollectionAuthority: collectionAuthority2.address,
    updateAuthority,
    payer: updateAuthority,
    mint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, approveInstruction2, [updateAuthority]);

  // Verify both collection authority records exist
  const record1 = await fetchCollectionAuthorityRecord(rpc, collectionAuthorityRecord1);
  const record2 = await fetchCollectionAuthorityRecord(rpc, collectionAuthorityRecord2);

  t.truthy(record1);
  t.truthy(record1.data.bump);
  t.truthy(record2);
  t.truthy(record2.data.bump);

  t.pass('Successfully approved multiple collection authorities');
});

/**
 * Test: ApproveCollectionAuthority is not supported on ProgrammableNonFungible
 * Note: This instruction is a legacy instruction that only works with NonFungible tokens.
 * For pNFTs, use the delegateCollectionV1 instruction instead.
 */
test('it cannot approve a collection authority on ProgrammableNonFungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const collectionMint = await createKeypair();
  const updateAuthority = await createKeypair();
  const newCollectionAuthority = await createKeypair();

  await airdrop(rpc, updateAuthority.address);

  // Create programmable collection NFT
  const createInstruction = await getCreateV1InstructionAsync({
    mint: collectionMint,
    authority: updateAuthority,
    payer: updateAuthority,
    name: 'My PNFT Collection',
    uri: 'https://example.com/pnft-collection.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    isCollection: true,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    collectionMint,
    updateAuthority,
  ]);

  // Derive the collection authority record PDA
  const [collectionAuthorityRecordAddress] = await findCollectionAuthorityRecordPda({
    mint: collectionMint.address,
    collectionAuthority: newCollectionAuthority.address,
  });

  // Approve collection authority - should fail for pNFTs
  const approveInstruction = await getApproveCollectionAuthorityInstructionAsync({
    collectionAuthorityRecord: collectionAuthorityRecordAddress,
    newCollectionAuthority: newCollectionAuthority.address,
    updateAuthority,
    payer: updateAuthority,
    mint: collectionMint.address,
  });

  try {
    await sendAndConfirm(rpc, rpcSubscriptions, approveInstruction, [updateAuthority]);
    t.fail('Expected transaction to fail for ProgrammableNonFungible');
  } catch (error) {
    // Expected: Instruction not supported for ProgrammableNonFungible assets
    t.pass('Correctly rejected approveCollectionAuthority for ProgrammableNonFungible');
  }
});
