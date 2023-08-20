//! This code was AUTOGENERATED using the kinobi library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun kinobi to update it.
//!
//! [https://github.com/metaplex-foundation/kinobi]
//!

use borsh::BorshDeserialize;
use borsh::BorshSerialize;

/// Accounts.
pub struct ApproveCollectionAuthority {
    /// Collection Authority Record PDA
    pub collection_authority_record: solana_program::pubkey::Pubkey,
    /// A Collection Authority
    pub new_collection_authority: solana_program::pubkey::Pubkey,
    /// Update Authority of Collection NFT
    pub update_authority: solana_program::pubkey::Pubkey,
    /// Payer
    pub payer: solana_program::pubkey::Pubkey,
    /// Collection Metadata account
    pub metadata: solana_program::pubkey::Pubkey,
    /// Mint of Collection Metadata
    pub mint: solana_program::pubkey::Pubkey,
    /// System program
    pub system_program: solana_program::pubkey::Pubkey,
    /// Rent info
    pub rent: Option<solana_program::pubkey::Pubkey>,
}

impl ApproveCollectionAuthority {
    #[allow(clippy::vec_init_then_push)]
    pub fn instruction(&self) -> solana_program::instruction::Instruction {
        let args = ApproveCollectionAuthorityInstructionArgs::new();

        let mut accounts = Vec::with_capacity(8);
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.collection_authority_record,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.new_collection_authority,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.update_authority,
            true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.payer, true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.metadata,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.mint, false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.system_program,
            false,
        ));
        if let Some(rent) = self.rent {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                rent, false,
            ));
        } else {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                crate::TOKEN_METADATA_ID,
                false,
            ));
        }

        solana_program::instruction::Instruction {
            program_id: crate::TOKEN_METADATA_ID,
            accounts,
            data: args.try_to_vec().unwrap(),
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
struct ApproveCollectionAuthorityInstructionArgs {
    discriminator: u8,
}

impl ApproveCollectionAuthorityInstructionArgs {
    pub fn new() -> Self {
        Self { discriminator: 23 }
    }
}

/// Instruction builder.
#[derive(Default)]
pub struct ApproveCollectionAuthorityBuilder {
    collection_authority_record: Option<solana_program::pubkey::Pubkey>,
    new_collection_authority: Option<solana_program::pubkey::Pubkey>,
    update_authority: Option<solana_program::pubkey::Pubkey>,
    payer: Option<solana_program::pubkey::Pubkey>,
    metadata: Option<solana_program::pubkey::Pubkey>,
    mint: Option<solana_program::pubkey::Pubkey>,
    system_program: Option<solana_program::pubkey::Pubkey>,
    rent: Option<solana_program::pubkey::Pubkey>,
}

impl ApproveCollectionAuthorityBuilder {
    pub fn new() -> Self {
        Self::default()
    }
    /// Collection Authority Record PDA
    #[inline(always)]
    pub fn collection_authority_record(
        &mut self,
        collection_authority_record: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.collection_authority_record = Some(collection_authority_record);
        self
    }
    /// A Collection Authority
    #[inline(always)]
    pub fn new_collection_authority(
        &mut self,
        new_collection_authority: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.new_collection_authority = Some(new_collection_authority);
        self
    }
    /// Update Authority of Collection NFT
    #[inline(always)]
    pub fn update_authority(
        &mut self,
        update_authority: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.update_authority = Some(update_authority);
        self
    }
    /// Payer
    #[inline(always)]
    pub fn payer(&mut self, payer: solana_program::pubkey::Pubkey) -> &mut Self {
        self.payer = Some(payer);
        self
    }
    /// Collection Metadata account
    #[inline(always)]
    pub fn metadata(&mut self, metadata: solana_program::pubkey::Pubkey) -> &mut Self {
        self.metadata = Some(metadata);
        self
    }
    /// Mint of Collection Metadata
    #[inline(always)]
    pub fn mint(&mut self, mint: solana_program::pubkey::Pubkey) -> &mut Self {
        self.mint = Some(mint);
        self
    }
    /// System program
    #[inline(always)]
    pub fn system_program(&mut self, system_program: solana_program::pubkey::Pubkey) -> &mut Self {
        self.system_program = Some(system_program);
        self
    }
    /// `[optional account]`
    /// Rent info
    #[inline(always)]
    pub fn rent(&mut self, rent: solana_program::pubkey::Pubkey) -> &mut Self {
        self.rent = Some(rent);
        self
    }
    #[allow(clippy::clone_on_copy)]
    pub fn build(&self) -> solana_program::instruction::Instruction {
        let accounts = ApproveCollectionAuthority {
            collection_authority_record: self
                .collection_authority_record
                .expect("collection_authority_record is not set"),
            new_collection_authority: self
                .new_collection_authority
                .expect("new_collection_authority is not set"),
            update_authority: self.update_authority.expect("update_authority is not set"),
            payer: self.payer.expect("payer is not set"),
            metadata: self.metadata.expect("metadata is not set"),
            mint: self.mint.expect("mint is not set"),
            system_program: self
                .system_program
                .unwrap_or(solana_program::pubkey!("11111111111111111111111111111111")),
            rent: self.rent,
        };

        accounts.instruction()
    }
}

/// `approve_collection_authority` CPI instruction.
pub struct ApproveCollectionAuthorityCpi<'a> {
    /// The program to invoke.
    pub __program: &'a solana_program::account_info::AccountInfo<'a>,
    /// Collection Authority Record PDA
    pub collection_authority_record: &'a solana_program::account_info::AccountInfo<'a>,
    /// A Collection Authority
    pub new_collection_authority: &'a solana_program::account_info::AccountInfo<'a>,
    /// Update Authority of Collection NFT
    pub update_authority: &'a solana_program::account_info::AccountInfo<'a>,
    /// Payer
    pub payer: &'a solana_program::account_info::AccountInfo<'a>,
    /// Collection Metadata account
    pub metadata: &'a solana_program::account_info::AccountInfo<'a>,
    /// Mint of Collection Metadata
    pub mint: &'a solana_program::account_info::AccountInfo<'a>,
    /// System program
    pub system_program: &'a solana_program::account_info::AccountInfo<'a>,
    /// Rent info
    pub rent: Option<&'a solana_program::account_info::AccountInfo<'a>>,
}

impl<'a> ApproveCollectionAuthorityCpi<'a> {
    pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed(&[])
    }
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed(
        &self,
        signers_seeds: &[&[&[u8]]],
    ) -> solana_program::entrypoint::ProgramResult {
        let args = ApproveCollectionAuthorityInstructionArgs::new();

        let mut accounts = Vec::with_capacity(8);
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.collection_authority_record.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.new_collection_authority.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.update_authority.key,
            true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.payer.key,
            true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.metadata.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.mint.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.system_program.key,
            false,
        ));
        if let Some(rent) = self.rent {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                *rent.key, false,
            ));
        } else {
            accounts.push(solana_program::instruction::AccountMeta::new_readonly(
                crate::TOKEN_METADATA_ID,
                false,
            ));
        }

        let instruction = solana_program::instruction::Instruction {
            program_id: crate::TOKEN_METADATA_ID,
            accounts,
            data: args.try_to_vec().unwrap(),
        };
        let mut account_infos = Vec::with_capacity(8 + 1);
        account_infos.push(self.__program.clone());
        account_infos.push(self.collection_authority_record.clone());
        account_infos.push(self.new_collection_authority.clone());
        account_infos.push(self.update_authority.clone());
        account_infos.push(self.payer.clone());
        account_infos.push(self.metadata.clone());
        account_infos.push(self.mint.clone());
        account_infos.push(self.system_program.clone());
        if let Some(rent) = self.rent {
            account_infos.push(rent.clone());
        }

        if signers_seeds.is_empty() {
            solana_program::program::invoke(&instruction, &account_infos)
        } else {
            solana_program::program::invoke_signed(&instruction, &account_infos, signers_seeds)
        }
    }
}

/// `approve_collection_authority` CPI instruction builder.
pub struct ApproveCollectionAuthorityCpiBuilder<'a> {
    instruction: Box<ApproveCollectionAuthorityCpiBuilderInstruction<'a>>,
}

impl<'a> ApproveCollectionAuthorityCpiBuilder<'a> {
    pub fn new(program: &'a solana_program::account_info::AccountInfo<'a>) -> Self {
        let instruction = Box::new(ApproveCollectionAuthorityCpiBuilderInstruction {
            __program: program,
            collection_authority_record: None,
            new_collection_authority: None,
            update_authority: None,
            payer: None,
            metadata: None,
            mint: None,
            system_program: None,
            rent: None,
        });
        Self { instruction }
    }
    /// Collection Authority Record PDA
    #[inline(always)]
    pub fn collection_authority_record(
        &mut self,
        collection_authority_record: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.collection_authority_record = Some(collection_authority_record);
        self
    }
    /// A Collection Authority
    #[inline(always)]
    pub fn new_collection_authority(
        &mut self,
        new_collection_authority: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.new_collection_authority = Some(new_collection_authority);
        self
    }
    /// Update Authority of Collection NFT
    #[inline(always)]
    pub fn update_authority(
        &mut self,
        update_authority: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.update_authority = Some(update_authority);
        self
    }
    /// Payer
    #[inline(always)]
    pub fn payer(&mut self, payer: &'a solana_program::account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.payer = Some(payer);
        self
    }
    /// Collection Metadata account
    #[inline(always)]
    pub fn metadata(
        &mut self,
        metadata: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.metadata = Some(metadata);
        self
    }
    /// Mint of Collection Metadata
    #[inline(always)]
    pub fn mint(&mut self, mint: &'a solana_program::account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.mint = Some(mint);
        self
    }
    /// System program
    #[inline(always)]
    pub fn system_program(
        &mut self,
        system_program: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.system_program = Some(system_program);
        self
    }
    /// `[optional account]`
    /// Rent info
    #[inline(always)]
    pub fn rent(&mut self, rent: &'a solana_program::account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.rent = Some(rent);
        self
    }
    #[allow(clippy::clone_on_copy)]
    pub fn build(&self) -> ApproveCollectionAuthorityCpi<'a> {
        ApproveCollectionAuthorityCpi {
            __program: self.instruction.__program,

            collection_authority_record: self
                .instruction
                .collection_authority_record
                .expect("collection_authority_record is not set"),

            new_collection_authority: self
                .instruction
                .new_collection_authority
                .expect("new_collection_authority is not set"),

            update_authority: self
                .instruction
                .update_authority
                .expect("update_authority is not set"),

            payer: self.instruction.payer.expect("payer is not set"),

            metadata: self.instruction.metadata.expect("metadata is not set"),

            mint: self.instruction.mint.expect("mint is not set"),

            system_program: self
                .instruction
                .system_program
                .expect("system_program is not set"),

            rent: self.instruction.rent,
        }
    }
}

struct ApproveCollectionAuthorityCpiBuilderInstruction<'a> {
    __program: &'a solana_program::account_info::AccountInfo<'a>,
    collection_authority_record: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    new_collection_authority: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    update_authority: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    payer: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    metadata: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    mint: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    system_program: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    rent: Option<&'a solana_program::account_info::AccountInfo<'a>>,
}
