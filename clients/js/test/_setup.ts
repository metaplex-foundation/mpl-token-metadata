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
import { createV1, mintV1, mplDigitalAsset, TokenStandard } from '../src';

export const createUmi = async () =>
  (await baseCreateUmi()).use(mplDigitalAsset());

export const createDigitalAsset = async (
  umi: Umi,
  input: Partial<Parameters<typeof createV1>[1]> = {}
): Promise<Signer> => {
  const mint = generateSigner(umi);
  await transactionBuilder(umi)
    .add(
      createV1(umi, {
        mint,
        name: 'My NFT',
        uri: 'https://example.com',
        sellerFeeBasisPoints: percentAmount(2.5),
        ...input,
      })
    )
    .sendAndConfirm();
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
  await transactionBuilder(umi)
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
        mint: mint.publicKey,
        token: input.token,
        tokenOwner: input.tokenOwner,
        amount: input.amount ?? 1,
        tokenStandard: input.tokenStandard ?? TokenStandard.NonFungible,
      })
    )
    .sendAndConfirm();
  return mint;
};
