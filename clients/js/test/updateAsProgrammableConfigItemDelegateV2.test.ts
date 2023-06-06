import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
import { generateSigner, none, some } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  Metadata,
  TokenStandard,
  delegateProgrammableConfigItemV1,
  fetchMetadataFromSeeds,
  ruleSetToggle,
  updateAsProgrammableConfigItemDelegateV2,
} from '../src';
import {
  OG_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

test('it can update a ProgrammableNonFungible as a programmable config item delegate', async (t) => {
  // Given an existing asset with no rule set.
  const umi = await createUmi();
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    ruleSet: none(),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // And a programmable config item delegate approved on the asset.
  const programmableConfigItemDelegate = generateSigner(umi);
  await delegateProgrammableConfigItemV1(umi, {
    mint,
    delegate: programmableConfigItemDelegate.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // When the delegate updates the rule set of the asset.
  const ruleSet = generateSigner(umi).publicKey;
  await updateAsProgrammableConfigItemDelegateV2(umi, {
    mint,
    token: findAssociatedTokenPda(umi, { mint, owner: umi.identity.publicKey }),
    authority: programmableConfigItemDelegate,
    ruleSet: ruleSetToggle('Set', [ruleSet]),
  }).sendAndConfirm(umi);

  // Then the account data was updated.
  const updatedMetadata = await fetchMetadataFromSeeds(umi, { mint });
  t.like(updatedMetadata, <Metadata>{
    programmableConfig: some({ ruleSet: some(ruleSet) }),
  });
});

OG_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it cannot update a ${tokenStandard} as a programmable config item delegate`, async (t) => {
    // Given an existing asset with no rule set.
    const umi = await createUmi();
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      ruleSet: none(),
      tokenStandard: TokenStandard[tokenStandard],
    });

    // And a programmable config item delegate approved on the asset.
    const programmableConfigItemDelegate = generateSigner(umi);
    await delegateProgrammableConfigItemV1(umi, {
      mint,
      delegate: programmableConfigItemDelegate.publicKey,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // When the delegate tries to update the rule set of the asset.
    const ruleSet = generateSigner(umi).publicKey;
    const promise = updateAsProgrammableConfigItemDelegateV2(umi, {
      mint,
      token: findAssociatedTokenPda(umi, {
        mint,
        owner: umi.identity.publicKey,
      }),
      authority: programmableConfigItemDelegate,
      ruleSet: ruleSetToggle('Set', [ruleSet]),
    }).sendAndConfirm(umi);

    // Then we expect a program error.
    await t.throwsAsync(promise, { name: 'InvalidTokenStandard' });
  });
});
