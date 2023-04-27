import {
  ACCOUNT_HEADER_SIZE,
  Context,
  Option,
  Pda,
  PublicKey,
  Signer,
  none,
  publicKey,
  samePublicKey,
  some,
} from '@metaplex-foundation/umi';
import { getMintSize } from '@metaplex-foundation/mpl-essentials';
import { isNonFungible, isProgrammable } from '../digitalAsset';
import {
  CollectionDetailsArgs,
  CreatorArgs,
  PrintSupplyArgs,
  TokenStandard,
  collectionDetails,
  findMasterEditionPda,
  findTokenRecordPda,
  getMasterEditionSize,
  getMetadataSize,
  printSupply,
} from '../generated';

export const resolveCollectionDetails = (
  context: any,
  accounts: any,
  args: { isCollection: boolean },
  programId: any
): Option<CollectionDetailsArgs> =>
  args.isCollection ? some(collectionDetails('V1', { size: 0 })) : none();

export const resolveMasterEdition = (
  context: Pick<Context, 'eddsa' | 'serializer' | 'programs'>,
  accounts: { mint: PublicKey | Signer },
  args: { tokenStandard: TokenStandard },
  programId: PublicKey
): PublicKey | Pda =>
  isNonFungible(args.tokenStandard)
    ? findMasterEditionPda(context, { mint: publicKey(accounts.mint) })
    : programId;

export const resolveMasterEditionForProgrammables = (
  context: Pick<Context, 'eddsa' | 'serializer' | 'programs'>,
  accounts: { mint: PublicKey | Signer },
  args: { tokenStandard: TokenStandard },
  programId: PublicKey
): PublicKey | Pda =>
  isNonFungible(args.tokenStandard) && isProgrammable(args.tokenStandard)
    ? findMasterEditionPda(context, { mint: publicKey(accounts.mint) })
    : programId;

export const resolveDecimals = (
  context: any,
  accounts: any,
  args: { tokenStandard: TokenStandard },
  programId: any
): Option<number> => (isNonFungible(args.tokenStandard) ? none() : some(0));

export const resolvePrintSupply = (
  context: any,
  accounts: any,
  args: { tokenStandard: TokenStandard },
  programId: any
): Option<PrintSupplyArgs> =>
  isNonFungible(args.tokenStandard) ? some(printSupply('Zero')) : none();

export const resolveCreators = (
  context: any,
  accounts: { authority: Signer },
  args: any,
  programId: any
): Option<CreatorArgs[]> =>
  some([
    { address: publicKey(accounts.authority), share: 100, verified: true },
  ]);

export const resolveCreateV1Bytes = (
  context: any,
  accounts: any,
  args: { tokenStandard: TokenStandard },
  programId: any
): number => {
  const base = getMintSize() + getMetadataSize() + 2 * ACCOUNT_HEADER_SIZE;
  if (isNonFungible(args.tokenStandard)) {
    return base + getMasterEditionSize() + ACCOUNT_HEADER_SIZE;
  }
  return base;
};

export const resolveOptionalTokenOwner = (
  context: Pick<Context, 'identity'>,
  accounts: { token?: PublicKey },
  args: any,
  programId: PublicKey
): PublicKey => (accounts.token ? programId : context.identity.publicKey);

export const resolveTokenRecord = (
  context: Pick<Context, 'eddsa' | 'serializer' | 'programs'>,
  accounts: { mint: PublicKey | Signer; token?: PublicKey },
  args: { tokenStandard: TokenStandard },
  programId: PublicKey
): PublicKey | Pda =>
  isProgrammable(args.tokenStandard) && accounts.token
    ? findTokenRecordPda(context, {
        mint: publicKey(accounts.mint),
        token: accounts.token,
      })
    : programId;

export const resolveDestinationTokenRecord = (
  context: Pick<Context, 'eddsa' | 'serializer' | 'programs'>,
  accounts: { mint: PublicKey | Signer; destinationToken: PublicKey },
  args: { tokenStandard: TokenStandard },
  programId: PublicKey
): PublicKey | Pda =>
  isProgrammable(args.tokenStandard)
    ? findTokenRecordPda(context, {
        mint: publicKey(accounts.mint),
        token: accounts.destinationToken,
      })
    : programId;

export const resolveAuthorizationRulesProgram = (
  context: Pick<Context, 'programs'>,
  accounts: { authorizationRules?: PublicKey },
  args: any,
  programId: PublicKey
): PublicKey & { isWritable?: false } =>
  accounts.authorizationRules
    ? {
        ...context.programs.getPublicKey(
          'mplTokenAuthRules',
          'auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg'
        ),
        isWritable: false,
      }
    : programId;

export const resolveTokenProgramForNonProgrammables = (
  context: Pick<Context, 'programs'>,
  accounts: any,
  args: { tokenStandard: TokenStandard },
  programId: PublicKey
): PublicKey & { isWritable?: false } =>
  !isProgrammable(args.tokenStandard)
    ? {
        ...context.programs.getPublicKey(
          'splToken',
          'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        ),
        isWritable: false,
      }
    : programId;

export const resolveBurnMasterEdition = (
  context: Pick<Context, 'eddsa' | 'serializer' | 'programs'>,
  accounts: { masterEditionMint: PublicKey },
  args: any,
  programId: PublicKey
): PublicKey | Pda =>
  samePublicKey(accounts.masterEditionMint, programId)
    ? programId
    : findMasterEditionPda(context, {
        mint: publicKey(accounts.masterEditionMint),
      });
