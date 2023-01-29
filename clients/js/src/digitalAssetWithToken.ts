import {
  assertAccountExists,
  Context,
  PublicKey,
  RpcAccount,
} from '@lorisleiva/js-core';
import {
  deserializeToken,
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
  token: PublicKey
): Promise<DigitalAsset> {
  const [
    mintAccount,
    metadataAccount,
    editionAccount,
    tokenAccount,
    tokenRecordAccount,
  ] = await context.rpc.getAccounts([
    mint,
    findMetadataPda(context, { mint }),
    findMasterEditionPda(context, { mint }),
    token,
    findTokenRecordPda(context, { mint, token }),
  ]);
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
  owner: PublicKey
): Promise<DigitalAsset> {
  const token = findAssociatedTokenPda(context, { mint, owner });
  return fetchDigitalAssetWithToken(context, mint, token);
}

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
