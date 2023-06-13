import { generateSigner } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  MetadataDelegateRole,
  TokenStandard,
  delegateCollectionV1,
  findMetadataDelegateRecordPda,
  revokeCollectionV1,
} from '../src';
import {
  NON_EDITION_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can revoke a collection delegate for a ${tokenStandard}`, async (t) => {
    // Given an asset with an approved collection delegate.
    const umi = await createUmi();
    const updateAuthority = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      authority: updateAuthority,
      tokenStandard: TokenStandard[tokenStandard],
    });
    const collectionDelegate = generateSigner(umi).publicKey;
    await delegateCollectionV1(umi, {
      mint,
      authority: updateAuthority,
      delegate: collectionDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);
    const [metadataDelegateRecord] = findMetadataDelegateRecordPda(umi, {
      mint,
      delegateRole: MetadataDelegateRole.Collection,
      delegate: collectionDelegate,
      updateAuthority: updateAuthority.publicKey,
    });
    t.true(await umi.rpc.accountExists(metadataDelegateRecord));

    // When we revoke the collection delegate.
    await revokeCollectionV1(umi, {
      mint,
      authority: updateAuthority,
      delegate: collectionDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // Then the metadata delegate record was deleted.
    t.false(await umi.rpc.accountExists(metadataDelegateRecord));
  });
});
