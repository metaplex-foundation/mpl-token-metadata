/**
 * UnverifyCreatorV1 tests for js-kit client
 *
 * These tests demonstrate unverifying creators:
 * - Create an NFT with a verified creator
 * - Have the creator unverify themselves
 * - Verify that the verified flag is set to false
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
  getVerifyCreatorV1Instruction,
  getUnverifyCreatorV1Instruction,
} from '../src/generated/instructions';
import { findMetadataPda } from '../src/generated/pdas';
import { SPL_TOKEN_PROGRAM_ADDRESS } from './_setup';
import { fetchMetadata } from '../src/generated/accounts';
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
 * Test: Unverify creator on NonFungible
 */
test('it can unverify the creator of a NonFungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const creator = await createKeypair();
  const payer = await createKeypair();

  await airdrop(rpc, creator.address);
  await airdrop(rpc, payer.address);

  // Create NFT with unverified creator
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: payer,
    payer,
    name: 'My NFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
    creators: [
      {
        address: creator.address,
        verified: false,
        share: 100,
      },
    ],
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    payer,
  ]);

  // Verify creator is unverified
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const metadataBefore = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataBefore.data.creators);
  if (metadataBefore.data.creators.__option === 'Some') {
    t.is(metadataBefore.data.creators.value.length, 1);
    t.false(metadataBefore.data.creators.value[0].verified);
    t.is(metadataBefore.data.creators.value[0].address, creator.address);
  }

  // Verify creator
  const verifyInstruction = getVerifyCreatorV1Instruction({
    authority: creator,
    metadata: metadataAddress,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, verifyInstruction, [creator]);

  // Verify creator is now verified
  const metadataAfterVerify = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataAfterVerify.data.creators);
  if (metadataAfterVerify.data.creators.__option === 'Some') {
    t.is(metadataAfterVerify.data.creators.value.length, 1);
    t.true(metadataAfterVerify.data.creators.value[0].verified);
    t.is(metadataAfterVerify.data.creators.value[0].address, creator.address);
  }

  // Unverify creator
  const unverifyInstruction = getUnverifyCreatorV1Instruction({
    authority: creator,
    metadata: metadataAddress,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, unverifyInstruction, [creator]);

  // Verify creator is now unverified
  const metadataAfterUnverify = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataAfterUnverify.data.creators);
  if (metadataAfterUnverify.data.creators.__option === 'Some') {
    t.is(metadataAfterUnverify.data.creators.value.length, 1);
    t.false(metadataAfterUnverify.data.creators.value[0].verified);
    t.is(metadataAfterUnverify.data.creators.value[0].address, creator.address);
  }

  t.pass('Successfully unverified creator on NonFungible');
});

/**
 * Test: Unverify creator on ProgrammableNonFungible
 */
test('it can unverify the creator of a ProgrammableNonFungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const creator = await createKeypair();
  const payer = await createKeypair();

  await airdrop(rpc, creator.address);
  await airdrop(rpc, payer.address);

  // Create PNFT with unverified creator
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: payer,
    payer,
    name: 'My PNFT',
    uri: 'https://example.com/pnft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    creators: [
      {
        address: creator.address,
        verified: false,
        share: 100,
      },
    ],
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    payer,
  ]);

  // Verify creator is unverified
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const metadataBefore = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataBefore.data.creators);
  if (metadataBefore.data.creators.__option === 'Some') {
    t.is(metadataBefore.data.creators.value.length, 1);
    t.false(metadataBefore.data.creators.value[0].verified);
  }

  // Verify creator
  const verifyInstruction = getVerifyCreatorV1Instruction({
    authority: creator,
    metadata: metadataAddress,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, verifyInstruction, [creator]);

  // Verify creator is now verified
  const metadataAfterVerify = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataAfterVerify.data.creators);
  if (metadataAfterVerify.data.creators.__option === 'Some') {
    t.is(metadataAfterVerify.data.creators.value.length, 1);
    t.true(metadataAfterVerify.data.creators.value[0].verified);
  }

  // Unverify creator
  const unverifyInstruction = getUnverifyCreatorV1Instruction({
    authority: creator,
    metadata: metadataAddress,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, unverifyInstruction, [creator]);

  // Verify creator is now unverified
  const metadataAfterUnverify = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataAfterUnverify.data.creators);
  if (metadataAfterUnverify.data.creators.__option === 'Some') {
    t.is(metadataAfterUnverify.data.creators.value.length, 1);
    t.false(metadataAfterUnverify.data.creators.value[0].verified);
  }

  t.pass('Successfully unverified creator on ProgrammableNonFungible');
});

/**
 * Test: Unverify creator on Fungible
 */
test('it can unverify the creator of a Fungible', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const creator = await createKeypair();
  const payer = await createKeypair();

  await airdrop(rpc, creator.address);
  await airdrop(rpc, payer.address);

  // Create Fungible with unverified creator
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: payer,
    payer,
    name: 'Fungible Token',
    uri: 'https://example.com/fungible.json',
    sellerFeeBasisPoints: basisPoints(2),
    tokenStandard: TokenStandard.Fungible,
    creators: [
      {
        address: creator.address,
        verified: false,
        share: 100,
      },
    ],
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    payer,
  ]);

  // Verify creator is unverified
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const metadataBefore = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataBefore.data.creators);
  if (metadataBefore.data.creators.__option === 'Some') {
    t.is(metadataBefore.data.creators.value.length, 1);
    t.false(metadataBefore.data.creators.value[0].verified);
  }

  // Verify creator
  const verifyInstruction = getVerifyCreatorV1Instruction({
    authority: creator,
    metadata: metadataAddress,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, verifyInstruction, [creator]);

  // Verify creator is now verified
  const metadataAfterVerify = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataAfterVerify.data.creators);
  if (metadataAfterVerify.data.creators.__option === 'Some') {
    t.is(metadataAfterVerify.data.creators.value.length, 1);
    t.true(metadataAfterVerify.data.creators.value[0].verified);
  }

  // Unverify creator
  const unverifyInstruction = getUnverifyCreatorV1Instruction({
    authority: creator,
    metadata: metadataAddress,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, unverifyInstruction, [creator]);

  // Verify creator is now unverified
  const metadataAfterUnverify = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataAfterUnverify.data.creators);
  if (metadataAfterUnverify.data.creators.__option === 'Some') {
    t.is(metadataAfterUnverify.data.creators.value.length, 1);
    t.false(metadataAfterUnverify.data.creators.value[0].verified);
  }

  t.pass('Successfully unverified creator on Fungible');
});

/**
 * Test: Unverify one of multiple creators
 */
test('it can unverify one of multiple creators', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const mint = await createKeypair();
  const creator1 = await createKeypair();
  const creator2 = await createKeypair();
  const payer = await createKeypair();

  await airdrop(rpc, creator1.address);
  await airdrop(rpc, creator2.address);
  await airdrop(rpc, payer.address);

  // Create NFT with multiple unverified creators
  const createInstruction = await getCreateV1InstructionAsync({
    mint,
    authority: payer,
    payer,
    name: 'Collaborative NFT',
    uri: 'https://example.com/collab.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenStandard: TokenStandard.NonFungible,
    creators: [
      {
        address: creator1.address,
        verified: false,
        share: 60,
      },
      {
        address: creator2.address,
        verified: false,
        share: 40,
      },
    ],
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createInstruction, [
    mint,
    payer,
  ]);

  // Verify both creators are unverified
  const [metadataAddress] = await findMetadataPda({ mint: mint.address });
  const metadataBefore = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataBefore.data.creators);
  if (metadataBefore.data.creators.__option === 'Some') {
    t.is(metadataBefore.data.creators.value.length, 2);
    t.false(metadataBefore.data.creators.value[0].verified);
    t.false(metadataBefore.data.creators.value[1].verified);
  }

  // Verify both creators
  const verifyInstruction1 = getVerifyCreatorV1Instruction({
    authority: creator1,
    metadata: metadataAddress,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, verifyInstruction1, [creator1]);

  const verifyInstruction2 = getVerifyCreatorV1Instruction({
    authority: creator2,
    metadata: metadataAddress,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, verifyInstruction2, [creator2]);

  // Verify both are verified
  const metadataAfterVerify = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataAfterVerify.data.creators);
  if (metadataAfterVerify.data.creators.__option === 'Some') {
    t.is(metadataAfterVerify.data.creators.value.length, 2);
    t.true(metadataAfterVerify.data.creators.value[0].verified);
    t.true(metadataAfterVerify.data.creators.value[1].verified);
  }

  // Unverify first creator
  const unverifyInstruction1 = getUnverifyCreatorV1Instruction({
    authority: creator1,
    metadata: metadataAddress,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, unverifyInstruction1, [creator1]);

  // Verify first creator is unverified, second is still verified
  const metadataAfterUnverify1 = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataAfterUnverify1.data.creators);
  if (metadataAfterUnverify1.data.creators.__option === 'Some') {
    t.is(metadataAfterUnverify1.data.creators.value.length, 2);
    t.false(metadataAfterUnverify1.data.creators.value[0].verified);
    t.true(metadataAfterUnverify1.data.creators.value[1].verified);
  }

  // Unverify second creator
  const unverifyInstruction2 = getUnverifyCreatorV1Instruction({
    authority: creator2,
    metadata: metadataAddress,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, unverifyInstruction2, [creator2]);

  // Verify both creators are now unverified
  const metadataAfterUnverify2 = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataAfterUnverify2.data.creators);
  if (metadataAfterUnverify2.data.creators.__option === 'Some') {
    t.is(metadataAfterUnverify2.data.creators.value.length, 2);
    t.false(metadataAfterUnverify2.data.creators.value[0].verified);
    t.false(metadataAfterUnverify2.data.creators.value[1].verified);
  }

  t.pass('Successfully unverified multiple creators independently');
});
