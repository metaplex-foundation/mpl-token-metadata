mod digital_asset;
mod dirty_clone;

pub use digital_asset::*;
pub use dirty_clone::*;

use solana_program::pubkey::Pubkey;
use solana_program_test::{ProgramTest, ProgramTestContext};
use solana_sdk::account::Account;

pub const PROGRAM_ID: Pubkey = mpl_token_metadata::ID;

pub fn program_test() -> ProgramTest {
    ProgramTest::new("token_metadata", mpl_token_metadata::ID, None)
}

pub async fn get_account(context: &mut ProgramTestContext, pubkey: &Pubkey) -> Account {
    context
        .banks_client
        .get_account(*pubkey)
        .await
        .unwrap()
        .expect("account not found")
}
