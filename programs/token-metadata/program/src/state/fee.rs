use super::*;

pub(crate) const FEE_AUTHORITY: Pubkey = pubkey!("Levytx9LLPzAtDJJD7q813Zsm8zg9e1pb53mGxTKpD7");
pub(crate) const OWNERLESS_CLOSE_AUTHORITY: Pubkey =
    pubkey!("C1oseLQExhuEzeBhsVbLtseSpVgvpHDbBj3PTevBCEBh");
pub(crate) const OWNERLESS_CLOSE_DESTINATION: Pubkey =
    pubkey!("E4ZJX8hYhz5tDbFsUo1DinxHqt33aUsFQpe8dYjASm2F");
pub(crate) const RESIZE_AUTHORITY: Pubkey = pubkey!("ResizebfwTEZTLbHbctTByvXYECKTJQXnMWG8g9XLix");
pub(crate) const RESIZE_DESTINATION: Pubkey =
    pubkey!("46mjNQBwXLCDCM7YiDQSPVdNZ4dLdZf79tTPRkT1wkF6");

// create_metadata_accounts_v3, create, print edition commands
pub const CREATE_FEE: u64 = 10_000_000;

pub const FEE_FLAG_SET: u8 = 1;
pub const FEE_FLAG_CLEARED: u8 = 0;
