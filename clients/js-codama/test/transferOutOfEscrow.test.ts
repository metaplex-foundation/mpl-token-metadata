/**
 * TransferOutOfEscrow tests for js-codama client
 *
 * TransferOutOfEscrow transfers tokens from an escrow account to a destination.
 * The escrow must first have tokens deposited into it (by transferring to the
 * escrow's ATA for the attribute mint).
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
  getTransferOutOfEscrowInstruction,
  getMintV1InstructionAsync,
} from '../src/generated/instructions';
import { TokenStandard } from '../src/generated/types';
import { fetchTokenOwnedEscrow } from '../src/generated/accounts';
import { createNft, createFungible } from '../src/hooked/createHelpers';
import { findMetadataPda } from '../src/generated/pdas';
import {
  SPL_TOKEN_PROGRAM_ADDRESS,
  SPL_ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
  findAssociatedTokenPda,
} from './_setup';
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
import {
  getTransferInstruction,
  getCreateAssociatedTokenInstructionAsync,
} from '@solana-program/token';

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
 * Test: Transfer tokens out of escrow
 *
 * Note: This is a complex operation that requires:
 * 1. Creating an NFT (the escrow holder)
 * 2. Creating a fungible token (the attribute to hold)
 * 3. Creating an escrow account
 * 4. Depositing tokens into the escrow's ATA
 * 5. Transferring tokens out of the escrow
 */
test('it can transfer tokens out of an escrow account', async (t) => {
  const canRun = await canRunTests();
  if (!canRun) {
    t.log(getSkipMessage());
    t.pass('Skipped - validator not running');
    return;
  }

  const rpc = createRpc();
  const rpcSubscriptions = createRpcSubscriptions();
  const escrowMint = await createKeypair();
  const attributeMint = await createKeypair();
  const owner = await createKeypair();

  await airdrop(rpc, owner.address);

  // Create a NonFungible NFT (the escrow holder)
  const [createNftIx, mintNftIx] = await createNft({
    mint: escrowMint,
    authority: owner,
    payer: owner,
    name: 'Escrow NFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: basisPoints(5),
    tokenOwner: owner.address,
    splTokenProgram: SPL_TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirmInstructions(rpc, rpcSubscriptions, [createNftIx, mintNftIx], [
    escrowMint,
    owner,
  ]);

  // Derive the NFT's token account
  const [nftTokenAddress] = await findAssociatedTokenPda({
    mint: escrowMint.address,
    owner: owner.address,
  });

  // Create the escrow account
  const [escrowAddress] = await findTokenOwnerEscrowPda(escrowMint.address);

  const createEscrowIx = await getCreateEscrowAccountInstructionAsync({
    escrow: escrowAddress,
    mint: escrowMint.address,
    tokenAccount: nftTokenAddress,
    payer: owner,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createEscrowIx, [owner]);

  // Verify escrow was created
  const escrowAccount = await fetchTokenOwnedEscrow(rpc, escrowAddress);
  t.truthy(escrowAccount.data.baseToken); // baseToken is set
  t.is(escrowAccount.data.authority.__kind, 'TokenOwner');

  // Create a fungible token (the attribute)
  const createFungibleIx = await createFungible({
    mint: attributeMint,
    authority: owner,
    payer: owner,
    name: 'Attribute Token',
    uri: 'https://example.com/token.json',
    sellerFeeBasisPoints: basisPoints(0),
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createFungibleIx, [attributeMint, owner]);

  // Mint some attribute tokens to the owner
  const [attrMetadata] = await findMetadataPda({ mint: attributeMint.address });

  const mintAttrIx = await getMintV1InstructionAsync({
    mint: attributeMint.address,
    authority: owner,
    payer: owner,
    metadata: attrMetadata,
    amount: 100,
    tokenStandard: TokenStandard.Fungible,
    tokenOwner: owner.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, mintAttrIx, [owner]);

  // Get owner's ATA for attribute token
  const [ownerAttrAta] = await findAssociatedTokenPda({
    mint: attributeMint.address,
    owner: owner.address,
  });

  // Get escrow's ATA for attribute token (destination for the transfer)
  const [escrowAttrAta] = await findAssociatedTokenPda({
    mint: attributeMint.address,
    owner: escrowAddress,
  });

  // First create the escrow's ATA
  const createEscrowAtaIx = await getCreateAssociatedTokenInstructionAsync({
    payer: owner,
    owner: escrowAddress,
    mint: attributeMint.address,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, createEscrowAtaIx, [owner]);

  // Transfer some attribute tokens to the escrow's ATA
  const transferToEscrowIx = getTransferInstruction({
    source: ownerAttrAta,
    destination: escrowAttrAta,
    authority: owner,
    amount: 50n,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, transferToEscrowIx, [owner]);

  // Now get owner's ATA balance (should have 50 left)
  const ownerAtaInfo = await rpc.getTokenAccountBalance(ownerAttrAta).send();
  t.is(String(ownerAtaInfo.value.amount), '50');

  // Get escrow's ATA balance (should have 50)
  const escrowAtaInfo = await rpc.getTokenAccountBalance(escrowAttrAta).send();
  t.is(String(escrowAtaInfo.value.amount), '50');

  // Get the metadata for the escrow NFT
  const [escrowNftMetadata] = await findMetadataPda({ mint: escrowMint.address });

  // Transfer out of escrow
  const transferOutIx = getTransferOutOfEscrowInstruction({
    escrow: escrowAddress,
    metadata: escrowNftMetadata,
    payer: owner,
    attributeMint: attributeMint.address,
    attributeSrc: escrowAttrAta,
    attributeDst: ownerAttrAta,
    escrowMint: escrowMint.address,
    escrowAccount: nftTokenAddress,
    amount: 25,
  });

  await sendAndConfirm(rpc, rpcSubscriptions, transferOutIx, [owner]);

  // Verify balances after transfer
  const ownerAtaInfoAfter = await rpc.getTokenAccountBalance(ownerAttrAta).send();
  t.is(String(ownerAtaInfoAfter.value.amount), '75'); // 50 + 25 = 75

  const escrowAtaInfoAfter = await rpc.getTokenAccountBalance(escrowAttrAta).send();
  t.is(String(escrowAtaInfoAfter.value.amount), '25'); // 50 - 25 = 25
});
