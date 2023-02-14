import {
  base58PublicKey,
  generateSigner,
  publicKey,
  some,
  transactionBuilder,
} from '@metaplex-foundation/umi-test';
import {
  createToken,
  findAssociatedTokenPda,
} from '@metaplex-foundation/mpl-essentials';
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
  const mx = await createUmi();
  const owner = generateSigner(mx).publicKey;
  const mint = await createDigitalAssetWithToken(mx, { tokenOwner: owner });

  // When we fetch a DigitalAssetWithToken using its mint address
  // and either its token address or its owner address.
  const digitalAsset = await fetchDigitalAssetWithAssociatedToken(
    mx,
    mint.publicKey,
    owner
  );

  // Then we get the expected digital asset.
  const ata = findAssociatedTokenPda(mx, { mint: mint.publicKey, owner });
  const metadata = findMetadataPda(mx, { mint: mint.publicKey });
  const edition = findMasterEditionPda(mx, { mint: mint.publicKey });
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
  const mx = await createUmi();
  const owner = generateSigner(mx).publicKey;
  const mint = await createDigitalAssetWithToken(mx, { tokenOwner: owner });

  // When we fetch a DigitalAssetWithToken using only its mint address.
  const digitalAsset = await fetchDigitalAssetWithTokenByMint(
    mx,
    mint.publicKey
  );

  // Then we get the expected digital asset.
  const ata = findAssociatedTokenPda(mx, { mint: mint.publicKey, owner });
  const metadata = findMetadataPda(mx, { mint: mint.publicKey });
  const edition = findMasterEditionPda(mx, { mint: mint.publicKey });
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
  const mx = await createUmi();
  const ownerA = generateSigner(mx).publicKey;
  const ownerB = generateSigner(mx).publicKey;

  // And three NFTs such that two are owned by A and one is owned by B.
  const mintA1 = await createDigitalAssetWithToken(mx, { tokenOwner: ownerA });
  const mintA2 = await createDigitalAssetWithToken(mx, { tokenOwner: ownerA });
  const mintB1 = await createDigitalAssetWithToken(mx, { tokenOwner: ownerB });

  // When we fetch all digital assets owned by A.
  const digitalAssets = await fetchAllDigitalAssetWithTokenByOwner(mx, ownerA);

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
  const mx = await createUmi();
  const ownerA = generateSigner(mx).publicKey;
  const ownerB = generateSigner(mx).publicKey;

  // And one SFT owned by A over multiple token accounts.
  // One via an associated token account an one via a regular token account.
  const mintA1 = await createDigitalAssetWithToken(mx, {
    tokenStandard: TokenStandard.FungibleAsset,
    tokenOwner: ownerA,
    amount: 42,
  });
  const associatedToken = findAssociatedTokenPda(mx, {
    mint: mintA1.publicKey,
    owner: ownerA,
  });
  const regularToken = generateSigner(mx);
  await transactionBuilder(mx)
    .add(
      createToken(mx, {
        mint: mintA1.publicKey,
        owner: ownerA,
        token: regularToken,
      })
    )
    .add(
      mintV1(mx, {
        mint: mintA1.publicKey,
        token: regularToken.publicKey,
        tokenStandard: TokenStandard.FungibleAsset,
        amount: 15,
      })
    )
    .sendAndConfirm();

  // And two other NFTs, one owned by A and one owned by B.
  const mintA2 = await createDigitalAssetWithToken(mx, { tokenOwner: ownerA });
  const mintB1 = await createDigitalAssetWithToken(mx, { tokenOwner: ownerB });

  // When we fetch all digital assets from the SFT owned by A.
  const digitalAssets = await fetchAllDigitalAssetWithTokenByOwnerAndMint(
    mx,
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
  const mx = await createUmi();
  const ownerA = generateSigner(mx).publicKey;
  const ownerB = generateSigner(mx).publicKey;

  // And an SFT that belongs to both owner A and B.
  const mintU = await createDigitalAssetWithToken(mx, {
    tokenOwner: ownerA,
    tokenStandard: TokenStandard.FungibleAsset,
  });
  const tokenAU = findAssociatedTokenPda(mx, {
    mint: mintU.publicKey,
    owner: ownerA,
  });
  const tokenBU = findAssociatedTokenPda(mx, {
    mint: mintU.publicKey,
    owner: ownerB,
  });
  await transactionBuilder(mx)
    .add(
      mintV1(mx, {
        mint: mintU.publicKey,
        tokenOwner: ownerB,
        amount: 2,
        tokenStandard: TokenStandard.FungibleAsset,
      })
    )
    .sendAndConfirm();

  // And two other NFTs, one owned by A and one owned by B.
  const mintV = await createDigitalAssetWithToken(mx, { tokenOwner: ownerA });
  const mintW = await createDigitalAssetWithToken(mx, { tokenOwner: ownerB });

  // When we fetch all DigitalAssetWithToken associated with the SFT.
  const digitalAssets = await fetchAllDigitalAssetWithTokenByMint(
    mx,
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
