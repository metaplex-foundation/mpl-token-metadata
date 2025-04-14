use mpl_utils::create_or_allocate_account_raw;
use arch_program::{account::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey};
use spl_token_2022::state::Mint;

use crate::{
    assertions::{
        assert_derivation, assert_mint_authority_matches_mint, assert_owned_by,
        assert_token_program_matches_package, metadata::assert_update_authority_is_correct,
    },
    error::MetadataError,
    processor::all_accounts,
    state::{
        Key, MasterEditionV2, Metadata, TokenMetadataAccount, TokenStandard, EDITION,
        MAX_MASTER_EDITION_LEN, PREFIX,
    },
    utils::{transfer_mint_authority, unpack_initialized},
};

/// Create master edition
pub fn process_create_master_edition(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    max_supply: Option<u64>,
) -> ProgramResult {
    all_accounts!(
        accounts,
        edition_account,
        mint_info,
        update_authority_info,
        mint_authority_info,
        payer_account,
        metadata_account,
        token_program_info,
        system_account
    );

    let metadata = Metadata::from_account(metadata_account)?;
    let mint = unpack_initialized::<Mint>(&mint_info.data.borrow())?;

    let bump_seed = assert_derivation(
        program_id,
        edition_account,
        &[
            PREFIX.as_bytes(),
            program_id.as_ref(),
            mint_info.key.as_ref(),
            EDITION.as_bytes(),
        ],
    )?;

    assert_token_program_matches_package(token_program_info)?;
    assert_mint_authority_matches_mint(&mint.mint_authority, mint_authority_info)?;
    assert_owned_by(metadata_account, program_id)?;
    assert_owned_by(mint_info, token_program_info.key)?;

    if metadata.mint != *mint_info.key {
        return Err(MetadataError::MintMismatch.into());
    }

    if mint.decimals != 0 {
        return Err(MetadataError::EditionMintDecimalsShouldBeZero.into());
    }

    assert_update_authority_is_correct(&metadata, update_authority_info)?;

    if mint.supply != 1 {
        return Err(MetadataError::EditionsMustHaveExactlyOneToken.into());
    }

    let edition_authority_seeds = &[
        PREFIX.as_bytes(),
        program_id.as_ref(),
        mint_info.key.as_ref(),
        EDITION.as_bytes(),
        &[bump_seed],
    ];

    create_or_allocate_account_raw(
        *program_id,
        edition_account,
        system_account,
        payer_account,
        MAX_MASTER_EDITION_LEN,
        edition_authority_seeds,
    )?;

    let mut edition = MasterEditionV2::from_account(edition_account)?;

    edition.key = Key::MasterEditionV2;
    edition.supply = 0;
    edition.max_supply = max_supply;
    borsh::to_writer(
        &mut edition_account.try_borrow_mut_data()?[..],
        &edition,
    )?;
    if metadata_account.is_writable {
        let mut metadata_mut = Metadata::from_account(metadata_account)?;
        metadata_mut.token_standard = Some(TokenStandard::NonFungible);
        borsh::to_writer(
            &mut metadata_account.try_borrow_mut_data()?[..],
            &metadata_mut,
        )?;
    }

    // While you can't mint any more of your master record, you can
    // mint as many limited editions as you like within your max supply.
    transfer_mint_authority(
        edition_account.key,
        edition_account,
        mint_info,
        mint_authority_info,
        token_program_info,
    )?;

    Ok(())
}
