#[cfg(feature = "test-sbf")]
pub mod setup;
use setup::*;

use solana_program::pubkey::Pubkey;
use solana_program::system_program;
use solana_program_test::*;
use solana_sdk::{
    signature::{Keypair, Signer},
    transaction::Transaction,
};

use mpl_token_metadata::accounts::MasterEdition;
use mpl_token_metadata::{
    accounts::Metadata,
    types::{Key, PrintSupply},
};
use mpl_token_metadata::{instructions::CreateV1Builder, types::TokenStandard};
use mpl_token_metadata::{
    instructions::{CreateV1, CreateV1InstructionArgs},
    utils::clean,
};

mod create {

    use super::*;

    #[tokio::test]
    async fn create_nonfungible() {
        let mut context = program_test().start_with_context().await;

        // given a mint address

        let payer_pubkey = context.payer.pubkey();
        let mint = Keypair::new();
        let mint_pubkey = mint.pubkey();

        let (metadata, _) = Metadata::find_pda(&mint_pubkey);
        let (master_edition, _) = MasterEdition::find_pda(&mint_pubkey);

        // when we create a non-fungible metadata

        let create_ix = CreateV1Builder::new()
            .metadata(metadata)
            .master_edition(Some(master_edition))
            .mint(mint_pubkey, true)
            .authority(payer_pubkey)
            .payer(payer_pubkey)
            .update_authority(payer_pubkey, true)
            .is_mutable(true)
            .primary_sale_happened(false)
            .name(String::from("NonFungible"))
            .symbol(String::from("NFT"))
            .uri(String::from("http://my.nft"))
            .seller_fee_basis_points(500)
            .token_standard(TokenStandard::NonFungible)
            .print_supply(PrintSupply::Zero)
            .instruction();

        let tx = Transaction::new_signed_with_payer(
            &[create_ix],
            Some(&context.payer.pubkey()),
            &[&context.payer, &mint],
            context.last_blockhash,
        );

        context.banks_client.process_transaction(tx).await.unwrap();

        // then the metadata is created with the correct values

        let metadata_account = get_account(&mut context, &metadata).await;
        let metadata = Metadata::from_bytes(&metadata_account.data).unwrap();

        assert!(!metadata.primary_sale_happened);
        assert!(metadata.is_mutable);

        assert_eq!(metadata.key, Key::MetadataV1);
        assert_eq!(clean(metadata.name), String::from("NonFungible"));
        assert_eq!(clean(metadata.symbol), String::from("NFT"));
        assert_eq!(clean(metadata.uri), String::from("http://my.nft"));
        assert_eq!(metadata.seller_fee_basis_points, 500);
        assert_eq!(metadata.creators, None);
        assert_eq!(metadata.mint, mint_pubkey);
        assert_eq!(metadata.update_authority, context.payer.pubkey());
        assert_eq!(metadata.token_standard, Some(TokenStandard::NonFungible));
    }

    #[tokio::test]
    async fn create_programmable_nonfungible() {
        let mut context = program_test().start_with_context().await;

        // given a mint address

        let payer_pubkey = context.payer.pubkey();
        let mint = Keypair::new();
        let mint_pubkey = mint.pubkey();

        let metadata_seeds = &[b"metadata", PROGRAM_ID.as_ref(), mint_pubkey.as_ref()];
        let (metadata, _) = Pubkey::find_program_address(metadata_seeds, &PROGRAM_ID);

        let master_edition_seeds = &[
            b"metadata",
            PROGRAM_ID.as_ref(),
            mint_pubkey.as_ref(),
            b"edition",
        ];
        let (master_edition, _) = Pubkey::find_program_address(master_edition_seeds, &PROGRAM_ID);

        // when we create a programmable non-fungible metadata

        let args = CreateV1InstructionArgs {
            name: String::from("pNFT"),
            uri: String::from("http://my.pnft"),
            symbol: String::from(""),
            seller_fee_basis_points: 500,
            primary_sale_happened: false,
            is_mutable: true,
            creators: None,
            token_standard: TokenStandard::ProgrammableNonFungible,
            collection: None,
            collection_details: None,
            decimals: Some(0),
            print_supply: Some(PrintSupply::Zero),
            rule_set: None,
            uses: None,
        };

        let create_ix = CreateV1 {
            metadata,
            master_edition: Some(master_edition),
            mint: (mint_pubkey, true),
            authority: payer_pubkey,
            update_authority: (payer_pubkey, true),
            payer: payer_pubkey,
            spl_token_program: spl_token::ID,
            system_program: system_program::ID,
            sysvar_instructions: solana_program::sysvar::instructions::ID,
        }
        .instruction(args);

        let tx = Transaction::new_signed_with_payer(
            &[create_ix],
            Some(&context.payer.pubkey()),
            &[&context.payer, &mint],
            context.last_blockhash,
        );

        context.banks_client.process_transaction(tx).await.unwrap();

        // then the metadata is created with the correct values

        let metadata_account = get_account(&mut context, &metadata).await;
        let metadata = Metadata::from_bytes(&metadata_account.data).unwrap();

        assert!(!metadata.primary_sale_happened);
        assert!(metadata.is_mutable);

        assert_eq!(metadata.key, Key::MetadataV1);
        assert_eq!(clean(metadata.name), String::from("pNFT"));
        assert_eq!(clean(metadata.symbol), String::from(""));
        assert_eq!(clean(metadata.uri), String::from("http://my.pnft"));
        assert_eq!(metadata.seller_fee_basis_points, 500);
        assert_eq!(metadata.creators, None);
        assert_eq!(metadata.mint, mint_pubkey);
        assert_eq!(metadata.update_authority, context.payer.pubkey());
        assert_eq!(
            metadata.token_standard,
            Some(TokenStandard::ProgrammableNonFungible)
        );
    }
}
