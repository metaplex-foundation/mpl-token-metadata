import { MetaplexPlugin } from '@lorisleiva/js-core';
import {
  getMplSystemExtrasProgram,
  getMplTokenExtrasProgram,
  getSplAssociatedTokenProgram,
  getSplMemoProgram,
  getSplSystemProgram,
  getSplTokenProgram,
} from './generated';

export const mplEssentials = (): MetaplexPlugin => ({
  install(metaplex) {
    metaplex.programs.add(getSplSystemProgram(), false);
    metaplex.programs.add(getSplMemoProgram(), false);
    metaplex.programs.add(getSplTokenProgram(), false);
    metaplex.programs.add(getSplAssociatedTokenProgram(), false);
    metaplex.programs.add(getMplSystemExtrasProgram(), false);
    metaplex.programs.add(getMplTokenExtrasProgram(), false);
  },
});
