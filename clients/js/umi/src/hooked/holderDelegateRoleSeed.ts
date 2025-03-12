import {
  mapSerializer,
  Serializer,
  string,
} from '@metaplex-foundation/umi/serializers';
import { TokenMetadataError } from '../errors';
import { HolderDelegateRole } from '../generated/types/holderDelegateRole';

export type HolderDelegateRoleSeed = 'print_delegate';

export type HolderDelegateRoleSeedArgs =
  | HolderDelegateRoleSeed
  | HolderDelegateRole;

export function getHolderDelegateRoleSeedSerializer(): Serializer<
  HolderDelegateRoleSeedArgs,
  HolderDelegateRoleSeed
> {
  return mapSerializer(
    string({ size: 'variable' }),
    (args: HolderDelegateRoleSeedArgs): string => {
      if (typeof args === 'string') return args;
      switch (args) {
        case HolderDelegateRole.PrintDelegate:
          return 'print_delegate';
        default:
          throw new TokenMetadataError(
            `Invalid PrintDelegateRoleArgs ${args as never}`
          );
      }
    },
    (seed: string): HolderDelegateRoleSeed => seed as HolderDelegateRoleSeed
  );
}
