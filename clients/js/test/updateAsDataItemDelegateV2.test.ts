import { generateSigner, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  Metadata,
  TokenStandard,
  delegateDataItemV1,
  fetchMetadataFromSeeds,
  updateAsDataItemDelegateV2,
} from '../src';
import {
  NON_EDITION_TOKEN_STANDARDS,
  createDigitalAsset,
  createUmi,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can update a ${tokenStandard} as a data item delegate`, async (t) => {
    // Given an existing asset.
    const umi = await createUmi();
    const { publicKey: mint } = await createDigitalAsset(umi, {
      name: 'Asset #1',
      tokenStandard: TokenStandard[tokenStandard],
    });

    // And a data item delegate approved on the asset.
    const dataItemDelegate = generateSigner(umi);
    await delegateDataItemV1(umi, {
      mint,
      delegate: dataItemDelegate.publicKey,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // When the delegate updates the name of the asset.
    const initialMetadata = await fetchMetadataFromSeeds(umi, { mint });
    await updateAsDataItemDelegateV2(umi, {
      mint,
      authority: dataItemDelegate,
      data: some({ ...initialMetadata, name: 'Asset #2' }),
    }).sendAndConfirm(umi);

    // Then the account data was updated.
    const updatedMetadata = await fetchMetadataFromSeeds(umi, { mint });
    t.like(updatedMetadata, <Metadata>{ name: 'Asset #2' });
  });
});
