import {
  assertAccountExists,
  Context,
  PublicKey,
  RpcAccount,
  RpcBaseOptions,
  RpcGetAccountsOptions,
  chunk,
  zipMap,
} from '@metaplex-foundation/umi';
import {
  deserializeToken,
  fetchAllTokenByOwner,
  FetchTokenAmountFilter,
  FetchTokenStrategy,
  findAssociatedTokenPda,
  findLargestTokensByMint,
  Token,
} from '@metaplex-foundation/mpl-toolbox';
import { deserializeDigitalAsset, DigitalAsset } from './digitalAsset';
import {
  deserializeTokenRecord,
  findMasterEditionPda,
  findMetadataPda,
  findTokenRecordPda,
  TokenRecord,
} from './generated';

export type DigitalAssetWithToken = DigitalAsset & {
  token: Token;
  tokenRecord?: TokenRecord;
};

export async function fetchDigitalAssetWithToken(
  context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>,
  mint: PublicKey,
  token: PublicKey,
  options?: RpcGetAccountsOptions
): Promise<DigitalAssetWithToken> {
  const [
    mintAccount,
    metadataAccount,
    editionAccount,
    tokenAccount,
    tokenRecordAccount,
  ] = await context.rpc.getAccounts(
    [
      mint,
      findMetadataPda(context, { mint })[0],
      findMasterEditionPda(context, { mint })[0],
      token,
      findTokenRecordPda(context, { mint, token })[0],
    ],
    options
  );
  assertAccountExists(mintAccount, 'Mint');
  assertAccountExists(metadataAccount, 'Metadata');
  assertAccountExists(tokenAccount, 'Token');
  return deserializeDigitalAssetWithToken(
    mintAccount,
    metadataAccount,
    tokenAccount,
    editionAccount.exists ? editionAccount : undefined,
    tokenRecordAccount.exists ? tokenRecordAccount : undefined
  );
}

export async function fetchDigitalAssetWithAssociatedToken(
  context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>,
  mint: PublicKey,
  owner: PublicKey,
  options?: RpcGetAccountsOptions
): Promise<DigitalAssetWithToken> {
  const [token] = findAssociatedTokenPda(context, { mint, owner });
  return fetchDigitalAssetWithToken(context, mint, token, options);
}

export async function fetchDigitalAssetWithTokenByMint(
  context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>,
  mint: PublicKey,
  options?: RpcBaseOptions
): Promise<DigitalAssetWithToken> {
  const digitalAssets = await fetchAllDigitalAssetWithTokenByMint(
    context,
    mint,
    options
  );
  if (digitalAssets.length === 0) {
    throw new Error('No valid token accounts found for the provided mint');
  }
  if (digitalAssets.length > 1) {
    throw new Error(
      'Multiple valid token accounts found for the provided mint' +
        'use `fetchAllDigitalAssetWithTokenByMint` instead to retrieve them all.'
    );
  }
  return digitalAssets[0];
}

export async function fetchAllDigitalAssetWithTokenByOwner(
  context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>,
  owner: PublicKey,
  options?: RpcBaseOptions & {
    mint?: PublicKey;
    tokenStrategy?: FetchTokenStrategy;
    tokenAmountFilter?: FetchTokenAmountFilter;
  }
): Promise<DigitalAssetWithToken[]> {
  const tokens = await fetchAllTokenByOwner(context, owner, options);
  const accountsToFetch = tokens.flatMap((token) => [
    token.mint,
    findMetadataPda(context, { mint: token.mint })[0],
    findMasterEditionPda(context, { mint: token.mint })[0],
    findTokenRecordPda(context, {
      mint: token.mint,
      token: token.publicKey,
    })[0],
  ]);
  const accounts = await context.rpc.getAccounts(accountsToFetch, options);

  return zipMap(
    tokens,
    chunk(accounts, 4),
    (token, otherAccounts): DigitalAssetWithToken[] => {
      if (!otherAccounts || otherAccounts.length !== 4) {
        return [];
      }
      const [mintAccount, metadataAccount, editionAccount, tokenRecordAccount] =
        otherAccounts;
      if (!mintAccount.exists || !metadataAccount.exists) {
        return [];
      }
      try {
        return [
          {
            ...deserializeDigitalAsset(
              mintAccount,
              metadataAccount,
              editionAccount.exists ? editionAccount : undefined
            ),
            token,
            tokenRecord: tokenRecordAccount.exists
              ? deserializeTokenRecord(tokenRecordAccount)
              : undefined,
          },
        ];
      } catch (e) {
        return [];
      }
    }
  ).flat();
}

export function fetchAllDigitalAssetWithTokenByOwnerAndMint(
  context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>,
  owner: PublicKey,
  mint: PublicKey,
  options?: RpcBaseOptions
): Promise<DigitalAssetWithToken[]> {
  return fetchAllDigitalAssetWithTokenByOwner(context, owner, {
    ...options,
    mint,
  });
}

/**
 * Retrives the largest 20 token accounts only for performance reasons.
 * For a more robust solution, please use an external indexer.
 */
export async function fetchAllDigitalAssetWithTokenByMint(
  context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>,
  mint: PublicKey,
  options?: RpcBaseOptions
): Promise<DigitalAssetWithToken[]> {
  const largestTokens = await findLargestTokensByMint(context, mint, options);
  const nonEmptyTokens = largestTokens
    .filter((token) => token.amount.basisPoints > 0)
    .map((token) => token.publicKey);
  const accountsToFetch = [
    mint,
    findMetadataPda(context, { mint })[0],
    findMasterEditionPda(context, { mint })[0],
  ];
  accountsToFetch.push(
    ...nonEmptyTokens.flatMap((token) => [
      token,
      findTokenRecordPda(context, { mint, token })[0],
    ])
  );
  const accounts = await context.rpc.getAccounts(accountsToFetch, options);
  const [mintAccount, metadataAccount, editionAccount, ...tokenAccounts] =
    accounts;
  assertAccountExists(mintAccount, 'Mint');
  assertAccountExists(metadataAccount, 'Metadata');

  return chunk(tokenAccounts, 2).flatMap(
    ([tokenAccount, tokenRecordAccount]): DigitalAssetWithToken[] => {
      if (!tokenAccount.exists) return [];
      return [
        deserializeDigitalAssetWithToken(
          mintAccount,
          metadataAccount,
          tokenAccount,
          editionAccount.exists ? editionAccount : undefined,
          tokenRecordAccount.exists ? tokenRecordAccount : undefined
        ),
      ];
    }
  );
}

export function deserializeDigitalAssetWithToken(
  mintAccount: RpcAccount,
  metadataAccount: RpcAccount,
  tokenAccount: RpcAccount,
  editionAccount?: RpcAccount,
  tokenRecordAccount?: RpcAccount
): DigitalAssetWithToken {
  return {
    ...deserializeDigitalAsset(mintAccount, metadataAccount, editionAccount),
    token: deserializeToken(tokenAccount),
    tokenRecord: tokenRecordAccount
      ? deserializeTokenRecord(tokenRecordAccount)
      : undefined,
  };
}
