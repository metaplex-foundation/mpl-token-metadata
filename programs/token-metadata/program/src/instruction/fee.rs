use arch_program::{account::AccountMeta, instruction::Instruction, pubkey::Pubkey};
use borsh::BorshSerialize;

use super::*;
use crate::state::fee::FEE_AUTHORITY;

pub fn collect_fees(recipient: Pubkey, fee_accounts: Vec<Pubkey>) -> Instruction {
    let mut accounts = vec![
        AccountMeta::new(FEE_AUTHORITY, true),
        AccountMeta::new(recipient, false),
    ];

    for fee_account in fee_accounts {
        accounts.push(AccountMeta::new(fee_account, false));
    }
    Instruction {
        program_id: crate::id(),
        accounts,
        data: MetadataInstruction::Collect.try_to_vec().unwrap(),
    }
}
