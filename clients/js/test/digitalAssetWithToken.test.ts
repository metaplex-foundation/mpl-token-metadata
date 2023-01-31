import { publicKey, some } from '@lorisleiva/js-test';
import { findAssociatedTokenPda } from '@lorisleiva/mpl-essentials';
import test from 'ava';
import {
  DigitalAssetWithToken,
  fetchDigitalAssetWithToken,
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
  const digitalAsset = await fetchDigitalAssetWithToken(
    mx,
    mint.publicKey,
    findAssociatedTokenPda(mx, {
      mint: mint.publicKey,
      owner: mx.identity.publicKey,
    })
  );

  // Then we get the expected digital asset.
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
    token: {},
    tokenRecord: {},
  });
});
