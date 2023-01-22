import { MetaplexPlugin } from '@lorisleiva/js-core';
import {
  getMplTokenAuthRulesProgram,
  getMplTokenMetadataProgram,
} from './generated';

export const mplDigitalAsset = (): MetaplexPlugin => ({
  install(metaplex) {
    metaplex.programs.add(getMplTokenAuthRulesProgram(), false);
    metaplex.programs.add(getMplTokenMetadataProgram(), false);
  },
});
