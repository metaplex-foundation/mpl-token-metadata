import { MetaplexPlugin } from '@lorisleiva/js-core';
import { mplEssentials } from '@lorisleiva/mpl-essentials';
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
