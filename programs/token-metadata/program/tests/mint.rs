#![cfg(feature = "test-bpf")]
pub mod utils;

use solana_program_test::*;
use solana_sdk::{instruction::InstructionError, signature::Signer, transaction::TransactionError};
use utils::*;

mod mint {

    use mpl_token_metadata::{error::MetadataError, state::TokenStandard, utils::unpack};
    use num_traits::FromPrimitive;
    use solana_program::pubkey::Pubkey;
    use spl_token_2022::state::Account;

    use super::*;

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn mint_programmable_nonfungible(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;

        // asset

        let mut asset = DigitalAsset::default();
        asset
            .create(
                &mut context,
                TokenStandard::ProgrammableNonFungible,
                None,
                spl_token_program,
            )
            .await
            .unwrap();

        // mints one token

        let payer_pubkey = context.payer.pubkey();

        asset
            .mint(&mut context, None, None, 1, spl_token_program)
            .await
            .unwrap();

        // asserts

        let account = get_account(&mut context, &asset.token.unwrap()).await;
        let token_account = unpack::<Account>(&account.data).unwrap();

        assert!(token_account.is_frozen());
        assert_eq!(token_account.amount, 1);
        assert_eq!(token_account.mint, asset.mint.pubkey());
        assert_eq!(token_account.owner, payer_pubkey);
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn mint_nonfungible(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;

        // asset

        let mut asset = DigitalAsset::default();
        asset
            .create(
                &mut context,
                TokenStandard::NonFungible,
                None,
                spl_token_program,
            )
            .await
            .unwrap();

        // mints one token

        asset
            .mint(&mut context, None, None, 1, spl_token_program)
            .await
            .unwrap();

        assert!(asset.token.is_some());

        if let Some(token) = asset.token {
            let account = get_account(&mut context, &token).await;
            let token_account = unpack::<Account>(&account.data).unwrap();

            assert!(!token_account.is_frozen());
            assert_eq!(token_account.amount, 1);
            assert_eq!(token_account.mint, asset.mint.pubkey());
            assert_eq!(token_account.owner, context.payer.pubkey());
        }
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn mint_fungible(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;

        // asset

        let mut asset = DigitalAsset::default();
        asset
            .create(
                &mut context,
                TokenStandard::Fungible,
                None,
                spl_token_program,
            )
            .await
            .unwrap();

        // mints one token

        asset
            .mint(&mut context, None, None, 100, spl_token_program)
            .await
            .unwrap();

        assert!(asset.token.is_some());

        if let Some(token) = asset.token {
            let account = get_account(&mut context, &token).await;
            let token_account = unpack::<Account>(&account.data).unwrap();

            assert!(!token_account.is_frozen());
            assert_eq!(token_account.amount, 100);
            assert_eq!(token_account.mint, asset.mint.pubkey());
            assert_eq!(token_account.owner, context.payer.pubkey());
        }
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn mint_fungible_asset(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;

        // asset

        let mut asset = DigitalAsset::default();
        asset
            .create(
                &mut context,
                TokenStandard::FungibleAsset,
                None,
                spl_token_program,
            )
            .await
            .unwrap();

        // mints one token

        asset
            .mint(&mut context, None, None, 50, spl_token_program)
            .await
            .unwrap();

        assert!(asset.token.is_some());

        if let Some(token) = asset.token {
            let account = get_account(&mut context, &token).await;
            let token_account = unpack::<Account>(&account.data).unwrap();

            assert!(!token_account.is_frozen());
            assert_eq!(token_account.amount, 50);
            assert_eq!(token_account.mint, asset.mint.pubkey());
            assert_eq!(token_account.owner, context.payer.pubkey());
        }
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn try_mint_multiple_programmable_nonfungible(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;

        let mut asset = DigitalAsset::default();
        let error = asset
            .create_and_mint(
                &mut context,
                TokenStandard::ProgrammableNonFungible,
                None,
                None,
                2,
                spl_token_program,
            )
            .await
            .unwrap_err();

        assert_custom_error_ix!(1, error, MetadataError::EditionsMustHaveExactlyOneToken);
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn try_mint_multiple_nonfungible(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;

        let mut asset = DigitalAsset::default();
        let error = asset
            .create_and_mint(
                &mut context,
                TokenStandard::NonFungible,
                None,
                None,
                2,
                spl_token_program,
            )
            .await
            .unwrap_err();

        assert_custom_error_ix!(1, error, MetadataError::EditionsMustHaveExactlyOneToken);
    }
}
