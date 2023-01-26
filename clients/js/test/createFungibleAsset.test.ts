import {
  generateSigner,
  none,
  percentAmount,
  publicKey,
  some,
  transactionBuilder,
} from '@lorisleiva/js-test';
import { fetchMint, Mint } from '@lorisleiva/mpl-essentials';
import test from 'ava';
import {
  createFungibleAsset,
  fetchMetadata,
  findMetadataPda,
  Metadata,
  TokenStandard,
} from '../src';
import { createMetaplex } from './_setup';

test('it can create a new FungibleAsset', async (t) => {
  // Given a new mint Signer.
  const mx = await createMetaplex();
  const mint = generateSigner(mx);

  // When we create a new FungibleAsset at this address.
  await transactionBuilder(mx)
    .add(
      createFungibleAsset(mx, {
        mint,
        name: 'My Fungible Asset',
        uri: 'https://example.com/my-fungible-asset.json',
        sellerFeeBasisPoints: percentAmount(5.5),
      })
    )
    .sendAndConfirm();

  // Then a Mint account was created with zero supply.
  const mintAccount = await fetchMint(mx, mint.publicKey);
  t.like(mintAccount, <Mint>{
    publicKey: publicKey(mint),
    supply: 0n,
    decimals: 0,
    mintAuthority: some(publicKey(mx.identity)),
    freezeAuthority: some(publicKey(mx.identity)),
  });

  // And a Metadata account was created.
  const metadata = findMetadataPda(mx, { mint: mint.publicKey });
  const metadataAccount = await fetchMetadata(mx, metadata);
  t.like(metadataAccount, <Metadata>{
    publicKey: publicKey(metadata),
    updateAuthority: publicKey(mx.identity),
    mint: publicKey(mint),
    tokenStandard: some(TokenStandard.FungibleAsset),
    name: 'My Fungible Asset',
    uri: 'https://example.com/my-fungible-asset.json',
    sellerFeeBasisPoints: 550,
    primarySaleHappened: false,
    isMutable: true,
    creators: some([
      { address: publicKey(mx.identity), verified: true, share: 100 },
    ]),
    collection: none(),
    uses: none(),
    collectionDetails: none(),
    programmableConfig: none(),
  });
});
