import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  MetadataDelegateRecord,
  MetadataDelegateRole,
  TokenStandard,
  delegateProgrammableConfigV1,
  fetchMetadataDelegateRecord,
  findMetadataDelegateRecordPda,
} from '../src';
import {
  NON_EDITION_TOKEN_STANDARDS,
  createDigitalAssetWithToken,
  createUmi,
} from './_setup';

NON_EDITION_TOKEN_STANDARDS.forEach((tokenStandard) => {
  test(`it can approve a programmable config delegate for a ${tokenStandard}`, async (t) => {
    // Given an asset.
    const umi = await createUmi();
    const updateAuthority = generateSigner(umi);
    const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
      authority: updateAuthority,
      tokenStandard: TokenStandard[tokenStandard],
    });

    // When we approve a programmable config delegate.
    const programmableConfigDelegate = generateSigner(umi).publicKey;
    await delegateProgrammableConfigV1(umi, {
      mint,
      authority: updateAuthority,
      delegate: programmableConfigDelegate,
      tokenStandard: TokenStandard[tokenStandard],
    }).sendAndConfirm(umi);

    // Then a new metadata delegate record was created.
    const delegateRecord = await fetchMetadataDelegateRecord(
      umi,
      findMetadataDelegateRecordPda(umi, {
        mint,
        delegateRole: MetadataDelegateRole.ProgrammableConfig,
        delegate: programmableConfigDelegate,
        updateAuthority: updateAuthority.publicKey,
      })
    );
    t.like(delegateRecord, <MetadataDelegateRecord>{
      mint: publicKey(mint),
      updateAuthority: publicKey(updateAuthority),
      delegate: publicKey(programmableConfigDelegate),
    });
  });
});
