import { publicKey, some } from '@lorisleiva/js-core';
import test from 'ava';
import {
  DigitalAsset,
  fetchDigitalAsset,
  findMasterEditionPda,
  findMetadataPda,
  TokenStandard,
} from '../src';
import { createDigitalAsset, createMetaplex } from './_setup';

test('it can fetch a Non Fungible', async (t) => {
  // Given an existing NFT.
  const mx = await createMetaplex();
  const mint = await createDigitalAsset(mx);

  // When we fetch a digital asset using its mint address.
  const digitalAsset = await fetchDigitalAsset(mx, mint.publicKey);

  // Then we get the expected digital asset.
  const metadata = findMetadataPda(mx, { mint: mint.publicKey });
  const edition = findMasterEditionPda(mx, { mint: mint.publicKey });
  t.like(digitalAsset, <DigitalAsset>{
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
  });
});
