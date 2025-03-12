import {
  getUtf8Encoder,
  transformEncoder,
  type Encoder
} from '@solana/kit';
import { MetadataDelegateRole } from '../generated/types/metadataDelegateRole';

// Define TokenMetadataError since it's missing
class TokenMetadataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenMetadataError';
  }
}

export type MetadataDelegateRoleSeed =
  | 'authority_item_delegate'
  | 'collection_delegate'
  | 'use_delegate'
  | 'data_delegate'
  | 'programmable_config_delegate'
  | 'data_item_delegate'
  | 'collection_item_delegate'
  | 'prog_config_item_delegate';

export type MetadataDelegateRoleSeedArgs =
  | MetadataDelegateRoleSeed
  | MetadataDelegateRole;

export function getMetadataDelegateRoleSeedSerializer(): Encoder<MetadataDelegateRoleSeedArgs> {
  return transformEncoder(
    getUtf8Encoder(),
    (args: MetadataDelegateRoleSeedArgs): string => {
      if (typeof args === 'string') return args;
      switch (args) {
        case MetadataDelegateRole.AuthorityItem:
          return 'authority_item_delegate';
        case MetadataDelegateRole.Collection:
          return 'collection_delegate';
        case MetadataDelegateRole.Use:
          return 'use_delegate';
        case MetadataDelegateRole.Data:
          return 'data_delegate';
        case MetadataDelegateRole.ProgrammableConfig:
          return 'programmable_config_delegate';
        case MetadataDelegateRole.DataItem:
          return 'data_item_delegate';
        case MetadataDelegateRole.CollectionItem:
          return 'collection_item_delegate';
        case MetadataDelegateRole.ProgrammableConfigItem:
          return 'prog_config_item_delegate';
        default:
          throw new TokenMetadataError(
            `Invalid MetadataDelegateRoleArgs ${args as never}`
          );
      }
    }
  );
}
