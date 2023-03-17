import { UmiPlugin } from '@metaplex-foundation/umi';
import { mplEssentials } from '@metaplex-foundation/mpl-essentials';
import { createMplTokenMetadataProgram } from './generated';

export const mplTokenMetadata = (): UmiPlugin => ({
  install(umi) {
    umi.use(mplEssentials());
    umi.programs.add(createMplTokenMetadataProgram(), false);
  },
});
