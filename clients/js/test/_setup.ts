/* eslint-disable import/no-extraneous-dependencies */
import {
  generateSigner,
  percentAmount,
  PublicKey,
  Signer,
  transactionBuilder,
  Umi,
} from '@metaplex-foundation/umi';
import { createUmi as baseCreateUmi } from '@metaplex-foundation/umi-bundle-tests';
import {
  createV1,
  findMetadataPda,
  mintV1,
  mplTokenMetadata,
  TokenStandard,
  verifyCreatorV1,
} from '../src';

export type TokenStandardKeys = keyof typeof TokenStandard;

export const ALL_TOKEN_STANDARDS: TokenStandardKeys[] = [
  'NonFungible',
  'FungibleAsset',
  'Fungible',
  'NonFungibleEdition',
  'ProgrammableNonFungible',
];

export const NON_EDITION_TOKEN_STANDARDS: TokenStandardKeys[] = [
  'NonFungible',
  'FungibleAsset',
  'Fungible',
  'ProgrammableNonFungible',
];

export const OG_TOKEN_STANDARDS: TokenStandardKeys[] = [
  'NonFungible',
  'FungibleAsset',
  'Fungible',
];

export const NON_EDITION_NON_FUNGIBLE_STANDARDS: TokenStandardKeys[] = [
  'NonFungible',
  'ProgrammableNonFungible',
];

export const FUNGIBLE_TOKEN_STANDARDS: TokenStandardKeys[] = [
  'FungibleAsset',
  'Fungible',
];

export const createUmi = async () =>
  (await baseCreateUmi()).use(mplTokenMetadata());

export const createDigitalAsset = async (
  umi: Umi,
  input: Partial<Parameters<typeof createV1>[1]> = {}
): Promise<Signer> => {
  const mint = generateSigner(umi);
  await createV1(umi, {
    mint,
    name: 'My NFT',
    uri: 'https://example.com',
    sellerFeeBasisPoints: percentAmount(2.5),
    ...input,
  }).sendAndConfirm(umi);
  return mint;
};

export const createDigitalAssetWithToken = async (
  umi: Umi,
  input: Partial<Parameters<typeof createV1>[1]> & {
    token?: PublicKey;
    tokenOwner?: PublicKey;
    amount?: number | bigint;
  } = {}
): Promise<Signer> => {
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(
      createV1(umi, {
        mint,
        name: 'My NFT',
        uri: 'https://example.com',
        sellerFeeBasisPoints: percentAmount(2.5),
        ...input,
      })
    )
    .add(
      mintV1(umi, {
        authority: input.authority,
        mint: mint.publicKey,
        token: input.token,
        tokenOwner: input.tokenOwner,
        amount: input.amount ?? 1,
        tokenStandard: input.tokenStandard ?? TokenStandard.NonFungible,
      })
    )
    .sendAndConfirm(umi);
  return mint;
};
export const createDigitalAssetWithVerifiedCreators = async (
  umi: Umi,
  input: Partial<Parameters<typeof createV1>[1]> & {
    creatorAuthority?: Signer;
  }
) => {
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(
      createV1(umi, {
        mint,
        name: 'My NFT',
        uri: 'https://example.com',
        sellerFeeBasisPoints: percentAmount(2.5),
        ...input,
      })
    )
    .sendAndConfirm(umi);

  const metadata = findMetadataPda(umi, { mint: mint.publicKey });

  await transactionBuilder()
    .add(verifyCreatorV1(umi, { metadata, authority: input.creatorAuthority }))
    .add(
      mintV1(umi, {
        authority: input.authority,
        mint: mint.publicKey,
        amount: 1,
        tokenStandard: TokenStandard.NonFungible,
      })
    );

  return mint;
};
