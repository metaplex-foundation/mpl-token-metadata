import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  MetadataDelegateRecord,
  MetadataDelegateRole,
  TokenStandard,
  delegateUpdateV1,
  fetchMetadataDelegateRecord,
  findMetadataDelegateRecordPda,
} from '../src';
import {
  NON_EDITION_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can approve a update delegate for a ${tokenStandard}`, async (t) => {
    // Given an asset.
    const umi = await createUmi();
    const updateAuthority = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      authority: updateAuthority,
      tokenStandard: TokenStandard[tokenStandard],
    });

    // When we approve a update delegate.
    const updateDelegate = generateSigner(umi).publicKey;
    await delegateUpdateV1(umi, {
      mint,
      updateAuthority: updateAuthority.publicKey,
      authority: updateAuthority,
      delegate: updateDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // Then a new metadata delegate record was created.
    const delegateRecord = await fetchMetadataDelegateRecord(
      umi,
      findMetadataDelegateRecordPda(umi, {
        mint,
        delegateRole: MetadataDelegateRole.Update,
        delegate: updateDelegate,
        updateAuthority: updateAuthority.publicKey,
      })
    );
    t.like(delegateRecord, <MetadataDelegateRecord>{
      mint: publicKey(mint),
      updateAuthority: publicKey(updateAuthority),
      delegate: publicKey(updateDelegate),
    });
  });
});
