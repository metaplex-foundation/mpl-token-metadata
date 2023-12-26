#[cfg(feature = "test-sbf")]
mod setup;
pub use setup::*;

use mpl_token_metadata::errors::MplTokenMetadataError;
use mpl_token_metadata::types::TokenStandard;
use solana_program::pubkey::Pubkey;
use solana_program_test::*;
use solana_sdk::signature::{Keypair, Signer};
use spl_token_2022::extension::ExtensionType;
use spl_token_2022::state::Account;

mod mint {

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
    async fn mint(token_standard: TokenStandard, spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;

        // given a mint account with metadata

        let mut asset = DigitalAsset::default();
        asset
            .create_default(&mut context, token_standard, spl_token_program)
            .await
            .unwrap();

        // when minting a token

        let token_owner = Keypair::new().pubkey();
        let payer = context.payer.dirty_clone();

        asset
            .mint(
                &mut context,
                &token_owner,
                1,
                &payer,
                &payer,
                spl_token_program,
            )
            .await
            .unwrap();

        // then the token account is created with the correct balance

        let token_account = get_account(&mut context, &asset.token).await;
        assert_eq!(token_account.owner, spl_token_program);

        let token = unpack::<Account>(&token_account.data).unwrap().base;
        assert_eq!(token.amount, 1);
    }

    #[test_case::test_case(TokenStandard::Fungible, spl_token::ID ; "fungible with spl-token")]
    #[test_case::test_case(TokenStandard::Fungible, spl_token_2022::ID ; "fungible with spl-token-2022")]
    #[test_case::test_case(TokenStandard::FungibleAsset, spl_token::ID ; "fungible_asset with spl-token")]
    #[test_case::test_case(TokenStandard::FungibleAsset, spl_token_2022::ID ; "fungible_asset with spl-token-2022")]
    #[test_case::test_case(TokenStandard::NonFungible, spl_token::ID ; "non_fungible with spl-token")]
    #[test_case::test_case(TokenStandard::NonFungible, spl_token_2022::ID ; "non_fungible with spl-token-2022")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible, spl_token::ID ; "programmable_non_fungible with spl-token")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible, spl_token_2022::ID ; "programmable_non_fungible with spl-token-2022")]
    #[tokio::test]
    async fn mint_with_existing_token_account(
        token_standard: TokenStandard,
        spl_token_program: Pubkey,
    ) {
        let mut context = program_test().start_with_context().await;

        // given a mint account with metadata

        let mut asset = DigitalAsset::default();
        asset
            .create_default(&mut context, token_standard, spl_token_program)
            .await
            .unwrap();

        // and a token account

        let token = Keypair::new();
        let token_owner = Keypair::new().pubkey();

        let token_manager = TokenManager { spl_token_program };
        token_manager
            .create_token_account(
                &mut context,
                &token_owner,
                &token,
                &asset.mint.pubkey(),
                spl_token_program,
            )
            .await
            .unwrap();

        asset.token = token.pubkey();

        // when minting a token

        let payer = context.payer.dirty_clone();

        asset
            .mint(
                &mut context,
                &token_owner,
                1,
                &payer,
                &payer,
                spl_token_program,
            )
            .await
            .unwrap();

        // then the token account is created with the correct balance

        let token_account = get_account(&mut context, &asset.token).await;
        assert_eq!(token_account.owner, spl_token_program);

        let token = unpack::<Account>(&token_account.data).unwrap().base;
        assert_eq!(token.amount, 1);
    }
}

mod mint_token2022 {

    use super::*;

    #[test_case::test_case(TokenStandard::Fungible ; "fungible")]
    #[test_case::test_case(TokenStandard::FungibleAsset ; "fungible_asset")]
    #[test_case::test_case(TokenStandard::NonFungible ; "non_fungible")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible ; "programmable_non_fungible")]
    #[tokio::test]
    async fn mint_with_mint_close_authority(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // given a mint account with extensions and metadata

        let mut asset = DigitalAsset::default();
        asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::MintCloseAuthority],
            )
            .await
            .unwrap();

        // when minting a token

        let token_owner = Keypair::new().pubkey();
        let payer = context.payer.dirty_clone();

        asset
            .mint(
                &mut context,
                &token_owner,
                1,
                &payer,
                &payer,
                spl_token_2022::ID,
            )
            .await
            .unwrap();

        // then the token account is created with the correct balance

        let token_account = get_account(&mut context, &asset.token).await;
        assert_eq!(token_account.owner, spl_token_2022::ID);

        let token = unpack::<Account>(&token_account.data).unwrap().base;
        assert_eq!(token.amount, 1);
    }

    #[test_case::test_case(TokenStandard::Fungible ; "fungible")]
    #[test_case::test_case(TokenStandard::FungibleAsset ; "fungible_asset")]
    #[test_case::test_case(TokenStandard::NonFungible ; "non_fungible")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible ; "programmable_non_fungible")]
    #[tokio::test]
    async fn mint_with_metadata_pointer(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // given a mint account with extensions and metadata

        let mut asset = DigitalAsset::default();
        asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::MetadataPointer],
            )
            .await
            .unwrap();

        // when minting a token

        let token_owner = Keypair::new().pubkey();
        let payer = context.payer.dirty_clone();

        asset
            .mint(
                &mut context,
                &token_owner,
                1,
                &payer,
                &payer,
                spl_token_2022::ID,
            )
            .await
            .unwrap();

        // then the token account is created with the correct balance

        let token_account = get_account(&mut context, &asset.token).await;
        assert_eq!(token_account.owner, spl_token_2022::ID);

        let token = unpack::<Account>(&token_account.data).unwrap().base;
        assert_eq!(token.amount, 1);
    }

    #[test_case::test_case(TokenStandard::Fungible ; "fungible")]
    #[test_case::test_case(TokenStandard::FungibleAsset ; "fungible_asset")]
    #[test_case::test_case(TokenStandard::NonFungible ; "non_fungible")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible ; "programmable_non_fungible")]
    #[tokio::test]
    async fn mint_with_non_transferable_mint(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // given a mint account with extensions and metadata

        let mut asset = DigitalAsset::default();
        asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::NonTransferable],
            )
            .await
            .unwrap();

        // when minting a token

        let token_owner = Keypair::new().pubkey();
        let payer = context.payer.dirty_clone();

        asset
            .mint(
                &mut context,
                &token_owner,
                1,
                &payer,
                &payer,
                spl_token_2022::ID,
            )
            .await
            .unwrap();

        // then the token account is created with the correct balance

        let token_account = get_account(&mut context, &asset.token).await;
        assert_eq!(token_account.owner, spl_token_2022::ID);

        let token = unpack::<Account>(&token_account.data).unwrap().base;
        assert_eq!(token.amount, 1);
    }

    #[test_case::test_case(TokenStandard::Fungible ; "fungible")]
    #[test_case::test_case(TokenStandard::FungibleAsset ; "fungible_asset")]
    #[test_case::test_case(TokenStandard::NonFungible ; "non_fungible")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible ; "programmable_non_fungible")]
    #[tokio::test]
    async fn mint_custom_token_with_non_transferable_mint_and_invalid_token_account(
        token_standard: TokenStandard,
    ) {
        let mut context = program_test().start_with_context().await;

        // given a mint account with a non-transferable extension and metadata

        let mut asset = DigitalAsset::default();
        asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::NonTransferable],
            )
            .await
            .unwrap();

        // and an existing token account without the immutable owner extension
        let mint = asset.mint.pubkey();
        let owner = Keypair::new().pubkey();
        let token_account = Keypair::new();

        TokenManager::default()
            .create_token_account_with_extensions(
                &mut context,
                &owner,
                &token_account,
                &mint,
                &[ExtensionType::NonTransferableAccount],
            )
            .await
            .unwrap();

        asset.token = token_account.pubkey();

        // when minting a token

        let payer = context.payer.dirty_clone();

        let error = asset
            .mint(&mut context, &owner, 1, &payer, &payer, spl_token_2022::ID)
            .await
            .unwrap_err();

        // then we expect an error

        assert_custom_instruction_error!(
            0,
            error,
            MplTokenMetadataError::MissingImmutableOwnerExtension
        );
    }

    #[test_case::test_case(TokenStandard::Fungible ; "fungible")]
    #[test_case::test_case(TokenStandard::FungibleAsset ; "fungible_asset")]
    #[test_case::test_case(TokenStandard::NonFungible ; "non_fungible")]
    #[test_case::test_case(TokenStandard::ProgrammableNonFungible ; "programmable_non_fungible")]
    #[tokio::test]
    async fn mint_custom_token_with_non_transferable_mint(token_standard: TokenStandard) {
        let mut context = program_test().start_with_context().await;

        // given a mint account with extensions and metadata

        let mut asset = DigitalAsset::default();
        asset
            .create_default_with_mint_extensions(
                &mut context,
                token_standard,
                &[ExtensionType::NonTransferable],
            )
            .await
            .unwrap();

        // and an existing token account with extensions
        let mint = asset.mint.pubkey();
        let owner = Keypair::new().pubkey();
        let token_account = Keypair::new();

        TokenManager::default()
            .create_token_account_with_extensions(
                &mut context,
                &owner,
                &token_account,
                &mint,
                &[
                    ExtensionType::NonTransferableAccount,
                    ExtensionType::ImmutableOwner,
                ],
            )
            .await
            .unwrap();

        asset.token = token_account.pubkey();

        // when minting a token

        let payer = context.payer.dirty_clone();

        asset
            .mint(&mut context, &owner, 1, &payer, &payer, spl_token_2022::ID)
            .await
            .unwrap();

        // then the token account is created with the correct balance

        let token_account = get_account(&mut context, &asset.token).await;
        assert_eq!(token_account.owner, spl_token_2022::ID);

        let token = unpack::<Account>(&token_account.data).unwrap().base;
        assert_eq!(token.amount, 1);
    }
}
