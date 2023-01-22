import {
  Context,
  Option,
  PublicKey,
  Signer,
  some,
  WrappedInstruction,
} from '@lorisleiva/js-core';
import {
  createAccountWithRent,
  getMintSize,
  initializeMint2,
} from './generated';

// Inputs.
export type CreateMintArgs = {
  mint: Signer;
  decimals?: number;
  mintAuthority?: PublicKey;
  freezeAuthority?: Option<PublicKey>;
};

// Instruction.
export function createMint(
  context: Pick<Context, 'serializer' | 'programs' | 'identity' | 'payer'>,
  input: CreateMintArgs
): WrappedInstruction[] {
  return [
    createAccountWithRent(context, {
      newAccount: input.mint,
      space: getMintSize(),
      programId: context.programs.get('splToken').publicKey,
    }),
    initializeMint2(context, {
      mint: input.mint.publicKey,
      decimals: input.decimals ?? 0,
      mintAuthority: input.mintAuthority ?? context.identity.publicKey,
      freezeAuthority:
        input.freezeAuthority === undefined
          ? some(context.identity.publicKey)
          : input.freezeAuthority,
    }),
  ];
}
