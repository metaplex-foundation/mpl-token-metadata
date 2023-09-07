#![cfg(feature = "test-bpf")]
pub mod utils;

use borsh::BorshSerialize;
use num_traits::FromPrimitive;
use solana_program_test::*;
use solana_sdk::{
    account::AccountSharedData, instruction::InstructionError, transaction::TransactionError,
};
use token_metadata::{
    error::MetadataError,
    state::{Key, MAX_MASTER_EDITION_LEN},
};
use utils::*;

mod print {

    use borsh::BorshDeserialize;
    use solana_program::pubkey::Pubkey;
    use token_metadata::state::{PrintSupply, TokenStandard};

    use super::*;

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn success(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;
        let mut asset = DigitalAsset::default();
        asset
            .create_and_mint_with_supply(
                &mut context,
                TokenStandard::ProgrammableNonFungible,
                None,
                None,
                1,
                PrintSupply::Unlimited,
                spl_token_program,
            )
            .await
            .unwrap();

        assert!(asset.token.is_some());

        let test_master_edition = MasterEditionV2::new_from_asset(&asset);
        let test_edition_marker =
            EditionMarker::new_from_asset(&asset, &test_master_edition, 1, spl_token_program);

        test_edition_marker
            .create_from_asset(&mut context)
            .await
            .unwrap();

        let edition_marker = test_edition_marker.get_data_v2(&mut context).await;

        assert_eq!(edition_marker.ledger[0], 64);
        assert_eq!(edition_marker.key, Key::EditionMarkerV2);

        let edition_metadata_account = context
            .banks_client
            .get_account(test_edition_marker.new_metadata_pubkey)
            .await
            .unwrap()
            .unwrap();
        let edition_metadata: token_metadata::state::Metadata =
            token_metadata::state::Metadata::deserialize(&mut &edition_metadata_account.data[..])
                .unwrap();
        assert_eq!(
            edition_metadata.token_standard,
            Some(TokenStandard::ProgrammableNonFungibleEdition)
        );
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn fail_invalid_token_program(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;

        let mut asset = DigitalAsset::default();
        asset
            .create_and_mint_with_supply(
                &mut context,
                TokenStandard::ProgrammableNonFungible,
                None,
                None,
                1,
                PrintSupply::Unlimited,
                spl_token_program,
            )
            .await
            .unwrap();

        let test_master_edition = MasterEditionV2::new_from_asset(&asset);
        let test_edition_marker =
            EditionMarker::new_from_asset(&asset, &test_master_edition, 1, spl_token_program);

        let result = test_edition_marker
            .create_from_asset_with_invalid_token_program(&mut context)
            .await
            .unwrap_err();

        match result {
            BanksClientError::TransactionError(TransactionError::InstructionError(
                _,
                InstructionError::IncorrectProgramId,
            )) => (),
            _ => panic!("Wrong error occurs while trying to use invalid token program"),
        }
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn fail_edition_already_initialized(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;
        let mut asset = DigitalAsset::default();
        asset
            .create_and_mint_with_supply(
                &mut context,
                TokenStandard::ProgrammableNonFungible,
                None,
                None,
                1,
                PrintSupply::Unlimited,
                spl_token_program,
            )
            .await
            .unwrap();

        let test_master_edition = MasterEditionV2::new_from_asset(&asset);
        let test_edition_marker =
            EditionMarker::new_from_asset(&asset, &test_master_edition, 1, spl_token_program);
        let test_edition_marker1 =
            EditionMarker::new_from_asset(&asset, &test_master_edition, 1, spl_token_program);

        test_edition_marker
            .create_from_asset(&mut context)
            .await
            .unwrap();
        let result = test_edition_marker1
            .create_from_asset(&mut context)
            .await
            .unwrap_err();
        assert_custom_error!(result, MetadataError::AlreadyInitialized);
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn fail_to_mint_edition_override_0(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;

        let mut asset = DigitalAsset::default();
        asset
            .create_and_mint_with_supply(
                &mut context,
                TokenStandard::ProgrammableNonFungible,
                None,
                None,
                1,
                PrintSupply::Unlimited,
                spl_token_program,
            )
            .await
            .unwrap();

        let test_master_edition = MasterEditionV2::new_from_asset(&asset);
        let test_edition_marker =
            EditionMarker::new_from_asset(&asset, &test_master_edition, 0, spl_token_program);

        let result = test_edition_marker
            .create_from_asset(&mut context)
            .await
            .unwrap_err();
        assert_custom_error!(result, MetadataError::EditionOverrideCannotBeZero);
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn fail_to_mint_edition_num_zero(spl_token_program: Pubkey) {
        // Make sure we can't mint 0th edition from a Master Edition with a max supply > 0.
        let mut context = program_test().start_with_context().await;

        let mut asset = DigitalAsset::default();
        asset
            .create_and_mint_with_supply(
                &mut context,
                TokenStandard::ProgrammableNonFungible,
                None,
                None,
                1,
                PrintSupply::Unlimited,
                spl_token_program,
            )
            .await
            .unwrap();

        let test_master_edition = MasterEditionV2::new_from_asset(&asset);
        let test_edition_marker =
            EditionMarker::new_from_asset(&asset, &test_master_edition, 0, spl_token_program);

        let result = test_edition_marker
            .create_from_asset(&mut context)
            .await
            .unwrap_err();
        assert_custom_error!(result, MetadataError::EditionOverrideCannotBeZero);
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn increment_master_edition_supply(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;
        let mut slot = 1;

        let mut original_nft = DigitalAsset::default();
        original_nft
            .create_and_mint_with_supply(
                &mut context,
                TokenStandard::ProgrammableNonFungible,
                None,
                None,
                1,
                PrintSupply::Limited(10),
                spl_token_program,
            )
            .await
            .unwrap();
        let _result = context.warp_to_slot(slot);
        slot += 1;

        let master_edition = MasterEditionV2::new_from_asset(&original_nft);

        let print_edition =
            EditionMarker::new_from_asset(&original_nft, &master_edition, 1, spl_token_program);
        let _result = context.warp_to_slot(slot);
        slot += 1;
        print_edition.create_from_asset(&mut context).await.unwrap();
        let _result = context.warp_to_slot(slot);
        slot += 1;

        // Metadata, Print Edition and token account exist.
        assert!(print_edition.exists_on_chain(&mut context).await);

        let master_edition_struct = master_edition.get_data(&mut context).await;

        // We've printed one edition and our max supply is 10.
        assert!(master_edition_struct.supply == 1);
        assert!(master_edition_struct.max_supply == Some(10));

        // Mint edition number 5 and supply should go up to 2.
        let print_edition =
            EditionMarker::new_from_asset(&original_nft, &master_edition, 5, spl_token_program);
        print_edition.create_from_asset(&mut context).await.unwrap();
        let _result = context.warp_to_slot(slot);
        slot += 1;

        let master_edition_struct = master_edition.get_data(&mut context).await;

        assert!(master_edition_struct.supply == 2);
        assert!(master_edition_struct.max_supply == Some(10));

        // Mint edition number 4 and supply should go up to 3.
        let print_edition =
            EditionMarker::new_from_asset(&original_nft, &master_edition, 4, spl_token_program);
        print_edition.create_from_asset(&mut context).await.unwrap();
        let _result = context.warp_to_slot(slot);
        slot += 1;

        let mut master_edition_struct = master_edition.get_data(&mut context).await;
        let mut master_edition_account = get_account(&mut context, &master_edition.pubkey).await;

        assert!(master_edition_struct.supply == 3);
        assert!(master_edition_struct.max_supply == Some(10));

        // Simulate a collection where there are are missing editions with numbers lower than the current
        // supply value and ensure they can still be minted.
        master_edition_struct.supply = 8;
        let mut data = master_edition_struct.try_to_vec().unwrap();
        let filler = vec![0u8; MAX_MASTER_EDITION_LEN - data.len()];
        data.extend_from_slice(&filler[..]);
        master_edition_account.data = data;

        let master_edition_shared_data: AccountSharedData = master_edition_account.into();
        context.set_account(&master_edition.pubkey, &master_edition_shared_data);

        assert!(master_edition_struct.supply == 8);
        assert!(master_edition_struct.max_supply == Some(10));

        // Mint edition number 2, this will succeed but supply will incremement.
        let print_edition =
            EditionMarker::new_from_asset(&original_nft, &master_edition, 2, spl_token_program);
        let _result = context.warp_to_slot(slot);
        slot += 1;
        print_edition.create_from_asset(&mut context).await.unwrap();
        let _result = context.warp_to_slot(slot);
        slot += 1;

        let master_edition_struct = master_edition.get_data(&mut context).await;

        assert!(master_edition_struct.supply == 9);
        assert!(master_edition_struct.max_supply == Some(10));

        // Mint edition number 10 and supply should increase by 1 to 10.
        let print_edition =
            EditionMarker::new_from_asset(&original_nft, &master_edition, 10, spl_token_program);
        print_edition.create_from_asset(&mut context).await.unwrap();
        let _result = context.warp_to_slot(slot);

        let master_edition_struct = master_edition.get_data(&mut context).await;

        assert!(master_edition_struct.supply == 10);
        assert!(master_edition_struct.max_supply == Some(10));

        // Mint another edition and it should succeed, but supply should stay the same since it's already reached max supply.
        // This allows minting missing editions even when the supply has erroneously reached
        // the max supply, since the bit mask is the source of truth for which particular editions have been minted.
        let print_edition =
            EditionMarker::new_from_asset(&original_nft, &master_edition, 6, spl_token_program);
        print_edition.create_from_asset(&mut context).await.unwrap();

        let master_edition_struct = master_edition.get_data(&mut context).await;

        assert!(master_edition_struct.supply == 10);
        assert!(master_edition_struct.max_supply == Some(10));
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn cannot_mint_edition_num_higher_than_max_supply(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;

        let mut original_nft = DigitalAsset::default();
        original_nft
            .create_and_mint_with_supply(
                &mut context,
                TokenStandard::ProgrammableNonFungible,
                None,
                None,
                1,
                PrintSupply::Limited(10),
                spl_token_program,
            )
            .await
            .unwrap();

        let master_edition = MasterEditionV2::new_from_asset(&original_nft);

        // Mint the first print edition.
        let print_edition =
            EditionMarker::new_from_asset(&original_nft, &master_edition, 1, spl_token_program);
        print_edition.create_from_asset(&mut context).await.unwrap();

        let master_edition_struct = master_edition.get_data(&mut context).await;
        assert!(master_edition_struct.supply == 1);
        assert!(master_edition_struct.max_supply == Some(10));

        // Try mint edition number 11, this should fail.
        let print_edition =
            EditionMarker::new_from_asset(&original_nft, &master_edition, 11, spl_token_program);
        let err = print_edition
            .create_from_asset(&mut context)
            .await
            .unwrap_err();

        assert_custom_error!(err, MetadataError::EditionNumberGreaterThanMaxSupply);

        // Try mint edition number 999, this should fail.
        let print_edition =
            EditionMarker::new_from_asset(&original_nft, &master_edition, 999, spl_token_program);
        let err = print_edition
            .create_from_asset(&mut context)
            .await
            .unwrap_err();

        assert_custom_error!(err, MetadataError::EditionNumberGreaterThanMaxSupply);
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn cannot_remint_existing_edition(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;

        let mut original_nft = DigitalAsset::default();
        original_nft
            .create_and_mint_with_supply(
                &mut context,
                TokenStandard::ProgrammableNonFungible,
                None,
                None,
                1,
                PrintSupply::Limited(999),
                spl_token_program,
            )
            .await
            .unwrap();

        let master_edition = MasterEditionV2::new_from_asset(&original_nft);

        // Mint a couple non-sequential editions.
        let edition_1 =
            EditionMarker::new_from_asset(&original_nft, &master_edition, 1, spl_token_program);
        edition_1.create_from_asset(&mut context).await.unwrap();
        let edition_99 =
            EditionMarker::new_from_asset(&original_nft, &master_edition, 99, spl_token_program);
        edition_99.create_from_asset(&mut context).await.unwrap();

        let master_edition_struct = master_edition.get_data(&mut context).await;
        assert!(master_edition_struct.supply == 2);
        assert!(master_edition_struct.max_supply == Some(999));

        // Try to remint edition numbers 1 and 99, this should fail.
        let print_edition =
            EditionMarker::new_from_asset(&original_nft, &master_edition, 1, spl_token_program);
        let err = print_edition
            .create_from_asset(&mut context)
            .await
            .unwrap_err();

        assert_custom_error!(err, MetadataError::AlreadyInitialized);

        let print_edition =
            EditionMarker::new_from_asset(&original_nft, &master_edition, 99, spl_token_program);
        let err = print_edition
            .create_from_asset(&mut context)
            .await
            .unwrap_err();

        assert_custom_error!(err, MetadataError::AlreadyInitialized);
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn can_mint_out_missing_editions(spl_token_program: Pubkey) {
        // Editions with the older override logic could have missing editions even though supply == max_supply.
        // This test ensures that the new logic can mint out missing editions even when supply == max_supply.
        let mut context = program_test().start_with_context().await;

        let mut original_nft = DigitalAsset::default();
        original_nft
            .create_and_mint_with_supply(
                &mut context,
                TokenStandard::ProgrammableNonFungible,
                None,
                None,
                1,
                PrintSupply::Limited(10),
                spl_token_program,
            )
            .await
            .unwrap();

        let master_edition = MasterEditionV2::new_from_asset(&original_nft);

        // Start with a supply of 10. Mint out edition number 10 and then artificially set the supply to 10
        // to simulate the old edition override logic.
        let edition_10 =
            EditionMarker::new_from_asset(&original_nft, &master_edition, 10, spl_token_program);
        edition_10.create_from_asset(&mut context).await.unwrap();

        let mut master_edition_struct = master_edition.get_data(&mut context).await;
        let mut master_edition_account = get_account(&mut context, &master_edition.pubkey).await;

        master_edition_struct.supply = 10;
        let mut data = master_edition_struct.try_to_vec().unwrap();
        let filler = vec![0u8; MAX_MASTER_EDITION_LEN - data.len()];
        data.extend_from_slice(&filler[..]);
        master_edition_account.data = data;

        let master_edition_shared_data: AccountSharedData = master_edition_account.into();
        context.set_account(&master_edition.pubkey, &master_edition_shared_data);

        assert!(master_edition_struct.supply == 10);
        assert!(master_edition_struct.max_supply == Some(10));

        // Try to mint edition number 11, this should fail.
        let print_edition =
            EditionMarker::new_from_asset(&original_nft, &master_edition, 11, spl_token_program);
        let err = print_edition
            .create_from_asset(&mut context)
            .await
            .unwrap_err();

        assert_custom_error!(err, MetadataError::EditionNumberGreaterThanMaxSupply);

        // We should be able to mint out missing editions 1-9.
        for i in 1..10 {
            let _result = context.warp_to_slot(i);
            let print_edition =
                EditionMarker::new_from_asset(&original_nft, &master_edition, i, spl_token_program);
            print_edition.create_from_asset(&mut context).await.unwrap();
        }

        let master_edition_struct = master_edition.get_data(&mut context).await;

        // Supply should still be 10.
        assert!(master_edition_struct.supply == 10);
        assert!(master_edition_struct.max_supply == Some(10));
    }
}
