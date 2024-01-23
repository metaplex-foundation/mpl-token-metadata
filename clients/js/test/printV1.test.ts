import {
  createMintWithAssociatedToken,
  fetchToken,
  setComputeUnitLimit,
} from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  percentAmount,
  sol,
  some,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import test from 'ava';
import {
  DigitalAsset,
  DigitalAssetWithToken,
  TokenStandard,
  delegatePrintDelegateV1,
  fetchDigitalAsset,
  fetchDigitalAssetWithAssociatedToken,
  findHolderDelegateRecordPda,
  findMasterEditionPda,
  printSupply,
  printV1,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can print a new edition from a NonFungible', async (t) => {
  // Given an existing master edition asset.
  const umi = await createUmi();
  const originalOwner = generateSigner(umi);
  const originalMint = await createDigitalAssetWithToken(umi, {
    name: 'My NFT',
    symbol: 'MNFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: percentAmount(5.42),
    tokenOwner: originalOwner.publicKey,
    printSupply: printSupply('Limited', [10]),
    tokenStandard: TokenStandard.NonFungible,
  });

  // When we print a new edition of the asset.
  const editionMint = generateSigner(umi);
  const editionOwner = generateSigner(umi);
  await printV1(umi, {
    masterTokenAccountOwner: originalOwner,
    masterEditionMint: originalMint.publicKey,
    editionMint,
    editionTokenAccountOwner: editionOwner.publicKey,
    editionNumber: 1,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then the original NFT was updated.
  const originalAsset = await fetchDigitalAsset(umi, originalMint.publicKey);
  t.like(originalAsset, <DigitalAsset>{
    edition: { supply: 1n, maxSupply: some(10n) },
  });

  // And the printed NFT was created with the same data.
  const editionAsset = await fetchDigitalAssetWithAssociatedToken(
    umi,
    editionMint.publicKey,
    editionOwner.publicKey
  );
  t.like(editionAsset, <DigitalAssetWithToken>{
    publicKey: editionMint.publicKey,
    metadata: {
      name: 'My NFT',
      symbol: 'MNFT',
      uri: 'https://example.com/nft.json',
      sellerFeeBasisPoints: 542,
    },
    token: {
      owner: editionOwner.publicKey,
      amount: 1n,
    },
    edition: {
      isOriginal: false,
      parent: findMasterEditionPda(umi, { mint: originalMint.publicKey })[0],
      edition: 1n,
    },
  });
});

test('it can print a new edition from a ProgrammableNonFungible', async (t) => {
  // Given an existing master edition PNFT.
  const umi = await createUmi();
  const originalOwner = generateSigner(umi);
  const originalMint = await createDigitalAssetWithToken(umi, {
    name: 'My PNFT',
    symbol: 'MPNFT',
    uri: 'https://example.com/pnft.json',
    sellerFeeBasisPoints: percentAmount(5.42),
    tokenOwner: originalOwner.publicKey,
    printSupply: printSupply('Limited', [10]),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // When we print a new edition of the asset.
  const editionMint = generateSigner(umi);
  const editionOwner = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 400_000 }))
    .add(
      printV1(umi, {
        masterTokenAccountOwner: originalOwner,
        masterEditionMint: originalMint.publicKey,
        editionMint,
        editionTokenAccountOwner: editionOwner.publicKey,
        editionNumber: 1,
        tokenStandard: TokenStandard.ProgrammableNonFungible,
      })
    )
    .sendAndConfirm(umi);

  // Then the original NFT was updated.
  const originalAsset = await fetchDigitalAsset(umi, originalMint.publicKey);
  t.like(originalAsset, <DigitalAsset>{
    edition: { supply: 1n, maxSupply: some(10n) },
  });

  // And the printed NFT was created with the same data.
  const editionAsset = await fetchDigitalAssetWithAssociatedToken(
    umi,
    editionMint.publicKey,
    editionOwner.publicKey
  );
  t.like(editionAsset, <DigitalAssetWithToken>{
    publicKey: editionMint.publicKey,
    metadata: {
      name: 'My PNFT',
      symbol: 'MPNFT',
      uri: 'https://example.com/pnft.json',
      sellerFeeBasisPoints: 542,
      tokenStandard: some(TokenStandard.ProgrammableNonFungibleEdition),
    },
    token: {
      owner: editionOwner.publicKey,
      amount: 1n,
    },
    edition: {
      isOriginal: false,
      parent: findMasterEditionPda(umi, { mint: originalMint.publicKey })[0],
      edition: 1n,
    },
  });
});

test('it can print a new edition from a NonFungible by initializing the mint beforehand', async (t) => {
  // Given an existing master edition asset.
  const umi = await createUmi();
  const originalOwner = generateSigner(umi);
  const originalMint = await createDigitalAssetWithToken(umi, {
    name: 'My NFT',
    symbol: 'MNFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: percentAmount(5.42),
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

  // When we print a new edition of the asset.
  await printV1(umi, {
    masterTokenAccountOwner: originalOwner,
    masterEditionMint: originalMint.publicKey,
    editionMint,
    editionMintAuthority,
    editionTokenAccountOwner: editionOwner.publicKey,
    editionNumber: 1,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then the original NFT was updated.
  const originalAsset = await fetchDigitalAsset(umi, originalMint.publicKey);
  t.like(originalAsset, <DigitalAsset>{
    edition: {
      isOriginal: true,
      supply: 1n,
      maxSupply: some(10n),
    },
  });

  // And the printed NFT was created with the same data.
  const editionAsset = await fetchDigitalAssetWithAssociatedToken(
    umi,
    editionMint.publicKey,
    editionOwner.publicKey
  );
  t.like(editionAsset, <DigitalAssetWithToken>{
    publicKey: editionMint.publicKey,
    metadata: {
      name: 'My NFT',
      symbol: 'MNFT',
      uri: 'https://example.com/nft.json',
      sellerFeeBasisPoints: 542,
    },
    token: {
      owner: editionOwner.publicKey,
      amount: 1n,
    },
    edition: {
      isOriginal: false,
      parent: findMasterEditionPda(umi, { mint: originalMint.publicKey })[0],
      edition: 1n,
    },
  });
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
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidMintForTokenStandard' });
});

test('it can delegate the authority to print a new edition', async (t) => {
  // Given an existing master edition asset.
  const umi = await createUmi();
  const originalOwner = generateSigner(umi);
  const delegate = generateSigner(umi);
  umi.rpc.airdrop(delegate.publicKey, sol(1));
  const originalMint = await createDigitalAssetWithToken(umi, {
    name: 'My NFT',
    symbol: 'MNFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: percentAmount(5.42),
    tokenOwner: originalOwner.publicKey,
    printSupply: printSupply('Limited', [10]),
    tokenStandard: TokenStandard.NonFungible,
  });

  const holderDelegateRecord = findHolderDelegateRecordPda(umi, {
    mint: originalMint.publicKey,
    delegateRole: 'print_delegate',
    owner: originalOwner.publicKey,
    delegate: delegate.publicKey,
  });

  const digitalAssetWithToken = await fetchDigitalAssetWithAssociatedToken(umi, originalMint.publicKey, originalOwner.publicKey);
  console.log(digitalAssetWithToken);
  const tokenAccount = await fetchToken(umi, digitalAssetWithToken.token.publicKey);
  console.log(tokenAccount);

  await delegatePrintDelegateV1(umi, {
    delegate: delegate.publicKey,
    mint: originalMint.publicKey,
    tokenStandard: TokenStandard.NonFungible,
    token: digitalAssetWithToken.token.publicKey,
    authority: originalOwner,
    delegateRecord: holderDelegateRecord[0],
  }).sendAndConfirm(umi);

  // When the delegate prints a new edition of the asset.
  const editionMint = generateSigner(umi);
  const editionOwner = generateSigner(umi);
  await printV1(umi, {
    masterTokenAccountOwner: originalOwner,
    masterEditionMint: originalMint.publicKey,
    editionMint,
    editionTokenAccountOwner: editionOwner.publicKey,
    editionNumber: 1,
    tokenStandard: TokenStandard.NonFungible,
    masterTokenAccount: digitalAssetWithToken.token.publicKey,
    payer: delegate,
  })
    .addRemainingAccounts({ pubkey: holderDelegateRecord[0], isSigner: false, isWritable: true })
    .sendAndConfirm(umi);

  // Then the original NFT was updated.
  const originalAsset = await fetchDigitalAsset(umi, originalMint.publicKey);
  t.like(originalAsset, <DigitalAsset>{
    edition: { supply: 1n, maxSupply: some(10n) },
  });

  // And the printed NFT was created with the same data.
  const editionAsset = await fetchDigitalAssetWithAssociatedToken(
    umi,
    editionMint.publicKey,
    editionOwner.publicKey
  );
  t.like(editionAsset, <DigitalAssetWithToken>{
    publicKey: editionMint.publicKey,
    metadata: {
      name: 'My NFT',
      symbol: 'MNFT',
      uri: 'https://example.com/nft.json',
      sellerFeeBasisPoints: 542,
    },
    token: {
      owner: editionOwner.publicKey,
      amount: 1n,
    },
    edition: {
      isOriginal: false,
      parent: findMasterEditionPda(umi, { mint: originalMint.publicKey })[0],
      edition: 1n,
    },
  });
});