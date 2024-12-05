use mpl_utils::{assert_signer, close_account_raw, token::SPL_TOKEN_PROGRAM_IDS};
use solana_program::{program_option::COption, program_pack::Pack, system_program};
use spl_token_2022::state::Mint;

use crate::{
    assertions::assert_owner_in,
    instruction::CloseAccounts,
    state::{EDITION, OWNERLESS_CLOSE_AUTHORITY, OWNERLESS_CLOSE_DESTINATION, PREFIX},
    utils::{assert_derivation, assert_owned_by},
};

use super::*;

pub(crate) fn process_close_accounts<'a>(
    _program_id: &'a Pubkey,
    accounts: &'a [AccountInfo<'a>],
) -> ProgramResult {
    let ctx = CloseAccounts::to_context(accounts)?;

    // Assert program ownership.
    assert_owned_by(ctx.accounts.metadata_info, &crate::ID)?;
    let mint_closed = ctx.accounts.mint_info.data_is_empty()
        && ctx.accounts.mint_info.owner == &system_program::ID;

    // If the mint is not closed then we want to check that it's owned by an SPL Token program.
    if !mint_closed {
        assert_owner_in(ctx.accounts.mint_info, &SPL_TOKEN_PROGRAM_IDS)?;
    }

    // Assert the correct authority is set and is a signer.
    assert_signer(ctx.accounts.authority_info)?;
    if *ctx.accounts.authority_info.key != OWNERLESS_CLOSE_AUTHORITY {
        return Err(MetadataError::InvalidCloseAuthority.into());
    }

    // Assert the correct destination is set.
    if *ctx.accounts.destination_info.key != OWNERLESS_CLOSE_DESTINATION {
        return Err(MetadataError::InvalidFeeAccount.into());
    }

    // The edition passed in is a valid Master Edition or Print Edition derivation.
    let edition_info_path = Vec::from([
        PREFIX.as_bytes(),
        crate::ID.as_ref(),
        ctx.accounts.mint_info.key.as_ref(),
        EDITION.as_bytes(),
    ]);
    let _bump = assert_derivation(&crate::ID, ctx.accounts.edition_info, &edition_info_path)?;

    // Deserialize accounts.
    let metadata = Metadata::from_account_info(ctx.accounts.metadata_info)?;

    // Mint account passed in matches the mint of the token account.
    if &metadata.mint != ctx.accounts.mint_info.key {
        return Err(MetadataError::MintMismatch.into());
    }

    let mint = if mint_closed {
        None
    } else {
        Some(Mint::unpack(&ctx.accounts.mint_info.data.borrow())?)
    };
    // Mint supply must be zero.
    if mint_closed
        || (mint.is_some() && mint.unwrap().supply == 0
        // Mint authority must be None or the edition key or the system program.
        && match mint.unwrap().mint_authority {
            COption::None => true,
            COption::Some(auth) => {
                (auth == *ctx.accounts.edition_info.key) || (auth == Pubkey::default())
            }
        })
    {
        // Close the metadata account.
        close_account_raw(ctx.accounts.destination_info, ctx.accounts.metadata_info)?;

        // Close the edition account if it exists.
        if ctx.accounts.edition_info.data_len() > 0 && ctx.accounts.edition_info.owner == &crate::ID
        {
            close_account_raw(ctx.accounts.destination_info, ctx.accounts.edition_info)?;
        }
    } else if mint.is_some() && mint.unwrap().supply > 0 {
        return Err(MetadataError::MintSupplyMustBeZero.into());
    } else if mint.is_some() && mint.unwrap().mint_authority.is_some() {
        return Err(MetadataError::InvalidMintAuthority.into());
    } else {
        return Err(MetadataError::ConditionsForClosingNotMet.into());
    }

    Ok(())
}
