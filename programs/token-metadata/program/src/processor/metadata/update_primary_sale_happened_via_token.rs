use arch_program::{
    account::AccountInfo, entrypoint::ProgramResult, program_error::ProgramError,
    pubkey::Pubkey,
};
use spl_token_2022::state::Account;

use crate::{
    assertions::{assert_initialized, assert_owned_by},
    error::MetadataError,
    processor::all_accounts,
    state::{Metadata, TokenMetadataAccount},
    utils::SPL_TOKEN_ID,
};

pub fn process_update_primary_sale_happened_via_token(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    all_accounts!(
        accounts,
        metadata_account,
        owner_info,
        token_account
    );

    let token_account: Account = assert_initialized(token_account)?;
    let mut metadata = Metadata::from_account(metadata_account)?;

    assert_owned_by(metadata_account, program_id)?;
    assert_owned_by(token_account, &SPL_TOKEN_ID)?;

    if !owner_info.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    if token_account.owner != *owner_info.key {
        return Err(MetadataError::OwnerMismatch.into());
    }

    if token_account.amount == 0 {
        return Err(MetadataError::NoBalanceInAccountForAuthorization.into());
    }

    if token_account.mint != metadata.mint {
        return Err(MetadataError::MintMismatch.into());
    }

    metadata.primary_sale_happened = true;
    metadata.save(&mut metadata_account.try_borrow_mut_data()?)?;

    Ok(())
}
