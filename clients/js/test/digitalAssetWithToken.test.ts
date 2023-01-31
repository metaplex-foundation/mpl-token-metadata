import { generateSigner, publicKey, some } from '@lorisleiva/js-test';
import { findAssociatedTokenPda } from '@lorisleiva/mpl-essentials';
import test from 'ava';
import {
  DigitalAssetWithToken,
  fetchDigitalAssetWithAssociatedToken,
  findMasterEditionPda,
  findMetadataPda,
  TokenStandard,
} from '../src';
import { createDigitalAssetWithToken, createMetaplex } from './_setup';

test('it can fetch a Non Fungible', async (t) => {
  // Given an existing NFT.
  const mx = await createMetaplex();
  const owner = generateSigner(mx).publicKey;
  const mint = await createDigitalAssetWithToken(mx, { tokenOwner: owner });

  // When we fetch a digital asset using its mint address.
  const digitalAsset = await fetchDigitalAssetWithAssociatedToken(
    mx,
    mint.publicKey,
    owner
  );

  // Then we get the expected digital asset.
  const ata = findAssociatedTokenPda(mx, { mint: mint.publicKey, owner });
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
    token: {
      publicKey: publicKey(ata),
    },
    tokenRecord: undefined,
  });
});
