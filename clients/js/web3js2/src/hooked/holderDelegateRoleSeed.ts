import {
  getUtf8Encoder,
  transformEncoder,
  type Encoder
} from '@solana/kit';
import { HolderDelegateRole } from '../generated/types/holderDelegateRole';

// Define TokenMetadataError since it's missing
class TokenMetadataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenMetadataError';
  }
}

export type HolderDelegateRoleSeed = 'print_delegate';

export type HolderDelegateRoleSeedArgs =
  | HolderDelegateRoleSeed
  | HolderDelegateRole;

export function getHolderDelegateRoleSeedSerializer(): Encoder<HolderDelegateRoleSeedArgs> {
  return transformEncoder(
    getUtf8Encoder(),
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
    }
  );
}
