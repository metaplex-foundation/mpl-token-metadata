use super::*;
use solana_program::{rent::Rent, sysvar::Sysvar};

pub(crate) const FEE_AUTHORITY: Pubkey = pubkey!("Levytx9LLPzAtDJJD7q813Zsm8zg9e1pb53mGxTKpD7");
pub const FEE_DESTINATION: Pubkey = pubkey!("2fb1TjRrJQLy9BkYfBjcYgibV7LUsr9cf6QxvyRZyuXn");
pub(crate) const OWNERLESS_CLOSE_AUTHORITY: Pubkey =
    pubkey!("C1oseLQExhuEzeBhsVbLtseSpVgvpHDbBj3PTevBCEBh");
pub const OWNERLESS_CLOSE_DESTINATION: Pubkey =
    pubkey!("GxCXYtrnaU6JXeAza8Ugn4EE6QiFinpfn8t3Lo4UkBDX");
pub(crate) const RESIZE_AUTHORITY: Pubkey = pubkey!("ResizebfwTEZTLbHbctTByvXYECKTJQXnMWG8g9XLix");
pub(crate) const RESIZE_DESTINATION: Pubkey =
    pubkey!("46mjNQBwXLCDCM7YiDQSPVdNZ4dLdZf79tTPRkT1wkF6");

const CREATE_FEE_SCALAR: usize = 1308;
const CREATE_FEE_OFFSET: u64 = 5440;
// create_metadata_accounts_v3, create, print edition commands
pub fn get_create_fee() -> Result<u64, ProgramError> {
    let rent = Rent::get()?.minimum_balance(CREATE_FEE_SCALAR);

    Ok(rent
        .checked_add(CREATE_FEE_OFFSET)
        .ok_or(MetadataError::NumericalOverflowError)?)
}

pub const FEE_FLAG_SET: u8 = 1;
pub const FEE_FLAG_CLEARED: u8 = 0;
