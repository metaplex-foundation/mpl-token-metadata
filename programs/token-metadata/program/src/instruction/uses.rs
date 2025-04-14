use arch_program::{
    account::AccountMeta,
    instruction::Instruction,
    pubkey::Pubkey,
    system_instruction as system_program,
};
use borsh::{BorshDeserialize, BorshSerialize};
#[cfg(feature = "serde-feature")]
use serde::{Deserialize, Serialize};

use crate::{instruction::MetadataInstruction, processor::AuthorizationData, utils::SPL_TOKEN_ID};

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Eq, Debug, Clone)]
pub struct ApproveUseAuthorityArgs {
    pub number_of_uses: u64,
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Eq, Debug, Clone)]
pub struct UtilizeArgs {
    pub number_of_uses: u64,
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Eq, Debug, Clone)]
pub enum UseArgs {
    V1 {
        authorization_data: Option<AuthorizationData>,
    },
}

pub fn approve_use_authority(
    program_id: Pubkey,
    use_authority_record: Pubkey,
    user: Pubkey,
    owner: Pubkey,
    payer: Pubkey,
    owner_token_account: Pubkey,
    metadata: Pubkey,
    mint: Pubkey,
    burner: Pubkey,
    number_of_uses: u64,
) -> Instruction {
    Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(use_authority_record, false),
            AccountMeta::new(owner, true),
            AccountMeta::new(payer, true),
            AccountMeta::new_readonly(user, false),
            AccountMeta::new(owner_token_account, false),
            AccountMeta::new_readonly(metadata, false),
            AccountMeta::new_readonly(mint, false),
            AccountMeta::new_readonly(burner, false),
            AccountMeta::new_readonly(Pubkey::from_slice(&SPL_TOKEN_ID.to_bytes()), false),
            AccountMeta::new_readonly(Pubkey::from_slice(&system_program::ID.to_bytes()), false),
        ],
        data: borsh::to_vec(
            &MetadataInstruction::ApproveUseAuthority(ApproveUseAuthorityArgs { number_of_uses }),
        )
        .unwrap(),
    }
}

pub fn revoke_use_authority(
    program_id: Pubkey,
    use_authority_record: Pubkey,
    user: Pubkey,
    owner: Pubkey,
    owner_token_account: Pubkey,
    metadata: Pubkey,
    mint: Pubkey,
) -> Instruction {
    Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(use_authority_record, false),
            AccountMeta::new(owner, true),
            AccountMeta::new_readonly(user, false),
            AccountMeta::new(owner_token_account, false),
            AccountMeta::new_readonly(mint, false),
            AccountMeta::new_readonly(metadata, false),
            AccountMeta::new_readonly(Pubkey::from_slice(&SPL_TOKEN_ID.to_bytes()), false),
            AccountMeta::new_readonly(Pubkey::from_slice(&system_program::ID.to_bytes()), false),
        ],
        data: borsh::to_vec(&MetadataInstruction::RevokeUseAuthority).unwrap(),
    }
}

pub fn utilize(
    program_id: Pubkey,
    metadata: Pubkey,
    token_account: Pubkey,
    mint: Pubkey,
    use_authority_record_pda: Option<Pubkey>,
    use_authority: Pubkey,
    owner: Pubkey,
    burner: Option<Pubkey>,
    number_of_uses: u64,
) -> Instruction {
    let mut accounts = vec![
        AccountMeta::new(metadata, false),
        AccountMeta::new(token_account, false),
        AccountMeta::new(mint, false),
        AccountMeta::new(use_authority, true),
        AccountMeta::new_readonly(owner, false),
        AccountMeta::new_readonly(Pubkey::from_slice(&SPL_TOKEN_ID.to_bytes()), false),
        AccountMeta::new_readonly(Pubkey::from_slice(
            &spl_associated_token_account::ID.to_bytes(),
        ), false),
        AccountMeta::new_readonly(Pubkey::from_slice(&system_program::ID.to_bytes()), false),
    ];
    if let Some(use_authority_record_pda) = use_authority_record_pda {
        accounts.push(AccountMeta::new(use_authority_record_pda, false));
    }
    if let Some(burner) = burner {
        accounts.push(AccountMeta::new_readonly(burner, false));
    }
    Instruction {
        program_id,
        accounts,
        data: borsh::to_vec(&MetadataInstruction::Utilize(UtilizeArgs { number_of_uses }))
            .unwrap(),
    }
}