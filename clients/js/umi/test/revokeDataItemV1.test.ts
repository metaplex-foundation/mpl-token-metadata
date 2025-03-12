import { generateSigner } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  MetadataDelegateRole,
  TokenStandard,
  delegateDataItemV1,
  findMetadataDelegateRecordPda,
  revokeDataItemV1,
} from '../src';
import {
  NON_EDITION_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can revoke a data item delegate for a ${tokenStandard}`, async (t) => {
    // Given an asset with an approved data item delegate.
    const umi = await createUmi();
    const updateAuthority = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      authority: updateAuthority,
      tokenStandard: TokenStandard[tokenStandard],
    });
    const dataItemDelegate = generateSigner(umi).publicKey;
    await delegateDataItemV1(umi, {
      mint,
      authority: updateAuthority,
      delegate: dataItemDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);
    const [metadataDelegateRecord] = findMetadataDelegateRecordPda(umi, {
      mint,
      delegateRole: MetadataDelegateRole.DataItem,
      delegate: dataItemDelegate,
      updateAuthority: updateAuthority.publicKey,
    });
    t.true(await umi.rpc.accountExists(metadataDelegateRecord));

    // When we revoke the data item delegate.
    await revokeDataItemV1(umi, {
      mint,
      authority: updateAuthority,
      delegate: dataItemDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // Then the metadata delegate record was deleted.
    t.false(await umi.rpc.accountExists(metadataDelegateRecord));
  });
});
