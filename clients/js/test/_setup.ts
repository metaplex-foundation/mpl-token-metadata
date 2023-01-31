/* eslint-disable import/no-extraneous-dependencies */
import {
  createMetaplex as baseCreateMetaplex,
  generateSigner,
  Metaplex,
  percentAmount,
  Signer,
  transactionBuilder,
} from '@lorisleiva/js-test';
import { findAssociatedTokenPda } from '@lorisleiva/mpl-essentials';
import { PublicKey } from '@solana/web3.js';
import { mplDigitalAsset, createV1, mintV1 } from '../src';

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
        tokenOwner: mx.identity.publicKey,
        token: findAssociatedTokenPda(mx, {
          mint: mint.publicKey,
          owner: mx.identity.publicKey,
        }),
        amount: 1,
      })
    )
    .sendAndConfirm();
  return mint;
};
