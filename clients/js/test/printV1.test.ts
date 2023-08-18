import { createMintWithAssociatedToken } from '@metaplex-foundation/mpl-toolbox';
import { generateSigner, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  DigitalAsset,
  TokenStandard,
  fetchDigitalAsset,
  printSupply,
  printV1,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test.skip('it can print a new edition from a NonFungible', async (t) => {
  // Given an existing master edition asset.
  const umi = await createUmi();
  const originalOwner = generateSigner(umi);
  const originalMint = await createDigitalAssetWithToken(umi, {
    tokenOwner: originalOwner.publicKey,
    printSupply: printSupply('Limited', [10]),
    tokenStandard: TokenStandard.NonFungible,
  });

  // When we update the name of the asset.
  const editionMint = generateSigner(umi);
  const editionOwner = generateSigner(umi);
  await printV1(umi, {
    masterTokenAccountOwner: originalOwner,
    masterEditionMint: originalMint.publicKey,
    editionMint,
    editionTokenAccountOwner: editionOwner.publicKey,
    editionNumber: 1,
  }).sendAndConfirm(umi);

  // Then the original NFT was updated.
  const originalAsset = await fetchDigitalAsset(umi, originalMint.publicKey);
  t.like(originalAsset, <DigitalAsset>{
    edition: { supply: 1n, maxSupply: some(10n) },
  });

  // And the printed NFT was created with the same data.
  // TODO
});

test('it can print a new edition from a NonFungible by initializing the mint beforehand', async (t) => {
  // Given an existing master edition asset.
  const umi = await createUmi();
  const originalOwner = generateSigner(umi);
  const originalMint = await createDigitalAssetWithToken(umi, {
    tokenOwner: originalOwner.publicKey,
    printSupply: printSupply('Limited', [10]),
    tokenStandard: TokenStandard.NonFungible,
  });

  // And given we have the mint of the printed edition initialized.
  const editionMint = generateSigner(umi);
  const editionMintAuthority = generateSigner(umi);
  const editionOwner = generateSigner(umi);
  await createMintWithAssociatedToken(umi, {
    mint: editionMint,
    owner: editionOwner.publicKey,
    mintAuthority: editionMintAuthority,
    freezeAuthority: editionMintAuthority.publicKey,
    amount: 1,
  }).sendAndConfirm(umi);

  // When we update the name of the asset.
  await printV1(umi, {
    masterTokenAccountOwner: originalOwner,
    masterEditionMint: originalMint.publicKey,
    editionMint,
    editionMintAuthority,
    editionTokenAccountOwner: editionOwner.publicKey,
    editionNumber: 1,
  }).sendAndConfirm(umi);

  // Then the original NFT was updated.
  const originalAsset = await fetchDigitalAsset(umi, originalMint.publicKey);
  t.like(originalAsset, <DigitalAsset>{
    edition: { supply: 1n, maxSupply: some(10n) },
  });

  // And the printed NFT was created with the same data.
  // TODO
});

test('it cannot print a new edition if the initialized edition mint account has more than 1 token of supply', async (t) => {
  // Given an existing master edition asset.
  const umi = await createUmi();
  const originalOwner = generateSigner(umi);
  const originalMint = await createDigitalAssetWithToken(umi, {
    tokenOwner: originalOwner.publicKey,
    printSupply: printSupply('Limited', [10]),
    tokenStandard: TokenStandard.NonFungible,
  });

  // And given we have the mint of the printed edition initialized with more than 1 token.
  const editionMint = generateSigner(umi);
  const editionMintAuthority = generateSigner(umi);
  const editionOwner = generateSigner(umi);
  await createMintWithAssociatedToken(umi, {
    mint: editionMint,
    owner: editionOwner.publicKey,
    mintAuthority: editionMintAuthority,
    freezeAuthority: editionMintAuthority.publicKey,
    amount: 2,
  }).sendAndConfirm(umi);

  // When we try to print a new edition of the asset.
  const promise = printV1(umi, {
    masterTokenAccountOwner: originalOwner,
    masterEditionMint: originalMint.publicKey,
    editionMint,
    editionMintAuthority,
    editionTokenAccountOwner: editionOwner.publicKey,
    editionNumber: 1,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidMintForTokenStandard' });
});
