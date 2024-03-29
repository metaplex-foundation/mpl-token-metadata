#![cfg(feature = "test-bpf")]
pub mod utils;

use num_traits::FromPrimitive;
use solana_program::pubkey::Pubkey;
use solana_program_test::*;
use solana_sdk::{
    instruction::InstructionError,
    signature::{Keypair, Signer},
    transaction::{Transaction, TransactionError},
};
use utils::*;

mod process_legacy_instruction {

    use borsh::BorshDeserialize;
    use solana_program::program_pack::Pack;
    use spl_token_2022::state::Account;
    use token_metadata::{
        error::MetadataError,
        instruction::{sign_metadata, DelegateArgs},
        state::{Metadata, TokenStandard},
        utils::unpack,
    };

    use super::*;

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[test_case::test_case(spl_token_2022::id() ; "Token-2022 Program")]
    #[tokio::test]
    async fn programmable_nft_in_legacy_processor(spl_token_program: Pubkey) {
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
        let (token, _) = Pubkey::find_program_address(
            &[
                &payer_pubkey.to_bytes(),
                &spl_token::ID.to_bytes(),
                &asset.mint.pubkey().to_bytes(),
            ],
            &spl_associated_token_account::ID,
        );
        asset.token = Some(token);

        asset
            .mint(&mut context, None, None, 1, spl_token_program)
            .await
            .unwrap();

        let metadata_account = get_account(&mut context, &asset.metadata).await;
        let metadata: Metadata = Metadata::deserialize(&mut &metadata_account.data[..]).unwrap();

        assert_eq!(
            metadata.token_standard,
            Some(TokenStandard::ProgrammableNonFungible)
        );

        // tries to use a "legacy" instruction with a pNFT

        // we won't need to use this keypair
        let creator = Keypair::new();

        let sign_ix = sign_metadata(token_metadata::ID, asset.metadata, creator.pubkey());
        let sign_tx = Transaction::new_signed_with_payer(
            &[sign_ix],
            Some(&context.payer.pubkey()),
            &[&creator, &context.payer],
            context.last_blockhash,
        );

        let error = context
            .banks_client
            .process_transaction(sign_tx)
            .await
            .unwrap_err();

        assert_custom_error!(error, MetadataError::InstructionNotSupported);
    }

    #[test_case::test_case(spl_token::id() ; "Token Program")]
    #[tokio::test]
    async fn thaw_programmable_nft(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;

        // asset

        let mut asset = DigitalAsset::default();
        asset
            .create_and_mint(
                &mut context,
                TokenStandard::ProgrammableNonFungible,
                None,
                None,
                1,
                spl_token_program,
            )
            .await
            .unwrap();

        let metadata_account = get_account(&mut context, &asset.metadata).await;
        let metadata: Metadata = Metadata::deserialize(&mut &metadata_account.data[..]).unwrap();

        assert_eq!(
            metadata.token_standard,
            Some(TokenStandard::ProgrammableNonFungible)
        );

        let account = get_account(&mut context, &asset.token.unwrap()).await;
        let token_account = unpack::<Account>(&account.data).unwrap();

        assert!(token_account.is_frozen());
        assert_eq!(token_account.amount, 1);
        assert_eq!(token_account.mint, asset.mint.pubkey());
        assert_eq!(token_account.owner, context.payer.pubkey());

        // creates a transfer delegate so we have a SPL Token delegate in place

        let delegate = Keypair::new();
        let delegate_pubkey = delegate.pubkey();

        let payer = Keypair::from_bytes(&context.payer.to_bytes()).unwrap();

        asset
            .delegate(
                &mut context,
                payer,
                delegate_pubkey,
                DelegateArgs::TransferV1 {
                    amount: 1,
                    authorization_data: None,
                },
                spl_token_program,
            )
            .await
            .unwrap();

        // tries to use a "legacy" thaw instruction with a pNFT

        let thaw_ix = token_metadata::instruction::thaw_delegated_account(
            token_metadata::ID,
            delegate_pubkey,
            asset.token.unwrap(),
            asset.edition.unwrap(),
            asset.mint.pubkey(),
        );
        let thaw_tx = Transaction::new_signed_with_payer(
            &[thaw_ix],
            Some(&context.payer.pubkey()),
            &[&context.payer, &delegate],
            context.last_blockhash,
        );

        // fails because it is a pNFT master edition
        let error = context
            .banks_client
            .process_transaction(thaw_tx)
            .await
            .unwrap_err();

        assert_custom_error!(error, MetadataError::InvalidTokenStandard);

        // makes sure the token still frozen

        let account = get_account(&mut context, &asset.token.unwrap()).await;
        let token_account = Account::unpack(&account.data).unwrap();
        assert!(token_account.is_frozen());

        // tries to freeze (this would normally fail at the SPL Token level, but we
        // should get our custom error first)

        let freeze_ix = token_metadata::instruction::freeze_delegated_account(
            token_metadata::ID,
            delegate_pubkey,
            asset.token.unwrap(),
            asset.edition.unwrap(),
            asset.mint.pubkey(),
        );

        let freeze_tx = Transaction::new_signed_with_payer(
            &[freeze_ix],
            Some(&context.payer.pubkey()),
            &[&context.payer, &delegate],
            context.last_blockhash,
        );

        // fails because it is a pNFT master edition
        let error = context
            .banks_client
            .process_transaction(freeze_tx)
            .await
            .unwrap_err();

        assert_custom_error!(error, MetadataError::InvalidTokenStandard);
    }
}
