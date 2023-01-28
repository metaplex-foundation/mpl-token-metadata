import { Option, some, WrappedInstruction } from '@lorisleiva/js-core';
import { createV1, Creator } from '../generated';

// Inputs.
export type CreateHelperArgs = Omit<
  Parameters<typeof createV1>[1],
  'creators'
> & { creators?: Option<Array<Creator>> };

export const createHelper = (
  context: Parameters<typeof createV1>[0],
  input: CreateHelperArgs
): WrappedInstruction =>
  createV1(context, {
    ...input,
    creators:
      input.creators ??
      some([
        {
          address: input.updateAuthority ?? context.identity.publicKey,
          share: 100,
          verified: true,
        },
      ]),
  });
