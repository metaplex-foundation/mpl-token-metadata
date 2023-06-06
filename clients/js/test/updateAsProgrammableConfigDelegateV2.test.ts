import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
import { generateSigner, none, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  Metadata,
  TokenStandard,
  delegateProgrammableConfigV1,
  fetchMetadataFromSeeds,
  ruleSetToggle,
  updateAsProgrammableConfigDelegateV2,
} from '../src';
import {
  OG_TOKEN_STANDARDS,
  createDigitalAsset,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

test('it can update a ProgrammableNonFungible as a programmable config delegate', async (t) => {
  // Given an existing asset with no rule set.
  const umi = await createUmi();
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    ruleSet: none(),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // And a programmable config delegate approved on the asset.
  const programmableConfigDelegate = generateSigner(umi);
  await delegateProgrammableConfigV1(umi, {
    mint,
    delegate: programmableConfigDelegate.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // When the delegate updates the rule set of the asset.
  const ruleSet = generateSigner(umi).publicKey;
  await updateAsProgrammableConfigDelegateV2(umi, {
    mint,
    token: findAssociatedTokenPda(umi, { mint, owner: umi.identity.publicKey }),
    authority: programmableConfigDelegate,
    ruleSet: ruleSetToggle('Set', [ruleSet]),
  }).sendAndConfirm(umi);

  // Then the account data was updated.
  const updatedMetadata = await fetchMetadataFromSeeds(umi, { mint });
  t.like(updatedMetadata, <Metadata>{
    programmableConfig: some({ ruleSet: some(ruleSet) }),
  });
});

OG_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it cannot update a ${tokenStandard} as a programmable config delegate`, async (t) => {
    // Given an existing asset with no rule set.
    const umi = await createUmi();
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      ruleSet: none(),
      tokenStandard: TokenStandard[tokenStandard],
    });

    // And a programmable config delegate approved on the asset.
    const programmableConfigDelegate = generateSigner(umi);
    await delegateProgrammableConfigV1(umi, {
      mint,
      delegate: programmableConfigDelegate.publicKey,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // When the delegate tries to update the rule set of the asset.
    const ruleSet = generateSigner(umi).publicKey;
    const promise = updateAsProgrammableConfigDelegateV2(umi, {
      mint,
      token: findAssociatedTokenPda(umi, {
        mint,
        owner: umi.identity.publicKey,
      }),
      authority: programmableConfigDelegate,
      ruleSet: ruleSetToggle('Set', [ruleSet]),
    }).sendAndConfirm(umi);

    // Then we expect a program error.
    await t.throwsAsync(promise, { name: 'InvalidTokenStandard' });
  });
});

test('it can update the items of a collection as a programmable config delegate', async (t) => {
  // Given a Collection NFT containing one Regular NFT with no rule set.
  const umi = await createUmi();
  const { publicKey: collectionMint } = await createDigitalAsset(umi, {
    isCollection: true,
  });
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    ruleSet: none(),
    collection: some({ key: collectionMint, verified: false }),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // And a programmable config delegate approved on the collection.
  const programmableConfigDelegate = generateSigner(umi);
  await delegateProgrammableConfigV1(umi, {
    mint: collectionMint,
    delegate: programmableConfigDelegate.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // When the delegate updates the name of the asset.
  const ruleSet = generateSigner(umi).publicKey;
  await updateAsProgrammableConfigDelegateV2(umi, {
    mint,
    token: findAssociatedTokenPda(umi, { mint, owner: umi.identity.publicKey }),
    delegateMint: collectionMint,
    authority: programmableConfigDelegate,
    ruleSet: ruleSetToggle('Set', [ruleSet]),
  }).sendAndConfirm(umi);

  // Then the account data was updated.
  const updatedMetadata = await fetchMetadataFromSeeds(umi, { mint });
  t.like(updatedMetadata, <Metadata>{
    programmableConfig: some({ ruleSet: some(ruleSet) }),
  });
});
