import { generateSigner, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  Metadata,
  TokenStandard,
  delegateAuthorityItemV1,
  fetchMetadataFromSeeds,
  updateAsAuthorityItemDelegateV2,
} from '../src';
import {
  NON_EDITION_TOKEN_STANDARDS,
  createDigitalAsset,
  createUmi,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can update a ${tokenStandard} as an authority item delegate`, async (t) => {
    // Given an existing asset.
    const umi = await createUmi();
    const { publicKey: mint } = await createDigitalAsset(umi, {
      tokenStandard: TokenStandard[tokenStandard],
    });

    // And an authority item delegate approved on the asset.
    const authorityItemDelegate = generateSigner(umi);
    await delegateAuthorityItemV1(umi, {
      mint,
      delegate: authorityItemDelegate.publicKey,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // When the delegate updates the update authority of the asset.
    const newUpdateAuthority = generateSigner(umi).publicKey;
    await updateAsAuthorityItemDelegateV2(umi, {
      mint,
      authority: authorityItemDelegate,
      newUpdateAuthority: some(newUpdateAuthority),
    }).sendAndConfirm(umi);

    // Then the account data was updated.
    const updatedMetadata = await fetchMetadataFromSeeds(umi, { mint });
    t.like(updatedMetadata, <Metadata>{ updateAuthority: newUpdateAuthority });
  });
});
