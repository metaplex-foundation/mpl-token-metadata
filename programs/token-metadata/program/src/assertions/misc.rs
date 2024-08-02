use mpl_utils::cmp_pubkeys;
use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    program_option::COption,
    program_pack::{IsInitialized, Pack},
    pubkey::Pubkey,
    rent::Rent,
};
use spl_token_2022::state::Account;

use crate::{
    error::MetadataError,
    state::{TokenDelegateRole, TokenRecord},
    utils::unpack_initialized,
};

pub fn assert_keys_equal(key1: &Pubkey, key2: &Pubkey) -> Result<(), ProgramError> {
    if !cmp_pubkeys(key1, key2) {
        Err(MetadataError::KeyMismatch.into())
    } else {
        Ok(())
    }
}

pub fn assert_keys_equal_with_error(
    key1: &Pubkey,
    key2: &Pubkey,
    err: MetadataError,
) -> Result<(), ProgramError> {
    if !cmp_pubkeys(key1, key2) {
        Err(err.into())
    } else {
        Ok(())
    }
}

/// assert initialized account
pub fn assert_initialized<T: Pack + IsInitialized>(
    account_info: &AccountInfo,
) -> Result<T, ProgramError> {
    mpl_utils::assert_initialized(account_info, MetadataError::Uninitialized)
}

pub fn assert_mint_authority_matches_mint(
    mint_authority: &COption<Pubkey>,
    mint_authority_info: &AccountInfo,
) -> ProgramResult {
    match mint_authority {
        COption::None => {
            return Err(MetadataError::InvalidMintAuthority.into());
        }
        COption::Some(key) => {
            if mint_authority_info.key != key {
                return Err(MetadataError::InvalidMintAuthority.into());
            }
        }
    }

    if !mint_authority_info.is_signer {
        return Err(MetadataError::NotMintAuthority.into());
    }

    Ok(())
}

pub fn assert_freeze_authority_matches_mint(
    freeze_authority: &COption<Pubkey>,
    freeze_authority_info: &AccountInfo,
) -> ProgramResult {
    match freeze_authority {
        COption::None => {
            return Err(MetadataError::InvalidFreezeAuthority.into());
        }
        COption::Some(key) => {
            if freeze_authority_info.key != key {
                return Err(MetadataError::InvalidFreezeAuthority.into());
            }
        }
    }
    Ok(())
}

pub fn assert_delegated_tokens(
    delegate: &AccountInfo,
    mint_info: &AccountInfo,
    token_account_info: &AccountInfo,
    spl_token_program: &Pubkey,
) -> ProgramResult {
    assert_owned_by(mint_info, spl_token_program)?;

    let token_account = unpack_initialized::<Account>(&token_account_info.data.borrow())?;
    assert_owned_by(token_account_info, spl_token_program)?;

    if token_account.mint != *mint_info.key {
        return Err(MetadataError::MintMismatch.into());
    }

    if token_account.amount < 1 {
        return Err(MetadataError::InsufficientTokenBalance.into());
    }

    if token_account.delegate == COption::None
        || token_account.delegated_amount != token_account.amount
        || token_account.delegate.unwrap() != *delegate.key
    {
        return Err(MetadataError::InvalidDelegate.into());
    }
    Ok(())
}

pub fn assert_derivation(
    program_id: &Pubkey,
    account: &AccountInfo,
    path: &[&[u8]],
) -> Result<u8, ProgramError> {
    mpl_utils::assert_derivation(program_id, account, path, MetadataError::DerivedKeyInvalid)
}

pub fn assert_derivation_with_bump(
    program_id: &Pubkey,
    account: &AccountInfo,
    path: &[&[u8]],
) -> Result<(), ProgramError> {
    mpl_utils::assert_derivation_with_bump(
        program_id,
        account,
        path,
        MetadataError::DerivedKeyInvalid,
    )
}

pub fn assert_owned_by(account: &AccountInfo, owner: &Pubkey) -> ProgramResult {
    mpl_utils::assert_owned_by(account, owner, MetadataError::IncorrectOwner)
}

pub fn assert_owner_in(account: &AccountInfo, owners: &[Pubkey]) -> ProgramResult {
    if owners.iter().any(|owner| cmp_pubkeys(owner, account.owner)) {
        Ok(())
    } else {
        Err(MetadataError::IncorrectOwner.into())
    }
}

pub fn assert_token_program_matches_package(token_program_info: &AccountInfo) -> ProgramResult {
    mpl_utils::token::assert_token_program_matches_package(
        token_program_info,
        MetadataError::InvalidTokenProgram,
    )
}

pub fn assert_rent_exempt(rent: &Rent, account_info: &AccountInfo) -> ProgramResult {
    mpl_utils::assert_rent_exempt(rent, account_info, MetadataError::NotRentExempt)
}

pub fn assert_delegate(
    delegate: &Pubkey,
    role: TokenDelegateRole,
    token_record: &TokenRecord,
) -> ProgramResult {
    if let TokenRecord {
        delegate: Some(token_delegate),
        delegate_role: Some(delegate_role),
        ..
    } = token_record
    {
        if cmp_pubkeys(delegate, token_delegate) && role == *delegate_role {
            return Ok(());
        }
    }

    Err(MetadataError::InvalidDelegate.into())
}

pub fn assert_token_matches_owner_and_mint(
    token_info: &AccountInfo,
    owner: &Pubkey,
    mint: &Pubkey,
) -> ProgramResult {
    let token_account: Account = unpack_initialized::<Account>(&token_info.data.borrow())?;

    if token_account.owner != *owner {
        return Err(MetadataError::InvalidOwner.into());
    }

    if token_account.mint != *mint {
        return Err(MetadataError::MintMismatch.into());
    }

    Ok(())
}
