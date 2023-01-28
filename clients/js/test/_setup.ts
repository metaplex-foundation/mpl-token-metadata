/* eslint-disable import/no-extraneous-dependencies */
import {
  createMetaplex as baseCreateMetaplex,
  generateSigner,
  Metaplex,
  percentAmount,
  Signer,
  transactionBuilder,
} from '@lorisleiva/js-test';
import { mplDigitalAsset, createNft as baseCreateNft } from '../src';

export const createMetaplex = async () =>
  (await baseCreateMetaplex()).use(mplDigitalAsset());

export const createNft = async (
  mx: Metaplex,
  input: Partial<Parameters<typeof baseCreateNft>[1]> = {}
): Promise<Signer> => {
  const mint = generateSigner(mx);
  await transactionBuilder(mx)
    .add(
      baseCreateNft(mx, {
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
