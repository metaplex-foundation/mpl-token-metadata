import { transformEncoder, type Encoder } from '@solana/kit';
import { getUtf8Encoder } from '@solana/codecs-strings';
import { HolderDelegateRole } from '../generated/types';

export type HolderDelegateRoleSeed = 'print_delegate';

export type HolderDelegateRoleSeedArgs =
  | HolderDelegateRoleSeed
  | HolderDelegateRole;

export function getHolderDelegateRoleSeedEncoder(): Encoder<HolderDelegateRoleSeedArgs> {
  return transformEncoder(
    getUtf8Encoder(),
    (role: HolderDelegateRoleSeedArgs): string => holderDelegateRoleToSeedString(role)
  );
}

function holderDelegateRoleToSeedString(role: HolderDelegateRoleSeedArgs): string {
  if (typeof role === 'string') return role;
  switch (role) {
    case HolderDelegateRole.PrintDelegate:
      return 'print_delegate';
    default:
      throw new Error(`Invalid HolderDelegateRoleArgs: ${role as never}`);
  }
}
