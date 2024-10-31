use borsh::BorshDeserialize;
use solana_sdk::{
    pubkey::Pubkey, signature::Signer, signer::keypair::Keypair, transaction::Transaction,
};
use token_metadata::{
    instruction::{self, builders::ResizeBuilder, InstructionBuilder},
    pda::find_master_edition_account,
    state::{
        Collection, CollectionDetails, Creator, DataV2, Metadata as TmMetadata,
        TokenMetadataAccount, TokenStandard, Uses, CREATE_FEE, FEE_FLAG_SET,
        METADATA_FEE_FLAG_OFFSET, PREFIX,
    },
    ID,
};

use crate::*;

#[derive(Debug)]
pub struct Metadata {
    pub mint: Keypair,
    pub pubkey: Pubkey,
    pub token: Keypair,
    pub spl_token_program: Pubkey,
}

impl Metadata {
    pub fn new() -> Self {
        let mint = Keypair::new();
        let mint_pubkey = mint.pubkey();
        let program_id = ID;

        let metadata_seeds = &[PREFIX.as_bytes(), program_id.as_ref(), mint_pubkey.as_ref()];
        let (pubkey, _) = Pubkey::find_program_address(metadata_seeds, &ID);

        Metadata {
            mint,
            pubkey,
            token: Keypair::new(),
            spl_token_program: spl_token::ID,
        }
    }

    pub async fn into_digital_asset(
        self,
        context: &mut ProgramTestContext,
        edition: Option<Pubkey>,
    ) -> DigitalAsset {
        let token_record = if self.is_pnft(context).await {
            Some(self.token.pubkey())
        } else {
            None
        };

        let md = self.get_metadata(context).await;

        DigitalAsset {
            metadata: self.pubkey,
            mint: self.mint,
            token: Some(self.token.pubkey()),
            edition,
            token_record,
            token_standard: md.token_standard,
            edition_num: None,
        }
    }

    pub async fn get_data(
        &self,
        context: &mut ProgramTestContext,
    ) -> token_metadata::state::Metadata {
        let account = get_account(context, &self.pubkey).await;
        BorshDeserialize::deserialize(&mut &account.data[..]).unwrap()
    }

    pub async fn is_pnft(&self, context: &mut ProgramTestContext) -> bool {
        let md = self.get_metadata(context).await;
        if let Some(standard) = md.token_standard {
            if standard == TokenStandard::ProgrammableNonFungible {
                return true;
            }
        }

        false
    }

    pub async fn get_metadata(&self, context: &mut ProgramTestContext) -> TmMetadata {
        let metadata_account = context
            .banks_client
            .get_account(self.pubkey)
            .await
            .unwrap()
            .unwrap();

        TmMetadata::safe_deserialize(&metadata_account.data).unwrap()
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn create_v3(
        &self,
        context: &mut ProgramTestContext,
        name: String,
        symbol: String,
        uri: String,
        creators: Option<Vec<Creator>>,
        seller_fee_basis_points: u16,
        is_mutable: bool,
        collection: Option<Collection>,
        uses: Option<Uses>,
        collection_details: Option<CollectionDetails>,
    ) -> Result<(), BanksClientError> {
        create_mint(
            context,
            &self.mint,
            &context.payer.pubkey(),
            Some(&context.payer.pubkey()),
            0,
            &self.spl_token_program,
        )
        .await?;
        create_token_account(
            context,
            &self.token,
            &self.mint.pubkey(),
            &context.payer.pubkey(),
            &self.spl_token_program,
        )
        .await?;
        mint_tokens(
            context,
            &self.mint.pubkey(),
            &self.token.pubkey(),
            1,
            &context.payer.pubkey(),
            None,
            &self.spl_token_program,
        )
        .await?;

        let tx = Transaction::new_signed_with_payer(
            &[instruction::create_metadata_accounts_v3(
                ID,
                self.pubkey,
                self.mint.pubkey(),
                context.payer.pubkey(),
                context.payer.pubkey(),
                context.payer.pubkey(),
                name,
                symbol,
                uri,
                creators,
                seller_fee_basis_points,
                false,
                is_mutable,
                collection,
                uses,
                collection_details,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );

        context.banks_client.process_transaction(tx).await?;

        #[cfg(feature = "padded")]
        {
            upsize_metadata(context, &self.pubkey).await;
        }

        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn create_fungible_v3(
        &self,
        context: &mut ProgramTestContext,
        name: String,
        symbol: String,
        uri: String,
        creators: Option<Vec<Creator>>,
        seller_fee_basis_points: u16,
        is_mutable: bool,
        collection: Option<Collection>,
        uses: Option<Uses>,
    ) -> Result<(), BanksClientError> {
        create_mint(
            context,
            &self.mint,
            &context.payer.pubkey(),
            Some(&context.payer.pubkey()),
            0,
            &self.spl_token_program,
        )
        .await?;
        create_token_account(
            context,
            &self.token,
            &self.mint.pubkey(),
            &context.payer.pubkey(),
            &self.spl_token_program,
        )
        .await?;
        mint_tokens(
            context,
            &self.mint.pubkey(),
            &self.token.pubkey(),
            10,
            &context.payer.pubkey(),
            None,
            &self.spl_token_program,
        )
        .await?;

        #[allow(deprecated)]
        let tx = Transaction::new_signed_with_payer(
            &[instruction::create_metadata_accounts_v3(
                ID,
                self.pubkey,
                self.mint.pubkey(),
                context.payer.pubkey(),
                context.payer.pubkey(),
                context.payer.pubkey(),
                name,
                symbol,
                uri,
                creators,
                seller_fee_basis_points,
                false,
                is_mutable,
                collection,
                uses,
                None,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );

        context.banks_client.process_transaction(tx).await?;

        #[cfg(feature = "padded")]
        upsize_metadata(context, &self.pubkey).await;

        #[cfg(feature = "resize")]
        {
            let tx = Transaction::new_signed_with_payer(
                &[ResizeBuilder::new()
                    .metadata(self.pubkey)
                    .edition(find_master_edition_account(&self.mint.pubkey()).0)
                    .mint(self.mint.pubkey())
                    .payer(context.payer.pubkey())
                    .authority(context.payer.pubkey())
                    .token(self.token.pubkey())
                    .system_program(solana_program::system_program::ID)
                    .build()
                    .unwrap()
                    .instruction()],
                Some(&context.payer.pubkey()),
                &[&context.payer],
                context.last_blockhash,
            );

            assert_before_metadata(context, self.pubkey).await;
            context.banks_client.process_transaction(tx).await?;
            assert_after_metadata(context, self.pubkey).await;
        }

        Ok(())
    }

    pub async fn create_v3_no_freeze_auth(
        &self,
        context: &mut ProgramTestContext,
    ) -> Result<(), BanksClientError> {
        let name = String::from("Test");
        let symbol = String::from("TEST");
        let uri = String::from("https://test.com");
        let creators = vec![Creator {
            address: context.payer.pubkey(),
            verified: true,
            share: 100,
        }];
        let sfbp = 100;
        let is_mutable = true;

        // Mint created with no freeze authority set.
        create_mint(
            context,
            &self.mint,
            &context.payer.pubkey(),
            None,
            0,
            &self.spl_token_program,
        )
        .await?;
        create_token_account(
            context,
            &self.token,
            &self.mint.pubkey(),
            &context.payer.pubkey(),
            &self.spl_token_program,
        )
        .await?;
        mint_tokens(
            context,
            &self.mint.pubkey(),
            &self.token.pubkey(),
            1,
            &context.payer.pubkey(),
            None,
            &self.spl_token_program,
        )
        .await?;

        let tx = Transaction::new_signed_with_payer(
            &[instruction::create_metadata_accounts_v3(
                ID,
                self.pubkey,
                self.mint.pubkey(),
                context.payer.pubkey(),
                context.payer.pubkey(),
                context.payer.pubkey(),
                name,
                symbol,
                uri,
                Some(creators),
                sfbp,
                false,
                is_mutable,
                None,
                None,
                None,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );

        context.banks_client.process_transaction(tx).await?;

        #[cfg(feature = "padded")]
        upsize_metadata(context, &self.pubkey).await;

        #[cfg(feature = "resize")]
        {
            let tx = Transaction::new_signed_with_payer(
                &[ResizeBuilder::new()
                    .metadata(self.pubkey)
                    .edition(find_master_edition_account(&self.mint.pubkey()).0)
                    .mint(self.mint.pubkey())
                    .payer(context.payer.pubkey())
                    .authority(context.payer.pubkey())
                    .token(self.token.pubkey())
                    .system_program(solana_program::system_program::ID)
                    .build()
                    .unwrap()
                    .instruction()],
                Some(&context.payer.pubkey()),
                &[&context.payer],
                context.last_blockhash,
            );

            assert_before_metadata(context, self.pubkey).await;
            context.banks_client.process_transaction(tx).await?;
            assert_after_metadata(context, self.pubkey).await;
        }

        Ok(())
    }

    pub async fn create_v3_default(
        &self,
        context: &mut ProgramTestContext,
    ) -> Result<(), BanksClientError> {
        let creators = vec![Creator {
            address: context.payer.pubkey(),
            verified: true,
            share: 100,
        }];

        self.create_v3(
            context,
            "name".to_string(),
            "symbol".to_string(),
            "uri".to_string(),
            Some(creators),
            0,
            true,
            None,
            None,
            None,
        )
        .await
    }

    pub async fn create_default_nft(
        context: &mut ProgramTestContext,
    ) -> Result<(Metadata, MasterEditionV2), BanksClientError> {
        let nft = Metadata::new();
        nft.create_v3(
            context,
            "Test".to_string(),
            "TST".to_string(),
            "uri".to_string(),
            None,
            10,
            false,
            None,
            None,
            None,
        )
        .await
        .unwrap();

        let master_edition = MasterEditionV2::new(&nft);
        master_edition.create_v3(context, Some(0)).await.unwrap();

        #[cfg(feature = "resize")]
        {
            let tx = Transaction::new_signed_with_payer(
                &[ResizeBuilder::new()
                    .metadata(nft.pubkey)
                    .edition(master_edition.pubkey)
                    .mint(nft.mint.pubkey())
                    .payer(context.payer.pubkey())
                    .authority(context.payer.pubkey())
                    .token(nft.token.pubkey())
                    .system_program(solana_program::system_program::ID)
                    .build()
                    .unwrap()
                    .instruction()],
                Some(&context.payer.pubkey()),
                &[&context.payer],
                context.last_blockhash,
            );

            assert_before_metadata(context, nft.pubkey).await;
            assert_before_master_edition(context, master_edition.pubkey).await;
            context.banks_client.process_transaction(tx).await?;
            assert_after_metadata(context, nft.pubkey).await;
            assert_after_master_edition(context, master_edition.pubkey).await;
        }

        Ok((nft, master_edition))
    }

    pub async fn create_default_sized_parent(
        context: &mut ProgramTestContext,
    ) -> Result<(Metadata, MasterEditionV2), BanksClientError> {
        let nft = Metadata::new();
        #[allow(deprecated)]
        nft.create_v3(
            context,
            "Test".to_string(),
            "TST".to_string(),
            "uri".to_string(),
            None,
            10,
            false,
            None,
            None,
            Some(CollectionDetails::V1 { size: 0 }),
        )
        .await
        .unwrap();

        let master_edition = MasterEditionV2::new(&nft);
        master_edition.create_v3(context, Some(0)).await.unwrap();

        #[cfg(feature = "resize")]
        {
            let tx = Transaction::new_signed_with_payer(
                &[ResizeBuilder::new()
                    .metadata(nft.pubkey)
                    .edition(master_edition.pubkey)
                    .mint(nft.mint.pubkey())
                    .payer(context.payer.pubkey())
                    .authority(context.payer.pubkey())
                    .token(nft.token.pubkey())
                    .system_program(solana_program::system_program::ID)
                    .build()
                    .unwrap()
                    .instruction()],
                Some(&context.payer.pubkey()),
                &[&context.payer],
                context.last_blockhash,
            );

            assert_before_metadata(context, nft.pubkey).await;
            assert_before_master_edition(context, master_edition.pubkey).await;
            context.banks_client.process_transaction(tx).await?;
            assert_after_metadata(context, nft.pubkey).await;
            assert_after_master_edition(context, master_edition.pubkey).await;
        }

        Ok((nft, master_edition))
    }

    pub async fn create_nft_with_max_supply(
        context: &mut ProgramTestContext,
        max_supply: u64,
    ) -> Result<(Metadata, MasterEditionV2), BanksClientError> {
        let nft = Metadata::new();
        #[allow(deprecated)]
        nft.create_v3(
            context,
            "Test".to_string(),
            "TST".to_string(),
            "uri".to_string(),
            None,
            10,
            false,
            None,
            None,
            Some(CollectionDetails::V1 { size: 0 }),
        )
        .await
        .unwrap();

        let master_edition = MasterEditionV2::new(&nft);
        master_edition
            .create_v3(context, Some(max_supply))
            .await
            .unwrap();

        #[cfg(feature = "resize")]
        {
            let tx = Transaction::new_signed_with_payer(
                &[ResizeBuilder::new()
                    .metadata(nft.pubkey)
                    .edition(master_edition.pubkey)
                    .mint(nft.mint.pubkey())
                    .payer(context.payer.pubkey())
                    .authority(context.payer.pubkey())
                    .token(nft.token.pubkey())
                    .system_program(solana_program::system_program::ID)
                    .build()
                    .unwrap()
                    .instruction()],
                Some(&context.payer.pubkey()),
                &[&context.payer],
                context.last_blockhash,
            );

            assert_before_metadata(context, nft.pubkey).await;
            assert_before_master_edition(context, master_edition.pubkey).await;
            context.banks_client.process_transaction(tx).await?;
            assert_after_metadata(context, nft.pubkey).await;
            assert_after_master_edition(context, master_edition.pubkey).await;
        }

        Ok((nft, master_edition))
    }

    pub async fn update_primary_sale_happened_via_token(
        &self,
        context: &mut ProgramTestContext,
    ) -> Result<(), BanksClientError> {
        let tx = Transaction::new_signed_with_payer(
            &[instruction::update_primary_sale_happened_via_token(
                ID,
                self.pubkey,
                context.payer.pubkey(),
                self.token.pubkey(),
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );

        context.banks_client.process_transaction(tx).await
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn update_v2(
        &self,
        context: &mut ProgramTestContext,
        name: String,
        symbol: String,
        uri: String,
        creators: Option<Vec<Creator>>,
        seller_fee_basis_points: u16,
        is_mutable: bool,
        collection: Option<Collection>,
        uses: Option<Uses>,
    ) -> Result<(), BanksClientError> {
        let tx = Transaction::new_signed_with_payer(
            &[instruction::update_metadata_accounts_v2(
                ID,
                self.pubkey,
                context.payer.pubkey(),
                None,
                Some(DataV2 {
                    name,
                    symbol,
                    uri,
                    creators,
                    seller_fee_basis_points,
                    collection,
                    uses,
                }),
                None,
                Some(is_mutable),
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );

        context.banks_client.process_transaction(tx).await
    }

    pub async fn verify_collection(
        &self,
        context: &mut ProgramTestContext,
        collection: Pubkey,
        collection_authority: &Keypair,
        collection_mint: Pubkey,
        collection_master_edition_account: Pubkey,
        collection_authority_record: Option<Pubkey>,
    ) -> Result<(), BanksClientError> {
        let tx = Transaction::new_signed_with_payer(
            &[instruction::verify_collection(
                ID,
                self.pubkey,
                collection_authority.pubkey(),
                context.payer.pubkey(),
                collection_mint,
                collection,
                collection_master_edition_account,
                collection_authority_record,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer, collection_authority],
            context.last_blockhash,
        );

        context.banks_client.process_transaction(tx).await
    }

    pub async fn verify_sized_collection_item(
        &self,
        context: &mut ProgramTestContext,
        collection: Pubkey,
        collection_authority: &Keypair,
        collection_mint: Pubkey,
        collection_master_edition_account: Pubkey,
        collection_authority_record: Option<Pubkey>,
    ) -> Result<(), BanksClientError> {
        let tx = Transaction::new_signed_with_payer(
            &[instruction::verify_sized_collection_item(
                ID,
                self.pubkey,
                collection_authority.pubkey(),
                context.payer.pubkey(),
                collection_mint,
                collection,
                collection_master_edition_account,
                collection_authority_record,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer, collection_authority],
            context.last_blockhash,
        );

        context.banks_client.process_transaction(tx).await
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn set_and_verify_collection(
        &self,
        context: &mut ProgramTestContext,
        collection: Pubkey,
        collection_authority: &Keypair,
        nft_update_authority: Pubkey,
        collection_mint: Pubkey,
        collection_master_edition_account: Pubkey,
        collection_authority_record: Option<Pubkey>,
    ) -> Result<(), BanksClientError> {
        let tx = Transaction::new_signed_with_payer(
            &[instruction::set_and_verify_collection(
                ID,
                self.pubkey,
                collection_authority.pubkey(),
                context.payer.pubkey(),
                nft_update_authority,
                collection_mint,
                collection,
                collection_master_edition_account,
                collection_authority_record,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer, collection_authority],
            context.last_blockhash,
        );
        context.banks_client.process_transaction(tx).await
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn set_and_verify_sized_collection_item(
        &self,
        context: &mut ProgramTestContext,
        collection: Pubkey,
        collection_authority: &Keypair,
        nft_update_authority: Pubkey,
        collection_mint: Pubkey,
        collection_master_edition_account: Pubkey,
        collection_authority_record: Option<Pubkey>,
    ) -> Result<(), BanksClientError> {
        let tx = Transaction::new_signed_with_payer(
            &[instruction::set_and_verify_sized_collection_item(
                ID,
                self.pubkey,
                collection_authority.pubkey(),
                context.payer.pubkey(),
                nft_update_authority,
                collection_mint,
                collection,
                collection_master_edition_account,
                collection_authority_record,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer, collection_authority],
            context.last_blockhash,
        );
        context.banks_client.process_transaction(tx).await
    }

    pub async fn unverify_collection(
        &self,
        context: &mut ProgramTestContext,
        collection: Pubkey,
        collection_authority: &Keypair,
        collection_mint: Pubkey,
        collection_master_edition_account: Pubkey,
        collection_authority_record: Option<Pubkey>,
    ) -> Result<(), BanksClientError> {
        let tx = Transaction::new_signed_with_payer(
            &[instruction::unverify_collection(
                ID,
                self.pubkey,
                collection_authority.pubkey(),
                collection_mint,
                collection,
                collection_master_edition_account,
                collection_authority_record,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer, collection_authority],
            context.last_blockhash,
        );

        context.banks_client.process_transaction(tx).await
    }

    pub async fn unverify_sized_collection_item(
        &self,
        context: &mut ProgramTestContext,
        collection: Pubkey,
        collection_authority: &Keypair,
        collection_mint: Pubkey,
        collection_master_edition_account: Pubkey,
        collection_authority_record: Option<Pubkey>,
    ) -> Result<(), BanksClientError> {
        let tx = Transaction::new_signed_with_payer(
            &[instruction::unverify_sized_collection_item(
                ID,
                self.pubkey,
                collection_authority.pubkey(),
                context.payer.pubkey(),
                collection_mint,
                collection,
                collection_master_edition_account,
                collection_authority_record,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer, collection_authority],
            context.last_blockhash,
        );

        context.banks_client.process_transaction(tx).await
    }

    pub async fn change_update_authority(
        &self,
        context: &mut ProgramTestContext,
        new_update_authority: Pubkey,
    ) -> Result<(), BanksClientError> {
        airdrop(context, &new_update_authority, 1_000_000_000)
            .await
            .unwrap();

        let tx = Transaction::new_signed_with_payer(
            &[instruction::update_metadata_accounts_v2(
                token_metadata::ID,
                self.pubkey,
                context.payer.pubkey(),
                Some(new_update_authority),
                None,
                None,
                None,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );

        context.banks_client.process_transaction(tx).await
    }

    pub async fn assert_create_fees_charged(
        &self,
        context: &mut ProgramTestContext,
    ) -> Result<(), BanksClientError> {
        let account = get_account(context, &self.pubkey).await;

        let rent = context.banks_client.get_rent().await.unwrap();
        let rent_exempt = rent.minimum_balance(account.data.len());

        let expected_lamports = rent_exempt + CREATE_FEE;

        assert_eq!(account.lamports, expected_lamports);
        let last_byte = account.data.len() - METADATA_FEE_FLAG_OFFSET;
        assert_eq!(account.data[last_byte], FEE_FLAG_SET);

        Ok(())
    }

    pub async fn assert_fee_flag_set(
        &self,
        context: &mut ProgramTestContext,
    ) -> Result<(), BanksClientError> {
        let account = get_account(context, &self.pubkey).await;

        let last_byte = account.data.len() - METADATA_FEE_FLAG_OFFSET;
        assert_eq!(account.data[last_byte], FEE_FLAG_SET);

        Ok(())
    }
}

impl Default for Metadata {
    fn default() -> Self {
        Self::new()
    }
}

pub async fn assert_collection_size(
    context: &mut ProgramTestContext,
    collection_metadata: &Metadata,
    size: u64,
) {
    let collection_md = collection_metadata.get_data(context).await;
    let retrieved_size = if let Some(details) = collection_md.collection_details {
        match details {
            #[allow(deprecated)]
            CollectionDetails::V1 { size } => size,
            CollectionDetails::V2 { padding: _ } => 0,
        }
    } else {
        panic!("Expected CollectionDetails::V1");
    };
    assert_eq!(retrieved_size, size);
}
