import { some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  fetchMetadataFromSeeds,
  Metadata,
  TokenStandard,
  updateAsUpdateAuthorityV2,
} from '../src';
import {
  createDigitalAsset,
  createUmi,
  NON_EDITION_TOKEN_STANDARDS,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can update a ${tokenStandard} as the update authority`, async (t) => {
    // Given an existing asset.
    const umi = await createUmi();
    const mint = await createDigitalAsset(umi, {
      name: 'Asset #1',
      tokenStandard: TokenStandard[tokenStandard],
    });
    const initialMetadata = await fetchMetadataFromSeeds(umi, {
      mint: mint.publicKey,
    });

    // When we update the name of the asset.
    await updateAsUpdateAuthorityV2(umi, {
      mint: mint.publicKey,
      data: some({ ...initialMetadata, name: 'Asset #2' }),
    }).sendAndConfirm(umi);

    // Then the account data was updated.
    const updatedMetadata = await fetchMetadataFromSeeds(umi, {
      mint: mint.publicKey,
    });
    t.like(updatedMetadata, <Metadata>{ name: 'Asset #2' });
  });
});
