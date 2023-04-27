import { generateSigner, publicKey, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  Metadata,
  TokenStandard,
  fetchMetadata,
  findMetadataPda,
  verifyCreatorV1,
} from '../src';
import {
  NON_EDITION_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can verify the creator of a ${tokenStandard}`, async (t) => {
    // Given an asset with an unverified creator.
    const umi = await createUmi();
    const creator = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      tokenStandard: TokenStandard[tokenStandard],
      creators: some([
        { address: creator.publicKey, verified: false, share: 100 },
      ]),
    });

    // When the creator verifies themselves on the asset.
    const metadata = findMetadataPda(umi, { mint });
    await verifyCreatorV1(umi, {
      metadata,
      authority: creator,
    }).sendAndConfirm(umi);

    // Then the creator is now marked as verified on the asset.
    t.like(await fetchMetadata(umi, metadata), <Metadata>{
      publicKey: publicKey(metadata),
      creators: some([
        { address: creator.publicKey, verified: true, share: 100 },
      ]),
    });
  });
});
