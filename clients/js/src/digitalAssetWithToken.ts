import { Token } from '@lorisleiva/mpl-essentials';
import { DigitalAsset } from './digitalAsset';
import { TokenRecord } from './generated';

export type DigitalAssetWithToken = DigitalAsset & {
  token: Token;
  tokenRecord?: TokenRecord;
};
