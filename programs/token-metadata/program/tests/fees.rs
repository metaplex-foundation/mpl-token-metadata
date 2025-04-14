#![cfg(feature = "test-bpf")]
pub mod utils;

use arch_program_test::*;
use utils::*;

mod fees {
    use num_traits::FromPrimitive;
    use arch_program::{native_token::LAMPORTS_PER_SOL, pubkey::Pubkey};
    use solana_sdk::{
        instruction::InstructionError,
        pubkey,
        signature::{read_keypair_file, Keypair},
        signer::Signer,
        transaction::Transaction,
        transaction::TransactionError,
    };
    use token_metadata::{
        error::MetadataError,
        instruction::{collect_fees, BurnArgs, UpdateArgs},
        state::{
            FEE_DESTINATION, FEE_FLAG_CLEARED, FEE_FLAG_SET, METADATA_FEE_FLAG_OFFSET,
            OWNERLESS_CLOSE_DESTINATION,
        },
    };

    use super::*;

    #[tokio::test]
    async fn fee_manager_pdas_are_correct() {
        let fee_manager = pubkey!("mgrfTeJh5VgHt67LQQVZ7U2gPY88En94QMWz64cV2AY");

        // Fee destination is correct PDA of the fee-manager program.
        let (derived_fee_dest, _) =
            Pubkey::find_program_address(&["fee_manager_treasury".as_bytes()], &fee_manager);
        assert_eq!(derived_fee_dest, FEE_DESTINATION);

        // Ownerless close destination is correct PDA of the fee-manager program.

        let (derived_ownerless_close_dest, _) =
            Pubkey::find_program_address(&["fee_manager_close_treasury".as_bytes()], &fee_manager);
        assert_eq!(derived_ownerless_close_dest, OWNERLESS_CLOSE_DESTINATION);
    }

    #[tokio::test]
    async fn charge_create_metadata_v3() {
        let mut context = program_test().start_with_context().await;

        let md = Metadata::new();
        md.create_v3_default(&mut context).await.unwrap();

        md.assert_fee_flag_set(&mut context).await.unwrap();
        md.assert_create_fees_charged(&mut context).await.unwrap();
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn charge_create(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;

        let mut nft = DigitalAsset::new();
        nft.create(
            &mut context,
            token_metadata::state::TokenStandard::NonFungible,
            None,
            spl_token_program,
        )
        .await
        .unwrap();

        nft.assert_fee_flag_set(&mut context).await.unwrap();
        nft.assert_create_fees_charged(&mut context).await.unwrap();
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn update_does_not_overwrite_flag(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;

        let update_authority = context.payer.dirty_clone();

        let mut nft = DigitalAsset::new();
        nft.create(
            &mut context,
            token_metadata::state::TokenStandard::NonFungible,
            None,
            spl_token_program,
        )
        .await
        .unwrap();

        let mut args = UpdateArgs::default_as_update_authority();
        match &mut args {
            UpdateArgs::AsUpdateAuthorityV2 { is_mutable, .. } => {
                *is_mutable = Some(false);
            }
            _ => panic!("Unexpected enum variant"),
        }

        nft.update(&mut context, update_authority, args)
            .await
            .unwrap();

        nft.assert_fee_flag_set(&mut context).await.unwrap();
        nft.assert_create_fees_charged(&mut context).await.unwrap();
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    // Used for local QA testing and requires a keypair so excluded from CI.
    #[ignore]
    async fn collect_fees_max_accounts(spl_token_program: Pubkey) {
        // Create NFTs and then collect the fees from the metadata accounts.
        let mut context = program_test().start_with_context().await;

        let authority_funding = 10 * LAMPORTS_PER_SOL;

        let authority = read_keypair_file(
            "/home/danenbm/keypairs/Levytx9LLPzAtDJJD7q813Zsm8zg9e1pb53mGxTKpD7.json",
        )
        .unwrap();
        authority
            .airdrop(&mut context, authority_funding)
            .await
            .unwrap();

        let num_accounts = 25;

        let mut nfts = vec![];
        for _ in 0..num_accounts {
            let mut nft = DigitalAsset::new();
            nft.create(
                &mut context,
                token_metadata::state::TokenStandard::NonFungible,
                None,
                spl_token_program,
            )
            .await
            .unwrap();
            nfts.push(nft);
        }

        let fee_accounts: Vec<Pubkey> = nfts.iter().map(|nft| nft.metadata).collect();

        let ix = collect_fees(FEE_DESTINATION, fee_accounts.clone());
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&authority.pubkey()),
            &[&authority],
            context.last_blockhash,
        );
        println!("Transaction size: {:?}", tx.message().serialize().len());
        context.banks_client.process_transaction(tx).await.unwrap();

        let expected_balance = num_accounts * SOLANA_CREATE_FEE;

        let recipient_balance = get_account(&mut context, &FEE_DESTINATION).await.lamports;

        assert_eq!(recipient_balance, expected_balance);

        // Fee flag in metadata accounts is cleared.
        for account in fee_accounts {
            let account = get_account(&mut context, &account).await;

            let last_byte = account.data.len() - METADATA_FEE_FLAG_OFFSET;
            assert_eq!(account.data[last_byte], FEE_FLAG_CLEARED);
        }
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    // Used for local QA testing and requires a keypair so excluded from CI.
    #[ignore]
    async fn collect_fees_burned_account(spl_token_program: Pubkey) {
        // Create NFTs and then collect the fees from the metadata accounts.
        let mut context = program_test().start_with_context().await;

        let nft_authority = context.payer.dirty_clone();

        let fee_authority_funding = LAMPORTS_PER_SOL;

        let fee_authority = read_keypair_file(
            "/home/danenbm/keypairs/Levytx9LLPzAtDJJD7q813Zsm8zg9e1pb53mGxTKpD7.json",
        )
        .unwrap();
        fee_authority
            .airdrop(&mut context, fee_authority_funding)
            .await
            .unwrap();

        let mut nft = DigitalAsset::new();
        nft.create_and_mint(
            &mut context,
            token_metadata::state::TokenStandard::NonFungible,
            None,
            None,
            1,
            spl_token_program,
        )
        .await
        .unwrap();

        let args = BurnArgs::V1 { amount: 1 };

        nft.burn(
            &mut context,
            nft_authority,
            args,
            None,
            None,
            spl_token_program,
        )
        .await
        .unwrap();

        let ix = collect_fees(FEE_DESTINATION, vec![nft.metadata]);
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&fee_authority.pubkey()),
            &[&fee_authority],
            context.last_blockhash,
        );
        context.banks_client.process_transaction(tx).await.unwrap();

        let expected_balance = SOLANA_CREATE_FEE;

        let recipient_balance = get_account(&mut context, &FEE_DESTINATION).await.lamports;

        assert_eq!(recipient_balance, expected_balance);
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    // Used for local QA testing and requires a keypair so excluded from CI.
    #[ignore]
    async fn cannot_collect_fees_using_wrong_fee_destination(spl_token_program: Pubkey) {
        // Create NFTs and then collect the fees from the metadata accounts.
        let mut context = program_test().start_with_context().await;

        let authority_funding = 10 * LAMPORTS_PER_SOL;

        let authority = read_keypair_file(
            "/home/danenbm/keypairs/Levytx9LLPzAtDJJD7q813Zsm8zg9e1pb53mGxTKpD7.json",
        )
        .unwrap();
        authority
            .airdrop(&mut context, authority_funding)
            .await
            .unwrap();

        // Fee destination is meant to be a specific PDA of the fee-manager program.
        let wrong_fee_destination = Keypair::new().pubkey();

        let mut nft = DigitalAsset::new();
        nft.create(
            &mut context,
            token_metadata::state::TokenStandard::NonFungible,
            None,
            spl_token_program,
        )
        .await
        .unwrap();

        let before_lamports = get_account(&mut context, &nft.metadata).await.lamports;

        let ix = collect_fees(wrong_fee_destination, vec![nft.metadata]);
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&authority.pubkey()),
            &[&authority],
            context.last_blockhash,
        );
        let err = context
            .banks_client
            .process_transaction(tx)
            .await
            .unwrap_err();

        assert_custom_error!(err, MetadataError::InvalidFeeAccount);

        let account = get_account(&mut context, &nft.metadata).await;
        let last_byte = account.data.len() - METADATA_FEE_FLAG_OFFSET;
        assert_eq!(account.data[last_byte], FEE_FLAG_SET);
        assert_eq!(account.lamports, before_lamports);
    }
}
