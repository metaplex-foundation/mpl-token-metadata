import { fetchMint, Mint } from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  none,
  percentAmount,
  publicKey,
  some,
} from '@metaplex-foundation/umi';
import test from 'ava';
import {
  createFungible,
  createFungibleAsset,
  createNft,
  createProgrammableNft,
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
  await createNft(umi, {
    mint,
    name: 'My NFT',
    uri: 'https://example.com/my-nft.json',
    sellerFeeBasisPoints: percentAmount(5.5),
  }).sendAndConfirm(umi);

  // Then a Mint account was created with 1 supply.
  const mintAccount = await fetchMint(umi, mint.publicKey);
  t.like(mintAccount, <Mint>{
    publicKey: publicKey(mint),
    supply: 1n,
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
  await createProgrammableNft(umi, {
    mint,
    name: 'My Programmable NFT',
    uri: 'https://example.com/my-programmable-nft.json',
    sellerFeeBasisPoints: percentAmount(5.5),
  }).sendAndConfirm(umi);

  // Then a Mint account was created with 1 supply.
  const mintAccount = await fetchMint(umi, mint.publicKey);
  const masterEdition = findMasterEditionPda(umi, { mint: mint.publicKey });
  t.like(mintAccount, <Mint>{
    publicKey: publicKey(mint),
    supply: 1n,
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
  await createFungible(umi, {
    mint,
    name: 'My Fungible',
    uri: 'https://example.com/my-fungible.json',
    sellerFeeBasisPoints: percentAmount(5.5),
  }).sendAndConfirm(umi);

  // Then a Mint account was created with no supply.
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
  await createFungibleAsset(umi, {
    mint,
    name: 'My Fungible Asset',
    uri: 'https://example.com/my-fungible-asset.json',
    sellerFeeBasisPoints: percentAmount(5.5),
  }).sendAndConfirm(umi);

  // Then a Mint account was created with no supply.
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
