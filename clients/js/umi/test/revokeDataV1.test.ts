import { generateSigner } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  MetadataDelegateRole,
  TokenStandard,
  delegateDataV1,
  findMetadataDelegateRecordPda,
  revokeDataV1,
} from '../src';
import {
  NON_EDITION_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can revoke a data delegate for a ${tokenStandard}`, async (t) => {
    // Given an asset with an approved data delegate.
    const umi = await createUmi();
    const updateAuthority = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      authority: updateAuthority,
      tokenStandard: TokenStandard[tokenStandard],
    });
    const dataDelegate = generateSigner(umi).publicKey;
    await delegateDataV1(umi, {
      mint,
      authority: updateAuthority,
      delegate: dataDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);
    const [metadataDelegateRecord] = findMetadataDelegateRecordPda(umi, {
      mint,
      delegateRole: MetadataDelegateRole.Data,
      delegate: dataDelegate,
      updateAuthority: updateAuthority.publicKey,
    });
    t.true(await umi.rpc.accountExists(metadataDelegateRecord));

    // When we revoke the data delegate.
    await revokeDataV1(umi, {
      mint,
      authority: updateAuthority,
      delegate: dataDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // Then the metadata delegate record was deleted.
    t.false(await umi.rpc.accountExists(metadataDelegateRecord));
  });
});
