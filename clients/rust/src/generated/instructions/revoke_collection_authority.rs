//! This code was AUTOGENERATED using the kinobi library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun kinobi to update it.
//!
//! [https://github.com/metaplex-foundation/kinobi]
//!

use borsh::BorshDeserialize;
use borsh::BorshSerialize;

/// Accounts.
pub struct RevokeCollectionAuthority {
    /// Collection Authority Record PDA
    pub collection_authority_record: solana_program::pubkey::Pubkey,
    /// Delegated Collection Authority
    pub delegate_authority: solana_program::pubkey::Pubkey,
    /// Update Authority, or Delegated Authority, of Collection NFT
    pub revoke_authority: solana_program::pubkey::Pubkey,
    /// Metadata account
    pub metadata: solana_program::pubkey::Pubkey,
    /// Mint of Metadata
    pub mint: solana_program::pubkey::Pubkey,
}

impl RevokeCollectionAuthority {
    #[allow(clippy::vec_init_then_push)]
    pub fn instruction(&self) -> solana_program::instruction::Instruction {
        let args = RevokeCollectionAuthorityInstructionArgs::new();

        let mut accounts = Vec::with_capacity(5);
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.collection_authority_record,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.delegate_authority,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            self.revoke_authority,
            true,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.metadata,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.mint, false,
        ));

        solana_program::instruction::Instruction {
            program_id: crate::MPL_TOKEN_METADATA_ID,
            accounts,
            data: args.try_to_vec().unwrap(),
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
struct RevokeCollectionAuthorityInstructionArgs {
    discriminator: u8,
}

impl RevokeCollectionAuthorityInstructionArgs {
    pub fn new() -> Self {
        Self { discriminator: 24 }
    }
}

/// Instruction builder.
#[derive(Default)]
pub struct RevokeCollectionAuthorityBuilder {
    collection_authority_record: Option<solana_program::pubkey::Pubkey>,
    delegate_authority: Option<solana_program::pubkey::Pubkey>,
    revoke_authority: Option<solana_program::pubkey::Pubkey>,
    metadata: Option<solana_program::pubkey::Pubkey>,
    mint: Option<solana_program::pubkey::Pubkey>,
}

impl RevokeCollectionAuthorityBuilder {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn collection_authority_record(
        &mut self,
        collection_authority_record: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.collection_authority_record = Some(collection_authority_record);
        self
    }
    pub fn delegate_authority(
        &mut self,
        delegate_authority: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.delegate_authority = Some(delegate_authority);
        self
    }
    pub fn revoke_authority(
        &mut self,
        revoke_authority: solana_program::pubkey::Pubkey,
    ) -> &mut Self {
        self.revoke_authority = Some(revoke_authority);
        self
    }
    pub fn metadata(&mut self, metadata: solana_program::pubkey::Pubkey) -> &mut Self {
        self.metadata = Some(metadata);
        self
    }
    pub fn mint(&mut self, mint: solana_program::pubkey::Pubkey) -> &mut Self {
        self.mint = Some(mint);
        self
    }
    #[allow(clippy::clone_on_copy)]
    pub fn build(&self) -> solana_program::instruction::Instruction {
        let accounts = RevokeCollectionAuthority {
            collection_authority_record: self
                .collection_authority_record
                .expect("collection_authority_record is not set"),
            delegate_authority: self
                .delegate_authority
                .expect("delegate_authority is not set"),
            revoke_authority: self.revoke_authority.expect("revoke_authority is not set"),
            metadata: self.metadata.expect("metadata is not set"),
            mint: self.mint.expect("mint is not set"),
        };

        accounts.instruction()
    }
}

/// `revoke_collection_authority` CPI instruction.
pub struct RevokeCollectionAuthorityCpi<'a> {
    /// The program to invoke.
    pub __program: &'a solana_program::account_info::AccountInfo<'a>,
    /// Collection Authority Record PDA
    pub collection_authority_record: &'a solana_program::account_info::AccountInfo<'a>,
    /// Delegated Collection Authority
    pub delegate_authority: &'a solana_program::account_info::AccountInfo<'a>,
    /// Update Authority, or Delegated Authority, of Collection NFT
    pub revoke_authority: &'a solana_program::account_info::AccountInfo<'a>,
    /// Metadata account
    pub metadata: &'a solana_program::account_info::AccountInfo<'a>,
    /// Mint of Metadata
    pub mint: &'a solana_program::account_info::AccountInfo<'a>,
}

impl<'a> RevokeCollectionAuthorityCpi<'a> {
    pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
        self.invoke_signed(&[])
    }
    #[allow(clippy::clone_on_copy)]
    #[allow(clippy::vec_init_then_push)]
    pub fn invoke_signed(
        &self,
        signers_seeds: &[&[&[u8]]],
    ) -> solana_program::entrypoint::ProgramResult {
        let args = RevokeCollectionAuthorityInstructionArgs::new();

        let mut accounts = Vec::with_capacity(5);
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.collection_authority_record.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.delegate_authority.key,
            false,
        ));
        accounts.push(solana_program::instruction::AccountMeta::new(
            *self.revoke_authority.key,
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

        let instruction = solana_program::instruction::Instruction {
            program_id: crate::MPL_TOKEN_METADATA_ID,
            accounts,
            data: args.try_to_vec().unwrap(),
        };
        let mut account_infos = Vec::with_capacity(5 + 1);
        account_infos.push(self.__program.clone());
        account_infos.push(self.collection_authority_record.clone());
        account_infos.push(self.delegate_authority.clone());
        account_infos.push(self.revoke_authority.clone());
        account_infos.push(self.metadata.clone());
        account_infos.push(self.mint.clone());

        if signers_seeds.is_empty() {
            solana_program::program::invoke(&instruction, &account_infos)
        } else {
            solana_program::program::invoke_signed(&instruction, &account_infos, signers_seeds)
        }
    }
}

/// `revoke_collection_authority` CPI instruction builder.
pub struct RevokeCollectionAuthorityCpiBuilder<'a> {
    instruction: Box<RevokeCollectionAuthorityCpiBuilderInstruction<'a>>,
}

impl<'a> RevokeCollectionAuthorityCpiBuilder<'a> {
    pub fn new(program: &'a solana_program::account_info::AccountInfo<'a>) -> Self {
        let instruction = Box::new(RevokeCollectionAuthorityCpiBuilderInstruction {
            __program: program,
            collection_authority_record: None,
            delegate_authority: None,
            revoke_authority: None,
            metadata: None,
            mint: None,
        });
        Self { instruction }
    }
    pub fn collection_authority_record(
        &mut self,
        collection_authority_record: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.collection_authority_record = Some(collection_authority_record);
        self
    }
    pub fn delegate_authority(
        &mut self,
        delegate_authority: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.delegate_authority = Some(delegate_authority);
        self
    }
    pub fn revoke_authority(
        &mut self,
        revoke_authority: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.revoke_authority = Some(revoke_authority);
        self
    }
    pub fn metadata(
        &mut self,
        metadata: &'a solana_program::account_info::AccountInfo<'a>,
    ) -> &mut Self {
        self.instruction.metadata = Some(metadata);
        self
    }
    pub fn mint(&mut self, mint: &'a solana_program::account_info::AccountInfo<'a>) -> &mut Self {
        self.instruction.mint = Some(mint);
        self
    }
    #[allow(clippy::clone_on_copy)]
    pub fn build(&self) -> RevokeCollectionAuthorityCpi<'a> {
        RevokeCollectionAuthorityCpi {
            __program: self.instruction.__program,

            collection_authority_record: self
                .instruction
                .collection_authority_record
                .expect("collection_authority_record is not set"),

            delegate_authority: self
                .instruction
                .delegate_authority
                .expect("delegate_authority is not set"),

            revoke_authority: self
                .instruction
                .revoke_authority
                .expect("revoke_authority is not set"),

            metadata: self.instruction.metadata.expect("metadata is not set"),

            mint: self.instruction.mint.expect("mint is not set"),
        }
    }
}

struct RevokeCollectionAuthorityCpiBuilderInstruction<'a> {
    __program: &'a solana_program::account_info::AccountInfo<'a>,
    collection_authority_record: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    delegate_authority: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    revoke_authority: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    metadata: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    mint: Option<&'a solana_program::account_info::AccountInfo<'a>>,
}
