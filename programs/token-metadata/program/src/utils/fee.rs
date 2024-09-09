use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, program::invoke, rent::Rent,
    sysvar::Sysvar,
};

use crate::{
    error::MetadataError,
    state::{get_create_fee, MAX_METADATA_LEN, METADATA_FEE_FLAG_OFFSET},
};

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub(crate) struct LevyArgs<'a> {
    pub payer_account_info: &'a AccountInfo<'a>,
    pub token_metadata_pda_info: &'a AccountInfo<'a>,
}

pub(crate) fn levy(args: LevyArgs) -> ProgramResult {
    // Fund metadata account with rent + Metaplex fee.
    let rent = Rent::get()?;

    // Normally we would use the account data length to calculate the rent, but
    // but levy is always called before the account is created, so it will be
    // zero at this point. But we double check anyway.
    let account_data_len = args.token_metadata_pda_info.data_len();
    if account_data_len > 0 {
        return Err(MetadataError::ExpectedUninitializedAccount.into());
    }
    let fee = get_create_fee()? + rent.minimum_balance(MAX_METADATA_LEN);

    invoke(
        &solana_program::system_instruction::transfer(
            args.payer_account_info.key,
            args.token_metadata_pda_info.key,
            fee,
        ),
        &[
            args.payer_account_info.clone(),
            args.token_metadata_pda_info.clone(),
        ],
    )?;

    Ok(())
}

pub(crate) fn set_fee_flag(pda_account_info: &AccountInfo) -> ProgramResult {
    let last_byte = pda_account_info
        .data_len()
        .checked_sub(METADATA_FEE_FLAG_OFFSET)
        .ok_or(MetadataError::NumericalOverflowError)?;
    let mut data = pda_account_info.try_borrow_mut_data()?;
    data[last_byte] = 1;

    Ok(())
}

pub(crate) fn clear_fee_flag(pda_account_info: &AccountInfo) -> ProgramResult {
    let last_byte = pda_account_info
        .data_len()
        .checked_sub(METADATA_FEE_FLAG_OFFSET)
        .ok_or(MetadataError::NumericalOverflowError)?;
    let mut data = pda_account_info.try_borrow_mut_data()?;

    // Clear the flag if the index exists.
    if let Some(flag) = data.get_mut(last_byte) {
        *flag = 0;
    }

    Ok(())
}
