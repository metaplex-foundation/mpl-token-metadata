mod digital_asset;
mod dirty_clone;
mod token_manager;

pub use digital_asset::*;
pub use dirty_clone::*;
use spl_token_2022::extension::{BaseState, StateWithExtensions};
pub use token_manager::*;

use solana_program::{program_error::ProgramError, pubkey::Pubkey};
use solana_program_test::{ProgramTest, ProgramTestContext};
use solana_sdk::account::Account;

pub fn program_test() -> ProgramTest {
    let mut program_test = ProgramTest::new("token_metadata", mpl_token_metadata::ID, None);
    program_test.add_program("spl_token_2022", spl_token_2022::ID, None);
    program_test
}

pub async fn find_account(context: &mut ProgramTestContext, pubkey: &Pubkey) -> Option<Account> {
    context.banks_client.get_account(*pubkey).await.unwrap()
}

pub async fn get_account(context: &mut ProgramTestContext, pubkey: &Pubkey) -> Account {
    context
        .banks_client
        .get_account(*pubkey)
        .await
        .unwrap()
        .expect("account not found")
}

pub fn unpack<S: BaseState>(
    account_data: &[u8],
) -> Result<StateWithExtensions<'_, S>, ProgramError> {
    StateWithExtensions::<S>::unpack(account_data)
}

#[macro_export]
macro_rules! assert_custom_instruction_error {
    ($ix:expr, $error:expr, $matcher:pat) => {
        match $error {
            solana_program_test::BanksClientError::TransactionError(
                solana_sdk::transaction::TransactionError::InstructionError(
                    $ix,
                    solana_sdk::instruction::InstructionError::Custom(x),
                ),
            ) => match num_traits::FromPrimitive::from_i32(x as i32) {
                Some($matcher) => assert!(true),
                Some(other) => {
                    assert!(
                        false,
                        "Expected another custom instruction error than '{:#?}'",
                        other
                    )
                }
                None => assert!(false, "Expected custom instruction error"),
            },
            err => assert!(
                false,
                "Expected custom instruction error but got '{:#?}'",
                err
            ),
        };
    };
}
