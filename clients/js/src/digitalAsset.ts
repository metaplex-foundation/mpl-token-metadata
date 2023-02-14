import {
  assertAccountExists,
  chunk,
  Context,
  PublicKey,
  RpcAccount,
  RpcGetAccountsOptions,
  unwrapSome,
} from '@metaplex-foundation/umi-core';
import { deserializeMint, Mint } from '@metaplex-foundation/mpl-essentials';
import {
  deserializeEdition,
  deserializeMasterEdition,
  deserializeMetadata,
  Edition,
  fetchMetadata,
  findMasterEditionPda,
  findMetadataPda,
  getMetadataGpaBuilder,
  getTokenMetadataKeySerializer,
  MasterEdition,
  Metadata,
  TokenMetadataKey,
  TokenStandard,
} from './generated';

const CREATORS_OFFSET = 326;
const MAX_CREATOR_SIZE = 34;

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
  mint: PublicKey,
  options?: RpcGetAccountsOptions
): Promise<DigitalAsset> {
  const metadata = findMetadataPda(context, { mint });
  const edition = findMasterEditionPda(context, { mint });
  const [mintAccount, metadataAccount, editionAccount] =
    await context.rpc.getAccounts([mint, metadata, edition], options);
  assertAccountExists(mintAccount, 'Mint');
  assertAccountExists(metadataAccount, 'Metadata');
  return deserializeDigitalAsset(
    context,
    mintAccount,
    metadataAccount,
    editionAccount.exists ? editionAccount : undefined
  );
}

export async function fetchDigitalAssetByMetadata(
  context: Pick<Context, 'rpc' | 'serializer' | 'eddsa' | 'programs'>,
  metadata: PublicKey,
  options?: RpcGetAccountsOptions
): Promise<DigitalAsset> {
  const metadataAccount = await fetchMetadata(context, metadata, options);
  return fetchDigitalAsset(context, metadataAccount.mint, options);
}

export async function fetchAllDigitalAsset(
  context: Pick<Context, 'rpc' | 'serializer' | 'eddsa' | 'programs'>,
  mints: PublicKey[],
  options?: RpcGetAccountsOptions
): Promise<DigitalAsset[]> {
  const accountsToFetch = mints.flatMap((mint) => [
    mint,
    findMetadataPda(context, { mint }),
    findMasterEditionPda(context, { mint }),
  ]);

  const accounts = await context.rpc.getAccounts(accountsToFetch, options);
  return chunk(accounts, 3).map(
    ([mintAccount, metadataAccount, editionAccount]) => {
      assertAccountExists(mintAccount, 'Mint');
      assertAccountExists(metadataAccount, 'Metadata');
      return deserializeDigitalAsset(
        context,
        mintAccount,
        metadataAccount,
        editionAccount.exists ? editionAccount : undefined
      );
    }
  );
}

export async function fetchAllDigitalAssetByCreator(
  context: Pick<Context, 'rpc' | 'serializer' | 'eddsa' | 'programs'>,
  creator: PublicKey,
  options?: RpcGetAccountsOptions & { position?: number }
): Promise<DigitalAsset[]> {
  const creatorIndex = (options?.position ?? 1) - 1;
  const mints = await getMetadataGpaBuilder(context)
    .where(CREATORS_OFFSET + creatorIndex * MAX_CREATOR_SIZE, creator)
    .sliceField('mint')
    .getDataAsPublicKeys();
  return fetchAllDigitalAsset(context, mints, options);
}

export async function fetchAllDigitalAssetByUpdateAuthority(
  context: Pick<Context, 'rpc' | 'serializer' | 'eddsa' | 'programs'>,
  updateAuthority: PublicKey,
  options?: RpcGetAccountsOptions
): Promise<DigitalAsset[]> {
  const mints = await getMetadataGpaBuilder(context)
    .whereField('updateAuthority', updateAuthority)
    .sliceField('mint')
    .getDataAsPublicKeys();
  return fetchAllDigitalAsset(context, mints, options);
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
