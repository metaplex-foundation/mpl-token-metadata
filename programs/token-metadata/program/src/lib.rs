//! A Token Metadata program for the Solana blockchain.
//!
//! The program attach additional data to Fungible or Non-Fungible Tokens on Solana.

use bs58;

pub mod assertions;

pub mod escrow {
    pub use crate::{instruction::escrow::*, processor::escrow::*};
}

#[cfg(not(feature = "no-entrypoint"))]
pub mod entrypoint;
pub mod error;
pub mod instruction;
pub mod pda;
pub mod processor;
pub mod state;
pub mod utils;

pub use arch_program;

use arch_program::pubkey::Pubkey;
static META_ID: [u8; 32] = [
    183, 219, 88, 147, 103, 148, 135, 91, 24, 142, 57, 4, 229, 29, 250, 219, 67, 113, 135, 228,
    131, 121, 208, 224, 13, 126, 199, 41, 114, 216, 141, 148,
];

pub fn id() -> Pubkey {
    Pubkey::from_slice(&META_ID)
}

pub fn pubkey(address: &str) -> Pubkey {
    let decoded = bs58::decode(address).into_vec().unwrap();
    Pubkey::from_slice(&decoded)
}
