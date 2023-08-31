import { getMintSize } from '@metaplex-foundation/mpl-toolbox';
import {
  ACCOUNT_HEADER_SIZE,
  Context,
  Option,
  Pda,
  PublicKey,
  Signer,
  none,
  publicKey,
  some,
} from '@metaplex-foundation/umi';
import { isNonFungible, isProgrammable } from '../digitalAsset';
import {
  CollectionDetailsArgs,
  CreatorArgs,
  PrintSupplyArgs,
  TokenStandard,
  WithWritable,
  collectionDetails,
  findEditionMarkerV2Pda,
  findMasterEditionPda,
  findTokenRecordPda,
  printSupply,
} from '../generated';
import { findEditionMarkerFromEditionNumberPda } from './editionMarker';

const METADATA_SIZE: number = 679;

const MASTER_EDITION_SIZE: number = 282;

export const resolveCollectionDetails = (
  context: any,
  accounts: any,
  args: { isCollection: boolean },
  programId: any,
  isWritable: boolean
): Option<CollectionDetailsArgs> =>
  args.isCollection ? some(collectionDetails('V1', { size: 0 })) : none();

export const resolveMasterEdition = (
  context: Pick<Context, 'eddsa' | 'programs'>,
  accounts: { mint: WithWritable<PublicKey | Pda | Signer> },
  args: { tokenStandard: TokenStandard },
  programId: PublicKey,
  isWritable: boolean
): WithWritable<PublicKey | Pda> =>
  isNonFungible(args.tokenStandard)
    ? [
        findMasterEditionPda(context, { mint: publicKey(accounts.mint[0]) }),
        isWritable,
      ]
    : [programId, false];

export const resolveMasterEditionForProgrammables = (
  context: Pick<Context, 'eddsa' | 'programs'>,
  accounts: { mint: WithWritable<PublicKey | Pda | Signer> },
  args: { tokenStandard: TokenStandard },
  programId: PublicKey,
  isWritable: boolean
): WithWritable<PublicKey | Pda> =>
  isNonFungible(args.tokenStandard) && isProgrammable(args.tokenStandard)
    ? [
        findMasterEditionPda(context, { mint: publicKey(accounts.mint[0]) }),
        isWritable,
      ]
    : [programId, false];

export const resolveDecimals = (
  context: any,
  accounts: any,
  args: { tokenStandard: TokenStandard },
  programId: any,
  isWritable: boolean
): Option<number> => (isNonFungible(args.tokenStandard) ? none() : some(0));

export const resolvePrintSupply = (
  context: any,
  accounts: any,
  args: { tokenStandard: TokenStandard },
  programId: any,
  isWritable: boolean
): Option<PrintSupplyArgs> =>
  isNonFungible(args.tokenStandard) ? some(printSupply('Zero')) : none();

export const resolveCreators = (
  context: any,
  accounts: { authority: WithWritable<Signer> },
  args: any,
  programId: any,
  isWritable: boolean
): Option<CreatorArgs[]> =>
  some([
    {
      address: publicKey(accounts.authority[0], false),
      share: 100,
      verified: true,
    },
  ]);

export const resolveCreateV1Bytes = (
  context: any,
  accounts: any,
  args: { tokenStandard: TokenStandard },
  programId: any,
  isWritable?: boolean
): number => {
  const base = getMintSize() + METADATA_SIZE + 2 * ACCOUNT_HEADER_SIZE;
  if (isNonFungible(args.tokenStandard)) {
    return base + MASTER_EDITION_SIZE + ACCOUNT_HEADER_SIZE;
  }
  return base;
};

export const resolveOptionalTokenOwner = (
  context: Pick<Context, 'identity'>,
  accounts: { token?: PublicKey | Pda | undefined },
  args: any,
  programId: PublicKey,
  isWritable: boolean
): WithWritable<PublicKey> =>
  accounts.token
    ? [programId, false]
    : [context.identity.publicKey, isWritable];

export const resolveBurnMasterEdition = (
  context: Pick<Context, 'eddsa' | 'programs'>,
  accounts: { masterEditionMint: WithWritable<PublicKey | Pda> },
  args: any,
  programId: PublicKey,
  isWritable: boolean
): WithWritable<PublicKey | Pda> =>
  accounts.masterEditionMint[0] === programId
    ? [programId, false]
    : [
        findMasterEditionPda(context, {
          mint: publicKey(accounts.masterEditionMint[0]),
        }),
        false,
      ];
