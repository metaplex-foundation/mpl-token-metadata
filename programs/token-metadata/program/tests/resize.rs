#![cfg(feature = "test-bpf")]
pub mod utils;

use solana_program_test::*;
use utils::*;

#[cfg(feature = "resize")]
mod resize {
    use instruction::{
        builders::ResizeBuilder, CollectionDetailsToggle, CollectionToggle, InstructionBuilder,
        RuleSetToggle, UpdateArgs, UsesToggle,
    };
    use num_traits::FromPrimitive;
    use solana_program::{native_token::LAMPORTS_PER_SOL, pubkey::Pubkey};
    use solana_sdk::{
        instruction::InstructionError,
        pubkey,
        signature::{read_keypair_file, Keypair},
        signer::Signer,
        transaction::{Transaction, TransactionError},
    };
    use token_metadata::{
        error::MetadataError, pda::find_master_edition_account, state::TokenStandard,
    };

    use super::*;

    const RESIZE_DESTINATION: Pubkey = pubkey!("46mjNQBwXLCDCM7YiDQSPVdNZ4dLdZf79tTPRkT1wkF6");

    #[test_case::test_matrix(
        [spl_token::id(), spl_token_2022::id()],
        [
            TokenStandard::NonFungible,
            TokenStandard::FungibleAsset,
            TokenStandard::Fungible,
            TokenStandard::ProgrammableNonFungible,
        ]
    )]
    #[tokio::test]
    async fn resize_with_payer(spl_token_program: Pubkey, token_standard: TokenStandard) {
        // Create NFTs and then collect the fees from the metadata accounts.
        let mut context = program_test().start_with_context().await;

        let mut nft = DigitalAsset::new();
        nft.create_and_mint(
            &mut context,
            token_standard,
            None,
            None,
            1,
            spl_token_program,
        )
        .await
        .unwrap();

        let edition = match token_standard {
            TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => {
                assert_before_master_edition(&mut context, nft.edition.unwrap()).await;
                nft.edition.unwrap()
            }
            TokenStandard::FungibleAsset | TokenStandard::Fungible => {
                find_master_edition_account(&nft.mint.pubkey()).0
            }
            TokenStandard::NonFungibleEdition | TokenStandard::ProgrammableNonFungibleEdition => {
                panic!("Invalid test for Editions")
            }
        };

        let tx = Transaction::new_signed_with_payer(
            &[ResizeBuilder::new()
                .metadata(nft.metadata)
                .edition(edition)
                .mint(nft.mint.pubkey())
                .payer(context.payer.pubkey())
                .token(nft.token.unwrap())
                .system_program(solana_program::system_program::ID)
                .build()
                .unwrap()
                .instruction()],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );

        let metadata_rent_before = context
            .banks_client
            .get_balance(nft.metadata)
            .await
            .unwrap();
        let edition_rent_before = context.banks_client.get_balance(edition).await.unwrap();
        let destination_rent_before = context
            .banks_client
            .get_balance(context.payer.pubkey())
            .await
            .unwrap();
        assert_before_metadata(&mut context, nft.metadata).await;
        context.banks_client.process_transaction(tx).await.unwrap();
        assert_after_metadata(&mut context, nft.metadata).await;
        match token_standard {
            TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => {
                assert_after_master_edition(&mut context, nft.edition.unwrap()).await;
            }
            TokenStandard::FungibleAsset | TokenStandard::Fungible => {}
            TokenStandard::NonFungibleEdition | TokenStandard::ProgrammableNonFungibleEdition => {
                panic!("Invalid test for Editions")
            }
        };
        let metadata_rent_after = context
            .banks_client
            .get_balance(nft.metadata)
            .await
            .unwrap();
        let edition_rent_after = context.banks_client.get_balance(edition).await.unwrap();
        let destination_rent_after = context
            .banks_client
            .get_balance(context.payer.pubkey())
            .await
            .unwrap();

        let metadata_rent_diff = metadata_rent_before - metadata_rent_after;
        let edition_rent_diff = edition_rent_before - edition_rent_after;
        let destination_rent_diff = destination_rent_after - destination_rent_before;
        assert_eq!(
            metadata_rent_diff + edition_rent_diff - 5000, // 5000 for transaction fee
            destination_rent_diff
        );
    }

    #[test_case::test_matrix(
        [spl_token::id(), spl_token_2022::id()],
        [
            TokenStandard::NonFungible,
            TokenStandard::ProgrammableNonFungible,
        ]
    )]
    #[tokio::test]
    async fn resize_nft_as_owner(spl_token_program: Pubkey, token_standard: TokenStandard) {
        // Create NFTs and then collect the fees from the metadata accounts.
        let mut context = program_test().start_with_context().await;
        let update_authority = Keypair::new();
        let destination = Keypair::new();

        let mut nft = DigitalAsset::new();
        nft.create_and_mint(
            &mut context,
            token_standard,
            None,
            None,
            1,
            spl_token_program,
        )
        .await
        .unwrap();

        let context_payer = Keypair::from_bytes(&context.payer.to_bytes()).unwrap();

        context.warp_to_slot(100).unwrap();

        nft.update(
            &mut context,
            context_payer,
            UpdateArgs::V1 {
                new_update_authority: Some(update_authority.pubkey()),
                data: None,
                primary_sale_happened: None,
                is_mutable: None,
                collection: CollectionToggle::None,
                collection_details: CollectionDetailsToggle::None,
                uses: UsesToggle::None,
                rule_set: RuleSetToggle::None,
                authorization_data: None,
            },
        )
        .await
        .unwrap();

        let edition = match token_standard {
            TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => {
                assert_before_master_edition(&mut context, nft.edition.unwrap()).await;
                nft.edition.unwrap()
            }
            TokenStandard::FungibleAsset | TokenStandard::Fungible => {
                find_master_edition_account(&nft.mint.pubkey()).0
            }
            TokenStandard::NonFungibleEdition | TokenStandard::ProgrammableNonFungibleEdition => {
                panic!("Invalid test for Editions")
            }
        };

        context.warp_to_slot(200).unwrap();
        let tx = Transaction::new_signed_with_payer(
            &[ResizeBuilder::new()
                .metadata(nft.metadata)
                .edition(edition)
                .mint(nft.mint.pubkey())
                .payer(destination.pubkey())
                .authority(context.payer.pubkey())
                .token(nft.token.unwrap())
                .system_program(solana_program::system_program::ID)
                .build()
                .unwrap()
                .instruction()],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );

        let metadata_rent_before = context
            .banks_client
            .get_balance(nft.metadata)
            .await
            .unwrap();
        let edition_rent_before = context.banks_client.get_balance(edition).await.unwrap();
        let destination_rent_before = context
            .banks_client
            .get_balance(destination.pubkey())
            .await
            .unwrap();
        assert_before_metadata(&mut context, nft.metadata).await;
        context.banks_client.process_transaction(tx).await.unwrap();
        assert_after_metadata(&mut context, nft.metadata).await;
        match token_standard {
            TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => {
                assert_after_master_edition(&mut context, nft.edition.unwrap()).await;
            }
            TokenStandard::FungibleAsset | TokenStandard::Fungible => {}
            TokenStandard::NonFungibleEdition | TokenStandard::ProgrammableNonFungibleEdition => {
                panic!("Invalid test for Editions")
            }
        };
        let metadata_rent_after = context
            .banks_client
            .get_balance(nft.metadata)
            .await
            .unwrap();
        let edition_rent_after = context.banks_client.get_balance(edition).await.unwrap();
        let destination_rent_after = context
            .banks_client
            .get_balance(destination.pubkey())
            .await
            .unwrap();

        let metadata_rent_diff = metadata_rent_before - metadata_rent_after;
        let edition_rent_diff = edition_rent_before - edition_rent_after;
        let destination_rent_diff = destination_rent_after - destination_rent_before;
        assert_eq!(
            metadata_rent_diff + edition_rent_diff, // 5000 for transaction fee
            destination_rent_diff
        );
    }

    #[test_case::test_matrix(
        [spl_token::id(), spl_token_2022::id()],
        [
            TokenStandard::Fungible,
            TokenStandard::FungibleAsset,
        ]
    )]
    #[tokio::test]
    // Currently ignoring due to DeadlineExceeded errors.
    #[ignore]
    async fn resize_fungible_as_update_authority(
        spl_token_program: Pubkey,
        token_standard: TokenStandard,
    ) {
        // Create NFTs and then collect the fees from the metadata accounts.
        let mut context = program_test().start_with_context().await;
        let update_authority = Keypair::new();
        let destination = Keypair::new();
        let mut fungible = DigitalAsset::new();
        fungible
            .create_and_mint(
                &mut context,
                token_standard,
                None,
                None,
                1,
                spl_token_program,
            )
            .await
            .unwrap();

        let context_payer = Keypair::from_bytes(&context.payer.to_bytes()).unwrap();

        context.warp_to_slot(100).unwrap();

        fungible
            .update(
                &mut context,
                context_payer,
                UpdateArgs::V1 {
                    new_update_authority: Some(update_authority.pubkey()),
                    data: None,
                    primary_sale_happened: None,
                    is_mutable: None,
                    collection: CollectionToggle::None,
                    collection_details: CollectionDetailsToggle::None,
                    uses: UsesToggle::None,
                    rule_set: RuleSetToggle::None,
                    authorization_data: None,
                },
            )
            .await
            .unwrap();

        let edition = match token_standard {
            TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => {
                assert_before_master_edition(&mut context, fungible.edition.unwrap()).await;
                fungible.edition.unwrap()
            }
            TokenStandard::FungibleAsset | TokenStandard::Fungible => {
                find_master_edition_account(&fungible.mint.pubkey()).0
            }
            TokenStandard::NonFungibleEdition | TokenStandard::ProgrammableNonFungibleEdition => {
                panic!("Invalid test for Editions")
            }
        };

        context.warp_to_slot(200).unwrap();
        let tx = Transaction::new_signed_with_payer(
            &[ResizeBuilder::new()
                .metadata(fungible.metadata)
                .edition(edition)
                .mint(fungible.mint.pubkey())
                .payer(destination.pubkey())
                .authority(update_authority.pubkey())
                .token(fungible.token.unwrap())
                .system_program(solana_program::system_program::ID)
                .build()
                .unwrap()
                .instruction()],
            Some(&update_authority.pubkey()),
            &[&update_authority],
            context.get_new_latest_blockhash().await.unwrap(),
        );

        let metadata_rent_before = context
            .banks_client
            .get_balance(fungible.metadata)
            .await
            .unwrap();
        let edition_rent_before = context.banks_client.get_balance(edition).await.unwrap();
        let destination_rent_before = context
            .banks_client
            .get_balance(destination.pubkey())
            .await
            .unwrap();
        assert_before_metadata(&mut context, fungible.metadata).await;
        context.warp_to_slot(300).unwrap();
        context.banks_client.process_transaction(tx).await.unwrap();
        assert_after_metadata(&mut context, fungible.metadata).await;
        match token_standard {
            TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => {
                assert_after_master_edition(&mut context, fungible.edition.unwrap()).await;
            }
            TokenStandard::FungibleAsset | TokenStandard::Fungible => {}
            TokenStandard::NonFungibleEdition | TokenStandard::ProgrammableNonFungibleEdition => {
                panic!("Invalid test for Editions")
            }
        };
        let metadata_rent_after = context
            .banks_client
            .get_balance(fungible.metadata)
            .await
            .unwrap();
        let edition_rent_after = context.banks_client.get_balance(edition).await.unwrap();
        let destination_rent_after = context
            .banks_client
            .get_balance(destination.pubkey())
            .await
            .unwrap();

        let metadata_rent_diff = metadata_rent_before - metadata_rent_after;
        let edition_rent_diff = edition_rent_before - edition_rent_after;
        let destination_rent_diff = destination_rent_after - destination_rent_before;
        assert_eq!(
            metadata_rent_diff + edition_rent_diff, // 5000 for transaction fee
            destination_rent_diff
        );
    }

    #[test_case::test_matrix(
        [spl_token::id(), spl_token_2022::id()],
        [
            TokenStandard::NonFungible,
            TokenStandard::FungibleAsset,
            TokenStandard::Fungible,
            TokenStandard::ProgrammableNonFungible,
        ]
    )]
    #[tokio::test]
    async fn resize_with_payer_and_authority(
        spl_token_program: Pubkey,
        token_standard: TokenStandard,
    ) {
        // Create NFTs and then collect the fees from the metadata accounts.
        let mut context = program_test().start_with_context().await;

        let funding = 10 * LAMPORTS_PER_SOL;
        let payer = Keypair::new();
        payer.airdrop(&mut context, funding).await.unwrap();

        let mut nft = DigitalAsset::new();
        nft.create_and_mint(
            &mut context,
            token_standard,
            None,
            None,
            1,
            spl_token_program,
        )
        .await
        .unwrap();

        let edition = match token_standard {
            TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => {
                assert_before_master_edition(&mut context, nft.edition.unwrap()).await;
                nft.edition.unwrap()
            }
            TokenStandard::FungibleAsset | TokenStandard::Fungible => {
                find_master_edition_account(&nft.mint.pubkey()).0
            }
            TokenStandard::NonFungibleEdition | TokenStandard::ProgrammableNonFungibleEdition => {
                panic!("Invalid test for Editions")
            }
        };

        let tx = Transaction::new_signed_with_payer(
            &[ResizeBuilder::new()
                .metadata(nft.metadata)
                .edition(edition)
                .mint(nft.mint.pubkey())
                .payer(payer.pubkey())
                .authority(context.payer.pubkey())
                .token(nft.token.unwrap())
                .system_program(solana_program::system_program::ID)
                .build()
                .unwrap()
                .instruction()],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );

        let metadata_rent_before = context
            .banks_client
            .get_balance(nft.metadata)
            .await
            .unwrap();
        let edition_rent_before = context.banks_client.get_balance(edition).await.unwrap();
        let destination_rent_before = context
            .banks_client
            .get_balance(payer.pubkey())
            .await
            .unwrap();
        assert_before_metadata(&mut context, nft.metadata).await;
        context.banks_client.process_transaction(tx).await.unwrap();
        assert_after_metadata(&mut context, nft.metadata).await;
        match token_standard {
            TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => {
                assert_after_master_edition(&mut context, nft.edition.unwrap()).await;
            }
            TokenStandard::FungibleAsset | TokenStandard::Fungible => {}
            TokenStandard::NonFungibleEdition | TokenStandard::ProgrammableNonFungibleEdition => {
                panic!("Invalid test for Editions")
            }
        };
        let metadata_rent_after = context
            .banks_client
            .get_balance(nft.metadata)
            .await
            .unwrap();
        let edition_rent_after = context.banks_client.get_balance(edition).await.unwrap();
        let destination_rent_after = context
            .banks_client
            .get_balance(payer.pubkey())
            .await
            .unwrap();

        let metadata_rent_diff = metadata_rent_before - metadata_rent_after;
        let edition_rent_diff = edition_rent_before - edition_rent_after;
        let destination_rent_diff = destination_rent_after - destination_rent_before;
        assert_eq!(
            metadata_rent_diff + edition_rent_diff,
            destination_rent_diff
        );
    }

    #[test_case::test_matrix(
        [spl_token::id(), spl_token_2022::id()],
        [
            TokenStandard::NonFungible,
            TokenStandard::FungibleAsset,
            TokenStandard::Fungible,
            TokenStandard::ProgrammableNonFungible,
        ]
    )]
    #[tokio::test]
    #[ignore]
    // Used for local QA testing and requires a keypair so excluded from CI.
    async fn resize_with_resize_authority(
        spl_token_program: Pubkey,
        token_standard: TokenStandard,
    ) {
        // Create NFTs and then collect the fees from the metadata accounts.
        let mut context = program_test().start_with_context().await;

        let funding = 10 * LAMPORTS_PER_SOL;
        let authority = read_keypair_file(
            "/Users/kelliott/Metaplex/Keys/ResizebfwTEZTLbHbctTByvXYECKTJQXnMWG8g9XLix.json",
        )
        .unwrap();
        authority.airdrop(&mut context, funding).await.unwrap();
        // Prefund to meet rent exemption.
        RESIZE_DESTINATION
            .airdrop(&mut context, funding)
            .await
            .unwrap();

        let mut nft = DigitalAsset::new();
        nft.create_and_mint(
            &mut context,
            token_standard,
            None,
            None,
            1,
            spl_token_program,
        )
        .await
        .unwrap();

        let edition = match token_standard {
            TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => {
                assert_before_master_edition(&mut context, nft.edition.unwrap()).await;
                nft.edition.unwrap()
            }
            TokenStandard::FungibleAsset | TokenStandard::Fungible => {
                find_master_edition_account(&nft.mint.pubkey()).0
            }
            TokenStandard::NonFungibleEdition | TokenStandard::ProgrammableNonFungibleEdition => {
                panic!("Invalid test for Editions")
            }
        };

        let tx = Transaction::new_signed_with_payer(
            &[ResizeBuilder::new()
                .metadata(nft.metadata)
                .edition(edition)
                .mint(nft.mint.pubkey())
                .payer(RESIZE_DESTINATION)
                .authority(authority.pubkey())
                .token(nft.token.unwrap())
                .system_program(solana_program::system_program::ID)
                .build()
                .unwrap()
                .instruction()],
            Some(&authority.pubkey()),
            &[&authority],
            context.last_blockhash,
        );

        let metadata_rent_before = context
            .banks_client
            .get_balance(nft.metadata)
            .await
            .unwrap();
        let edition_rent_before = context.banks_client.get_balance(edition).await.unwrap();
        let destination_rent_before = context
            .banks_client
            .get_balance(RESIZE_DESTINATION)
            .await
            .unwrap();
        assert_before_metadata(&mut context, nft.metadata).await;
        context.banks_client.process_transaction(tx).await.unwrap();
        assert_after_metadata(&mut context, nft.metadata).await;
        match token_standard {
            TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => {
                assert_after_master_edition(&mut context, nft.edition.unwrap()).await;
            }
            TokenStandard::FungibleAsset | TokenStandard::Fungible => {}
            TokenStandard::NonFungibleEdition | TokenStandard::ProgrammableNonFungibleEdition => {
                panic!("Invalid test for Editions")
            }
        };
        let metadata_rent_after = context
            .banks_client
            .get_balance(nft.metadata)
            .await
            .unwrap();
        let edition_rent_after = context.banks_client.get_balance(edition).await.unwrap();
        let destination_rent_after = context
            .banks_client
            .get_balance(RESIZE_DESTINATION)
            .await
            .unwrap();

        let metadata_rent_diff = metadata_rent_before - metadata_rent_after;
        let edition_rent_diff = edition_rent_before - edition_rent_after;
        let destination_rent_diff = destination_rent_after - destination_rent_before;
        assert_eq!(
            metadata_rent_diff + edition_rent_diff,
            destination_rent_diff
        );
    }

    #[test_case::test_matrix(
        [spl_token::id(), spl_token_2022::id()],
        [
            TokenStandard::NonFungible,
            TokenStandard::FungibleAsset,
            TokenStandard::Fungible,
            TokenStandard::ProgrammableNonFungible,
        ]
    )]
    #[tokio::test]
    #[ignore]
    // Used for local QA testing and requires a keypair so excluded from CI.
    async fn cannot_resize_with_resize_authority_and_wrong_destination(
        spl_token_program: Pubkey,
        token_standard: TokenStandard,
    ) {
        // Create NFTs and then collect the fees from the metadata accounts.
        let mut context = program_test().start_with_context().await;

        let funding = 10 * LAMPORTS_PER_SOL;
        let authority = read_keypair_file(
            "/Users/kelliott/Metaplex/Keys/ResizebfwTEZTLbHbctTByvXYECKTJQXnMWG8g9XLix.json",
        )
        .unwrap();
        authority.airdrop(&mut context, funding).await.unwrap();

        let mut nft = DigitalAsset::new();
        nft.create_and_mint(
            &mut context,
            token_standard,
            None,
            None,
            1,
            spl_token_program,
        )
        .await
        .unwrap();

        let edition = match token_standard {
            TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => {
                assert_before_master_edition(&mut context, nft.edition.unwrap()).await;
                nft.edition.unwrap()
            }
            TokenStandard::FungibleAsset | TokenStandard::Fungible => {
                find_master_edition_account(&nft.mint.pubkey()).0
            }
            TokenStandard::NonFungibleEdition | TokenStandard::ProgrammableNonFungibleEdition => {
                panic!("Invalid test for Editions")
            }
        };

        let tx = Transaction::new_signed_with_payer(
            &[ResizeBuilder::new()
                .metadata(nft.metadata)
                .edition(edition)
                .mint(nft.mint.pubkey())
                .payer(context.payer.pubkey())
                .authority(authority.pubkey())
                .token(nft.token.unwrap())
                .system_program(solana_program::system_program::ID)
                .build()
                .unwrap()
                .instruction()],
            Some(&authority.pubkey()),
            &[&authority],
            context.last_blockhash,
        );

        assert_before_metadata(&mut context, nft.metadata).await;
        let result = context
            .banks_client
            .process_transaction(tx)
            .await
            .unwrap_err();

        assert_custom_error!(result, MetadataError::InvalidFeeAccount);
    }

    #[test_case::test_matrix(
        [spl_token::id(), spl_token_2022::id()],
        [
            TokenStandard::NonFungible,
            TokenStandard::FungibleAsset,
            TokenStandard::Fungible,
            TokenStandard::ProgrammableNonFungible,
        ]
    )]
    #[tokio::test]
    async fn cannot_resize_wrong_metadata(
        spl_token_program: Pubkey,
        token_standard: TokenStandard,
    ) {
        // Create NFTs and then collect the fees from the metadata accounts.
        let mut context = program_test().start_with_context().await;
        let mut nft = DigitalAsset::new();
        nft.create_and_mint(
            &mut context,
            token_standard,
            None,
            None,
            1,
            spl_token_program,
        )
        .await
        .unwrap();

        let mut other_nft = DigitalAsset::new();
        other_nft
            .create_and_mint(
                &mut context,
                token_standard,
                None,
                None,
                1,
                spl_token_program,
            )
            .await
            .unwrap();

        let edition = match token_standard {
            TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => {
                assert_before_master_edition(&mut context, nft.edition.unwrap()).await;
                nft.edition.unwrap()
            }
            TokenStandard::FungibleAsset | TokenStandard::Fungible => {
                find_master_edition_account(&nft.mint.pubkey()).0
            }
            TokenStandard::NonFungibleEdition | TokenStandard::ProgrammableNonFungibleEdition => {
                panic!("Invalid test for Editions")
            }
        };

        let tx = Transaction::new_signed_with_payer(
            &[ResizeBuilder::new()
                .metadata(other_nft.metadata)
                .edition(edition)
                .mint(nft.mint.pubkey())
                .payer(context.payer.pubkey())
                .token(nft.token.unwrap())
                .system_program(solana_program::system_program::ID)
                .build()
                .unwrap()
                .instruction()],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );

        assert_before_metadata(&mut context, nft.metadata).await;
        let result = context
            .banks_client
            .process_transaction(tx)
            .await
            .unwrap_err();

        assert_custom_error!(result, MetadataError::MintMismatch);
    }

    #[test_case::test_matrix(
        [spl_token::id(), spl_token_2022::id()],
        [
            TokenStandard::NonFungible,
            TokenStandard::FungibleAsset,
            TokenStandard::Fungible,
            TokenStandard::ProgrammableNonFungible,
        ]
    )]
    #[tokio::test]
    async fn cannot_resize_wrong_edition(spl_token_program: Pubkey, token_standard: TokenStandard) {
        // Create NFTs and then collect the fees from the metadata accounts.
        let mut context = program_test().start_with_context().await;
        let mut nft = DigitalAsset::new();
        nft.create_and_mint(
            &mut context,
            token_standard,
            None,
            None,
            1,
            spl_token_program,
        )
        .await
        .unwrap();

        let mut other_nft = DigitalAsset::new();
        other_nft
            .create_and_mint(
                &mut context,
                token_standard,
                None,
                None,
                1,
                spl_token_program,
            )
            .await
            .unwrap();

        let other_edition = match token_standard {
            TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => {
                assert_before_master_edition(&mut context, other_nft.edition.unwrap()).await;
                other_nft.edition.unwrap()
            }
            TokenStandard::FungibleAsset | TokenStandard::Fungible => {
                find_master_edition_account(&other_nft.mint.pubkey()).0
            }
            TokenStandard::NonFungibleEdition | TokenStandard::ProgrammableNonFungibleEdition => {
                panic!("Invalid test for Editions")
            }
        };

        let tx = Transaction::new_signed_with_payer(
            &[ResizeBuilder::new()
                .metadata(nft.metadata)
                .edition(other_edition)
                .mint(nft.mint.pubkey())
                .payer(context.payer.pubkey())
                .token(nft.token.unwrap())
                .system_program(solana_program::system_program::ID)
                .build()
                .unwrap()
                .instruction()],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );

        assert_before_metadata(&mut context, nft.metadata).await;
        let result = context
            .banks_client
            .process_transaction(tx)
            .await
            .unwrap_err();

        assert_custom_error!(result, MetadataError::DerivedKeyInvalid);
    }

    #[test_case::test_matrix(
        [spl_token::id(), spl_token_2022::id()],
        [
            TokenStandard::NonFungible,
            TokenStandard::FungibleAsset,
            TokenStandard::Fungible,
            TokenStandard::ProgrammableNonFungible,
        ]
    )]
    #[tokio::test]
    async fn cannot_resize_wrong_mint(spl_token_program: Pubkey, token_standard: TokenStandard) {
        // Create NFTs and then collect the fees from the metadata accounts.
        let mut context = program_test().start_with_context().await;
        let mut nft = DigitalAsset::new();
        nft.create_and_mint(
            &mut context,
            token_standard,
            None,
            None,
            1,
            spl_token_program,
        )
        .await
        .unwrap();

        let mut other_nft = DigitalAsset::new();
        other_nft
            .create_and_mint(
                &mut context,
                token_standard,
                None,
                None,
                1,
                spl_token_program,
            )
            .await
            .unwrap();

        let edition = match token_standard {
            TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => {
                assert_before_master_edition(&mut context, nft.edition.unwrap()).await;
                nft.edition.unwrap()
            }
            TokenStandard::FungibleAsset | TokenStandard::Fungible => {
                find_master_edition_account(&nft.mint.pubkey()).0
            }
            TokenStandard::NonFungibleEdition | TokenStandard::ProgrammableNonFungibleEdition => {
                panic!("Invalid test for Editions")
            }
        };

        let tx = Transaction::new_signed_with_payer(
            &[ResizeBuilder::new()
                .metadata(nft.metadata)
                .edition(edition)
                .mint(other_nft.mint.pubkey())
                .payer(context.payer.pubkey())
                .token(nft.token.unwrap())
                .system_program(solana_program::system_program::ID)
                .build()
                .unwrap()
                .instruction()],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );

        assert_before_metadata(&mut context, nft.metadata).await;
        let result = context
            .banks_client
            .process_transaction(tx)
            .await
            .unwrap_err();

        assert_custom_error!(result, MetadataError::DerivedKeyInvalid);
    }

    #[test_case::test_matrix(
        [spl_token::id(), spl_token_2022::id()],
        [
            TokenStandard::NonFungible,
            TokenStandard::FungibleAsset,
            TokenStandard::Fungible,
            TokenStandard::ProgrammableNonFungible,
        ]
    )]
    #[tokio::test]
    async fn cannot_resize_wrong_edition_wrong_mint(
        spl_token_program: Pubkey,
        token_standard: TokenStandard,
    ) {
        // Create NFTs and then collect the fees from the metadata accounts.
        let mut context = program_test().start_with_context().await;
        let mut nft = DigitalAsset::new();
        nft.create_and_mint(
            &mut context,
            token_standard,
            None,
            None,
            1,
            spl_token_program,
        )
        .await
        .unwrap();

        let mut other_nft = DigitalAsset::new();
        other_nft
            .create_and_mint(
                &mut context,
                token_standard,
                None,
                None,
                1,
                spl_token_program,
            )
            .await
            .unwrap();

        let other_edition = match token_standard {
            TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => {
                assert_before_master_edition(&mut context, other_nft.edition.unwrap()).await;
                other_nft.edition.unwrap()
            }
            TokenStandard::FungibleAsset | TokenStandard::Fungible => {
                find_master_edition_account(&other_nft.mint.pubkey()).0
            }
            TokenStandard::NonFungibleEdition | TokenStandard::ProgrammableNonFungibleEdition => {
                panic!("Invalid test for Editions")
            }
        };

        let tx = Transaction::new_signed_with_payer(
            &[ResizeBuilder::new()
                .metadata(nft.metadata)
                .edition(other_edition)
                .mint(other_nft.mint.pubkey())
                .payer(context.payer.pubkey())
                .token(nft.token.unwrap())
                .system_program(solana_program::system_program::ID)
                .build()
                .unwrap()
                .instruction()],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );

        assert_before_metadata(&mut context, nft.metadata).await;
        let result = context
            .banks_client
            .process_transaction(tx)
            .await
            .unwrap_err();

        assert_custom_error!(result, MetadataError::MintMismatch);
    }

    #[test_case::test_matrix(
        [spl_token::id(), spl_token_2022::id()],
        [
            // Fungible resizes don't care about the token account.
            TokenStandard::NonFungible,
            TokenStandard::ProgrammableNonFungible,
        ]
    )]
    #[tokio::test]
    async fn cannot_resize_wrong_token(spl_token_program: Pubkey, token_standard: TokenStandard) {
        // Create NFTs and then collect the fees from the metadata accounts.
        let mut context = program_test().start_with_context().await;
        let mut nft = DigitalAsset::new();
        nft.create_and_mint(
            &mut context,
            token_standard,
            None,
            None,
            1,
            spl_token_program,
        )
        .await
        .unwrap();

        let mut other_nft = DigitalAsset::new();
        other_nft
            .create_and_mint(
                &mut context,
                token_standard,
                None,
                None,
                1,
                spl_token_program,
            )
            .await
            .unwrap();

        let edition = match token_standard {
            TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => {
                assert_before_master_edition(&mut context, nft.edition.unwrap()).await;
                nft.edition.unwrap()
            }
            TokenStandard::FungibleAsset | TokenStandard::Fungible => {
                find_master_edition_account(&nft.mint.pubkey()).0
            }
            TokenStandard::NonFungibleEdition | TokenStandard::ProgrammableNonFungibleEdition => {
                panic!("Invalid test for Editions")
            }
        };

        let tx = Transaction::new_signed_with_payer(
            &[ResizeBuilder::new()
                .metadata(nft.metadata)
                .edition(edition)
                .mint(nft.mint.pubkey())
                .payer(context.payer.pubkey())
                .token(other_nft.token.unwrap())
                .system_program(solana_program::system_program::ID)
                .build()
                .unwrap()
                .instruction()],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );

        assert_before_metadata(&mut context, nft.metadata).await;
        let result = context
            .banks_client
            .process_transaction(tx)
            .await
            .unwrap_err();

        assert_custom_error!(result, MetadataError::MintMismatch);
    }
}
