use mpl_utils::{close_account_raw, token::SPL_TOKEN_PROGRAM_IDS};
use solana_program::{program_option::COption, program_pack::Pack};
use spl_token_2022::state::Mint;

use crate::{
    assertions::assert_owner_in,
    instruction::CloseAccounts,
    state::{EDITION, FEE_AUTHORITY, PREFIX},
    utils::{assert_derivation, assert_owned_by},
};

use super::*;

pub(crate) fn process_close_accounts<'a>(
    program_id: &'a Pubkey,
    accounts: &'a [AccountInfo<'a>],
) -> ProgramResult {
    let ctx = CloseAccounts::to_context(accounts)?;

    // Assert program ownership.
    assert_owned_by(ctx.accounts.metadata_info, program_id)?;
    assert_owner_in(ctx.accounts.mint_info, &SPL_TOKEN_PROGRAM_IDS)?;

    // Assert the correct destination is set.
    // TODO: This should be replaced by destination address.
    if *ctx.accounts.fee_destination_info.key != FEE_AUTHORITY {
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

    let mint = Mint::unpack(&ctx.accounts.mint_info.data.borrow())?;

    // Mint supply must be zero.
    if mint.supply == 0
        // Mint authority must be None or the edition key or the system program.
        && match mint.mint_authority {
            COption::None => true,
            COption::Some(auth) => {
                (auth == *ctx.accounts.edition_info.key) || (auth == Pubkey::default())
            }
        }
    {
        // Close the metadata account.
        close_account_raw(
            ctx.accounts.fee_destination_info,
            ctx.accounts.metadata_info,
        )?;

        // Close the edition account if it exists.
        if ctx.accounts.edition_info.data_len() > 0 && ctx.accounts.edition_info.owner == &crate::ID
        {
            close_account_raw(ctx.accounts.fee_destination_info, ctx.accounts.edition_info)?;
        }
    } else if mint.supply > 0 {
        return Err(MetadataError::MintSupplyMustBeZero.into());
    } else {
        return Err(MetadataError::InvalidTokenStandard.into());
    }

    Ok(())
}
