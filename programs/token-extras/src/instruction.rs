use borsh::{BorshDeserialize, BorshSerialize};
use shank::ShankInstruction;
use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    system_program,
};

#[derive(Debug, Clone, ShankInstruction, BorshSerialize, BorshDeserialize)]
#[rustfmt::skip]
pub enum TokenExtrasInstruction {
    /// Creates a new associated token account for the given mint and owner, if and only if
    /// the given token account does not exists and the token account is the same as the
    /// associated token account. That way, clients can ensure that, after this instruction,
    /// the token account will exists.
    ///
    /// Notice this instruction asks for both the token account and the associated token account (ATA)
    /// These may or may not be the same account. Here are all the possible cases:
    ///
    /// - Token exists and Token is ATA: Instruction succeeds.
    /// - Token exists and Token is not ATA: Instruction succeeds.
    /// - Token does not exist and Token is ATA: Instruction creates the ATA account and succeeds.
    /// - Token does not exist and Token is not ATA: Instruction fails as we cannot create a
    ///    non-ATA account without it being a signer.
    ///
    /// Note that additional checks are made to ensure that the token account provided
    /// matches the mint account and owner account provided.
    #[account(0, writable, signer, name="payer", desc = "The account paying for the token account creation if needed")]
    #[account(1, name="token", desc = "The token account that may or may not exist")]
    #[account(2, name="mint", desc = "The mint account of the provided token account")]
    #[account(3, name="owner", desc = "The owner of the provided token account")]
    #[account(4, writable, name="ata", desc = "The associated token account which may be the same as the token account")]
    #[account(5, name="system_program", desc = "System program")]
    #[account(6, name="token_program", desc = "Token program")]
    #[account(7, name="ata_program", desc = "Associated Token program")]
    CreateTokenIfMissing,
}

pub fn create_token_if_missing_instruction(
    payer: &Pubkey,
    token: &Pubkey,
    mint: &Pubkey,
    owner: &Pubkey,
    ata: &Pubkey,
) -> Instruction {
    Instruction {
        program_id: crate::ID,
        accounts: vec![
            AccountMeta::new(*payer, true),
            AccountMeta::new_readonly(*token, false),
            AccountMeta::new_readonly(*mint, false),
            AccountMeta::new_readonly(*owner, false),
            AccountMeta::new(*ata, false),
            AccountMeta::new_readonly(system_program::id(), false),
            AccountMeta::new_readonly(spl_token::id(), false),
            AccountMeta::new_readonly(spl_associated_token_account::id(), false),
        ],
        data: TokenExtrasInstruction::CreateTokenIfMissing
            .try_to_vec()
            .unwrap(),
    }
}
