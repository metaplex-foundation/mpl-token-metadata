import {
  assertAccountExists,
  Context,
  PublicKey,
  RpcAccount,
  unwrapSome,
} from '@lorisleiva/js-core';
import { deserializeMint, Mint } from '@lorisleiva/mpl-essentials';
import {
  deserializeEdition,
  deserializeMasterEdition,
  deserializeMetadata,
  Edition,
  findMasterEditionPda,
  findMetadataPda,
  getTokenMetadataKeySerializer,
  MasterEdition,
  Metadata,
  TokenMetadataKey,
  TokenStandard,
} from './generated';

export type DigitalAsset = {
  publicKey: PublicKey;
  mint: Mint;
  metadata: Metadata;
  edition?:
    | ({ isOriginal: true } & MasterEdition)
    | ({ isOriginal: false } & Edition);
};

export async function fetchDigitalAsset(
  context: Pick<Context, 'rpc' | 'serializer' | 'eddsa' | 'programs'>,
  mint: PublicKey
): Promise<DigitalAsset> {
  const metadata = findMetadataPda(context, { mint });
  const edition = findMasterEditionPda(context, { mint });
  const [mintAccount, metadataAccount, editionAccount] =
    await context.rpc.getAccounts([mint, metadata, edition]);
  assertAccountExists(mintAccount, 'Mint');
  assertAccountExists(metadataAccount, 'Metadata');
  return deserializeDigitalAsset(
    context,
    mintAccount,
    metadataAccount,
    editionAccount.exists ? editionAccount : undefined
  );
}

export function deserializeDigitalAsset(
  context: Pick<Context, 'serializer'>,
  mintAccount: RpcAccount,
  metadataAccount: RpcAccount,
  editionAccount?: RpcAccount
): DigitalAsset {
  const mint = deserializeMint(context, mintAccount);
  const metadata = deserializeMetadata(context, metadataAccount);
  const tokenStandard = unwrapSome(metadata.tokenStandard);
  if (tokenStandard && isNonFungible(tokenStandard) && !editionAccount) {
    // TODO(loris): Custom error.
    throw new Error(
      'Edition account must be provided for non-fungible assets.'
    );
  }

  const digitalAsset = { publicKey: mint.publicKey, mint, metadata };
  if (!editionAccount) return digitalAsset;

  const editionKey = getTokenMetadataKeySerializer(context).deserialize(
    editionAccount.data
  )[0];
  let edition: DigitalAsset['edition'];
  if (
    editionKey === TokenMetadataKey.MasterEditionV1 ||
    editionKey === TokenMetadataKey.MasterEditionV2
  ) {
    edition = {
      isOriginal: true,
      ...deserializeMasterEdition(context, editionAccount),
    };
  } else if (editionKey === TokenMetadataKey.EditionV1) {
    edition = {
      isOriginal: false,
      ...deserializeEdition(context, editionAccount),
    };
  } else {
    // TODO(loris): Custom error.
    throw new Error(`Invalid key "${editionKey}" for edition account.`);
  }

  return { ...digitalAsset, edition };
}

export const isFungible = (tokenStandard: TokenStandard): boolean =>
  tokenStandard === TokenStandard.Fungible ||
  tokenStandard === TokenStandard.FungibleAsset;

export const isNonFungible = (tokenStandard: TokenStandard): boolean =>
  !isFungible(tokenStandard);

export const isProgrammable = (tokenStandard: TokenStandard): boolean =>
  tokenStandard === TokenStandard.ProgrammableNonFungible;
