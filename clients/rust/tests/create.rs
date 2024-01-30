#[cfg(feature = "test-sbf")]
pub mod setup;
pub use setup::*;

use solana_program::pubkey::Pubkey;
use solana_program::system_program;
use solana_program_test::*;
use solana_sdk::{
    signature::{Keypair, Signer},
    transaction::Transaction,
};
use spl_token_2022::extension::ExtensionType;

use mpl_token_metadata::accounts::MasterEdition;
use mpl_token_metadata::errors::MplTokenMetadataError;
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

    #[test_case::test_case(TokenStandard::Fungible, spl_token::ID ; "fungible with spl-token")]
    #[test_case::test_case(TokenStandard::Fungible, spl_token_2022::ID ; "fungible with spl-token-2022")]
    #[test_case::test_case(TokenStandard::FungibleAsset, spl_token::ID ; "fungible_asset with spl-token")]
    #[test_case::test_case(TokenStandard::FungibleAsset, spl_token_2022::ID ; "fungible_asset with spl-token-2022")]
    #[test_case::test_case(TokenStandard::NonFungible, spl_token::ID ; "non_fungible with spl-token")]
    #[test_case::test_case(TokenStandard::NonFungible, spl_token_2022::ID ; "non_fungible with spl-token-2022")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible, spl_token::ID ; "programmable_non_fungible with spl-token")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible, spl_token_2022::ID ; "programmable_non_fungible with spl-token-2022")]
    #[tokio::test]
    async fn create(token_standard: TokenStandard, spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;

        // when we create an asset with the mint extension

        let mut asset = DigitalAsset::default();
        asset
            .create_default(&mut context, token_standard, spl_token_program)
            .await
            .unwrap();

        // then the mint account was created

        let account = get_account(&mut context, &asset.mint.pubkey()).await;
        assert!(account.owner == spl_token_program);

        // and the metadata account was created

        let (metadata, _) = Metadata::find_pda(&asset.mint.pubkey());
        let metadata_account = get_account(&mut context, &metadata).await;
        let metadata = Metadata::from_bytes(&metadata_account.data).unwrap();

        assert_eq!(metadata.token_standard, Some(token_standard));
    }

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
            .spl_token_program(Some(spl_token::ID))
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

        let (metadata, _) = Metadata::find_pda(&mint.pubkey());
        let (master_edition, _) = MasterEdition::find_pda(&mint.pubkey());

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
            spl_token_program: Some(spl_token::ID),
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

mod create_token2022 {

    use super::*;

    #[test_case::test_case(TokenStandard::Fungible ; "fungible")]
    #[test_case::test_case(TokenStandard::FungibleAsset ; "fungible_asset")]
    #[test_case::test_case(TokenStandard::NonFungible ; "non_fungible")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible ; "programmable_non_fungible")]
    #[tokio::test]
    async fn create_from_mint_with_mint_close_authority(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // when we create an asset with the mint extension

        let mut asset = DigitalAsset::default();
        asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::MintCloseAuthority],
            )
            .await
            .unwrap();

        // then the mint account was created

        let account = get_account(&mut context, &asset.mint.pubkey()).await;
        assert!(account.owner == spl_token_2022::ID);

        // and the metadata account was created

        let (metadata, _) = Metadata::find_pda(&asset.mint.pubkey());
        let metadata_account = get_account(&mut context, &metadata).await;
        let metadata = Metadata::from_bytes(&metadata_account.data).unwrap();

        assert_eq!(metadata.token_standard, Some(token_standard));
    }

    #[test_case::test_case(TokenStandard::Fungible ; "fungible")]
    #[test_case::test_case(TokenStandard::FungibleAsset ; "fungible_asset")]
    #[tokio::test]
    async fn create_from_mint_with_mint_transfer_fees(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // when we create an asset with the metadata pointer extension

        let mut asset = DigitalAsset::default();
        asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::TransferFeeConfig],
            )
            .await
            .unwrap();

        // then the mint account was created

        let account = get_account(&mut context, &asset.mint.pubkey()).await;
        assert!(account.owner == spl_token_2022::ID);

        // and the metadata account was created

        let (metadata, _) = Metadata::find_pda(&asset.mint.pubkey());
        let metadata_account = get_account(&mut context, &metadata).await;
        let metadata = Metadata::from_bytes(&metadata_account.data).unwrap();

        assert_eq!(metadata.token_standard, Some(token_standard));
    }

    #[test_case::test_case(TokenStandard::NonFungible ; "non_fungible")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible ; "programmable_non_fungible")]
    #[tokio::test]
    async fn fail_from_mint_with_transfer_fees(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // when we create an asset with the metadata pointer extension

        let mut asset = DigitalAsset::default();
        let error = asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::TransferFeeConfig],
            )
            .await
            .unwrap_err();

        // then we expect an error since the extension is not supported

        assert_custom_instruction_error!(0, error, MplTokenMetadataError::InvalidMintExtensionType);
    }

    #[test_case::test_case(TokenStandard::Fungible ; "fungible")]
    #[test_case::test_case(TokenStandard::FungibleAsset ; "fungible_asset")]
    #[tokio::test]
    async fn create_from_mint_with_default_accout_state(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // when we create an asset with the metadata pointer extension

        let mut asset = DigitalAsset::default();
        asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::DefaultAccountState],
            )
            .await
            .unwrap();

        // then the mint account was created

        let account = get_account(&mut context, &asset.mint.pubkey()).await;
        assert!(account.owner == spl_token_2022::ID);

        // and the metadata account was created

        let (metadata, _) = Metadata::find_pda(&asset.mint.pubkey());
        let metadata_account = get_account(&mut context, &metadata).await;
        let metadata = Metadata::from_bytes(&metadata_account.data).unwrap();

        assert_eq!(metadata.token_standard, Some(token_standard));
    }

    #[test_case::test_case(TokenStandard::NonFungible ; "non_fungible")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible ; "programmable_non_fungible")]
    #[tokio::test]
    async fn fail_from_mint_with_default_accout_state(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // when we create an asset with the metadata pointer extension

        let mut asset = DigitalAsset::default();
        let error = asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::DefaultAccountState],
            )
            .await
            .unwrap_err();

        // then we expect an error since the extension is not supported

        assert_custom_instruction_error!(0, error, MplTokenMetadataError::InvalidMintExtensionType);
    }

    #[test_case::test_case(TokenStandard::Fungible ; "fungible")]
    #[test_case::test_case(TokenStandard::FungibleAsset ; "fungible_asset")]
    #[test_case::test_case(TokenStandard::NonFungible ; "non_fungible")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible ; "programmable_non_fungible")]
    #[tokio::test]
    async fn create_from_mint_with_non_transferable_tokens(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // when we create an asset with the metadata pointer extension

        let mut asset = DigitalAsset::default();
        asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::NonTransferable],
            )
            .await
            .unwrap();

        // then the mint account was created

        let account = get_account(&mut context, &asset.mint.pubkey()).await;
        assert!(account.owner == spl_token_2022::ID);

        // and the metadata account was created

        let (metadata, _) = Metadata::find_pda(&asset.mint.pubkey());
        let metadata_account = get_account(&mut context, &metadata).await;
        let metadata = Metadata::from_bytes(&metadata_account.data).unwrap();

        assert_eq!(metadata.token_standard, Some(token_standard));
    }

    #[test_case::test_case(TokenStandard::Fungible ; "fungible")]
    #[test_case::test_case(TokenStandard::FungibleAsset ; "fungible_asset")]
    #[tokio::test]
    async fn create_from_mint_with_interest_bearing_tokens(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // when we create an asset with the metadata pointer extension

        let mut asset = DigitalAsset::default();
        asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::InterestBearingConfig],
            )
            .await
            .unwrap();

        // then the mint account was created

        let account = get_account(&mut context, &asset.mint.pubkey()).await;
        assert!(account.owner == spl_token_2022::ID);

        // and the metadata account was created

        let (metadata, _) = Metadata::find_pda(&asset.mint.pubkey());
        let metadata_account = get_account(&mut context, &metadata).await;
        let metadata = Metadata::from_bytes(&metadata_account.data).unwrap();

        assert_eq!(metadata.token_standard, Some(token_standard));
    }

    #[test_case::test_case(TokenStandard::NonFungible ; "non_fungible")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible ; "programmable_non_fungible")]
    #[tokio::test]
    async fn fail_from_mint_with_interest_bearing_tokens(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // when we create an asset with the metadata pointer extension

        let mut asset = DigitalAsset::default();
        let error = asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::InterestBearingConfig],
            )
            .await
            .unwrap_err();

        // then we expect an error since the extension is not supported

        assert_custom_instruction_error!(0, error, MplTokenMetadataError::InvalidMintExtensionType);
    }

    #[test_case::test_case(TokenStandard::Fungible ; "fungible")]
    #[test_case::test_case(TokenStandard::FungibleAsset ; "fungible_asset")]
    #[tokio::test]
    async fn create_from_mint_with_permanent_delegate(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // when we create an asset with the metadata pointer extension

        let mut asset = DigitalAsset::default();
        asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::PermanentDelegate],
            )
            .await
            .unwrap();

        // then the mint account was created

        let account = get_account(&mut context, &asset.mint.pubkey()).await;
        assert!(account.owner == spl_token_2022::ID);

        // and the metadata account was created

        let (metadata, _) = Metadata::find_pda(&asset.mint.pubkey());
        let metadata_account = get_account(&mut context, &metadata).await;
        let metadata = Metadata::from_bytes(&metadata_account.data).unwrap();

        assert_eq!(metadata.token_standard, Some(token_standard));
    }

    #[test_case::test_case(TokenStandard::NonFungible ; "non_fungible")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible ; "programmable_non_fungible")]
    #[tokio::test]
    async fn fail_from_mint_with_permanent_delegate(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // when we create an asset with the metadata pointer extension

        let mut asset = DigitalAsset::default();
        let error = asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::PermanentDelegate],
            )
            .await
            .unwrap_err();

        // then we expect an error since the extension is not supported

        assert_custom_instruction_error!(0, error, MplTokenMetadataError::InvalidMintExtensionType);
    }

    #[test_case::test_case(TokenStandard::Fungible ; "fungible")]
    #[test_case::test_case(TokenStandard::FungibleAsset ; "fungible_asset")]
    #[tokio::test]
    async fn create_from_mint_with_transfer_hook(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // when we create an asset with the metadata pointer extension

        let mut asset = DigitalAsset::default();
        asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::TransferHook],
            )
            .await
            .unwrap();

        // then the mint account was created

        let account = get_account(&mut context, &asset.mint.pubkey()).await;
        assert!(account.owner == spl_token_2022::ID);

        // and the metadata account was created

        let (metadata, _) = Metadata::find_pda(&asset.mint.pubkey());
        let metadata_account = get_account(&mut context, &metadata).await;
        let metadata = Metadata::from_bytes(&metadata_account.data).unwrap();

        assert_eq!(metadata.token_standard, Some(token_standard));
    }

    #[test_case::test_case(TokenStandard::NonFungible ; "non_fungible")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible ; "programmable_non_fungible")]
    #[tokio::test]
    async fn fail_from_mint_with_transfer_hook(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // when we create an asset with the metadata pointer extension

        let mut asset = DigitalAsset::default();
        let error = asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::TransferHook],
            )
            .await
            .unwrap_err();

        // then we expect an error since the extension is not supported

        assert_custom_instruction_error!(0, error, MplTokenMetadataError::InvalidMintExtensionType);
    }

    #[test_case::test_case(TokenStandard::Fungible ; "fungible")]
    #[test_case::test_case(TokenStandard::FungibleAsset ; "fungible_asset")]
    #[test_case::test_case(TokenStandard::NonFungible ; "non_fungible")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible ; "programmable_non_fungible")]
    #[tokio::test]
    async fn create_from_mint_with_metadata_pointer(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // when we create an asset with the metadata pointer extension

        let mut asset = DigitalAsset::default();
        asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::MetadataPointer],
            )
            .await
            .unwrap();

        // then the mint account was created

        let account = get_account(&mut context, &asset.mint.pubkey()).await;
        assert!(account.owner == spl_token_2022::ID);

        // and the metadata account was created

        let (metadata, _) = Metadata::find_pda(&asset.mint.pubkey());
        let metadata_account = get_account(&mut context, &metadata).await;
        let metadata = Metadata::from_bytes(&metadata_account.data).unwrap();

        assert_eq!(metadata.token_standard, Some(token_standard));
    }
}
