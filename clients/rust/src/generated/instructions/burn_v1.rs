//! This code was AUTOGENERATED using the kinobi library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun kinobi to update it.
//!
//! [https://github.com/metaplex-foundation/kinobi]
//!

use borsh::BorshDeserialize;
use borsh::BorshSerialize;

/// Accounts.
pub struct BurnV1 {
    /// Asset owner or Utility delegate
    pub authority: solana_program::pubkey::Pubkey,
    /// Metadata of the Collection
    pub collection_metadata: Option<solana_program::pubkey::Pubkey>,
    /// Metadata (pda of ['metadata', program id, mint id])
    pub metadata: solana_program::pubkey::Pubkey,
    /// Edition of the asset
    pub edition: Option<solana_program::pubkey::Pubkey>,
    /// Mint of token asset
    pub mint: solana_program::pubkey::Pubkey,
    /// Token account to close
    pub token: solana_program::pubkey::Pubkey,
    /// Master edition account
    pub master_edition: Option<solana_program::pubkey::Pubkey>,
    /// Master edition mint of the asset
    pub master_edition_mint: Option<solana_program::pubkey::Pubkey>,
    /// Master edition token account
    pub master_edition_token: Option<solana_program::pubkey::Pubkey>,
    /// Edition marker account
    pub edition_marker: Option<solana_program::pubkey::Pubkey>,
    /// Token record account
    pub token_record: Option<solana_program::pubkey::Pubkey>,
    /// System program
    pub system_program: solana_program::pubkey::Pubkey,
    /// Instructions sysvar account
    pub sysvar_instructions: solana_program::pubkey::Pubkey,
    /// SPL Token Program
    pub spl_token_program: solana_program::pubkey::Pubkey,
}

impl BurnV1 {
    #[allow(clippy::vec_init_then_push)]
    pub fn instruction(&self) -> solana_program::instruction::Instruction {
        let args = BurnV1InstructionArgs::new();

        let mut accounts = Vec::with_capacity(14);
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.authority,
            true,
        ));
        if let Some(collection_metadata) = self.collection_metadata {
            accounts.push(solana_program::instruction::AccountMeta::new(
                collection_metadata,
                false,
            ));
        } else {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                crate::MPL_TOKEN_METADATA_ID,
                false,
            ));
        }
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.metadata,
            false,
        ));
        if let Some(edition) = self.edition {
            accounts.push(solana_program::instruction::AccountMeta::new(
                edition, false,
            ));
        } else {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                crate::MPL_TOKEN_METADATA_ID,
                false,
            ));
        }
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.mint, false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.token, false,
        ));
        if let Some(master_edition) = self.master_edition {
            accounts.push(solana_program::instruction::AccountMeta::new(
                master_edition,
                false,
            ));
        } else {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                crate::MPL_TOKEN_METADATA_ID,
                false,
            ));
        }
        if let Some(master_edition_mint) = self.master_edition_mint {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                master_edition_mint,
                false,
            ));
        } else {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                crate::MPL_TOKEN_METADATA_ID,
                false,
            ));
        }
        if let Some(master_edition_token) = self.master_edition_token {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                master_edition_token,
                false,
            ));
        } else {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                crate::MPL_TOKEN_METADATA_ID,
                false,
            ));
        }
        if let Some(edition_marker) = self.edition_marker {
            accounts.push(solana_program::instruction::AccountMeta::new(
                edition_marker,
                false,
            ));
        } else {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                crate::MPL_TOKEN_METADATA_ID,
                false,
            ));
        }
        if let Some(token_record) = self.token_record {
            accounts.push(solana_program::instruction::AccountMeta::new(
                token_record,
                false,
            ));
        } else {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                crate::MPL_TOKEN_METADATA_ID,
                false,
            ));
        }
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.system_program,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.sysvar_instructions,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.spl_token_program,
            false,
        ));

        solana_program::instruction::Instruction {
            program_id: crate::MPL_TOKEN_METADATA_ID,
            accounts,
            data: args.try_to_vec().unwrap(),
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
struct BurnV1InstructionArgs {
    discriminator: u8,
    burn_v1_discriminator: u8,
    pub amount: u64,
}

impl BurnV1InstructionArgs {
    pub fn new() -> Self {
        Self {
            discriminator: 41,
            burn_v1_discriminator: 0,
            amount: 1,
        }
    }
}

/// Instruction builder.
#[derive(Default)]
pub struct BurnV1Builder {
    authority: Option<solana_program::pubkey::Pubkey>,
    collection_metadata: Option<solana_program::pubkey::Pubkey>,
    metadata: Option<solana_program::pubkey::Pubkey>,
    edition: Option<solana_program::pubkey::Pubkey>,
    mint: Option<solana_program::pubkey::Pubkey>,
    token: Option<solana_program::pubkey::Pubkey>,
    master_edition: Option<solana_program::pubkey::Pubkey>,
    master_edition_mint: Option<solana_program::pubkey::Pubkey>,
    master_edition_token: Option<solana_program::pubkey::Pubkey>,
    edition_marker: Option<solana_program::pubkey::Pubkey>,
    token_record: Option<solana_program::pubkey::Pubkey>,
    system_program: Option<solana_program::pubkey::Pubkey>,
    sysvar_instructions: Option<solana_program::pubkey::Pubkey>,
    spl_token_program: Option<solana_program::pubkey::Pubkey>,
    amount: Option<u64>,
}

impl BurnV1Builder {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn authority(&mut self, authority: solana_program::pubkey::Pubkey) -> &mut Self {
        self.authority = Some(authority);
        self
    }
    pub fn collection_metadata(
        &mut self,
        collection_metadata: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.collection_metadata = Some(collection_metadata);
        self
    }
    pub fn metadata(&mut self, metadata: solana_program::pubkey::Pubkey) -> &mut Self {
        self.metadata = Some(metadata);
        self
    }
    pub fn edition(&mut self, edition: solana_program::pubkey::Pubkey) -> &mut Self {
        self.edition = Some(edition);
        self
    }
    pub fn mint(&mut self, mint: solana_program::pubkey::Pubkey) -> &mut Self {
        self.mint = Some(mint);
        self
    }
    pub fn token(&mut self, token: solana_program::pubkey::Pubkey) -> &mut Self {
        self.token = Some(token);
        self
    }
    pub fn master_edition(&mut self, master_edition: solana_program::pubkey::Pubkey) -> &mut Self {
        self.master_edition = Some(master_edition);
        self
    }
    pub fn master_edition_mint(
        &mut self,
        master_edition_mint: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.master_edition_mint = Some(master_edition_mint);
        self
    }
    pub fn master_edition_token(
        &mut self,
        master_edition_token: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.master_edition_token = Some(master_edition_token);
        self
    }
    pub fn edition_marker(&mut self, edition_marker: solana_program::pubkey::Pubkey) -> &mut Self {
        self.edition_marker = Some(edition_marker);
        self
    }
    pub fn token_record(&mut self, token_record: solana_program::pubkey::Pubkey) -> &mut Self {
        self.token_record = Some(token_record);
        self
    }
    pub fn system_program(&mut self, system_program: solana_program::pubkey::Pubkey) -> &mut Self {
        self.system_program = Some(system_program);
        self
    }
    pub fn sysvar_instructions(
        &mut self,
        sysvar_instructions: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.sysvar_instructions = Some(sysvar_instructions);
        self
    }
    pub fn spl_token_program(
        &mut self,
        spl_token_program: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.spl_token_program = Some(spl_token_program);
        self
    }
    pub fn amount(&mut self, amount: u64) -> &mut Self {
        self.amount = Some(amount);
        self
    }
    #[allow(clippy::clone_on_copy)]
    pub fn build(&self) -> solana_program::instruction::Instruction {
        let accounts = BurnV1 {
            authority: self.authority.expect("authority is not set"),
            collection_metadata: self.collection_metadata,
            metadata: self.metadata.expect("metadata is not set"),
            edition: self.edition,
            mint: self.mint.expect("mint is not set"),
            token: self.token.expect("token is not set"),
            master_edition: self.master_edition,
            master_edition_mint: self.master_edition_mint,
            master_edition_token: self.master_edition_token,
            edition_marker: self.edition_marker,
            token_record: self.token_record,
            system_program: self
                .system_program
                .unwrap_or(solana_program::pubkey!("11111111111111111111111111111111")),
            sysvar_instructions: self.sysvar_instructions.unwrap_or(solana_program::pubkey!(
                "Sysvar1nstructions1111111111111111111111111"
            )),
            spl_token_program: self.spl_token_program.unwrap_or(solana_program::pubkey!(
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            )),
        };

        accounts.instruction()
    }
}

/// `burn_v1` CPI instruction.
pub struct BurnV1Cpi<'a> {
    /// The program to invoke.
    pub __program: &'a solana_program::account_info::AccountInfo<'a>,
    /// Asset owner or Utility delegate
    pub authority: &'a solana_program::account_info::AccountInfo<'a>,
    /// Metadata of the Collection
    pub collection_metadata: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    /// Metadata (pda of ['metadata', program id, mint id])
    pub metadata: &'a solana_program::account_info::AccountInfo<'a>,
    /// Edition of the asset
    pub edition: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    /// Mint of token asset
    pub mint: &'a solana_program::account_info::AccountInfo<'a>,
    /// Token account to close
    pub token: &'a solana_program::account_info::AccountInfo<'a>,
    /// Master edition account
    pub master_edition: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    /// Master edition mint of the asset
    pub master_edition_mint: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    /// Master edition token account
    pub master_edition_token: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    /// Edition marker account
    pub edition_marker: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    /// Token record account
    pub token_record: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    /// System program
    pub system_program: &'a solana_program::account_info::AccountInfo<'a>,
    /// Instructions sysvar account
    pub sysvar_instructions: &'a solana_program::account_info::AccountInfo<'a>,
    /// SPL Token Program
    pub spl_token_program: &'a solana_program::account_info::AccountInfo<'a>,
}

impl<'a> BurnV1Cpi<'a> {
    pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed(&[])
    }
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed(
        &self,
        signers_seeds: &[&[&[u8]]],
    ) -> solana_program::entrypoint::ProgramResult {
        let args = BurnV1InstructionArgs::new();

        let mut accounts = Vec::with_capacity(14);
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.authority.key,
            true,
        ));
        if let Some(collection_metadata) = self.collection_metadata {
            accounts.push(solana_program::instruction::AccountMeta::new(
                *collection_metadata.key,
                false,
            ));
        } else {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                crate::MPL_TOKEN_METADATA_ID,
                false,
            ));
        }
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.metadata.key,
            false,
        ));
        if let Some(edition) = self.edition {
            accounts.push(solana_program::instruction::AccountMeta::new(
                *edition.key,
                false,
            ));
        }
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.mint.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.token.key,
            false,
        ));
        if let Some(master_edition) = self.master_edition {
            accounts.push(solana_program::instruction::AccountMeta::new(
                *master_edition.key,
                false,
            ));
        }
        if let Some(master_edition_mint) = self.master_edition_mint {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                *master_edition_mint.key,
                false,
            ));
        } else {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                crate::MPL_TOKEN_METADATA_ID,
                false,
            ));
        }
        if let Some(master_edition_token) = self.master_edition_token {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                *master_edition_token.key,
                false,
            ));
        } else {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                crate::MPL_TOKEN_METADATA_ID,
                false,
            ));
        }
        if let Some(edition_marker) = self.edition_marker {
            accounts.push(solana_program::instruction::AccountMeta::new(
                *edition_marker.key,
                false,
            ));
        } else {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                crate::MPL_TOKEN_METADATA_ID,
                false,
            ));
        }
        if let Some(token_record) = self.token_record {
            accounts.push(solana_program::instruction::AccountMeta::new(
                *token_record.key,
                false,
            ));
        }
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.system_program.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.sysvar_instructions.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.spl_token_program.key,
            false,
        ));

        let instruction = solana_program::instruction::Instruction {
            program_id: crate::MPL_TOKEN_METADATA_ID,
            accounts,
            data: args.try_to_vec().unwrap(),
        };
        let mut account_infos = Vec::with_capacity(14 + 1);
        account_infos.push(self.__program.clone());
        account_infos.push(self.authority.clone());
        if let Some(collection_metadata) = self.collection_metadata {
            account_infos.push(collection_metadata.clone());
        }
        account_infos.push(self.metadata.clone());
        if let Some(edition) = self.edition {
            account_infos.push(edition.clone());
        }
        account_infos.push(self.mint.clone());
        account_infos.push(self.token.clone());
        if let Some(master_edition) = self.master_edition {
            account_infos.push(master_edition.clone());
        }
        if let Some(master_edition_mint) = self.master_edition_mint {
            account_infos.push(master_edition_mint.clone());
        }
        if let Some(master_edition_token) = self.master_edition_token {
            account_infos.push(master_edition_token.clone());
        }
        if let Some(edition_marker) = self.edition_marker {
            account_infos.push(edition_marker.clone());
        }
        if let Some(token_record) = self.token_record {
            account_infos.push(token_record.clone());
        }
        account_infos.push(self.system_program.clone());
        account_infos.push(self.sysvar_instructions.clone());
        account_infos.push(self.spl_token_program.clone());

        if signers_seeds.is_empty() {
            solana_program::program::invoke(&instruction, &account_infos)
        } else {
            solana_program::program::invoke_signed(&instruction, &account_infos, signers_seeds)
        }
    }
}

/// `burn_v1` CPI instruction builder.
pub struct BurnV1CpiBuilder<'a> {
    instruction: Box<BurnV1CpiBuilderInstruction<'a>>,
}

impl<'a> BurnV1CpiBuilder<'a> {
    pub fn new(program: &'a solana_program::account_info::AccountInfo<'a>) -> Self {
        let instruction = Box::new(BurnV1CpiBuilderInstruction {
            __program: program,
            authority: None,
            collection_metadata: None,
            metadata: None,
            edition: None,
            mint: None,
            token: None,
            master_edition: None,
            master_edition_mint: None,
            master_edition_token: None,
            edition_marker: None,
            token_record: None,
            system_program: None,
            sysvar_instructions: None,
            spl_token_program: None,
            amount: None,
        });
        Self { instruction }
    }
    pub fn authority(
        &mut self,
        authority: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.authority = Some(authority);
        self
    }
    pub fn collection_metadata(
        &mut self,
        collection_metadata: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.collection_metadata = Some(collection_metadata);
        self
    }
    pub fn metadata(
        &mut self,
        metadata: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.metadata = Some(metadata);
        self
    }
    pub fn edition(
        &mut self,
        edition: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.edition = Some(edition);
        self
    }
    pub fn mint(&mut self, mint: &'a solana_program::account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.mint = Some(mint);
        self
    }
    pub fn token(&mut self, token: &'a solana_program::account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.token = Some(token);
        self
    }
    pub fn master_edition(
        &mut self,
        master_edition: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.master_edition = Some(master_edition);
        self
    }
    pub fn master_edition_mint(
        &mut self,
        master_edition_mint: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.master_edition_mint = Some(master_edition_mint);
        self
    }
    pub fn master_edition_token(
        &mut self,
        master_edition_token: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.master_edition_token = Some(master_edition_token);
        self
    }
    pub fn edition_marker(
        &mut self,
        edition_marker: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.edition_marker = Some(edition_marker);
        self
    }
    pub fn token_record(
        &mut self,
        token_record: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.token_record = Some(token_record);
        self
    }
    pub fn system_program(
        &mut self,
        system_program: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.system_program = Some(system_program);
        self
    }
    pub fn sysvar_instructions(
        &mut self,
        sysvar_instructions: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.sysvar_instructions = Some(sysvar_instructions);
        self
    }
    pub fn spl_token_program(
        &mut self,
        spl_token_program: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.spl_token_program = Some(spl_token_program);
        self
    }
    pub fn amount(&mut self, amount: u64) -> &mut Self {
        self.instruction.amount = Some(amount);
        self
    }
    #[allow(clippy::clone_on_copy)]
    pub fn build(&self) -> BurnV1Cpi<'a> {
        BurnV1Cpi {
            __program: self.instruction.__program,

            authority: self.instruction.authority.expect("authority is not set"),

            collection_metadata: self.instruction.collection_metadata,

            metadata: self.instruction.metadata.expect("metadata is not set"),

            edition: self.instruction.edition,

            mint: self.instruction.mint.expect("mint is not set"),

            token: self.instruction.token.expect("token is not set"),

            master_edition: self.instruction.master_edition,

            master_edition_mint: self.instruction.master_edition_mint,

            master_edition_token: self.instruction.master_edition_token,

            edition_marker: self.instruction.edition_marker,

            token_record: self.instruction.token_record,

            system_program: self
                .instruction
                .system_program
                .expect("system_program is not set"),

            sysvar_instructions: self
                .instruction
                .sysvar_instructions
                .expect("sysvar_instructions is not set"),

            spl_token_program: self
                .instruction
                .spl_token_program
                .expect("spl_token_program is not set"),
        }
    }
}

struct BurnV1CpiBuilderInstruction<'a> {
    __program: &'a solana_program::account_info::AccountInfo<'a>,
    authority: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    collection_metadata: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    metadata: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    edition: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    mint: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    token: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    master_edition: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    master_edition_mint: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    master_edition_token: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    edition_marker: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    token_record: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    system_program: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    sysvar_instructions: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    spl_token_program: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    amount: Option<u64>,
}
