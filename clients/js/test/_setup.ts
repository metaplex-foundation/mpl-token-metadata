/* eslint-disable import/no-extraneous-dependencies */
import {
  createMetaplex as baseCreateMetaplex,
  generateSigner,
  Metaplex,
  percentAmount,
  PublicKey,
  Signer,
  transactionBuilder,
} from '@lorisleiva/js-test';
import { createV1, mintV1, mplDigitalAsset, TokenStandard } from '../src';

export const createMetaplex = async () =>
  (await baseCreateMetaplex()).use(mplDigitalAsset());

export const createDigitalAsset = async (
  mx: Metaplex,
  input: Partial<Parameters<typeof createV1>[1]> = {}
): Promise<Signer> => {
  const mint = generateSigner(mx);
  await transactionBuilder(mx)
    .add(
      createV1(mx, {
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
  mx: Metaplex,
  input: Partial<Parameters<typeof createV1>[1]> & {
    token?: PublicKey;
    tokenOwner?: PublicKey;
    amount?: number | bigint;
  } = {}
): Promise<Signer> => {
  const mint = generateSigner(mx);
  await transactionBuilder(mx)
    .add(
      createV1(mx, {
        mint,
        name: 'My NFT',
        uri: 'https://example.com',
        sellerFeeBasisPoints: percentAmount(2.5),
        ...input,
      })
    )
    .add(
      mintV1(mx, {
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
