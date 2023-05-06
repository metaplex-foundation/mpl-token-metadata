import { generateSigner, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  delegateDataV1,
  fetchMetadataFromSeeds,
  Metadata,
  TokenStandard,
  updateAsDataDelegateV2,
} from '../src';
import {
  createDigitalAsset,
  createUmi,
  NON_EDITION_TOKEN_STANDARDS,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can update a ${tokenStandard} as a data delegate`, async (t) => {
    // Given an existing asset.
    const umi = await createUmi();
    const { publicKey: mint } = await createDigitalAsset(umi, {
      name: 'Asset #1',
      tokenStandard: TokenStandard[tokenStandard],
    });

    // And a data delegate approved on the asset.
    const dataDelegate = generateSigner(umi);
    await delegateDataV1(umi, {
      mint,
      delegate: dataDelegate.publicKey,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // When the delegate updates the name of the asset.
    const initialMetadata = await fetchMetadataFromSeeds(umi, { mint });
    await updateAsDataDelegateV2(umi, {
      mint,
      authority: dataDelegate,
      data: some({ ...initialMetadata, name: 'Asset #2' }),
    }).sendAndConfirm(umi);

    // Then the account data was updated.
    const updatedMetadata = await fetchMetadataFromSeeds(umi, { mint });
    t.like(updatedMetadata, <Metadata>{ name: 'Asset #2' });
  });
});

test('it can update the items of a collection as a data delegate', async (t) => {
  // Given a Collection NFT with one Regular NFT inside it.
  const umi = await createUmi();
  const { publicKey: collectionMint } = await createDigitalAsset(umi, {
    isCollection: true,
  });
  const { publicKey: mint } = await createDigitalAsset(umi, {
    name: 'Asset #1',
    collection: some({ key: collectionMint, verified: false }),
  });

  // And a data delegate approved on the collection.
  const dataDelegate = generateSigner(umi);
  await delegateDataV1(umi, {
    mint: collectionMint,
    delegate: dataDelegate.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // When the delegate updates the name of the asset.
  const initialMetadata = await fetchMetadataFromSeeds(umi, { mint });
  await updateAsDataDelegateV2(umi, {
    mint,
    delegateMint: collectionMint,
    authority: dataDelegate,
    data: some({ ...initialMetadata, name: 'Asset #2' }),
  }).sendAndConfirm(umi);

  // Then the account data was updated.
  const updatedMetadata = await fetchMetadataFromSeeds(umi, { mint });
  t.like(updatedMetadata, <Metadata>{ name: 'Asset #2' });
});
