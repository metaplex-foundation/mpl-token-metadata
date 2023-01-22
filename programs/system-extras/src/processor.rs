use crate::error::SystemExtrasError;
use borsh::BorshDeserialize;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    program::invoke,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction, system_program,
    sysvar::Sysvar,
};

use crate::instruction::SystemExtrasInstruction;

pub struct Processor;
impl Processor {
    pub fn process_instruction(
        _program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction: SystemExtrasInstruction =
            SystemExtrasInstruction::try_from_slice(instruction_data)?;
        match instruction {
            SystemExtrasInstruction::CreateAccountWithRent {
                space,
                program_id: program_owner,
            } => create_account_with_rent(accounts, space, program_owner),
            SystemExtrasInstruction::TransferAllSol => transfer_all_sol(accounts),
        }
    }
}

fn create_account_with_rent(
    accounts: &[AccountInfo],
    space: u64,
    program_owner: Pubkey,
) -> ProgramResult {
    // Accounts.
    let account_info_iter = &mut accounts.iter();
    let payer = next_account_info(account_info_iter)?;
    let new_account = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    let rent = Rent::get()?;

    // Guards.
    if *system_program.key != system_program::id() {
        return Err(SystemExtrasError::InvalidSystemProgram.into());
    }

    // Fetch the minimum lamports required for rent exemption.
    let lamports: u64 = rent.minimum_balance(space as usize);

    // CPI to the System Program.
    invoke(
        &system_instruction::create_account(
            payer.key,
            new_account.key,
            lamports,
            space,
            &program_owner,
        ),
        &[payer.clone(), new_account.clone(), system_program.clone()],
    )?;

    Ok(())
}

fn transfer_all_sol(accounts: &[AccountInfo]) -> ProgramResult {
    // Accounts.
    let account_info_iter = &mut accounts.iter();
    let source = next_account_info(account_info_iter)?;
    let destination = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    // Guards.
    if *system_program.key != system_program::id() {
        return Err(SystemExtrasError::InvalidSystemProgram.into());
    }

    // CPI to the System Program.
    invoke(
        &system_instruction::transfer(source.key, destination.key, source.lamports()),
        &[source.clone(), destination.clone(), system_program.clone()],
    )?;

    Ok(())
}
