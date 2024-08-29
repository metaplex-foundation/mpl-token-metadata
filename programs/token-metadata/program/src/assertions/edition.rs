use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, program_option::COption, pubkey::Pubkey,
};
use spl_token_2022::state::Mint;

use crate::{
    error::MetadataError,
    pda::find_master_edition_account,
    state::{
        Key, TokenStandard, EDITION, EDITION_TOKEN_STANDARD_OFFSET,
        MASTER_EDITION_TOKEN_STANDARD_OFFSET, PREFIX,
    },
    utils::unpack,
};

pub fn assert_edition_is_not_mint_authority(mint_account_info: &AccountInfo) -> ProgramResult {
    let mint = unpack::<Mint>(&mint_account_info.try_borrow_data()?)?;

    let (edition_pda, _) = find_master_edition_account(mint_account_info.key);

    if mint.mint_authority == COption::Some(edition_pda) {
        return Err(MetadataError::MissingEditionAccount.into());
    }

    Ok(())
}

/// Checks that the `edition` is not a pNFT master edition or edition.
pub fn assert_edition_is_not_programmable(edition_info: &AccountInfo) -> ProgramResult {
    let edition_data = edition_info.data.borrow();

    // Check if it's a master edition of a pNFT
    if (edition_data[0] == Key::MasterEditionV2 as u8
        && (edition_data[edition_data.len() - MASTER_EDITION_TOKEN_STANDARD_OFFSET] == TokenStandard::ProgrammableNonFungible as u8))
        // Check if it's an edition of a pNFT
        || (edition_data[0] == Key::EditionV1 as u8
            && edition_data[edition_data.len() - EDITION_TOKEN_STANDARD_OFFSET]
                == TokenStandard::ProgrammableNonFungible as u8)
    {
        return Err(MetadataError::InvalidTokenStandard.into());
    }

    Ok(())
}

// Todo deprecate this for assert derivation
pub fn assert_edition_valid(
    program_id: &Pubkey,
    mint: &Pubkey,
    edition_account_info: &AccountInfo,
) -> ProgramResult {
    let edition_seeds = &[
        PREFIX.as_bytes(),
        program_id.as_ref(),
        mint.as_ref(),
        EDITION.as_bytes(),
    ];
    let (edition_key, _) = Pubkey::find_program_address(edition_seeds, program_id);
    if edition_key != *edition_account_info.key {
        return Err(MetadataError::InvalidEditionKey.into());
    }

    Ok(())
}
