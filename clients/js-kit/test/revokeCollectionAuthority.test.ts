/**
 * RevokeCollectionAuthority tests for js-kit client
 *
 * These tests demonstrate revoking a collection authority:
 * - Create a collection NFT
 * - Approve a collection authority
 * - Revoke the collection authority
 * - Verify the collection authority record is closed
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
  getRevokeCollectionAuthorityInstructionAsync,
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
 * Test: Revoke collection authority as update authority
 */
test('it can revoke a collection authority as update authority', async (t) => {
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
  const collectionAuthority = await createKeypair();

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
    collectionAuthority: collectionAuthority.address,
  });

  // Approve collection authority
  const approveInstruction = await getApproveCollectionAuthorityInstructionAsync({
    collectionAuthorityRecord: collectionAuthorityRecordAddress,
    newCollectionAuthority: collectionAuthority.address,
    updateAuthority,
    payer: updateAuthority,
    mint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, approveInstruction, [updateAuthority]);

  // Verify collection authority record exists
  const recordAfterApprove = await fetchCollectionAuthorityRecord(rpc, collectionAuthorityRecordAddress);
  t.truthy(recordAfterApprove);
  t.truthy(recordAfterApprove.data.bump);

  // Revoke collection authority as update authority
  const revokeInstruction = await getRevokeCollectionAuthorityInstructionAsync({
    collectionAuthorityRecord: collectionAuthorityRecordAddress,
    delegateAuthority: collectionAuthority.address,
    revokeAuthority: updateAuthority,
    mint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, revokeInstruction, [updateAuthority]);

  // Verify collection authority record no longer exists
  const recordAfterRevoke = await fetchMaybeCollectionAuthorityRecord(rpc, collectionAuthorityRecordAddress);
  t.false(recordAfterRevoke.exists);

  t.pass('Successfully revoked collection authority as update authority');
});

/**
 * Test: Revoke collection authority as the delegate itself
 */
test('it can revoke a collection authority as the delegate itself', async (t) => {
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
  const collectionAuthority = await createKeypair();

  await airdrop(rpc, updateAuthority.address);
  await airdrop(rpc, collectionAuthority.address);

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
    collectionAuthority: collectionAuthority.address,
  });

  // Approve collection authority
  const approveInstruction = await getApproveCollectionAuthorityInstructionAsync({
    collectionAuthorityRecord: collectionAuthorityRecordAddress,
    newCollectionAuthority: collectionAuthority.address,
    updateAuthority,
    payer: updateAuthority,
    mint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, approveInstruction, [updateAuthority]);

  // Verify collection authority record exists
  const recordAfterApprove = await fetchCollectionAuthorityRecord(rpc, collectionAuthorityRecordAddress);
  t.truthy(recordAfterApprove);

  // Revoke collection authority as the delegate itself
  const revokeInstruction = await getRevokeCollectionAuthorityInstructionAsync({
    collectionAuthorityRecord: collectionAuthorityRecordAddress,
    delegateAuthority: collectionAuthority.address,
    revokeAuthority: collectionAuthority,
    mint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, revokeInstruction, [collectionAuthority]);

  // Verify collection authority record no longer exists
  const recordAfterRevoke = await fetchMaybeCollectionAuthorityRecord(rpc, collectionAuthorityRecordAddress);
  t.false(recordAfterRevoke.exists);

  t.pass('Successfully revoked collection authority as the delegate itself');
});

/**
 * Test: Revoke one of multiple collection authorities
 */
test('it can revoke one of multiple collection authorities', async (t) => {
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

  // Approve both collection authorities
  const approveInstruction1 = await getApproveCollectionAuthorityInstructionAsync({
    collectionAuthorityRecord: collectionAuthorityRecord1,
    newCollectionAuthority: collectionAuthority1.address,
    updateAuthority,
    payer: updateAuthority,
    mint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, approveInstruction1, [updateAuthority]);

  const approveInstruction2 = await getApproveCollectionAuthorityInstructionAsync({
    collectionAuthorityRecord: collectionAuthorityRecord2,
    newCollectionAuthority: collectionAuthority2.address,
    updateAuthority,
    payer: updateAuthority,
    mint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, approveInstruction2, [updateAuthority]);

  // Verify both collection authority records exist
  const record1Before = await fetchCollectionAuthorityRecord(rpc, collectionAuthorityRecord1);
  const record2Before = await fetchCollectionAuthorityRecord(rpc, collectionAuthorityRecord2);
  t.truthy(record1Before);
  t.truthy(record2Before);

  // Revoke only the first collection authority
  const revokeInstruction1 = await getRevokeCollectionAuthorityInstructionAsync({
    collectionAuthorityRecord: collectionAuthorityRecord1,
    delegateAuthority: collectionAuthority1.address,
    revokeAuthority: updateAuthority,
    mint: collectionMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, revokeInstruction1, [updateAuthority]);

  // Verify first authority is revoked, second still exists
  const record1After = await fetchMaybeCollectionAuthorityRecord(rpc, collectionAuthorityRecord1);
  const record2After = await fetchCollectionAuthorityRecord(rpc, collectionAuthorityRecord2);
  t.false(record1After.exists);
  t.truthy(record2After);
  t.truthy(record2After.data.bump);

  t.pass('Successfully revoked one of multiple collection authorities');
});

/**
 * Test: RevokeCollectionAuthority is not supported on ProgrammableNonFungible
 * Note: This instruction is a legacy instruction that only works with NonFungible tokens.
 * For pNFTs, use the revokeCollectionV1 instruction instead.
 */
test('it cannot approve/revoke collection authority on ProgrammableNonFungible', async (t) => {
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
  const collectionAuthority = await createKeypair();

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
    collectionAuthority: collectionAuthority.address,
  });

  // Try to approve collection authority - should fail for pNFTs
  const approveInstruction = await getApproveCollectionAuthorityInstructionAsync({
    collectionAuthorityRecord: collectionAuthorityRecordAddress,
    newCollectionAuthority: collectionAuthority.address,
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
