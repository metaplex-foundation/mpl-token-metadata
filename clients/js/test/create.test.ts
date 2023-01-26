import {
  generateSigner,
  percentAmount,
  some,
  transactionBuilder,
} from '@lorisleiva/js-test';
import test from 'ava';
import {
  create,
  createArgs,
  fetchMetadata,
  findMasterEditionPda,
  findMetadataPda,
  TokenStandard,
} from '../src';
import { createMetaplex } from './_setup';

test('it can create a new NFT with minimum configuration', async (t) => {
  // Given
  const mx = await createMetaplex();
  const mint = generateSigner(mx);

  // When
  await transactionBuilder(mx)
    .add(
      create(mx, {
        mint,
        masterEdition: findMasterEditionPda(mx, { mint: mint.publicKey }),
        createArgs: createArgs('V1', {
          updateAuthority: mx.identity.publicKey,
          name: 'My NFT',
          uri: 'https://example.com/my-nft.json',
          sellerFeeBasisPoints: percentAmount(5.5),
          creators: some([
            {
              address: mx.identity.publicKey,
              verified: true,
              share: 100,
            },
          ]),
          tokenStandard: TokenStandard.NonFungible,
        }),
      })
    )
    .sendAndConfirm();

  // Then
  const metadata = findMetadataPda(mx, { mint: mint.publicKey });
  const metadataAccount = await fetchMetadata(mx, metadata);
  console.log(metadataAccount);
  t.pass();
});
