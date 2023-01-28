import {
  generateSigner,
  percentAmount,
  some,
  transactionBuilder,
} from '@lorisleiva/js-test';
import test from 'ava';
import { createNft, fetchMetadata, findMetadataPda, updateV1 } from '../src';
import { createMetaplex } from './_setup';

test('it can update a NonFungible', async (t) => {
  // Given
  const mx = await createMetaplex();
  const mint = generateSigner(mx);
  await transactionBuilder(mx)
    .add(
      createNft(mx, {
        mint,
        name: 'NFT #1',
        uri: 'https://example.com',
        sellerFeeBasisPoints: percentAmount(2.5),
      })
    )
    .sendAndConfirm();
  const initialMetadata = findMetadataPda(mx, { mint: mint.publicKey });
  const initialMetadataAccount = await fetchMetadata(mx, initialMetadata);

  // When
  await transactionBuilder(mx)
    .add(
      updateV1(mx, {
        mint: mint.publicKey,
        data: some({ ...initialMetadataAccount, name: 'NFT #2' }),
      })
    )
    .sendAndConfirm();

  // Then
  const updatedMetadataAccount = await fetchMetadata(mx, initialMetadata);
  console.log(updatedMetadataAccount);
  t.pass();
});
