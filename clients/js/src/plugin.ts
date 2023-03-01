import { UmiPlugin } from '@metaplex-foundation/umi';
import { mplEssentials } from '@metaplex-foundation/mpl-essentials';
import { getMplTokenMetadataProgram } from './generated';

export const mplDigitalAsset = (): UmiPlugin => ({
  install(umi) {
    umi.use(mplEssentials());
    umi.programs.add(getMplTokenMetadataProgram(), false);
  },
});
