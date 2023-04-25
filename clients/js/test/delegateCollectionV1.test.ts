import { generateSigner } from '@metaplex-foundation/umi';
import test from 'ava';
import {
  MetadataDelegateRole,
  TokenStandard,
  delegateCollectionV1,
  fetchMetadataDelegateRecord,
  findMetadataDelegateRecordPda,
} from '../src';
import { createDigitalAssetWithToken, createUmi } from './_setup';

test('it can approve a collection delegate for a ProgrammableNonFungible', async (t) => {
  // Given a ProgrammableNonFungible.
  const umi = await createUmi();
  const updateAuthority = generateSigner(umi);
  const { publicKey: mint } = await createDigitalAssetWithToken(umi, {
    authority: updateAuthority,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // When we approve a collection delegate.
  const collectionDelegate = generateSigner(umi).publicKey;
  await delegateCollectionV1(umi, {
    mint,
    updateAuthority: updateAuthority.publicKey,
    authority: updateAuthority,
    delegate: collectionDelegate,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then a new metadata delegate record was created.
  const delegateRecord = await fetchMetadataDelegateRecord(
    umi,
    findMetadataDelegateRecordPda(umi, {
      mint,
      delegateRole: MetadataDelegateRole.Collection,
      delegate: collectionDelegate,
      updateAuthority: updateAuthority.publicKey,
    })
  );
  console.log(delegateRecord);
});
