import test from 'ava';
import {
  addAmounts,
  createSignerFromKeypair,
  generateSigner,
  lamports,
  MaybeRpcAccount,
  percentAmount,
  publicKey,
  subtractAmounts,
} from '@metaplex-foundation/umi';
import { readFileSync } from 'fs';
import { burnToken, findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
import { burnToken22, createDigitalAssetWithToken, createUmi, SPL_TOKEN_2022_PROGRAM_ID } from '../_setup';
import {
  closeAccounts,
  createV1,
  fetchDigitalAsset,
  fetchDigitalAssetWithAssociatedToken,
  mintV1,
  printSupply,
  printV1,
  TokenStandard,
} from '../../src';

const closeDestination = publicKey(
  'GxCXYtrnaU6JXeAza8Ugn4EE6QiFinpfn8t3Lo4UkBDX'
);

test.serial('it can close t22 ownerless metadata for a non-fungible with zero supply', async (t) => {
  const umi = await createUmi();
  const mint = generateSigner(umi);
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

  await createV1(umi, {
    mint,
    name: 'My NFT',
    uri: 'https://example.com/my-nft.json',
    tokenStandard: TokenStandard.NonFungible,
    splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
    sellerFeeBasisPoints: percentAmount(0),
  }).sendAndConfirm(umi);

  // And we derive the associated token account from SPL Token 2022.
  const token = findAssociatedTokenPda(umi, {
    mint: mint.publicKey,
    owner: umi.identity.publicKey,
    tokenProgramId: SPL_TOKEN_2022_PROGRAM_ID,
  });

  // When we mint one token.
  await mintV1(umi, {
    mint: mint.publicKey,
    token,
    tokenOwner: umi.identity.publicKey,
    amount: 1,
    splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  const asset = await fetchDigitalAsset(
    umi,
    mint.publicKey,
  );

  await burnToken22(umi, {
    account: token,
    mint: mint.publicKey,
    amount: 1,
  }).sendAndConfirm(umi);

  const metadataLamports = await umi.rpc.getBalance(asset.metadata.publicKey);

  if (asset.edition === undefined) {
    t.fail('Expected edition to exist');
  }

  const masterEditionLamports = await umi.rpc.getBalance(
    // @ts-ignore
    asset.edition.publicKey
  );
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
  t.deepEqual(
    subtractAmounts(lamportsAfter, lamportsBefore),
    addAmounts(metadataLamports, masterEditionLamports)
  );
});

test.serial('it can close ownerless metadata for a non-fungible with zero supply', async (t) => {
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
    tokenStandard: TokenStandard.NonFungible,
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

  const metadataLamports = await umi.rpc.getBalance(asset.metadata.publicKey);

  if (asset.edition === undefined) {
    t.fail('Expected edition to exist');
  }

  const masterEditionLamports = await umi.rpc.getBalance(
    // @ts-ignore
    asset.edition.publicKey
  );
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
  t.deepEqual(
    subtractAmounts(lamportsAfter, lamportsBefore),
    addAmounts(metadataLamports, masterEditionLamports)
  );
});

test.serial('it cannot close ownerless metadata for a non-fungible with non-zero supply', async (t) => {
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
    tokenStandard: TokenStandard.NonFungible,
    amount: 1,
  });

  const result = closeAccounts(umi, {
    mint: mint.publicKey,
    authority: closeAuthority,
    destination: closeDestination,
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, { name: 'MintSupplyMustBeZero' });
});

test.serial('it cannot close ownerless metadata for a programmable non-fungible with non-zero supply', async (t) => {
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
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    amount: 1,
  });

  const result = closeAccounts(umi, {
    mint: mint.publicKey,
    authority: closeAuthority,
    destination: closeDestination,
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, { name: 'MintSupplyMustBeZero' });
});

test.serial('it cannot close ownerless metadata with wrong authority', async (t) => {
  const umi = await createUmi();

  const mint = await createDigitalAssetWithToken(umi, {
    name: 'Fungible',
    symbol: 'FUN',
    uri: 'https://example.com/nft.json',
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    amount: 1,
  });

  const result = closeAccounts(umi, {
    mint: mint.publicKey,
    authority: generateSigner(umi),
    destination: closeDestination,
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, { name: 'InvalidCloseAuthority' });
});

test.serial('it cannot close ownerless metadata with wrong destination', async (t) => {
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
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    amount: 1,
  });

  const result = closeAccounts(umi, {
    mint: mint.publicKey,
    authority: closeAuthority,
    destination: generateSigner(umi).publicKey,
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, { name: 'InvalidFeeAccount' });
});

test.serial('it can close ownerless metadata for a non-fungible edition with zero supply', async (t) => {
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

  const originalMint = await createDigitalAssetWithToken(umi, {
    name: 'My NFT',
    symbol: 'MNFT',
    uri: 'https://example.com/nft.json',
    printSupply: printSupply('Limited', [10]),
    tokenStandard: TokenStandard.NonFungible,
  });

  // When we print a new edition of the asset.
  const editionMint = generateSigner(umi);
  await printV1(umi, {
    masterTokenAccountOwner: umi.identity,
    masterEditionMint: originalMint.publicKey,
    editionMint,
    editionTokenAccountOwner: umi.identity.publicKey,
    editionNumber: 1,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  const asset = await fetchDigitalAssetWithAssociatedToken(
    umi,
    editionMint.publicKey,
    umi.identity.publicKey
  );

  await burnToken(umi, {
    account: asset.token.publicKey,
    mint: editionMint.publicKey,
    amount: 1,
  }).sendAndConfirm(umi);

  const metadataLamports = await umi.rpc.getBalance(asset.metadata.publicKey);

  if (asset.edition === undefined) {
    t.fail('Expected edition to exist');
  }
  // @ts-ignore
  const editionLamports = await umi.rpc.getBalance(asset.edition.publicKey);
  const lamportsBefore = await umi.rpc.getBalance(closeDestination);
  await closeAccounts(umi, {
    mint: editionMint.publicKey,
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
  t.deepEqual(
    subtractAmounts(lamportsAfter, lamportsBefore),
    addAmounts(metadataLamports, editionLamports)
  );
});

test.serial('it can close ownerless metadata for a t22 non-fungible edition with zero supply', async (t) => {
  const umi = await createUmi();
  const originalMint = generateSigner(umi);
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

  await createV1(umi, {
    mint: originalMint,
    name: 'My NFT',
    symbol: 'MNFT',
    uri: 'https://example.com/nft.json',
    printSupply: printSupply('Limited', [10]),
    tokenStandard: TokenStandard.NonFungible,
    splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
    sellerFeeBasisPoints: percentAmount(0),
  }).sendAndConfirm(umi);

  const originalToken = findAssociatedTokenPda(umi, {
    mint: originalMint.publicKey,
    owner: umi.identity.publicKey,
    tokenProgramId: SPL_TOKEN_2022_PROGRAM_ID,
  });

  await mintV1(umi, {
    mint: originalMint.publicKey,
    token: originalToken,
    tokenOwner: umi.identity.publicKey,
    amount: 1,
    splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  // When we print a new edition of the asset.
  const editionMint = generateSigner(umi);
  const token = findAssociatedTokenPda(umi, {
    mint: editionMint.publicKey,
    owner: umi.identity.publicKey,
    tokenProgramId: SPL_TOKEN_2022_PROGRAM_ID,
  });

  await printV1(umi, {
    masterTokenAccountOwner: umi.identity,
    masterEditionMint: originalMint.publicKey,
    masterTokenAccount: originalToken,
    editionMint,
    editionTokenAccountOwner: umi.identity.publicKey,
    editionTokenAccount: token,
    editionNumber: 1,
    tokenStandard: TokenStandard.NonFungible,
    splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
  }).sendAndConfirm(umi);

  const asset = await fetchDigitalAsset(
    umi,
    editionMint.publicKey,
  );

  await burnToken22(umi, {
    account: token,
    mint: editionMint.publicKey,
    amount: 1,
  }).sendAndConfirm(umi);

  const metadataLamports = await umi.rpc.getBalance(asset.metadata.publicKey);

  if (asset.edition === undefined) {
    t.fail('Expected edition to exist');
  }
  // @ts-ignore
  const editionLamports = await umi.rpc.getBalance(asset.edition.publicKey);
  const lamportsBefore = await umi.rpc.getBalance(closeDestination);
  await closeAccounts(umi, {
    mint: editionMint.publicKey,
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
  t.deepEqual(
    subtractAmounts(lamportsAfter, lamportsBefore),
    addAmounts(metadataLamports, editionLamports)
  );
});

test.serial('it cannot close ownerless metadata for a non-fungible edition with non-zero supply', async (t) => {
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

  const originalMint = await createDigitalAssetWithToken(umi, {
    name: 'My NFT',
    symbol: 'MNFT',
    uri: 'https://example.com/nft.json',
    printSupply: printSupply('Limited', [10]),
    tokenStandard: TokenStandard.NonFungible,
  });

  // When we print a new edition of the asset.
  const editionMint = generateSigner(umi);
  await printV1(umi, {
    masterTokenAccountOwner: umi.identity,
    masterEditionMint: originalMint.publicKey,
    editionMint,
    editionTokenAccountOwner: umi.identity.publicKey,
    editionNumber: 1,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  const result = closeAccounts(umi, {
    mint: editionMint.publicKey,
    authority: closeAuthority,
    destination: closeDestination,
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, { name: 'MintSupplyMustBeZero' });
});

test.serial('it cannot close ownerless metadata for a programmable non-fungible edition with non-zero supply', async (t) => {
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

  const originalMint = await createDigitalAssetWithToken(umi, {
    name: 'My NFT',
    symbol: 'MNFT',
    uri: 'https://example.com/nft.json',
    printSupply: printSupply('Limited', [10]),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // When we print a new edition of the asset.
  const editionMint = generateSigner(umi);
  await printV1(umi, {
    masterTokenAccountOwner: umi.identity,
    masterEditionMint: originalMint.publicKey,
    editionMint,
    editionTokenAccountOwner: umi.identity.publicKey,
    editionNumber: 1,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  }).sendAndConfirm(umi);

  const result = closeAccounts(umi, {
    mint: editionMint.publicKey,
    authority: closeAuthority,
    destination: closeDestination,
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, { name: 'MintSupplyMustBeZero' });
});
