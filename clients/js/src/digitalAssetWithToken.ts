import {
  assertAccountExists,
  Context,
  PublicKey,
  RpcAccount,
  RpcBaseOptions,
  RpcGetAccountsOptions,
  chunk,
  zipMap,
} from '@lorisleiva/js-core';
import {
  deserializeToken,
  fetchTokensByOwner,
  findAssociatedTokenPda,
  Token,
} from '@lorisleiva/mpl-essentials';
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
  context: Pick<Context, 'rpc' | 'serializer' | 'eddsa' | 'programs'>,
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
      findMetadataPda(context, { mint }),
      findMasterEditionPda(context, { mint }),
      token,
      findTokenRecordPda(context, { mint, token }),
    ],
    options
  );
  assertAccountExists(mintAccount, 'Mint');
  assertAccountExists(metadataAccount, 'Metadata');
  assertAccountExists(tokenAccount, 'Token');
  return deserializeDigitalAssetWithToken(
    context,
    mintAccount,
    metadataAccount,
    tokenAccount,
    editionAccount.exists ? editionAccount : undefined,
    tokenRecordAccount.exists ? tokenRecordAccount : undefined
  );
}

export async function fetchDigitalAssetWithAssociatedToken(
  context: Pick<Context, 'rpc' | 'serializer' | 'eddsa' | 'programs'>,
  mint: PublicKey,
  owner: PublicKey,
  options?: RpcGetAccountsOptions
): Promise<DigitalAssetWithToken> {
  const token = findAssociatedTokenPda(context, { mint, owner });
  return fetchDigitalAssetWithToken(context, mint, token, options);
}

export async function fetchAllDigitalAssetWithTokenByOwner(
  context: Pick<Context, 'rpc' | 'serializer' | 'eddsa' | 'programs'>,
  owner: PublicKey,
  options?: RpcBaseOptions & { mint?: PublicKey }
): Promise<DigitalAssetWithToken[]> {
  const tokens = await fetchTokensByOwner(context, owner, options);
  const nonEmptyTokens = tokens.filter((token) => token.amount > 0);
  const accountsToFetch = nonEmptyTokens.flatMap((token) => [
    token.mint,
    findMetadataPda(context, { mint: token.mint }),
    findMasterEditionPda(context, { mint: token.mint }),
    findTokenRecordPda(context, { mint: token.mint, token: token.publicKey }),
  ]);
  const accounts = await context.rpc.getAccounts(accountsToFetch, options);

  return zipMap(
    nonEmptyTokens,
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

      return [
        {
          ...deserializeDigitalAsset(
            context,
            mintAccount,
            metadataAccount,
            editionAccount.exists ? editionAccount : undefined
          ),
          token,
          tokenRecord: tokenRecordAccount.exists
            ? deserializeTokenRecord(context, tokenRecordAccount)
            : undefined,
        },
      ];
    }
  ).flat();
}

export function fetchAllDigitalAssetWithTokenByOwnerAndMint(
  context: Pick<Context, 'rpc' | 'serializer' | 'eddsa' | 'programs'>,
  owner: PublicKey,
  mint: PublicKey,
  options?: RpcBaseOptions
): Promise<DigitalAssetWithToken[]> {
  return fetchAllDigitalAssetWithTokenByOwner(context, owner, {
    ...options,
    mint,
  });
}

// export async function fetchDigitalAssetsWithTokenByMint(
//   context: Pick<Context, 'rpc' | 'serializer' | 'eddsa' | 'programs'>,
//   mint: PublicKey
// ): Promise<DigitalAssetWithToken[]> {
//   // TODO
// }

export function deserializeDigitalAssetWithToken(
  context: Pick<Context, 'serializer'>,
  mintAccount: RpcAccount,
  metadataAccount: RpcAccount,
  tokenAccount: RpcAccount,
  editionAccount?: RpcAccount,
  tokenRecordAccount?: RpcAccount
): DigitalAssetWithToken {
  return {
    ...deserializeDigitalAsset(
      context,
      mintAccount,
      metadataAccount,
      editionAccount
    ),
    token: deserializeToken(context, tokenAccount),
    tokenRecord: tokenRecordAccount
      ? deserializeTokenRecord(context, tokenRecordAccount)
      : undefined,
  };
}
