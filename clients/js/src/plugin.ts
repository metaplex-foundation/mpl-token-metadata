import { MetaplexPlugin } from '@metaplex-foundation/umi-core';
import { mplEssentials } from '@metaplex-foundation/mpl-essentials';
import {
  getMplTokenAuthRulesProgram,
  getMplTokenMetadataProgram,
} from './generated';

export const mplDigitalAsset = (): MetaplexPlugin => ({
  install(metaplex) {
    metaplex.use(mplEssentials());
    metaplex.programs.add(getMplTokenAuthRulesProgram(), false);
    metaplex.programs.add(getMplTokenMetadataProgram(), false);
  },
});
