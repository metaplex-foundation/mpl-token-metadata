/**
 * VerifyCreatorV1 tests for js-kit client
 *
 * These tests demonstrate verifying creators:
 * - Create an NFT with an unverified creator
 * - Have the creator verify themselves
 * - Verify that the verified flag is set to true
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
 * Test: Verify creator on NonFungible
 */
test('it can verify the creator of a NonFungible', async (t) => {
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
  const metadataAfter = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataAfter.data.creators);
  if (metadataAfter.data.creators.__option === 'Some') {
    t.is(metadataAfter.data.creators.value.length, 1);
    t.true(metadataAfter.data.creators.value[0].verified);
    t.is(metadataAfter.data.creators.value[0].address, creator.address);
  }

  t.pass('Successfully verified creator on NonFungible');
});

/**
 * Test: Verify creator on ProgrammableNonFungible
 */
test('it can verify the creator of a ProgrammableNonFungible', async (t) => {
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
  const metadataAfter = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataAfter.data.creators);
  if (metadataAfter.data.creators.__option === 'Some') {
    t.is(metadataAfter.data.creators.value.length, 1);
    t.true(metadataAfter.data.creators.value[0].verified);
  }

  t.pass('Successfully verified creator on ProgrammableNonFungible');
});

/**
 * Test: Verify creator on Fungible
 */
test('it can verify the creator of a Fungible', async (t) => {
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
  const metadataAfter = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataAfter.data.creators);
  if (metadataAfter.data.creators.__option === 'Some') {
    t.is(metadataAfter.data.creators.value.length, 1);
    t.true(metadataAfter.data.creators.value[0].verified);
  }

  t.pass('Successfully verified creator on Fungible');
});

/**
 * Test: Verify multiple creators
 */
test('it can verify one of multiple creators', async (t) => {
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

  // Verify first creator
  const verifyInstruction1 = getVerifyCreatorV1Instruction({
    authority: creator1,
    metadata: metadataAddress,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, verifyInstruction1, [creator1]);

  // Verify first creator is verified, second is still unverified
  const metadataAfterFirst = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataAfterFirst.data.creators);
  if (metadataAfterFirst.data.creators.__option === 'Some') {
    t.is(metadataAfterFirst.data.creators.value.length, 2);
    t.true(metadataAfterFirst.data.creators.value[0].verified);
    t.false(metadataAfterFirst.data.creators.value[1].verified);
  }

  // Verify second creator
  const verifyInstruction2 = getVerifyCreatorV1Instruction({
    authority: creator2,
    metadata: metadataAddress,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, verifyInstruction2, [creator2]);

  // Verify both creators are now verified
  const metadataAfterBoth = await fetchMetadata(rpc, metadataAddress);
  t.truthy(metadataAfterBoth.data.creators);
  if (metadataAfterBoth.data.creators.__option === 'Some') {
    t.is(metadataAfterBoth.data.creators.value.length, 2);
    t.true(metadataAfterBoth.data.creators.value[0].verified);
    t.true(metadataAfterBoth.data.creators.value[1].verified);
  }

  t.pass('Successfully verified multiple creators independently');
});
