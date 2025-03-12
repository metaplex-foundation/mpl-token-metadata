import { Context } from '@metaplex-foundation/umi';
import { TokenMetadataError } from './errors';

export type JsonMetadata = {
  name?: string;
  symbol?: string;
  description?: string;
  seller_fee_basis_points?: number;
  image?: string;
  animation_url?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type?: string;
    value?: string;
    [key: string]: unknown;
  }>;
  properties?: {
    creators?: Array<{
      address?: string;
      share?: number;
      [key: string]: unknown;
    }>;
    files?: Array<{
      type?: string;
      uri?: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  collection?: {
    name?: string;
    family?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export const fetchJsonMetadata = async (
  context: Pick<Context, 'downloader'>,
  uri: string
): Promise<JsonMetadata> => {
  try {
    return await context.downloader.downloadJson<JsonMetadata>(uri);
  } catch (error) {
    throw new TokenMetadataError(
      `Failed to fetch JSON metadata from ${uri}`,
      error
    );
  }
};
