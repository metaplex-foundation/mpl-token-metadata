import { generateSigner } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  MetadataDelegateRole,
  TokenStandard,
  delegateProgrammableConfigItemV1,
  findMetadataDelegateRecordPda,
  revokeProgrammableConfigItemV1,
} from '../src';
import {
  NON_EDITION_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can revoke a programmable config item delegate for a ${tokenStandard}`, async (t) => {
    // Given an asset with an approved programmable config item delegate.
    const umi = await createUmi();
    const updateAuthority = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      authority: updateAuthority,
      tokenStandard: TokenStandard[tokenStandard],
    });
    const programmableConfigItemDelegate = generateSigner(umi).publicKey;
    await delegateProgrammableConfigItemV1(umi, {
      mint,
      authority: updateAuthority,
      delegate: programmableConfigItemDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);
    const [metadataDelegateRecord] = findMetadataDelegateRecordPda(umi, {
      mint,
      delegateRole: MetadataDelegateRole.ProgrammableConfigItem,
      delegate: programmableConfigItemDelegate,
      updateAuthority: updateAuthority.publicKey,
    });
    t.true(await umi.rpc.accountExists(metadataDelegateRecord));

    // When we revoke the programmable config item delegate.
    await revokeProgrammableConfigItemV1(umi, {
      mint,
      authority: updateAuthority,
      delegate: programmableConfigItemDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // Then the metadata delegate record was deleted.
    t.false(await umi.rpc.accountExists(metadataDelegateRecord));
  });
});
