import {
  PublicKey,
  publicKey,
  WrappedInstruction,
} from '@metaplex-foundation/umi';
import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-essentials';
import { isFungible } from '../digitalAsset';
import { findMasterEditionPda, TokenStandard } from '../generated';
import {
  getMintV1InstructionDataSerializer,
  mintV1 as baseMintV1,
  MintV1InstructionAccounts,
  MintV1InstructionData,
  MintV1InstructionDataArgs,
} from '../generated/instructions/mintV1';

export {
  MintV1InstructionAccounts,
  MintV1InstructionData,
  MintV1InstructionDataArgs,
  getMintV1InstructionDataSerializer,
};

// Inputs.
export type MintV1InstructionInput = Omit<
  Parameters<typeof baseMintV1>[1],
  'token'
> & {
  /** @defaultValue Defaults to the associated token of the `tokenOwner` */
  token?: PublicKey;
  tokenStandard: TokenStandard;
};

export const mintV1 = (
  context: Parameters<typeof baseMintV1>[0],
  input: MintV1InstructionInput
): WrappedInstruction => {
  const defaultMasterEdition = isFungible(input.tokenStandard)
    ? undefined
    : findMasterEditionPda(context, { mint: publicKey(input.mint) });
  const defaultTokenOwner = input.token
    ? undefined
    : context.identity.publicKey;

  return baseMintV1(context, {
    masterEdition: input.masterEdition ?? defaultMasterEdition,
    ...input,
    tokenOwner: input.tokenOwner ?? defaultTokenOwner,
    token:
      input.token ??
      findAssociatedTokenPda(context, {
        mint: publicKey(input.mint),
        owner: publicKey(input.tokenOwner ?? (defaultTokenOwner as PublicKey)),
      }),
  });
};
