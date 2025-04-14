use arch_program::{account::AccountMeta, instruction::Instruction};
use borsh::{BorshDeserialize, BorshSerialize};
#[cfg(feature = "serde-feature")]
use serde::{Deserialize, Serialize};

use super::InstructionBuilder;
use crate::instruction::MetadataInstruction;

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Eq, Debug, Clone)]
pub enum VerificationArgs {
    CreatorV1,
    CollectionV1,
}

/// Verifies a creator or collection for an asset.
///
/// # Accounts:
///
///   0. `[signer]` Creator to verify, collection update authority or delegate
///   1. `[optional]` Delegate record PDA
///   2. `[writable]` Metadata account
///   3. `[optional]` Mint of the Collection
///   4. `[optional, writable]` Metadata Account of the Collection
///   5. `[optional]` Master Edition Account of the Collection Token
///   6. `[]` System program
///   7. `[]` Instructions sysvar account
impl InstructionBuilder for super::builders::Verify {
    fn instruction(&self) -> arch_program::instruction::Instruction {
        let accounts = vec![
            AccountMeta::new_readonly(self.authority, true),
            AccountMeta::new_readonly(self.delegate_record.unwrap_or(crate::id()), false),
            AccountMeta::new(self.metadata, false),
            AccountMeta::new_readonly(self.collection_mint.unwrap_or(crate::id()), false),
            if let Some(collection_metadata) = self.collection_metadata {
                AccountMeta::new(collection_metadata, false)
            } else {
                AccountMeta::new_readonly(crate::id(), false)
            },
            AccountMeta::new_readonly(self.collection_master_edition.unwrap_or(crate::id()), false),
            AccountMeta::new_readonly(self.system_program, false),
            AccountMeta::new_readonly(self.sysvar_instructions, false),
        ];

        Instruction {
            program_id: crate::id(),
            accounts,
            data: {
                let mut data = Vec::new();
                data.push(0);
                self.args.serialize(&mut data).unwrap();
                data
            },
        }
    }
}

/// Unverifies a creator or collection for an asset.
///
/// # Accounts:
///
///   0. `[signer]` Creator to verify, collection (or metadata if parent burned) update authority or delegate
///   1. `[optional]` Delegate record PDA
///   2. `[writable]` Metadata account
///   3. `[optional]` Mint of the Collection
///   4. `[optional, writable]` Metadata Account of the Collection
///   5. `[]` System program
///   6. `[]` Instructions sysvar account
impl InstructionBuilder for super::builders::Unverify {
    fn instruction(&self) -> arch_program::instruction::Instruction {
        let accounts = vec![
            AccountMeta::new_readonly(self.authority, true),
            AccountMeta::new_readonly(self.delegate_record.unwrap_or(crate::id()), false),
            AccountMeta::new(self.metadata, false),
            AccountMeta::new_readonly(self.collection_mint.unwrap_or(crate::id()), false),
            if let Some(collection_metadata) = self.collection_metadata {
                AccountMeta::new(collection_metadata, false)
            } else {
                AccountMeta::new_readonly(crate::id(), false)
            },
            AccountMeta::new_readonly(self.system_program, false),
            AccountMeta::new_readonly(self.sysvar_instructions, false),
        ];

        Instruction {
            program_id: crate::id(),
            accounts,
            data: {
                let mut data = Vec::new();
                data.push(1);
                self.args.serialize(&mut data).unwrap();
                data
            },
        }
    }
}