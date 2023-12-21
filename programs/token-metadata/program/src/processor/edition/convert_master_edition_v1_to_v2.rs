use solana_program::{account_info::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey};
use spl_token_2022::state::Mint;

use crate::{
    assertions::{assert_initialized, assert_owned_by},
    error::MetadataError,
    processor::all_account_infos,
    state::{Key, MasterEditionV1, MasterEditionV2, TokenMetadataAccount},
    utils::SPL_TOKEN_ID,
};

pub fn process_convert_master_edition_v1_to_v2(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    all_account_infos!(
        accounts,
        master_edition_info,
        one_time_printing_auth_mint_info,
        printing_mint_info
    );

    assert_owned_by(master_edition_info, program_id)?;
    assert_owned_by(one_time_printing_auth_mint_info, &SPL_TOKEN_ID)?;
    assert_owned_by(printing_mint_info, &SPL_TOKEN_ID)?;
    let master_edition = MasterEditionV1::from_account_info(master_edition_info)?;
    let printing_mint: Mint = assert_initialized(printing_mint_info)?;
    let auth_mint: Mint = assert_initialized(one_time_printing_auth_mint_info)?;
    if master_edition.one_time_printing_authorization_mint != *one_time_printing_auth_mint_info.key
    {
        return Err(MetadataError::OneTimePrintingAuthMintMismatch.into());
    }

    if master_edition.printing_mint != *printing_mint_info.key {
        return Err(MetadataError::PrintingMintMismatch.into());
    }

    if printing_mint.supply != 0 {
        return Err(MetadataError::PrintingMintSupplyMustBeZeroForConversion.into());
    }

    if auth_mint.supply != 0 {
        return Err(MetadataError::OneTimeAuthMintSupplyMustBeZeroForConversion.into());
    }

    borsh::to_writer(
        &mut master_edition_info.try_borrow_mut_data()?[..],
        &MasterEditionV2 {
            key: Key::MasterEditionV2,
            supply: master_edition.supply,
            max_supply: master_edition.max_supply,
        },
    )?;

    Ok(())
}
