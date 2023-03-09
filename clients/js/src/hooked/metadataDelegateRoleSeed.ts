import { Context, mapSerializer, Serializer } from '@metaplex-foundation/umi';
import { TokenMetadataError } from '../errors';
import { MetadataDelegateRole } from '../generated/types/metadataDelegateRole';

export type MetadataDelegateRoleSeed =
  | 'authority_delegate'
  | 'collection_delegate'
  | 'use_delegate'
  | 'update_delegate'
  | 'programmable_config_delegate';

export type MetadataDelegateRoleSeedArgs =
  | MetadataDelegateRoleSeed
  | MetadataDelegateRole;

export function getMetadataDelegateRoleSeedSerializer(
  context: Pick<Context, 'serializer'>
): Serializer<MetadataDelegateRoleSeedArgs, MetadataDelegateRoleSeed> {
  const s = context.serializer;
  return mapSerializer(
    s.string({ size: 'variable' }),
    (args: MetadataDelegateRoleSeedArgs): string => {
      if (typeof args === 'string') return args;
      switch (args) {
        case MetadataDelegateRole.Authority:
          return 'authority_delegate';
        case MetadataDelegateRole.Collection:
          return 'collection_delegate';
        case MetadataDelegateRole.Use:
          return 'use_delegate';
        case MetadataDelegateRole.Update:
          return 'update_delegate';
        case MetadataDelegateRole.ProgrammableConfig:
          return 'programmable_config_delegate';
        default:
          throw new TokenMetadataError(
            `Invalid MetadataDelegateRoleArgs ${args as never}`
          );
      }
    },
    (seed: string): MetadataDelegateRoleSeed => seed as MetadataDelegateRoleSeed
  );
}
