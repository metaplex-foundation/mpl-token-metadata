// Type-checked with `moduleResolution: node16` and no `paths` alias, so the
// package resolves through the `require` condition to dist/types/index.d.ts.
import type { Pda, UmiPlugin } from '@metaplex-foundation/umi';
import {
  findMetadataPda,
  getEditionSize,
  mplTokenMetadata,
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata';

// Fails to compile if a type resolved to `any`, e.g. through a broken umi
// or mpl-toolbox import inside the declarations.
type IsAny<T> = 0 extends 1 & T ? true : false;
type NotAny<T> = IsAny<T> extends true ? never : T;

export const plugin: NotAny<UmiPlugin> = mplTokenMetadata();
export const metadata: NotAny<Pda> = findMetadataPda(
  {} as Parameters<typeof findMetadataPda>[0],
  {} as Parameters<typeof findMetadataPda>[1]
);
export const editionSize: NotAny<number> = getEditionSize();
export const standard: NotAny<TokenStandard> = TokenStandard.NonFungible;
export const pluginIsTyped: IsAny<ReturnType<typeof mplTokenMetadata>> = false;
export const pdaIsTyped: IsAny<ReturnType<typeof findMetadataPda>> = false;
