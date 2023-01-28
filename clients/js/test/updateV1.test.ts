import { some, transactionBuilder } from '@lorisleiva/js-test';
import test from 'ava';
import { fetchMetadata, findMetadataPda, Metadata, updateV1 } from '../src';
import { createMetaplex, createNft } from './_setup';

test('it can update a NonFungible', async (t) => {
  // Given an existing NFT.
  const mx = await createMetaplex();
  const mint = await createNft(mx, { name: 'NFT #1' });
  const initialMetadata = findMetadataPda(mx, { mint: mint.publicKey });
  const initialMetadataAccount = await fetchMetadata(mx, initialMetadata);

  // When we update the name of the NFT.
  await transactionBuilder(mx)
    .add(
      updateV1(mx, {
        mint: mint.publicKey,
        data: some({ ...initialMetadataAccount, name: 'NFT #2' }),
      })
    )
    .sendAndConfirm();

  // Then the account data was updated.
  const updatedMetadataAccount = await fetchMetadata(mx, initialMetadata);
  t.like(updatedMetadataAccount, <Metadata>{ name: 'NFT #2' });
});
