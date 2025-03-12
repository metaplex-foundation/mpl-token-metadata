import { generateSigner } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  MetadataDelegateRole,
  TokenStandard,
  delegateAuthorityItemV1,
  findMetadataDelegateRecordPda,
  revokeAuthorityItemV1,
} from '../src';
import {
  NON_EDITION_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can revoke an authority item delegate for a ${tokenStandard}`, async (t) => {
    // Given an asset with an approvedn authority item delegate.
    const umi = await createUmi();
    const updateAuthority = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      authority: updateAuthority,
      tokenStandard: TokenStandard[tokenStandard],
    });
    const authorityItemDelegate = generateSigner(umi).publicKey;
    await delegateAuthorityItemV1(umi, {
      mint,
      authority: updateAuthority,
      delegate: authorityItemDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);
    const [metadataDelegateRecord] = findMetadataDelegateRecordPda(umi, {
      mint,
      delegateRole: MetadataDelegateRole.AuthorityItem,
      delegate: authorityItemDelegate,
      updateAuthority: updateAuthority.publicKey,
    });
    t.true(await umi.rpc.accountExists(metadataDelegateRecord));

    // When we revoke then authority item delegate.
    await revokeAuthorityItemV1(umi, {
      mint,
      authority: updateAuthority,
      delegate: authorityItemDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // Then the metadata delegate record was deleted.
    t.false(await umi.rpc.accountExists(metadataDelegateRecord));
  });
});
