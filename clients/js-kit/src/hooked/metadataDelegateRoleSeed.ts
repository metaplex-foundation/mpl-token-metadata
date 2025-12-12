/**
 * Custom serializer for MetadataDelegateRole when used as a PDA seed
 *
 * The Rust program converts MetadataDelegateRole to specific strings for PDA derivation.
 * This serializer ensures the TypeScript client matches the Rust program's behavior.
 */

import { getUtf8Encoder, transformEncoder, type Encoder } from '@solana/kit';
import { MetadataDelegateRole } from '../generated/types/metadataDelegateRole';

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

/**
 * Converts MetadataDelegateRole enum to the string used in PDA seeds
 *
 * This matches the Rust program's to_string() implementation for MetadataDelegateRole
 */
function metadataDelegateRoleToSeedString(role: MetadataDelegateRoleSeedArgs): string {
  if (typeof role === 'string') return role;

  switch (role) {
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
      throw new Error(`Invalid MetadataDelegateRole: ${role}`);
  }
}

/**
 * Encoder for MetadataDelegateRole when used as a PDA seed
 *
 * Returns an encoder that converts the role to its string representation
 * and encodes it as UTF-8 bytes for use in PDA derivation
 */
export function getMetadataDelegateRoleSeedEncoder(): Encoder<MetadataDelegateRoleSeedArgs> {
  return transformEncoder(
    getUtf8Encoder(),
    (role: MetadataDelegateRoleSeedArgs): string => metadataDelegateRoleToSeedString(role)
  );
}
