use mpl_utils::{assert_signer, close_account_raw};
use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey, system_program,
};

use super::find_escrow_seeds;
use crate::{
    assertions::{assert_derivation, assert_initialized, assert_keys_equal, assert_owned_by},
    error::MetadataError,
    pda::{EDITION, PREFIX},
    processor::all_account_infos,
    state::{EscrowAuthority, Metadata, TokenMetadataAccount, TokenOwnedEscrow},
    utils::SPL_TOKEN_ID,
};

pub fn process_close_escrow_account(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    all_account_infos!(
        accounts,
        escrow_account_info,
        metadata_account_info,
        mint_account_info,
        token_account_info,
        edition_account_info,
        payer_account_info,
        system_account_info
    );

    assert_owned_by(escrow_account_info, &crate::ID)?;
    assert_owned_by(metadata_account_info, &crate::ID)?;
    assert_owned_by(mint_account_info, &SPL_TOKEN_ID)?;
    assert_owned_by(token_account_info, &SPL_TOKEN_ID)?;
    assert_owned_by(edition_account_info, &crate::ID)?;
    assert_signer(payer_account_info)?;

    if *system_account_info.key != system_program::ID {
        return Err(MetadataError::InvalidSystemProgram.into());
    }

    let metadata: Metadata = Metadata::from_account_info(metadata_account_info)?;

    // Mint account passed in must be the mint of the metadata account passed in.
    if &metadata.mint != mint_account_info.key {
        return Err(MetadataError::MintMismatch.into());
    }

    // Check that the edition account is for this mint.
    let _edition_bump = assert_derivation(
        &crate::ID,
        edition_account_info,
        &[
            PREFIX.as_bytes(),
            crate::ID.as_ref(),
            mint_account_info.key.as_ref(),
            EDITION.as_bytes(),
        ],
    )?;

    let token_account: spl_token_2022::state::Account = assert_initialized(token_account_info)?;

    if token_account.mint != *mint_account_info.key {
        return Err(MetadataError::MintMismatch.into());
    }

    if token_account.amount != 1 {
        return Err(MetadataError::NotEnoughTokens.into());
    }

    if token_account.mint != metadata.mint {
        return Err(MetadataError::MintMismatch.into());
    }

    let creator_type = if token_account.owner == *payer_account_info.key {
        EscrowAuthority::TokenOwner
    } else {
        EscrowAuthority::Creator(*payer_account_info.key)
    };

    // Derive the seeds for PDA signing.
    let escrow_seeds = find_escrow_seeds(mint_account_info.key, &creator_type);

    let bump_seed = assert_derivation(&crate::ID, escrow_account_info, &escrow_seeds)?;

    let token_account: spl_token_2022::state::Account = assert_initialized(token_account_info)?;
    let toe = TokenOwnedEscrow::from_account_info(escrow_account_info)?;
    assert_keys_equal(&toe.base_token, mint_account_info.key)?;

    if bump_seed != toe.bump {
        return Err(MetadataError::InvalidEscrowBumpSeed.into());
    }

    match toe.authority {
        EscrowAuthority::TokenOwner => {
            if *payer_account_info.key != token_account.owner {
                return Err(MetadataError::MustBeEscrowAuthority.into());
            }
        }
        EscrowAuthority::Creator(authority) => {
            if *payer_account_info.key != authority {
                return Err(MetadataError::MustBeEscrowAuthority.into());
            }
        }
    }

    // Close the account.
    close_account_raw(payer_account_info, escrow_account_info)?;

    Ok(())
}
