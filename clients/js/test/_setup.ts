/* eslint-disable import/no-extraneous-dependencies */
import {
  Context,
  generateSigner,
  percentAmount,
  publicKey,
  PublicKey,
  Signer,
  TransactionBuilder,
  transactionBuilder,
  Umi,
} from '@metaplex-foundation/umi';
import { createUmi as baseCreateUmi } from '@metaplex-foundation/umi-bundle-tests';
import {
  createV1,
  findMetadataPda,
  mintV1,
  mplTokenMetadata,
  TokenStandard,
  verifyCreatorV1,
} from '../src';
import {
  BurnTokenInstructionAccounts,
  BurnTokenInstructionArgs,
  BurnTokenInstructionDataArgs,
  getAccountMetasAndSigners,
  getBurnTokenInstructionDataSerializer,
  getSetAuthorityInstructionDataSerializer,
  ResolvedAccount,
  ResolvedAccountsWithIndices,
  SetAuthorityInstructionAccounts,
  SetAuthorityInstructionArgs,
  SetAuthorityInstructionDataArgs,
} from '@metaplex-foundation/mpl-toolbox';

export type TokenStandardKeys = keyof typeof TokenStandard;

export const ALL_TOKEN_STANDARDS: TokenStandardKeys[] = [
  'NonFungible',
  'FungibleAsset',
  'Fungible',
  'NonFungibleEdition',
  'ProgrammableNonFungible',
];

export const NON_EDITION_TOKEN_STANDARDS: TokenStandardKeys[] = [
  'NonFungible',
  'FungibleAsset',
  'Fungible',
  'ProgrammableNonFungible',
];

export const OG_TOKEN_STANDARDS: TokenStandardKeys[] = [
  'NonFungible',
  'FungibleAsset',
  'Fungible',
];

export const NON_EDITION_NON_FUNGIBLE_STANDARDS: TokenStandardKeys[] = [
  'NonFungible',
  'ProgrammableNonFungible',
];

export const FUNGIBLE_TOKEN_STANDARDS: TokenStandardKeys[] = [
  'FungibleAsset',
  'Fungible',
];

export const SPL_TOKEN_2022_PROGRAM_ID: PublicKey = publicKey(
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
);

export const collectionV2Padding = new Array(8).fill(0);

export const createUmi = async () =>
  (await baseCreateUmi()).use(mplTokenMetadata());

export const createDigitalAsset = async (
  umi: Umi,
  input: Partial<Parameters<typeof createV1>[1]> = {}
): Promise<Signer> => {
  const mint = generateSigner(umi);
  await createV1(umi, {
    mint,
    name: 'My NFT',
    uri: 'https://example.com',
    sellerFeeBasisPoints: percentAmount(2.5),
    ...input,
  }).sendAndConfirm(umi);
  return mint;
};

export const createDigitalAssetWithToken = async (
  umi: Umi,
  input: Partial<Parameters<typeof createV1>[1]> & {
    token?: PublicKey;
    tokenOwner?: PublicKey;
    amount?: number | bigint;
  } = {}
): Promise<Signer> => {
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(
      createV1(umi, {
        mint,
        name: 'My NFT',
        uri: 'https://example.com',
        sellerFeeBasisPoints: percentAmount(2.5),
        ...input,
      })
    )
    .add(
      mintV1(umi, {
        authority: input.authority,
        mint: mint.publicKey,
        token: input.token,
        tokenOwner: input.tokenOwner ?? umi.identity.publicKey,
        amount: input.amount ?? 1,
        tokenStandard: input.tokenStandard ?? TokenStandard.NonFungible,
      })
    )
    .sendAndConfirm(umi);
  return mint;
};
export const createDigitalAssetWithVerifiedCreators = async (
  umi: Umi,
  input: Partial<Parameters<typeof createV1>[1]> & {
    creatorAuthority?: Signer;
  }
) => {
  const mint = generateSigner(umi);
  await transactionBuilder()
    .add(
      createV1(umi, {
        mint,
        name: 'My NFT',
        uri: 'https://example.com',
        sellerFeeBasisPoints: percentAmount(2.5),
        ...input,
      })
    )
    .sendAndConfirm(umi);

  const metadata = findMetadataPda(umi, { mint: mint.publicKey });

  await transactionBuilder()
    .add(verifyCreatorV1(umi, { metadata, authority: input.creatorAuthority }))
    .add(
      mintV1(umi, {
        authority: input.authority,
        mint: mint.publicKey,
        tokenOwner: umi.identity.publicKey,
        amount: 1,
        tokenStandard: TokenStandard.NonFungible,
      })
    );

  return mint;
};

export function burnToken22(
  context: Pick<Context, 'identity' | 'programs'>,
  input: BurnTokenInstructionAccounts & BurnTokenInstructionArgs
): TransactionBuilder {
  // Program ID.
  const programId = SPL_TOKEN_2022_PROGRAM_ID;

  // Accounts.
  const resolvedAccounts: ResolvedAccountsWithIndices = {
    account: { index: 0, isWritable: true, value: input.account ?? null },
    mint: { index: 1, isWritable: true, value: input.mint ?? null },
    authority: { index: 2, isWritable: false, value: input.authority ?? null },
  };

  // Arguments.
  const resolvedArgs: BurnTokenInstructionArgs = { ...input };

  // Default values.
  if (!resolvedAccounts.authority.value) {
    resolvedAccounts.authority.value = context.identity;
  }

  // Accounts in order.
  const orderedAccounts: ResolvedAccount[] = Object.values(
    resolvedAccounts
  ).sort((a, b) => a.index - b.index);

  // Keys and Signers.
  const [keys, signers] = getAccountMetasAndSigners(
    orderedAccounts,
    'programId',
    programId
  );

  // Data.
  const data = getBurnTokenInstructionDataSerializer().serialize(
    resolvedArgs as BurnTokenInstructionDataArgs
  );

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}

export function setAuthority22(
  context: Pick<Context, 'programs'>,
  input: SetAuthorityInstructionAccounts & SetAuthorityInstructionArgs
): TransactionBuilder {
  // Program ID.
  const programId = SPL_TOKEN_2022_PROGRAM_ID;

  // Accounts.
  const resolvedAccounts: ResolvedAccountsWithIndices = {
    owned: { index: 0, isWritable: true, value: input.owned ?? null },
    owner: { index: 1, isWritable: false, value: input.owner ?? null },
  };

  // Arguments.
  const resolvedArgs: SetAuthorityInstructionArgs = { ...input };

  // Accounts in order.
  const orderedAccounts: ResolvedAccount[] = Object.values(
    resolvedAccounts
  ).sort((a, b) => a.index - b.index);

  // Keys and Signers.
  const [keys, signers] = getAccountMetasAndSigners(
    orderedAccounts,
    'programId',
    programId
  );

  // Data.
  const data = getSetAuthorityInstructionDataSerializer().serialize(
    resolvedArgs as SetAuthorityInstructionDataArgs
  );

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
