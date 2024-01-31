import {
  createMintWithAssociatedToken,
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
  printV2,
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
  await printV2(umi, {
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
      printV2(umi, {
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
  await printV2(umi, {
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
  const promise = printV2(umi, {
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

  const digitalAssetWithToken = await fetchDigitalAssetWithAssociatedToken(
    umi,
    originalMint.publicKey,
    originalOwner.publicKey
  );
  // const tokenAccount = await fetchToken(umi, digitalAssetWithToken.token.publicKey);

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

  await printV2(umi, {
    masterTokenAccountOwner: originalOwner.publicKey,
    masterEditionMint: originalMint.publicKey,
    editionMint,
    editionTokenAccountOwner: editionOwner.publicKey,
    editionNumber: 1,
    tokenStandard: TokenStandard.NonFungible,
    masterTokenAccount: digitalAssetWithToken.token.publicKey,
    payer: delegate,
    holderDelegateRecord: holderDelegateRecord[0],
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

test('it can delegate multiple authorities to print new editions', async (t) => {
  // Given an existing master edition asset.
  const umi = await createUmi();
  const originalOwner = generateSigner(umi);
  const delegate0 = generateSigner(umi);
  const delegate1 = generateSigner(umi);
  umi.rpc.airdrop(delegate0.publicKey, sol(1));
  umi.rpc.airdrop(delegate1.publicKey, sol(1));
  const originalMint = await createDigitalAssetWithToken(umi, {
    name: 'My NFT',
    symbol: 'MNFT',
    uri: 'https://example.com/nft.json',
    sellerFeeBasisPoints: percentAmount(5.42),
    tokenOwner: originalOwner.publicKey,
    printSupply: printSupply('Limited', [10]),
    tokenStandard: TokenStandard.NonFungible,
  });

  const holderDelegateRecord0 = findHolderDelegateRecordPda(umi, {
    mint: originalMint.publicKey,
    delegateRole: 'print_delegate',
    owner: originalOwner.publicKey,
    delegate: delegate0.publicKey,
  });

  const holderDelegateRecord1 = findHolderDelegateRecordPda(umi, {
    mint: originalMint.publicKey,
    delegateRole: 'print_delegate',
    owner: originalOwner.publicKey,
    delegate: delegate1.publicKey,
  });

  const digitalAssetWithToken = await fetchDigitalAssetWithAssociatedToken(
    umi,
    originalMint.publicKey,
    originalOwner.publicKey
  );
  // const tokenAccount = await fetchToken(umi, digitalAssetWithToken.token.publicKey);

  await delegatePrintDelegateV1(umi, {
    delegate: delegate0.publicKey,
    mint: originalMint.publicKey,
    tokenStandard: TokenStandard.NonFungible,
    token: digitalAssetWithToken.token.publicKey,
    authority: originalOwner,
    delegateRecord: holderDelegateRecord0[0],
  }).sendAndConfirm(umi);

  await delegatePrintDelegateV1(umi, {
    delegate: delegate1.publicKey,
    mint: originalMint.publicKey,
    tokenStandard: TokenStandard.NonFungible,
    token: digitalAssetWithToken.token.publicKey,
    authority: originalOwner,
    delegateRecord: holderDelegateRecord1[0],
  }).sendAndConfirm(umi);

  // When the delegate prints a new edition of the asset.
  const editionMint0 = generateSigner(umi);
  const editionOwner0 = generateSigner(umi);
  await printV2(umi, {
    masterTokenAccountOwner: originalOwner.publicKey,
    masterEditionMint: originalMint.publicKey,
    editionMint: editionMint0,
    editionTokenAccountOwner: editionOwner0.publicKey,
    editionNumber: 1,
    tokenStandard: TokenStandard.NonFungible,
    masterTokenAccount: digitalAssetWithToken.token.publicKey,
    payer: delegate0,
    holderDelegateRecord: holderDelegateRecord0[0],
  }).sendAndConfirm(umi);

  // When the delegate prints a new edition of the asset.
  const editionMint1 = generateSigner(umi);
  const editionOwner1 = generateSigner(umi);
  await printV2(umi, {
    masterTokenAccountOwner: originalOwner.publicKey,
    masterEditionMint: originalMint.publicKey,
    editionMint: editionMint1,
    editionTokenAccountOwner: editionOwner1.publicKey,
    editionNumber: 2,
    tokenStandard: TokenStandard.NonFungible,
    masterTokenAccount: digitalAssetWithToken.token.publicKey,
    payer: delegate1,
    holderDelegateRecord: holderDelegateRecord1[0],
  }).sendAndConfirm(umi);

  // Then the original NFT was updated.
  const originalAsset = await fetchDigitalAsset(umi, originalMint.publicKey);
  t.like(originalAsset, <DigitalAsset>{
    edition: { supply: 2n, maxSupply: some(10n) },
  });

  // And the printed NFT was created with the same data.
  const editionAsset0 = await fetchDigitalAssetWithAssociatedToken(
    umi,
    editionMint0.publicKey,
    editionOwner0.publicKey
  );
  t.like(editionAsset0, <DigitalAssetWithToken>{
    publicKey: editionMint0.publicKey,
    metadata: {
      name: 'My NFT',
      symbol: 'MNFT',
      uri: 'https://example.com/nft.json',
      sellerFeeBasisPoints: 542,
    },
    token: {
      owner: editionOwner0.publicKey,
      amount: 1n,
    },
    edition: {
      isOriginal: false,
      parent: findMasterEditionPda(umi, { mint: originalMint.publicKey })[0],
      edition: 1n,
    },
  });

  // And the printed NFT was created with the same data.
  const editionAsset1 = await fetchDigitalAssetWithAssociatedToken(
    umi,
    editionMint1.publicKey,
    editionOwner1.publicKey
  );
  t.like(editionAsset1, <DigitalAssetWithToken>{
    publicKey: editionMint1.publicKey,
    metadata: {
      name: 'My NFT',
      symbol: 'MNFT',
      uri: 'https://example.com/nft.json',
      sellerFeeBasisPoints: 542,
    },
    token: {
      owner: editionOwner1.publicKey,
      amount: 1n,
    },
    edition: {
      isOriginal: false,
      parent: findMasterEditionPda(umi, { mint: originalMint.publicKey })[0],
      edition: 2n,
    },
  });
});

test('it can print a new owner as the master holder after delegating the authority', async (t) => {
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

  const digitalAssetWithToken = await fetchDigitalAssetWithAssociatedToken(
    umi,
    originalMint.publicKey,
    originalOwner.publicKey
  );
  // const tokenAccount = await fetchToken(umi, digitalAssetWithToken.token.publicKey);

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
  await printV2(umi, {
    masterTokenAccountOwner: originalOwner,
    masterEditionMint: originalMint.publicKey,
    editionMint,
    editionTokenAccountOwner: editionOwner.publicKey,
    editionNumber: 1,
    tokenStandard: TokenStandard.NonFungible,
    masterTokenAccount: digitalAssetWithToken.token.publicKey,
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
