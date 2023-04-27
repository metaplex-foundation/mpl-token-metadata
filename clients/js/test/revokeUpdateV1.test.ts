import { generateSigner } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  MetadataDelegateRole,
  TokenStandard,
  delegateUpdateV1,
  findMetadataDelegateRecordPda,
  revokeUpdateV1,
} from '../src';
import {
  NON_EDITION_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can revoke a update delegate for a ${tokenStandard}`, async (t) => {
    // Given an asset with an approved update delegate.
    const umi = await createUmi();
    const updateAuthority = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      authority: updateAuthority,
      tokenStandard: TokenStandard[tokenStandard],
    });
    const updateDelegate = generateSigner(umi).publicKey;
    await delegateUpdateV1(umi, {
      mint,
      updateAuthority: updateAuthority.publicKey,
      authority: updateAuthority,
      delegate: updateDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);
    const metadataDelegateRecord = findMetadataDelegateRecordPda(umi, {
      mint,
      delegateRole: MetadataDelegateRole.Update,
      delegate: updateDelegate,
      updateAuthority: updateAuthority.publicKey,
    });
    t.true(await umi.rpc.accountExists(metadataDelegateRecord));

    // When we revoke the update delegate.
    await revokeUpdateV1(umi, {
      mint,
      updateAuthority: updateAuthority.publicKey,
      authority: updateAuthority,
      delegate: updateDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // Then the metadata delegate record was deleted.
    t.false(await umi.rpc.accountExists(metadataDelegateRecord));
  });
});
