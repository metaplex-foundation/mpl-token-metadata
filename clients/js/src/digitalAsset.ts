import {
  deserializeMint,
  fetchAllMintPublicKeyByOwner,
  FetchTokenAmountFilter,
  FetchTokenStrategy,
  Mint,
} from '@metaplex-foundation/mpl-toolbox';
import {
  assertAccountExists,
  chunk,
  Context,
  Pda,
  PublicKey,
  RpcAccount,
  RpcGetAccountsOptions,
  unwrapOption,
} from '@metaplex-foundation/umi';
import { TokenMetadataError } from './errors';
import {
  deserializeEdition,
  deserializeMasterEdition,
  deserializeMetadata,
  Edition,
  fetchMetadata,
  findMasterEditionPda,
  findMetadataPda,
  getKeySerializer,
  getMetadataGpaBuilder,
  Key,
  MasterEdition,
  Metadata,
  TokenStandard,
} from './generated';

const CREATORS_OFFSET = 326;
const MAX_CREATOR_SIZE = 34;
const COLLECTION_OFFSETS = [366, 400, 434, 468, 502];
const VERIFIED_COLLECTION_OFFSET = 1;
const COLLECTION_ADDRESS_OFFSET = 2;

export type DigitalAsset = {
  publicKey: PublicKey;
  mint: Mint;
  metadata: Metadata;
  edition?:
    | ({ isOriginal: true } & MasterEdition)
    | ({ isOriginal: false } & Edition);
};

export async function fetchDigitalAsset(
  context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>,
  mint: PublicKey,
  options?: RpcGetAccountsOptions
): Promise<DigitalAsset> {
  const [metadata] = findMetadataPda(context, { mint });
  const [edition] = findMasterEditionPda(context, { mint });
  const [mintAccount, metadataAccount, editionAccount] =
    await context.rpc.getAccounts([mint, metadata, edition], options);
  assertAccountExists(mintAccount, 'Mint');
  assertAccountExists(metadataAccount, 'Metadata');
  return deserializeDigitalAsset(
    mintAccount,
    metadataAccount,
    editionAccount.exists ? editionAccount : undefined
  );
}

export async function fetchDigitalAssetByMetadata(
  context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>,
  metadata: PublicKey | Pda,
  options?: RpcGetAccountsOptions
): Promise<DigitalAsset> {
  const metadataAccount = await fetchMetadata(context, metadata, options);
  return fetchDigitalAsset(context, metadataAccount.mint, options);
}

export async function fetchAllDigitalAsset(
  context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>,
  mints: PublicKey[],
  options?: RpcGetAccountsOptions
): Promise<DigitalAsset[]> {
  const accountsToFetch = mints.flatMap((mint) => [
    mint,
    findMetadataPda(context, { mint })[0],
    findMasterEditionPda(context, { mint })[0],
  ]);

  const accounts = await context.rpc.getAccounts(accountsToFetch, options);
  return chunk(accounts, 3).flatMap(
    ([mintAccount, metadataAccount, editionAccount]) => {
      try {
        assertAccountExists(mintAccount, 'Mint');
        assertAccountExists(metadataAccount, 'Metadata');
        return [
          deserializeDigitalAsset(
            mintAccount,
            metadataAccount,
            editionAccount.exists ? editionAccount : undefined
          ),
        ];
      } catch (e) {
        return [];
      }
    }
  );
}

export async function fetchAllDigitalAssetByCreator(
  context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>,
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

/**
 * Fetches all digital assets from a verified collection. This does not work on older nfts that do not have a tokenStandard set.
 */
export async function fetchAllDigitalAssetByVerifiedCollection(
  context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>,
  collectionAddress: PublicKey,
  options?: RpcGetAccountsOptions
): Promise<DigitalAsset[]> {
  const mints = await Promise.all(
    COLLECTION_OFFSETS.map(async (offset) =>
      getMetadataGpaBuilder(context)
        .where(offset, 1)
        .where(offset + VERIFIED_COLLECTION_OFFSET, 1)
        .where(offset + COLLECTION_ADDRESS_OFFSET, collectionAddress)
        .sliceField('mint')
        .getDataAsPublicKeys()
    )
  );

  return fetchAllDigitalAsset(context, mints.flat(), options);
}

export async function fetchAllDigitalAssetByUpdateAuthority(
  context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>,
  updateAuthority: PublicKey,
  options?: RpcGetAccountsOptions
): Promise<DigitalAsset[]> {
  const mints = await getMetadataGpaBuilder(context)
    .whereField('updateAuthority', updateAuthority)
    .sliceField('mint')
    .getDataAsPublicKeys();
  return fetchAllDigitalAsset(context, mints, options);
}

export async function fetchAllDigitalAssetByOwner(
  context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>,
  owner: PublicKey,
  options?: RpcGetAccountsOptions & {
    tokenStrategy?: FetchTokenStrategy;
    tokenAmountFilter?: FetchTokenAmountFilter;
  }
): Promise<DigitalAsset[]> {
  const mints = await fetchAllMintPublicKeyByOwner(context, owner, options);
  return fetchAllDigitalAsset(context, mints, options);
}

export async function fetchAllMetadataByOwner(
  context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>,
  owner: PublicKey,
  options?: RpcGetAccountsOptions & {
    tokenStrategy?: FetchTokenStrategy;
    tokenAmountFilter?: FetchTokenAmountFilter;
  }
): Promise<Metadata[]> {
  const mints = await fetchAllMintPublicKeyByOwner(context, owner, options);
  const publicKeys = mints.map((mint) => findMetadataPda(context, { mint })[0]);
  const maybeAccounts = await context.rpc.getAccounts(publicKeys, options);
  return maybeAccounts.flatMap((maybeAccount) => {
    try {
      assertAccountExists(maybeAccount, 'Metadata');
      return [deserializeMetadata(maybeAccount)];
    } catch (e) {
      return [];
    }
  });
}

export function deserializeDigitalAsset(
  mintAccount: RpcAccount,
  metadataAccount: RpcAccount,
  editionAccount?: RpcAccount
): DigitalAsset {
  const mint = deserializeMint(mintAccount);
  const metadata = deserializeMetadata(metadataAccount);
  const tokenStandard = unwrapOption(metadata.tokenStandard);
  if (tokenStandard && isNonFungible(tokenStandard) && !editionAccount) {
    // TODO(loris): Custom error.
    throw new Error(
      'Edition account must be provided for non-fungible assets.'
    );
  }

  const digitalAsset = { publicKey: mint.publicKey, mint, metadata };
  if (!editionAccount) return digitalAsset;

  const editionKey = getKeySerializer().deserialize(editionAccount.data)[0];
  let edition: DigitalAsset['edition'];
  if (
    editionKey === Key.MasterEditionV1 ||
    editionKey === Key.MasterEditionV2
  ) {
    edition = {
      isOriginal: true,
      ...deserializeMasterEdition(editionAccount),
    };
  } else if (editionKey === Key.EditionV1) {
    edition = {
      isOriginal: false,
      ...deserializeEdition(editionAccount),
    };
  } else {
    throw new TokenMetadataError(
      `Invalid key "${editionKey}" for edition account.`
    );
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
