import { some, transactionBuilder } from '@lorisleiva/js-test';
import test from 'ava';
import { fetchMetadata, findMetadataPda, Metadata, updateV1 } from '../src';
import { createMetaplex, createDigitalAsset } from './_setup';

test('it can update a NonFungible', async (t) => {
  // Given an existing NFT.
  const mx = await createMetaplex();
  const mint = await createDigitalAsset(mx);
});
