#![allow(clippy::module_inception)]

use arrayref::array_ref;
use mpl_utils::{
    assert_signer,
    token::{
        get_mint_decimals, get_mint_supply, spl_token_burn, spl_token_close, TokenBurnParams,
        TokenCloseParams,
    },
};
use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, program_error::ProgramError,
    pubkey::Pubkey, system_program, sysvar,
};

use crate::{
    error::MetadataError,
    instruction::{Burn, BurnArgs, Context},
    pda::{find_metadata_account, EDITION, PREFIX},
    processor::burn::nonfungible::{burn_nonfungible, BurnNonFungibleArgs},
    state::{Edition, EditionMarker, Key, Metadata, TokenMetadataAccount, TokenStandard},
    utils::{
        assert_derivation, assert_owned_by, close_program_account, decrement_collection_size,
        is_master_edition, is_print_edition,
    },
};

mod burn;
mod burn_edition_nft;
mod burn_nft;
mod fungible;
mod nonfungible;
mod nonfungible_edition;

pub use burn::*;
pub use burn_edition_nft::*;
pub use burn_nft::*;
