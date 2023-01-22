/* eslint-disable import/no-extraneous-dependencies */
import { createMetaplex as baseCreateMetaplex } from '@lorisleiva/js-test';
import { mplDigitalAsset } from '../src';

export const createMetaplex = async () =>
  (await baseCreateMetaplex()).use(mplDigitalAsset());
