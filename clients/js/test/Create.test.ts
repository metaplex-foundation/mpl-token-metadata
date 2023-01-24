import {
  generateSigner,
  none,
  some,
  transactionBuilder,
  createAmount,
} from '@lorisleiva/js-test';
import test from 'ava';
import { create, createArgs, CreateArgs, TokenStandard } from '../src';
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
        createArgs: createArgs('V1', {
          updateAuthority: mx.identity.publicKey,
          name: 'My NFT',
          uri: 'https://example.com/my-nft.json',
          sellerFeeBasisPoints: createAmount(500, '%', 2),
          creators: some([
            {
              address: mx.identity.publicKey,
              verified: true,
              share: 100,
            },
          ]),
          tokenStandard: TokenStandard.NonFungible,
          collection: none(),
          uses: none(),
          collectionDetails: none(),
          ruleSet: none(),
          decimals: none(),
          printSupply: none(),
        }),
      })
    )
    .sendAndConfirm();
});
