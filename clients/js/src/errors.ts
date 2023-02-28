import { UmiError } from '@metaplex-foundation/umi-core';

export class TokenMetadataError extends UmiError {
  readonly name: string = 'TokenMetadataError';

  constructor(message: string, cause?: Error) {
    super(message, 'plugin', 'Token Metadata', cause);
  }
}
