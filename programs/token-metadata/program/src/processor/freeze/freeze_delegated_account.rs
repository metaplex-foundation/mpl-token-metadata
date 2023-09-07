use mpl_utils::assert_signer;
use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, program::invoke_signed, pubkey::Pubkey,
};
use spl_token_2022::{instruction::freeze_account, state::Mint};

use crate::{
    assertions::{
        assert_delegated_tokens, assert_derivation, assert_freeze_authority_matches_mint,
        assert_initialized, assert_owned_by, edition::assert_edition_is_not_programmable,
    },
    error::MetadataError,
    processor::all_account_infos,
    state::{EDITION, PREFIX},
    utils::SPL_TOKEN_ID,
};

pub fn process_freeze_delegated_account(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    all_account_infos!(
        accounts,
        delegate_info,
        token_account_info,
        edition_info,
        mint_info,
        token_program_account_info
    );

    if *token_program_account_info.key != SPL_TOKEN_ID {
        return Err(MetadataError::InvalidTokenProgram.into());
    }

    // assert that edition pda is the freeze authority of this mint
    let mint: Mint = assert_initialized(mint_info)?;
    assert_owned_by(edition_info, program_id)?;
    assert_freeze_authority_matches_mint(&mint.freeze_authority, edition_info)?;

    // assert delegate is signer and delegated tokens
    assert_signer(delegate_info)?;
    assert_delegated_tokens(
        delegate_info,
        mint_info,
        token_account_info,
        token_program_account_info.key,
    )?;

    let edition_info_path = Vec::from([
        PREFIX.as_bytes(),
        program_id.as_ref(),
        mint_info.key.as_ref(),
        EDITION.as_bytes(),
    ]);
    let edition_info_path_bump_seed = &[assert_derivation(
        program_id,
        edition_info,
        &edition_info_path,
    )?];

    // check that we are not dealing with a pNFT master edition
    assert_edition_is_not_programmable(edition_info)?;

    let mut edition_info_seeds = edition_info_path.clone();
    edition_info_seeds.push(edition_info_path_bump_seed);
    invoke_signed(
        &freeze_account(
            token_program_account_info.key,
            token_account_info.key,
            mint_info.key,
            edition_info.key,
            &[],
        )
        .unwrap(),
        &[
            token_account_info.clone(),
            mint_info.clone(),
            edition_info.clone(),
        ],
        &[&edition_info_seeds],
    )?;
    Ok(())
}
