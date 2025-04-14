use mpl_utils::assert_signer;
use num_traits::FromPrimitive;
use arch_program::{account::next_account_info, rent::Rent, system_program, sysvar::Sysvar};

use super::*;
use crate::{
    state::fee::{FEE_AUTHORITY, FEE_DESTINATION},
    utils::fee::clear_fee_flag,
};

pub(crate) fn process_collect_fees(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_iter = &mut accounts.iter();

    let authority_info = next_account_info(account_iter)?;

    assert_signer(authority_info)?;

    if *authority_info.key != FEE_AUTHORITY {
        return Err(MetadataError::UpdateAuthorityIncorrect.into());
    }

    let recipient_info = next_account_info(account_iter)?;

    if *recipient_info.key != FEE_DESTINATION {
        return Err(MetadataError::InvalidFeeAccount.into());
    }

    for account in account_iter {
        if account.owner != program_id {
            return Err(MetadataError::InvalidFeeAccount.into());
        }

        collect_fee_from_account(account, recipient_info)?;
    }

    Ok(())
}

fn collect_fee_from_account(account: &AccountInfo, dest_info: &AccountInfo) -> ProgramResult {
    // Scope refcell borrow
    let account_key = {
        let data = account.data.borrow();

        // Burned accounts with fees will have no data, so should be assigned the `Uninitialized` key.
        let key_byte = data.first().unwrap_or(&0);

        FromPrimitive::from_u8(*key_byte).ok_or(MetadataError::InvalidFeeAccount)?
    };

    let rent = Rent::get()?;
    let data_len = account.data_len();
    let metadata_rent = rent.minimum_balance(data_len);

    let (fee_amount, rent_amount) = match account_key {
        Key::Uninitialized => {
            account.assign(&system_program::ID);

            (account.lamports(), 0)
        }
        Key::MetadataV1 => {
            let fee_amount = account
                .lamports()
                .checked_sub(metadata_rent)
                .ok_or(MetadataError::NumericalOverflowError)?;

            (fee_amount, metadata_rent)
        }
        _ => return Err(MetadataError::InvalidFeeAccount.into()),
    };

    let dest_starting_lamports = dest_info.lamports();
    **dest_info.lamports.borrow_mut() = dest_starting_lamports
        .checked_add(fee_amount)
        .ok_or(MetadataError::NumericalOverflowError)?;
    **account.lamports.borrow_mut() = rent_amount;

    // Clear fee flag.
    clear_fee_flag(account)?;

    Ok(())
}
