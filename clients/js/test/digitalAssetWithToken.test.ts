import {
  createToken,
  findAssociatedTokenPda,
} from '@metaplex-foundation/mpl-toolbox';
import {
  base58PublicKey,
  generateSigner,
  publicKey,
  some,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import test from 'ava';
import {
  DigitalAssetWithToken,
  fetchAllDigitalAssetWithTokenByMint,
  fetchAllDigitalAssetWithTokenByOwner,
  fetchAllDigitalAssetWithTokenByOwnerAndMint,
  fetchDigitalAssetWithAssociatedToken,
  fetchDigitalAssetWithTokenByMint,
  findMasterEditionPda,
  findMetadataPda,
  mintV1,
  TokenStandard,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can fetch a DigitalAssetWithToken from its mint and token accounts', async (t) => {
  // Given an existing NFT.
  const umi = await createUmi();
  const owner = generateSigner(umi).publicKey;
  const mint = await createDigitalAssetWithToken(umi, { tokenOwner: owner });

  // When we fetch a DigitalAssetWithToken using its mint address
  // and either its token address or its owner address.
  const digitalAsset = await fetchDigitalAssetWithAssociatedToken(
    umi,
    mint.publicKey,
    owner
  );

  // Then we get the expected digital asset.
  const ata = findAssociatedTokenPda(umi, { mint: mint.publicKey, owner });
  const metadata = findMetadataPda(umi, { mint: mint.publicKey });
  const edition = findMasterEditionPda(umi, { mint: mint.publicKey });
  t.like(digitalAsset, <DigitalAssetWithToken>{
    publicKey: publicKey(mint.publicKey),
    mint: { publicKey: publicKey(mint.publicKey) },
    metadata: {
      publicKey: publicKey(metadata),
      mint: publicKey(mint.publicKey),
      tokenStandard: some(TokenStandard.NonFungible),
    },
    edition: {
      isOriginal: true,
      publicKey: publicKey(edition),
    },
    token: {
      publicKey: publicKey(ata),
    },
    tokenRecord: undefined,
  });
});

test('it can fetch a DigitalAssetWithToken from its mint only', async (t) => {
  // Given an existing NFT.
  const umi = await createUmi();
  const owner = generateSigner(umi).publicKey;
  const mint = await createDigitalAssetWithToken(umi, { tokenOwner: owner });

  // When we fetch a DigitalAssetWithToken using only its mint address.
  const digitalAsset = await fetchDigitalAssetWithTokenByMint(
    umi,
    mint.publicKey
  );

  // Then we get the expected digital asset.
  const ata = findAssociatedTokenPda(umi, { mint: mint.publicKey, owner });
  const metadata = findMetadataPda(umi, { mint: mint.publicKey });
  const edition = findMasterEditionPda(umi, { mint: mint.publicKey });
  t.like(digitalAsset, <DigitalAssetWithToken>{
    publicKey: publicKey(mint.publicKey),
    mint: { publicKey: publicKey(mint.publicKey) },
    metadata: {
      publicKey: publicKey(metadata),
      mint: publicKey(mint.publicKey),
      tokenStandard: some(TokenStandard.NonFungible),
    },
    edition: {
      isOriginal: true,
      publicKey: publicKey(edition),
    },
    token: {
      publicKey: publicKey(ata),
    },
    tokenRecord: undefined,
  });
});

test('it can fetch all DigitalAssetWithToken by owner', async (t) => {
  // Given two owner A and B.
  const umi = await createUmi();
  const ownerA = generateSigner(umi).publicKey;
  const ownerB = generateSigner(umi).publicKey;

  // And three NFTs such that two are owned by A and one is owned by B.
  const mintA1 = await createDigitalAssetWithToken(umi, { tokenOwner: ownerA });
  const mintA2 = await createDigitalAssetWithToken(umi, { tokenOwner: ownerA });
  const mintB1 = await createDigitalAssetWithToken(umi, { tokenOwner: ownerB });

  // When we fetch all digital assets owned by A.
  const digitalAssets = await fetchAllDigitalAssetWithTokenByOwner(umi, ownerA);

  // Then we get the two digital assets owned by A.
  t.is(digitalAssets.length, 2);
  const mints = digitalAssets.map((da) => base58PublicKey(da.mint.publicKey));
  t.true(mints.includes(base58PublicKey(mintA1.publicKey)));
  t.true(mints.includes(base58PublicKey(mintA2.publicKey)));

  // And we don't get the one owned by B.
  t.false(mints.includes(base58PublicKey(mintB1.publicKey)));
});

test('it can fetch all DigitalAssetWithToken by owner and mint', async (t) => {
  // Given two owner A and B.
  const umi = await createUmi();
  const ownerA = generateSigner(umi).publicKey;
  const ownerB = generateSigner(umi).publicKey;

  // And one SFT owned by A over multiple token accounts.
  // One via an associated token account an one via a regular token account.
  const mintA1 = await createDigitalAssetWithToken(umi, {
    tokenStandard: TokenStandard.FungibleAsset,
    tokenOwner: ownerA,
    amount: 42,
  });
  const associatedToken = findAssociatedTokenPda(umi, {
    mint: mintA1.publicKey,
    owner: ownerA,
  });
  const regularToken = generateSigner(umi);
  await transactionBuilder()
    .add(
      createToken(umi, {
        mint: mintA1.publicKey,
        owner: ownerA,
        token: regularToken,
      })
    )
    .add(
      mintV1(umi, {
        mint: mintA1.publicKey,
        token: regularToken.publicKey,
        tokenStandard: TokenStandard.FungibleAsset,
        amount: 15,
      })
    )
    .sendAndConfirm(umi);

  // And two other NFTs, one owned by A and one owned by B.
  const mintA2 = await createDigitalAssetWithToken(umi, { tokenOwner: ownerA });
  const mintB1 = await createDigitalAssetWithToken(umi, { tokenOwner: ownerB });

  // When we fetch all digital assets from the SFT owned by A.
  const digitalAssets = await fetchAllDigitalAssetWithTokenByOwnerAndMint(
    umi,
    ownerA,
    mintA1.publicKey
  );

  // Then we get the two DigitalAssetWithTokens from mint A1.
  t.is(digitalAssets.length, 2);
  const mints = digitalAssets.map((da) => base58PublicKey(da.mint.publicKey));
  const tokens = digitalAssets.map((da) => base58PublicKey(da.token.publicKey));
  t.true(mints.every((m) => m === base58PublicKey(mintA1.publicKey)));
  t.true(tokens.includes(base58PublicKey(associatedToken)));
  t.true(tokens.includes(base58PublicKey(regularToken.publicKey)));

  // And we don't get any from mint A2 or B1.
  t.false(mints.includes(base58PublicKey(mintA2.publicKey)));
  t.false(mints.includes(base58PublicKey(mintB1.publicKey)));
});

test('it can fetch all DigitalAssetWithToken by mint', async (t) => {
  // Given two owner A and B.
  const umi = await createUmi();
  const ownerA = generateSigner(umi).publicKey;
  const ownerB = generateSigner(umi).publicKey;

  // And an SFT that belongs to both owner A and B.
  const mintU = await createDigitalAssetWithToken(umi, {
    tokenOwner: ownerA,
    tokenStandard: TokenStandard.FungibleAsset,
  });
  const tokenAU = findAssociatedTokenPda(umi, {
    mint: mintU.publicKey,
    owner: ownerA,
  });
  const tokenBU = findAssociatedTokenPda(umi, {
    mint: mintU.publicKey,
    owner: ownerB,
  });
  await mintV1(umi, {
    mint: mintU.publicKey,
    tokenOwner: ownerB,
    amount: 2,
    tokenStandard: TokenStandard.FungibleAsset,
  }).sendAndConfirm(umi);

  // And two other NFTs, one owned by A and one owned by B.
  const mintV = await createDigitalAssetWithToken(umi, { tokenOwner: ownerA });
  const mintW = await createDigitalAssetWithToken(umi, { tokenOwner: ownerB });

  // When we fetch all DigitalAssetWithToken associated with the SFT.
  const digitalAssets = await fetchAllDigitalAssetWithTokenByMint(
    umi,
    mintU.publicKey
  );

  // Then we get the two DigitalAssetWithToken owned by A and B from mint U.
  t.is(digitalAssets.length, 2);
  const mints = digitalAssets.map((da) => base58PublicKey(da.mint.publicKey));
  const tokens = digitalAssets.map((da) => base58PublicKey(da.token.publicKey));
  t.true(mints.every((m) => m === base58PublicKey(mintU.publicKey)));
  t.true(tokens.includes(base58PublicKey(tokenAU)));
  t.true(tokens.includes(base58PublicKey(tokenBU)));

  // But we don't get the other NFTs V and W.
  t.false(mints.includes(base58PublicKey(mintV.publicKey)));
  t.false(mints.includes(base58PublicKey(mintW.publicKey)));
});
