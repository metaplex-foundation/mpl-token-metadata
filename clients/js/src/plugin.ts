import { MetaplexPlugin } from '@lorisleiva/js-core';
import { getMplTokenMetadataProgram } from './generated';

export const mplDigitalAsset = (): MetaplexPlugin => ({
  install(metaplex) {
    metaplex.programs.add(getMplTokenMetadataProgram(), false);
  },
});
