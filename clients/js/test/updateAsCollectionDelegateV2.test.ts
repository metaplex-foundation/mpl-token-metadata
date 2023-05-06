import { generateSigner, none, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  Metadata,
  TokenStandard,
  collectionToggle,
  delegateCollectionV1,
  fetchMetadataFromSeeds,
  updateAsCollectionDelegateV2,
} from '../src';
import {
  NON_EDITION_TOKEN_STANDARDS,
  createDigitalAsset,
  createUmi,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can update a ${tokenStandard} as a collection delegate`, async (t) => {
    // Given a Collection NFT and an asset that does not belong to any collection.
    const umi = await createUmi();
    const { publicKey: collectionMint } = await createDigitalAsset(umi, {
      isCollection: true,
    });
    const { publicKey: mint } = await createDigitalAsset(umi, {
      tokenStandard: TokenStandard[tokenStandard],
    });

    // And a collection delegate approved on the asset.
    const collectionDelegate = generateSigner(umi);
    await delegateCollectionV1(umi, {
      mint,
      delegate: collectionDelegate.publicKey,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // When the delegate sets the collection on the asset.
    await updateAsCollectionDelegateV2(umi, {
      mint,
      authority: collectionDelegate,
      collection: collectionToggle('Set', [
        { key: collectionMint, verified: false },
      ]),
    }).sendAndConfirm(umi);

    // Then the account data was updated.
    const updatedMetadata = await fetchMetadataFromSeeds(umi, { mint });
    t.like(updatedMetadata, <Metadata>{
      collection: some({ key: collectionMint, verified: false }),
    });
  });
});

test('it can update the items of a collection as a collection delegate', async (t) => {
  // Given a Collection NFT with one Regular NFT inside it.
  const umi = await createUmi();
  const { publicKey: collectionMint } = await createDigitalAsset(umi, {
    isCollection: true,
  });
  const { publicKey: mint } = await createDigitalAsset(umi, {
    collection: some({ key: collectionMint, verified: false }),
  });

  // And a collection delegate approved on the collection.
  const collectionDelegate = generateSigner(umi);
  await delegateCollectionV1(umi, {
    mint: collectionMint,
    delegate: collectionDelegate.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // When the delegate clears the collection on the asset.
  await updateAsCollectionDelegateV2(umi, {
    mint,
    delegateMint: collectionMint,
    authority: collectionDelegate,
    collection: collectionToggle('Clear'),
  }).sendAndConfirm(umi);

  // Then the account data was updated.
  let updatedMetadata = await fetchMetadataFromSeeds(umi, { mint });
  t.like(updatedMetadata, <Metadata>{ collection: none() });

  // When we re-set the collection on the asset afterwards.
  await updateAsCollectionDelegateV2(umi, {
    mint,
    delegateMint: collectionMint,
    authority: collectionDelegate,
    collection: collectionToggle('Set', [
      { key: collectionMint, verified: false },
    ]),
  }).sendAndConfirm(umi);

  // Then it works because the asset has the same update authority as the collection NFT.
  updatedMetadata = await fetchMetadataFromSeeds(umi, { mint });
  t.like(updatedMetadata, <Metadata>{
    collection: some({ key: collectionMint, verified: false }),
  });
});

test("it cannot update the collection of someone else's NFT as a collection delegate", async (t) => {
  // Given a Collection NFT and a Regular NFT that does not belong to any collection.
  const umi = await createUmi();
  const updateAuthorityA = generateSigner(umi);
  const updateAuthorityB = generateSigner(umi);
  const { publicKey: collectionMint } = await createDigitalAsset(umi, {
    authority: updateAuthorityA,
    isCollection: true,
  });
  const { publicKey: mint } = await createDigitalAsset(umi, {
    authority: updateAuthorityB,
    collection: none(),
  });

  // And a collection delegate approved on the collection.
  const collectionDelegate = generateSigner(umi);
  await delegateCollectionV1(umi, {
    authority: updateAuthorityA,
    mint: collectionMint,
    delegate: collectionDelegate.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // When we try to set the collection on the asset as the delegate.
  const promise = updateAsCollectionDelegateV2(umi, {
    mint,
    delegateMint: collectionMint,
    delegateUpdateAuthority: updateAuthorityA.publicKey,
    authority: collectionDelegate,
    collection: collectionToggle('Set', [
      { key: collectionMint, verified: false },
    ]),
  }).sendAndConfirm(umi);

  // Then we expect a program error.
  await t.throwsAsync(promise, { name: 'InvalidAuthorityType' });
});
