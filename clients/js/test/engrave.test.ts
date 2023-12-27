import {
  fetchMint,
  Mint,
  setComputeUnitLimit,
} from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  percentAmount,
  publicKey,
} from '@metaplex-foundation/umi';
import test from 'ava';
import { MPL_ENGRAVER_PROGRAM_ID } from '@metaplex-foundation/mpl-engraver';
import {
  createV1,
  engrave,
  fetchDigitalAssetWithTokenByMint,
  mintV1,
  TokenStandard,
} from '../src';
import { createUmi } from './_setup';

test('it can mint and engrave a NonFungible', async (t) => {
  // Given a created NonFungible.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  await createV1(umi, {
    mint,
    name: 'My Engraved NFT',
    uri: 'https://example.com/my-nft.json',
    sellerFeeBasisPoints: percentAmount(5.5),
  }).sendAndConfirm(umi);

  // When we mint one token.
  await mintV1(umi, {
    mint: mint.publicKey,
    amount: 1,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // Then a token was minted to the associated token account.
  const mintAccount = await fetchMint(umi, mint.publicKey);
  t.like(mintAccount, <Mint>{ publicKey: publicKey(mint), supply: 1n });

  const nft = await fetchDigitalAssetWithTokenByMint(umi, mint.publicKey);

  // And when we engrave the token.
  await engrave(umi, {
    metadata: nft.metadata.publicKey,
    edition: nft.edition?.publicKey,
    mint: mint.publicKey,
    updateAuthority: umi.identity,
    engraverProgram: MPL_ENGRAVER_PROGRAM_ID,
  })
    .prepend(setComputeUnitLimit(umi, { units: 1000000 }))
    .sendAndConfirm(umi, { send: { skipPreflight: true } });
});

test('it can mint and engrave a ProgrammableNonFungible', async (t) => {
  // Given a created NonFungible.
  const umi = await createUmi();
  const mint = generateSigner(umi);
  await createV1(umi, {
    mint,
    name: 'My Engraved pNFT',
    uri: 'https://example.com/my-nft.json',
    sellerFeeBasisPoints: percentAmount(5.5),
  }).sendAndConfirm(umi);

  // When we mint one token.
  await mintV1(umi, {
    mint: mint.publicKey,
    amount: 1,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  // Then a token was minted to the associated token account.
  const mintAccount = await fetchMint(umi, mint.publicKey);
  t.like(mintAccount, <Mint>{ publicKey: publicKey(mint), supply: 1n });

  const nft = await fetchDigitalAssetWithTokenByMint(umi, mint.publicKey);

  // And when we engrave the token.
  await engrave(umi, {
    metadata: nft.metadata.publicKey,
    edition: nft.edition?.publicKey,
    mint: mint.publicKey,
    updateAuthority: umi.identity,
    engraverProgram: MPL_ENGRAVER_PROGRAM_ID,
  })
    .prepend(setComputeUnitLimit(umi, { units: 1000000 }))
    .sendAndConfirm(umi, { send: { skipPreflight: true } });
});
