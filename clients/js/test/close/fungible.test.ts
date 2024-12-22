import test from 'ava';
import {
  createSignerFromKeypair,
  generateSigner,
  lamports,
  MaybeRpcAccount,
  publicKey,
  subtractAmounts,
} from '@metaplex-foundation/umi';
import { readFileSync } from 'fs';
import {
  AuthorityType,
  burnToken,
  setAuthority,
  SPL_SYSTEM_PROGRAM_ID,
} from '@metaplex-foundation/mpl-toolbox';
import { createDigitalAssetWithToken, createUmi } from '../_setup';
import {
  closeAccounts,
  fetchDigitalAssetWithAssociatedToken,
  TokenStandard,
} from '../../src';

const closeDestination = publicKey(
  'GxCXYtrnaU6JXeAza8Ugn4EE6QiFinpfn8t3Lo4UkBDX'
);

test.skip('it can close ownerless metadata for a fungible with zero supply and no mint authority', async (t) => {
  const umi = await createUmi();
  const closeAuthority = createSignerFromKeypair(
    umi,
    umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(
        JSON.parse(
          readFileSync(
            '/Users/kelliott/Metaplex/keys/C1oseLQExhuEzeBhsVbLtseSpVgvpHDbBj3PTevBCEBh.json'
          ).toString()
        )
      )
    )
  );

  const mint = await createDigitalAssetWithToken(umi, {
    name: 'Fungible',
    symbol: 'FUN',
    uri: 'https://example.com/nft.json',
    tokenStandard: TokenStandard.Fungible,
    amount: 1,
  });

  const asset = await fetchDigitalAssetWithAssociatedToken(
    umi,
    mint.publicKey,
    umi.identity.publicKey
  );

  await burnToken(umi, {
    account: asset.token.publicKey,
    mint: mint.publicKey,
    amount: 1,
  }).sendAndConfirm(umi);

  await setAuthority(umi, {
    owned: mint.publicKey,
    owner: umi.identity,
    authorityType: AuthorityType.MintTokens,
    newAuthority: null,
  }).sendAndConfirm(umi);

  const metadataLamports = await umi.rpc.getBalance(asset.metadata.publicKey);
  const lamportsBefore = await umi.rpc.getBalance(closeDestination);
  await closeAccounts(umi, {
    mint: mint.publicKey,
    authority: closeAuthority,
    destination: closeDestination,
  }).sendAndConfirm(umi);

  t.deepEqual(await umi.rpc.getAccount(asset.metadata.publicKey), <
    MaybeRpcAccount
    >{
      publicKey: asset.metadata.publicKey,
      exists: false,
    });
  t.deepEqual(await umi.rpc.getBalance(asset.metadata.publicKey), lamports(0));

  const lamportsAfter = await umi.rpc.getBalance(closeDestination);
  t.deepEqual(subtractAmounts(lamportsAfter, lamportsBefore), metadataLamports);
});

test.skip('it can close ownerless metadata for a fungible with zero supply and mint authority set to the system program', async (t) => {
  const umi = await createUmi();
  const closeAuthority = createSignerFromKeypair(
    umi,
    umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(
        JSON.parse(
          readFileSync(
            '/Users/kelliott/Metaplex/keys/C1oseLQExhuEzeBhsVbLtseSpVgvpHDbBj3PTevBCEBh.json'
          ).toString()
        )
      )
    )
  );

  const mint = await createDigitalAssetWithToken(umi, {
    name: 'Fungible',
    symbol: 'FUN',
    uri: 'https://example.com/nft.json',
    tokenStandard: TokenStandard.Fungible,
    amount: 1,
  });

  const asset = await fetchDigitalAssetWithAssociatedToken(
    umi,
    mint.publicKey,
    umi.identity.publicKey
  );

  await burnToken(umi, {
    account: asset.token.publicKey,
    mint: mint.publicKey,
    amount: 1,
  }).sendAndConfirm(umi);

  await setAuthority(umi, {
    owned: mint.publicKey,
    owner: umi.identity,
    authorityType: AuthorityType.MintTokens,
    newAuthority: SPL_SYSTEM_PROGRAM_ID,
  }).sendAndConfirm(umi);

  const metadataLamports = await umi.rpc.getBalance(asset.metadata.publicKey);
  const lamportsBefore = await umi.rpc.getBalance(closeDestination);
  await closeAccounts(umi, {
    mint: mint.publicKey,
    authority: closeAuthority,
    destination: closeDestination,
  }).sendAndConfirm(umi);

  t.deepEqual(await umi.rpc.getAccount(asset.metadata.publicKey), <
    MaybeRpcAccount
    >{
      publicKey: asset.metadata.publicKey,
      exists: false,
    });
  t.deepEqual(await umi.rpc.getBalance(asset.metadata.publicKey), lamports(0));

  const lamportsAfter = await umi.rpc.getBalance(closeDestination);
  t.deepEqual(subtractAmounts(lamportsAfter, lamportsBefore), metadataLamports);
});

test.skip('it can close ownerless metadata for a fungible asset with zero supply and no mint authority', async (t) => {
  const umi = await createUmi();
  const closeAuthority = createSignerFromKeypair(
    umi,
    umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(
        JSON.parse(
          readFileSync(
            '/Users/kelliott/Metaplex/keys/C1oseLQExhuEzeBhsVbLtseSpVgvpHDbBj3PTevBCEBh.json'
          ).toString()
        )
      )
    )
  );

  const mint = await createDigitalAssetWithToken(umi, {
    name: 'Fungible',
    symbol: 'FUN',
    uri: 'https://example.com/nft.json',
    tokenStandard: TokenStandard.FungibleAsset,
    amount: 1,
  });

  const asset = await fetchDigitalAssetWithAssociatedToken(
    umi,
    mint.publicKey,
    umi.identity.publicKey
  );

  await burnToken(umi, {
    account: asset.token.publicKey,
    mint: mint.publicKey,
    amount: 1,
  }).sendAndConfirm(umi);

  await setAuthority(umi, {
    owned: mint.publicKey,
    owner: umi.identity,
    authorityType: AuthorityType.MintTokens,
    newAuthority: null,
  }).sendAndConfirm(umi);

  const metadataLamports = await umi.rpc.getBalance(asset.metadata.publicKey);
  const lamportsBefore = await umi.rpc.getBalance(closeDestination);
  await closeAccounts(umi, {
    mint: mint.publicKey,
    authority: closeAuthority,
    destination: closeDestination,
  }).sendAndConfirm(umi);

  t.deepEqual(await umi.rpc.getAccount(asset.metadata.publicKey), <
    MaybeRpcAccount
    >{
      publicKey: asset.metadata.publicKey,
      exists: false,
    });
  t.deepEqual(await umi.rpc.getBalance(asset.metadata.publicKey), lamports(0));

  const lamportsAfter = await umi.rpc.getBalance(closeDestination);
  t.deepEqual(subtractAmounts(lamportsAfter, lamportsBefore), metadataLamports);
});

test.skip('it cannot close ownerless metadata for a fungible with non-zero supply and no mint authority', async (t) => {
  const umi = await createUmi();
  const closeAuthority = createSignerFromKeypair(
    umi,
    umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(
        JSON.parse(
          readFileSync(
            '/Users/kelliott/Metaplex/keys/C1oseLQExhuEzeBhsVbLtseSpVgvpHDbBj3PTevBCEBh.json'
          ).toString()
        )
      )
    )
  );

  const mint = await createDigitalAssetWithToken(umi, {
    name: 'Fungible',
    symbol: 'FUN',
    uri: 'https://example.com/nft.json',
    tokenStandard: TokenStandard.Fungible,
    amount: 1,
  });

  await setAuthority(umi, {
    owned: mint.publicKey,
    owner: umi.identity,
    authorityType: AuthorityType.MintTokens,
    newAuthority: null,
  }).sendAndConfirm(umi);

  const result = closeAccounts(umi, {
    mint: mint.publicKey,
    authority: closeAuthority,
    destination: closeDestination,
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, {
    name: 'MintSupplyMustBeZero',
  });
});

test.skip('it cannot close ownerless metadata for a fungible with zero supply and a mint authority', async (t) => {
  const umi = await createUmi();
  const closeAuthority = createSignerFromKeypair(
    umi,
    umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(
        JSON.parse(
          readFileSync(
            '/Users/kelliott/Metaplex/keys/C1oseLQExhuEzeBhsVbLtseSpVgvpHDbBj3PTevBCEBh.json'
          ).toString()
        )
      )
    )
  );

  const mint = await createDigitalAssetWithToken(umi, {
    name: 'Fungible',
    symbol: 'FUN',
    uri: 'https://example.com/nft.json',
    tokenStandard: TokenStandard.Fungible,
    amount: 1,
  });

  const asset = await fetchDigitalAssetWithAssociatedToken(
    umi,
    mint.publicKey,
    umi.identity.publicKey
  );

  await burnToken(umi, {
    account: asset.token.publicKey,
    mint: mint.publicKey,
    amount: 1,
  }).sendAndConfirm(umi);

  const result = closeAccounts(umi, {
    mint: mint.publicKey,
    authority: closeAuthority,
    destination: closeDestination,
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, {
    name: 'InvalidMintAuthority',
  });
});

test.skip('it cannot close ownerless metadata for a fungible with wrong authority', async (t) => {
  const umi = await createUmi();
  const closeAuthority = generateSigner(umi);

  const mint = await createDigitalAssetWithToken(umi, {
    name: 'Fungible',
    symbol: 'FUN',
    uri: 'https://example.com/nft.json',
    tokenStandard: TokenStandard.Fungible,
    amount: 1,
  });

  const asset = await fetchDigitalAssetWithAssociatedToken(
    umi,
    mint.publicKey,
    umi.identity.publicKey
  );

  await burnToken(umi, {
    account: asset.token.publicKey,
    mint: mint.publicKey,
    amount: 1,
  }).sendAndConfirm(umi);

  await setAuthority(umi, {
    owned: mint.publicKey,
    owner: umi.identity,
    authorityType: AuthorityType.MintTokens,
    newAuthority: null,
  }).sendAndConfirm(umi);

  const result = closeAccounts(umi, {
    mint: mint.publicKey,
    authority: closeAuthority,
    destination: closeDestination,
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, {
    name: 'InvalidCloseAuthority',
  });
});

test.skip('it cannot close ownerless metadata for a fungible with wrong destination', async (t) => {
  const umi = await createUmi();
  const closeAuthority = createSignerFromKeypair(
    umi,
    umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(
        JSON.parse(
          readFileSync(
            '/Users/kelliott/Metaplex/keys/C1oseLQExhuEzeBhsVbLtseSpVgvpHDbBj3PTevBCEBh.json'
          ).toString()
        )
      )
    )
  );

  const mint = await createDigitalAssetWithToken(umi, {
    name: 'Fungible',
    symbol: 'FUN',
    uri: 'https://example.com/nft.json',
    tokenStandard: TokenStandard.Fungible,
    amount: 1,
  });

  const asset = await fetchDigitalAssetWithAssociatedToken(
    umi,
    mint.publicKey,
    umi.identity.publicKey
  );

  await burnToken(umi, {
    account: asset.token.publicKey,
    mint: mint.publicKey,
    amount: 1,
  }).sendAndConfirm(umi);

  await setAuthority(umi, {
    owned: mint.publicKey,
    owner: umi.identity,
    authorityType: AuthorityType.MintTokens,
    newAuthority: null,
  }).sendAndConfirm(umi);

  const result = closeAccounts(umi, {
    mint: mint.publicKey,
    authority: closeAuthority,
    destination: generateSigner(umi).publicKey,
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, {
    name: 'InvalidFeeAccount',
  });
});
