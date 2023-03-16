import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-essentials';
import {
  PublicKey,
  publicKey,
  TransactionBuilder,
} from '@metaplex-foundation/umi';
import { isFungible, isProgrammable } from '../digitalAsset';
import {
  findMasterEditionPda,
  findTokenRecordPda,
  TokenStandard,
} from '../generated';
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
): TransactionBuilder => {
  const defaultMasterEdition = isFungible(input.tokenStandard)
    ? undefined
    : findMasterEditionPda(context, { mint: publicKey(input.mint) });
  const masterEdition = input.masterEdition ?? defaultMasterEdition;
  const defaultTokenOwner = input.token
    ? undefined
    : context.identity.publicKey;
  const tokenOwner = input.tokenOwner ?? defaultTokenOwner;
  const token =
    input.token ??
    findAssociatedTokenPda(context, {
      mint: publicKey(input.mint),
      owner: publicKey(input.tokenOwner ?? (defaultTokenOwner as PublicKey)),
    });
  const defaultTokenRecord = isProgrammable(input.tokenStandard)
    ? findTokenRecordPda(context, { mint: publicKey(input.mint), token })
    : undefined;
  const tokenRecord = input.tokenRecord ?? defaultTokenRecord;

  return baseMintV1(context, {
    ...input,
    masterEdition,
    tokenOwner,
    token,
    tokenRecord,
  });
};
