import { generateSigner } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  MetadataDelegateRole,
  TokenStandard,
  delegateCollectionItemV1,
  findMetadataDelegateRecordPda,
  revokeCollectionItemV1,
} from '../src';
import {
  NON_EDITION_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can revoke a collection item delegate for a ${tokenStandard}`, async (t) => {
    // Given an asset with an approved collection item delegate.
    const umi = await createUmi();
    const updateAuthority = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      authority: updateAuthority,
      tokenStandard: TokenStandard[tokenStandard],
    });
    const collectionItemDelegate = generateSigner(umi).publicKey;
    await delegateCollectionItemV1(umi, {
      mint,
      authority: updateAuthority,
      delegate: collectionItemDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);
    const [metadataDelegateRecord] = findMetadataDelegateRecordPda(umi, {
      mint,
      delegateRole: MetadataDelegateRole.CollectionItem,
      delegate: collectionItemDelegate,
      updateAuthority: updateAuthority.publicKey,
    });
    t.true(await umi.rpc.accountExists(metadataDelegateRecord));

    // When we revoke the collection item delegate.
    await revokeCollectionItemV1(umi, {
      mint,
      authority: updateAuthority,
      delegate: collectionItemDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // Then the metadata delegate record was deleted.
    t.false(await umi.rpc.accountExists(metadataDelegateRecord));
  });
});
