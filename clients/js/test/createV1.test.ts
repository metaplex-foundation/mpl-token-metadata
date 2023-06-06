import {
  createMint,
  createMintWithAssociatedToken,
  fetchMint,
  Mint,
} from '@metaplex-foundation/mpl-toolbox';
import {
  addAmounts,
  generateSigner,
  none,
  percentAmount,
  publicKey,
  sol,
  some,
  subtractAmounts,
} from '@metaplex-foundation/umi';
import { generateSignerWithSol } from '@metaplex-foundation/umi-bundle-tests';
import test from 'ava';
import {
  collectionDetails,
  createV1,
  fetchMasterEdition,
  fetchMetadata,
  findMasterEditionPda,
  findMetadataPda,
  MasterEdition,
  Metadata,
  programmableConfig,
  TokenStandard,
} from '../src';
import { createUmi } from './_setup';

test('it can create a new NonFungible', async (t) => {
  // Given a new mint Signer.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  const masterEdition = findMasterEditionPda(umi, { mint: mint.publicKey });

  // When we create a new NonFungible at this address.
  await createV1(umi, {
    mint,
    name: 'My NFT',
    uri: 'https://example.com/my-nft.json',
    sellerFeeBasisPoints: percentAmount(5.5),
  }).sendAndConfirm(umi);

  // Then a Mint account was created with zero supply.
  const mintAccount = await fetchMint(umi, mint.publicKey);
  t.like(mintAccount, <Mint>{
    publicKey: publicKey(mint),
    supply: 0n,
    decimals: 0,
    mintAuthority: some(publicKey(masterEdition)),
    freezeAuthority: some(publicKey(masterEdition)),
  });

  // And a Metadata account was created.
  const metadata = findMetadataPda(umi, { mint: mint.publicKey });
  const metadataAccount = await fetchMetadata(umi, metadata);
  t.like(metadataAccount, <Metadata>{
    publicKey: publicKey(metadata),
    updateAuthority: publicKey(umi.identity),
    mint: publicKey(mint),
    tokenStandard: some(TokenStandard.NonFungible),
    name: 'My NFT',
    uri: 'https://example.com/my-nft.json',
    sellerFeeBasisPoints: 550,
    primarySaleHappened: false,
    isMutable: true,
    creators: some([
      { address: publicKey(umi.identity), verified: true, share: 100 },
    ]),
    collection: none(),
    uses: none(),
    collectionDetails: none(),
    programmableConfig: none(),
  });

  // And a MasterEdition account was created.
  const masterEditionAccount = await fetchMasterEdition(umi, masterEdition);
  t.like(masterEditionAccount, <MasterEdition>{
    publicKey: publicKey(masterEdition),
    supply: 0n,
    maxSupply: some(0n),
  });
});

test('it can create a new ProgrammableNonFungible', async (t) => {
  // Given a new mint Signer.
  const umi = await createUmi();
  const mint = generateSigner(umi);

  // When we create a new ProgrammableNonFungible at this address.
  await createV1(umi, {
    mint,
    name: 'My Programmable NFT',
    uri: 'https://example.com/my-programmable-nft.json',
    sellerFeeBasisPoints: percentAmount(5.5),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then a Mint account was created with zero supply.
  const mintAccount = await fetchMint(umi, mint.publicKey);
  const masterEdition = findMasterEditionPda(umi, { mint: mint.publicKey });
  t.like(mintAccount, <Mint>{
    publicKey: publicKey(mint),
    supply: 0n,
    decimals: 0,
    mintAuthority: some(publicKey(masterEdition)),
    freezeAuthority: some(publicKey(masterEdition)),
  });

  // And a Metadata account was created.
  const metadata = findMetadataPda(umi, { mint: mint.publicKey });
  const metadataAccount = await fetchMetadata(umi, metadata);
  t.like(metadataAccount, <Metadata>{
    publicKey: publicKey(metadata),
    updateAuthority: publicKey(umi.identity),
    mint: publicKey(mint),
    tokenStandard: some(TokenStandard.ProgrammableNonFungible),
    name: 'My Programmable NFT',
    uri: 'https://example.com/my-programmable-nft.json',
    sellerFeeBasisPoints: 550,
    primarySaleHappened: false,
    isMutable: true,
    creators: some([
      { address: publicKey(umi.identity), verified: true, share: 100 },
    ]),
    collection: none(),
    uses: none(),
    collectionDetails: none(),
    programmableConfig: some(programmableConfig('V1', { ruleSet: none() })),
  });

  // And a MasterEdition account was created.
  const masterEditionAccount = await fetchMasterEdition(umi, masterEdition);
  t.like(masterEditionAccount, <MasterEdition>{
    publicKey: publicKey(masterEdition),
    supply: 0n,
    maxSupply: some(0n),
  });
});

test('it can create a new Fungible', async (t) => {
  // Given a new mint Signer.
  const umi = await createUmi();
  const mint = generateSigner(umi);

  // When we create a new Fungible at this address.
  await createV1(umi, {
    mint,
    name: 'My Fungible',
    uri: 'https://example.com/my-fungible.json',
    sellerFeeBasisPoints: percentAmount(5.5),
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);

  // Then a Mint account was created with zero supply.
  const mintAccount = await fetchMint(umi, mint.publicKey);
  t.like(mintAccount, <Mint>{
    publicKey: publicKey(mint),
    supply: 0n,
    decimals: 0,
    mintAuthority: some(publicKey(umi.identity)),
    freezeAuthority: some(publicKey(umi.identity)),
  });

  // And a Metadata account was created.
  const metadata = findMetadataPda(umi, { mint: mint.publicKey });
  const metadataAccount = await fetchMetadata(umi, metadata);
  t.like(metadataAccount, <Metadata>{
    publicKey: publicKey(metadata),
    updateAuthority: publicKey(umi.identity),
    mint: publicKey(mint),
    tokenStandard: some(TokenStandard.Fungible),
    name: 'My Fungible',
    uri: 'https://example.com/my-fungible.json',
    sellerFeeBasisPoints: 550,
    primarySaleHappened: false,
    isMutable: true,
    creators: some([
      { address: publicKey(umi.identity), verified: true, share: 100 },
    ]),
    collection: none(),
    uses: none(),
    collectionDetails: none(),
    programmableConfig: none(),
  });
});

test('it can create a new FungibleAsset', async (t) => {
  // Given a new mint Signer.
  const umi = await createUmi();
  const mint = generateSigner(umi);

  // When we create a new FungibleAsset at this address.
  await createV1(umi, {
    mint,
    name: 'My Fungible Asset',
    uri: 'https://example.com/my-fungible-asset.json',
    sellerFeeBasisPoints: percentAmount(5.5),
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);

  // Then a Mint account was created with zero supply.
  const mintAccount = await fetchMint(umi, mint.publicKey);
  t.like(mintAccount, <Mint>{
    publicKey: publicKey(mint),
    supply: 0n,
    decimals: 0,
    mintAuthority: some(publicKey(umi.identity)),
    freezeAuthority: some(publicKey(umi.identity)),
  });

  // And a Metadata account was created.
  const metadata = findMetadataPda(umi, { mint: mint.publicKey });
  const metadataAccount = await fetchMetadata(umi, metadata);
  t.like(metadataAccount, <Metadata>{
    publicKey: publicKey(metadata),
    updateAuthority: publicKey(umi.identity),
    mint: publicKey(mint),
    tokenStandard: some(TokenStandard.FungibleAsset),
    name: 'My Fungible Asset',
    uri: 'https://example.com/my-fungible-asset.json',
    sellerFeeBasisPoints: 550,
    primarySaleHappened: false,
    isMutable: true,
    creators: some([
      { address: publicKey(umi.identity), verified: true, share: 100 },
    ]),
    collection: none(),
    uses: none(),
    collectionDetails: none(),
    programmableConfig: none(),
  });
});

test('it can create a collection NonFungible', async (t) => {
  // Given a new mint Signer.
  const umi = await createUmi();
  const mint = generateSigner(umi);

  // When we create a new NonFungible at this address.
  await createV1(umi, {
    mint,
    name: 'My Collection NFT',
    uri: 'https://example.com/my-collection-nft.json',
    sellerFeeBasisPoints: percentAmount(5.5),
    isCollection: true,
  }).sendAndConfirm(umi);

  // Then a Metadata account was created with the collection details set.
  const metadata = findMetadataPda(umi, { mint: mint.publicKey });
  const metadataAccount = await fetchMetadata(umi, metadata);
  t.like(metadataAccount, <Metadata>{
    publicKey: publicKey(metadata),
    collectionDetails: some(collectionDetails('V1', { size: 0n })),
  });
});

test('it can create a NonFungible from an existing mint', async (t) => {
  // Given an existing mint account.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  await createMint(umi, { mint }).sendAndConfirm(umi);

  // When we create a new NonFungible at this address.
  await createV1(umi, {
    mint: mint.publicKey,
    name: 'My NFT',
    uri: 'https://example.com/my-nft.json',
    sellerFeeBasisPoints: percentAmount(5.5),
  }).sendAndConfirm(umi);

  // Then an associated Metadata account was created.
  const metadata = findMetadataPda(umi, { mint: mint.publicKey });
  const metadataAccount = await fetchMetadata(umi, metadata);
  t.like(metadataAccount, <Metadata>{
    publicKey: publicKey(metadata),
    mint: publicKey(mint),
  });
});

test('it can create a ProgrammableNonFungible from an existing mint', async (t) => {
  // Given an existing mint account.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  await createMint(umi, { mint }).sendAndConfirm(umi);

  // When we create a new ProgrammableNonFungible at this address.
  await createV1(umi, {
    mint: mint.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    name: 'My NFT',
    uri: 'https://example.com/my-nft.json',
    sellerFeeBasisPoints: percentAmount(5.5),
  }).sendAndConfirm(umi);

  // Then an associated Metadata account was created.
  const metadata = findMetadataPda(umi, { mint: mint.publicKey });
  const metadataAccount = await fetchMetadata(umi, metadata);
  t.like(metadataAccount, <Metadata>{
    publicKey: publicKey(metadata),
    mint: publicKey(mint),
    tokenStandard: some(TokenStandard.ProgrammableNonFungible),
  });
});

test('it cannot create a programmableNonFungible from an existing mint with supply greater than zero', async (t) => {
  // Given an existing mint account with a supply greater than zero.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  await createMintWithAssociatedToken(umi, {
    mint,
    owner: umi.identity.publicKey,
    amount: 1n,
  }).sendAndConfirm(umi);

  // When we try to create a new ProgrammableNonFungible at this address.
  const promise = createV1(umi, {
    mint: mint.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    name: 'My NFT',
    uri: 'https://example.com/my-nft.json',
    sellerFeeBasisPoints: percentAmount(5.5),
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'MintSupplyMustBeZero' });
});

test('an explicit payer can be used for storage fees', async (t) => {
  // Given a new mint Signer and an explicit payer.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  const payer = await generateSignerWithSol(umi, sol(10));

  // When we create a new NonFungible using the explicit payer.
  const builder = createV1(umi, {
    mint,
    name: 'My NFT',
    uri: 'https://example.com/my-nft.json',
    sellerFeeBasisPoints: percentAmount(5.5),
    payer,
  });
  await builder.sendAndConfirm(umi);

  // Then the payer has paid the storage fees.
  const storageFees = await builder.getRentCreatedOnChain(umi);
  const totalFees = addAmounts(storageFees, sol(0.01)); // Create fee.
  const payerBalance = await umi.rpc.getBalance(payer.publicKey);
  t.deepEqual(payerBalance, subtractAmounts(sol(10), totalFees));
});
