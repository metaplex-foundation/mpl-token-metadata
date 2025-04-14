use arch_program::{account::AccountMeta, instruction::Instruction};
use borsh::{BorshDeserialize, BorshSerialize};
#[cfg(feature = "serde-feature")]
use serde::{Deserialize, Serialize};

use super::{InstructionBuilder, MetadataInstruction};
use crate::processor::AuthorizationData;

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Eq, Debug, Clone)]
pub enum LockArgs {
    V1 {
        /// Required authorization data to validate the request.
        authorization_data: Option<AuthorizationData>,
    },
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Eq, Debug, Clone)]
pub enum UnlockArgs {
    V1 {
        /// Required authorization data to validate the request.
        authorization_data: Option<AuthorizationData>,
    },
}

/// Locks an asset. For non-programmable assets, this will also freeze the token account.
///
/// # Accounts:
///
///   0. `[signer]` Delegate account
///   1. `[optional]` Token owner
///   2. `[writable]` Token account
///   3. `[]` Mint account
///   4. `[writable]` Metadata account
///   5. `[optional]` Edition account
///   6. `[optional, writable]` Token record account
///   7. `[signer, writable]` Payer
///   8. `[]` System Program
///   9. `[]` Instructions sysvar account
///   10. `[optional]` SPL Token Program
///   11. `[optional]` Token Authorization Rules program
///   12. `[optional]` Token Authorization Rules account
impl InstructionBuilder for super::builders::Lock {
    fn instruction(&self) -> arch_program::instruction::Instruction {
        let mut accounts = vec![
            AccountMeta::new_readonly(self.authority, true),
            AccountMeta::new_readonly(self.token_owner.unwrap_or(crate::id()), false),
            AccountMeta::new(self.token, false),
            AccountMeta::new_readonly(self.mint, false),
            AccountMeta::new(self.metadata, false),
            AccountMeta::new_readonly(self.edition.unwrap_or(crate::id()), false),
            if let Some(token_record) = self.token_record {
                AccountMeta::new(token_record, false)
            } else {
                AccountMeta::new_readonly(crate::id(), false)
            },
            AccountMeta::new(self.payer, true),
            AccountMeta::new_readonly(self.system_program, false),
            AccountMeta::new_readonly(self.sysvar_instructions, false),
            AccountMeta::new_readonly(self.spl_token_program.unwrap_or(crate::id()), false),
        ];

        // Optional authorization rules accounts
        if let Some(rules) = &self.authorization_rules {
            accounts.push(AccountMeta::new_readonly(mpl_token_auth_rules::ID, false));
            accounts.push(AccountMeta::new_readonly(*rules, false));
        } else {
            accounts.push(AccountMeta::new_readonly(crate::id(), false));
            accounts.push(AccountMeta::new_readonly(crate::id(), false));
        }

        Instruction {
            program_id: crate::id(),
            accounts,
            data: MetadataInstruction::Lock(self.args.clone())
                .try_to_vec()
                .unwrap(),
        }
    }
}

/// Unlocks an asset. For non-programmable assets, this will also thaw the token account.
///
/// # Accounts:
///
///   0. `[signer]` Delegate account
///   1. `[optional]` Token owner
///   2. `[writable]` Token account
///   3. `[]` Mint account
///   4. `[writable]` Metadata account
///   5. `[optional]` Edition account
///   6. `[optional, writable]` Token record account
///   7. `[signer, writable]` Payer
///   8. `[]` System Program
///   9. `[]` Instructions sysvar account
///   10. `[optional]` SPL Token Program
///   11. `[optional]` Token Authorization Rules program
///   12. `[optional]` Token Authorization Rules account
impl InstructionBuilder for super::builders::Unlock {
    fn instruction(&self) -> arch_program::instruction::Instruction {
        let mut accounts = vec![
            AccountMeta::new_readonly(self.authority, true),
            AccountMeta::new_readonly(self.token_owner.unwrap_or(crate::id()), false),
            AccountMeta::new(self.token, false),
            AccountMeta::new_readonly(self.mint, false),
            AccountMeta::new(self.metadata, false),
            AccountMeta::new_readonly(self.edition.unwrap_or(crate::id()), false),
            if let Some(token_record) = self.token_record {
                AccountMeta::new(token_record, false)
            } else {
                AccountMeta::new_readonly(crate::id(), false)
            },
            AccountMeta::new(self.payer, true),
            AccountMeta::new_readonly(self.system_program, false),
            AccountMeta::new_readonly(self.sysvar_instructions, false),
            AccountMeta::new_readonly(self.spl_token_program.unwrap_or(crate::id()), false),
        ];

        // Optional authorization rules accounts
        if let Some(rules) = &self.authorization_rules {
            accounts.push(AccountMeta::new_readonly(mpl_token_auth_rules::ID, false));
            accounts.push(AccountMeta::new_readonly(*rules, false));
        } else {
            accounts.push(AccountMeta::new_readonly(crate::id(), false));
            accounts.push(AccountMeta::new_readonly(crate::id(), false));
        }

        Instruction {
            program_id: crate::id(),
            accounts,
            data: MetadataInstruction::Unlock(self.args.clone())
                .try_to_vec()
                .unwrap(),
        }
    }
}
