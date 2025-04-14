use arch_program::{account::AccountMeta, instruction::Instruction, pubkey::Pubkey};
use borsh::BorshSerialize;

use crate::{instruction::MetadataInstruction, utils::SPL_TOKEN_ID};

///# Freeze delegated account
///
///Allow freezing of an NFT if this user is the delegate of the NFT
///
///### Accounts:
///   0. `[signer]` Delegate
///   1. `[writable]` Token account to freeze
///   2. `[]` Edition
///   3. `[]` Token mint
#[allow(clippy::too_many_arguments)]
pub fn freeze_delegated_account(
    program_id: Pubkey,
    delegate: Pubkey,
    token_account: Pubkey,
    edition: Pubkey,
    mint: Pubkey,
) -> Instruction {
    Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(delegate, true),
            AccountMeta::new(token_account, false),
            AccountMeta::new_readonly(edition, false),
            AccountMeta::new_readonly(mint, false),
            AccountMeta::new_readonly(SPL_TOKEN_ID, false),
        ],
        data: {
            let mut d = vec![];
            d.push(0u8);
            d
        },
    }
}

///# Thaw delegated account
///
///Allow thawing of an NFT if this user is the delegate of the NFT
///
///### Accounts:
///   0. `[signer]` Delegate
///   1. `[writable]` Token account to thaw
///   2. `[]` Edition
///   3. `[]` Token mint
#[allow(clippy::too_many_arguments)]
pub fn thaw_delegated_account(
    program_id: Pubkey,
    delegate: Pubkey,
    token_account: Pubkey,
    edition: Pubkey,
    mint: Pubkey,
) -> Instruction {
    Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(delegate, true),
            AccountMeta::new(token_account, false),
            AccountMeta::new_readonly(edition, false),
            AccountMeta::new_readonly(mint, false),
            AccountMeta::new_readonly(SPL_TOKEN_ID, false),
        ],
        data: {
            let mut d = vec![];
            d.push(1u8);
            d
        },
    }
}