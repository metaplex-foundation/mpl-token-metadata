use num_derive::FromPrimitive;
use solana_program::{
    decode_error::DecodeError,
    msg,
    program_error::{PrintProgramError, ProgramError},
};
use thiserror::Error;

#[derive(Error, Clone, Debug, Eq, PartialEq, FromPrimitive)]
pub enum TokenExtrasError {
    #[error("Invalid System Program")]
    InvalidSystemProgram,

    #[error("Invalid Token Program")]
    InvalidTokenProgram,

    #[error("Invalid Associated Token Program")]
    InvalidAssociatedTokenProgram,

    #[error("Invalid Associated Token Account: it should derive from the provided mint and owner")]
    InvalidAssociatedTokenAccount,

    #[error("Invalid Program Owner")]
    InvalidProgramOwner,

    #[error("Invalid Token Mint: it should be the same as the provided mint account")]
    InvalidTokenMint,

    #[error("Invalid Program Owner: it should be the same as the provided owner account")]
    InvalidTokenOwner,

    #[error(
        "Cannot create non-associated token accounts as they would need to sign the transaction. Please provide an associated token account instead"
    )]
    CannotCreateNonAssociatedToken,
}

impl PrintProgramError for TokenExtrasError {
    fn print<E>(&self) {
        msg!(&self.to_string());
    }
}

impl From<TokenExtrasError> for ProgramError {
    fn from(e: TokenExtrasError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl<T> DecodeError<T> for TokenExtrasError {
    fn type_of() -> &'static str {
        "Create With Rent Error"
    }
}
