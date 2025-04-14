use arch_program::{
    account::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    pubkey::Pubkey,
};

use crate::{
    assertions::{
        assert_derivation, assert_owned_by, metadata::assert_update_authority_is_correct,
    },
    error::MetadataError,
    state::{Metadata, TokenMetadataAccount, EDITION, PREFIX},
    utils::{check_token_standard, metadata::clean_write_metadata},
};

pub fn process_set_token_standard(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_iter = &mut accounts.iter();

    let metadata_account = next_account_info(account_iter)?;
    let update_authority_account = next_account_info(account_iter)?;
    let mint_account = next_account_info(account_iter)?;

    // Owned by token-metadata program.
    assert_owned_by(metadata_account, program_id)?;
    let mut metadata = Metadata::from_account(metadata_account)?;

    // Mint account passed in must be the mint of the metadata account passed in.
    if &metadata.mint != mint_account.key {
        return Err(MetadataError::MintMismatch.into());
    }

    // Update authority is a signer and matches update authority on metadata.
    assert_update_authority_is_correct(&metadata, update_authority_account)?;

    let edition_info_opt = account_iter.next();

    // Edition account provided.
    let token_standard = if let Some(edition_info) = edition_info_opt {
        let edition_path = Vec::from([
            PREFIX.as_bytes(),
            program_id.as_ref(),
            mint_account.key.as_ref(),
            EDITION.as_bytes(),
        ]);

        assert_owned_by(edition_info, program_id)?;
        assert_derivation(program_id, edition_info, &edition_path)?;

        check_token_standard(mint_account, Some(edition_info))?
    } else {
        check_token_standard(mint_account, None)?
    };

    metadata.token_standard = Some(token_standard);
    clean_write_metadata(&mut metadata, metadata_account)
}
