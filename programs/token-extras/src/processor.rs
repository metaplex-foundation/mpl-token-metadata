use crate::error::TokenExtrasError;
use borsh::BorshDeserialize;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    program::invoke,
    program_pack::Pack,
    pubkey::Pubkey,
    system_program,
};
use spl_associated_token_account::get_associated_token_address;

use crate::instruction::TokenExtrasInstruction;

pub struct Processor;

impl Processor {
    pub fn process_instruction(
        _program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction: TokenExtrasInstruction =
            TokenExtrasInstruction::try_from_slice(instruction_data)?;
        match instruction {
            TokenExtrasInstruction::CreateTokenIfMissing => create_token_if_missing(accounts),
        }
    }
}

fn create_token_if_missing(accounts: &[AccountInfo]) -> ProgramResult {
    // Accounts.
    let account_info_iter = &mut accounts.iter();
    let payer = next_account_info(account_info_iter)?;
    let token = next_account_info(account_info_iter)?;
    let mint = next_account_info(account_info_iter)?;
    let owner = next_account_info(account_info_iter)?;
    let ata = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let ata_program = next_account_info(account_info_iter)?;
    let computed_ata = get_associated_token_address(owner.key, mint.key);

    // Guards.
    if *system_program.key != system_program::id() {
        return Err(TokenExtrasError::InvalidSystemProgram.into());
    }
    if *token_program.key != spl_token::id() {
        return Err(TokenExtrasError::InvalidTokenProgram.into());
    }
    if *ata_program.key != spl_associated_token_account::id() {
        return Err(TokenExtrasError::InvalidAssociatedTokenProgram.into());
    }
    if *ata.key != computed_ata {
        return Err(TokenExtrasError::InvalidAssociatedTokenAccount.into());
    }

    if !token.data_is_empty() {
        let parsed_token = spl_token::state::Account::unpack(&token.data.borrow())?;
        if *token.owner != *token_program.key {
            return Err(TokenExtrasError::InvalidProgramOwner.into());
        }
        if parsed_token.mint != *mint.key {
            return Err(TokenExtrasError::InvalidTokenMint.into());
        }
        if parsed_token.owner != *owner.key {
            return Err(TokenExtrasError::InvalidTokenOwner.into());
        }
        return Ok(());
    }

    if *token.key != *ata.key {
        return Err(TokenExtrasError::CannotCreateNonAssociatedToken.into());
    }

    // Create and initialize the associated token account.
    invoke(
        &spl_associated_token_account::instruction::create_associated_token_account(
            payer.key,
            owner.key,
            mint.key,
            token_program.key,
        ),
        &[payer.clone(), owner.clone(), mint.clone(), token.clone()],
    )?;

    Ok(())
}
