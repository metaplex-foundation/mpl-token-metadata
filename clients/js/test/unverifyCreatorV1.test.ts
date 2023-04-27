import { generateSigner, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  Metadata,
  TokenStandard,
  fetchMetadata,
  findMetadataPda,
  unverifyCreatorV1,
  verifyCreatorV1,
} from '../src';
import {
  NON_EDITION_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can unverify the creator of a ${tokenStandard}`, async (t) => {
    // Given an asset with an verified creator.
    const umi = await createUmi();
    const creator = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      tokenStandard: TokenStandard[tokenStandard],
      creators: some([
        { address: creator.publicKey, verified: false, share: 100 },
      ]),
    });
    const metadata = findMetadataPda(umi, { mint });
    await verifyCreatorV1(umi, {
      metadata,
      authority: creator,
    }).sendAndConfirm(umi);
    t.like(await fetchMetadata(umi, metadata), <Metadata>{
      creators: some([
        { address: creator.publicKey, verified: true, share: 100 },
      ]),
    });

    // When the creator unverifies themselves on the asset.
    await unverifyCreatorV1(umi, {
      metadata,
      authority: creator,
    }).sendAndConfirm(umi);

    // Then the creator is now marked as unverified on the asset.
    t.like(await fetchMetadata(umi, metadata), <Metadata>{
      creators: some([
        { address: creator.publicKey, verified: false, share: 100 },
      ]),
    });
  });
});
