import { PublicKey } from '@lorisleiva/js-core';
import { Mint, Token } from '@lorisleiva/mpl-essentials';
import { Edition, MasterEdition, Metadata, TokenRecord } from './generated';

export type DigitalAsset = {
  publicKey: PublicKey;
  mint: Mint;
  metadata: Metadata;
  edition?:
    | ({ isOriginal: true } & MasterEdition)
    | ({ isOriginal: false } & Edition);
};

export type DigitalAssetWithToken = DigitalAsset & {
  token: Token;
  tokenRecord?: TokenRecord;
};

// export async function fetchDigitalAsset(
//   context: Pick<Context, 'rpc' | 'serializer'>,
//   publicKey: PublicKey
// ): Promise<DigitalAsset> {
//   const maybeAccount = await context.rpc.getAccount(publicKey);
//   assertAccountExists(maybeAccount, 'DigitalAsset');
//   return deserializeDigitalAsset(context, maybeAccount);
// }

// export async function safeFetchDigitalAsset(
//   context: Pick<Context, 'rpc' | 'serializer'>,
//   publicKey: PublicKey
// ): Promise<DigitalAsset | null> {
//   const maybeAccount = await context.rpc.getAccount(publicKey);
//   return maybeAccount.exists
//     ? deserializeDigitalAsset(context, maybeAccount)
//     : null;
// }

// export function deserializeDigitalAsset(
//   context: Pick<Context, 'serializer'>,
//   rawAccount: RpcAccount
// ): DigitalAsset {
//   return deserializeAccount(
//     rawAccount,
//     getDigitalAssetAccountDataSerializer(context)
//   );
// }
