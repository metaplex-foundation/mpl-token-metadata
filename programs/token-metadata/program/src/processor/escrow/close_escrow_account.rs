use arch_program::{
    account::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey, system_program,
};
use mpl_utils::{assert_signer, close_account_raw};

use super::find_escrow_seeds;
use crate::{
    assertions::{assert_derivation, assert_initialized, assert_keys_equal, assert_owned_by},
    error::MetadataError,
    pda::{EDITION, PREFIX},
    processor::all_accounts,
    state::{EscrowAuthority, Metadata, TokenMetadataAccount, TokenOwnedEscrow},
    utils::SPL_TOKEN_ID,
};

pub fn process_close_escrow_account(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    all_accounts!(
        accounts,
        escrow_account,
        metadata_account,
        mint_account,
        token_account,
        edition_account,
        payer_account,
        system_account
    );

    assert_owned_by(escrow_account, &crate::id())?;
    assert_owned_by(metadata_account, &crate::id())?;
    assert_owned_by(mint_account, &SPL_TOKEN_ID)?;
    assert_owned_by(token_account, &SPL_TOKEN_ID)?;
    assert_owned_by(edition_account, &crate::id())?;
    assert_signer(payer_account)?;

    if *system_account.key != system_program::ID {
        return Err(MetadataError::InvalidSystemProgram.into());
    }

    let metadata: Metadata = Metadata::from_account(metadata_account)?;

    // Mint account passed in must be the mint of the metadata account passed in.
    if &metadata.mint != mint_account.key {
        return Err(MetadataError::MintMismatch.into());
    }

    // Check that the edition account is for this mint.
    let _edition_bump = assert_derivation(
        &crate::id(),
        edition_account,
        &[
            PREFIX.as_bytes(),
            crate::id().as_ref(),
            mint_account.key.as_ref(),
            EDITION.as_bytes(),
        ],
    )?;

    let token_account: spl_token_2022::state::Account = assert_initialized(token_account)?;

    if token_account.mint != *mint_account.key {
        return Err(MetadataError::MintMismatch.into());
    }

    if token_account.amount != 1 {
        return Err(MetadataError::NotEnoughTokens.into());
    }

    if token_account.mint != metadata.mint {
        return Err(MetadataError::MintMismatch.into());
    }

    let creator_type = if token_account.owner == *payer_account.key {
        EscrowAuthority::TokenOwner
    } else {
        EscrowAuthority::Creator(*payer_account.key)
    };

    // Derive the seeds for PDA signing.
    let escrow_seeds = find_escrow_seeds(mint_account.key, &creator_type);

    let bump_seed = assert_derivation(&crate::id(), escrow_account, &escrow_seeds)?;

    let token_account: spl_token_2022::state::Account = assert_initialized(token_account)?;
    let toe = TokenOwnedEscrow::from_account(escrow_account)?;
    assert_keys_equal(&toe.base_token, mint_account.key)?;

    if bump_seed != toe.bump {
        return Err(MetadataError::InvalidEscrowBumpSeed.into());
    }

    match toe.authority {
        EscrowAuthority::TokenOwner => {
            if *payer_account.key != token_account.owner {
                return Err(MetadataError::MustBeEscrowAuthority.into());
            }
        }
        EscrowAuthority::Creator(authority) => {
            if *payer_account.key != authority {
                return Err(MetadataError::MustBeEscrowAuthority.into());
            }
        }
    }

    // Close the account.
    close_account_raw(payer_account, escrow_account)?;

    Ok(())
}
