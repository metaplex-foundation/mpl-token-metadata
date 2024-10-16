#![cfg(feature = "test-bpf")]
pub mod utils;

use solana_program_test::*;
use utils::*;

mod resize {
    use instruction::{builders::ResizeBuilder, InstructionBuilder};
    use solana_program::{native_token::LAMPORTS_PER_SOL, pubkey::Pubkey};
    use solana_sdk::{
        pubkey, signature::read_keypair_file, signer::Signer, transaction::Transaction,
    };

    use super::*;

    const RESIZE_DESTINATION: Pubkey = pubkey!("Levytx9LLPzAtDJJD7q813Zsm8zg9e1pb53mGxTKpD7");

    #[cfg(feature = "resize")]
    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    // Used for local QA testing and requires a keypair so excluded from CI.
    async fn resize_with_authority(spl_token_program: Pubkey) {
        // Create NFTs and then collect the fees from the metadata accounts.
        let mut context = program_test().start_with_context().await;

        let authority_funding = 10 * LAMPORTS_PER_SOL;
        let authority = read_keypair_file(
            "/Users/kelliott/Metaplex/Keys/ResizebfwTEZTLbHbctTByvXYECKTJQXnMWG8g9XLix.json",
        )
        .unwrap();
        authority
            .airdrop(&mut context, authority_funding)
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

        let tx = Transaction::new_signed_with_payer(
            &[ResizeBuilder::new()
                .metadata(nft.metadata)
                .edition(nft.edition.unwrap())
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
        let edition_rent_before = context
            .banks_client
            .get_balance(nft.edition.unwrap())
            .await
            .unwrap();
        let destination_rent_before = context
            .banks_client
            .get_balance(RESIZE_DESTINATION)
            .await
            .unwrap();
        assert_before_metadata(&mut context, nft.metadata).await;
        assert_before_master_edition(&mut context, nft.edition.unwrap()).await;
        context.banks_client.process_transaction(tx).await.unwrap();
        assert_after_metadata(&mut context, nft.metadata).await;
        assert_after_master_edition(&mut context, nft.edition.unwrap()).await;
        let metadata_rent_after = context
            .banks_client
            .get_balance(nft.metadata)
            .await
            .unwrap();
        let edition_rent_after = context
            .banks_client
            .get_balance(nft.edition.unwrap())
            .await
            .unwrap();
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
}
