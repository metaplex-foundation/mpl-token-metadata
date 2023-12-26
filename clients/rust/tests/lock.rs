#[cfg(feature = "test-sbf")]
pub mod setup;
pub use setup::*;

use solana_program::pubkey::Pubkey;
use solana_program_test::*;
use solana_sdk::signature::{Keypair, Signer};
use solana_sdk::transaction::Transaction;

use mpl_token_metadata::instructions::DelegateStandardV1Builder;
use mpl_token_metadata::instructions::LockV1Builder;
use mpl_token_metadata::types::TokenStandard;

mod lock {

    use spl_token_2022::state::Account;

    use super::*;

    #[test_case::test_case(spl_token::ID ; "spl-token")]
    #[test_case::test_case(spl_token_2022::ID ; "spl-token-2022")]
    #[tokio::test]
    async fn delegate_lock_nonfungible(spl_token_program: Pubkey) {
        let mut context = program_test().start_with_context().await;

        // given a non-fungible asset and a token

        let update_authority = Keypair::new();
        let token_owner = Keypair::new();
        let payer = context.payer.dirty_clone();

        let mut asset = DigitalAsset::default();
        asset
            .create_and_mint(
                &mut context,
                TokenStandard::NonFungible,
                &update_authority,
                &token_owner.pubkey(),
                1,
                &payer,
                spl_token_program,
            )
            .await
            .unwrap();

        // and a standard delegate

        let delegate = Keypair::new();

        let delegate_ix = DelegateStandardV1Builder::new()
            .token(asset.token)
            .metadata(asset.metadata)
            .master_edition(Some(asset.master_edition))
            .mint(asset.mint.pubkey())
            .delegate(delegate.pubkey())
            .authority(token_owner.pubkey())
            .spl_token_program(Some(spl_token_program))
            .payer(payer.pubkey())
            .amount(1)
            .instruction();

        let tx = Transaction::new_signed_with_payer(
            &[delegate_ix],
            Some(&context.payer.pubkey()),
            &[&payer, &token_owner],
            context.last_blockhash,
        );
        context.banks_client.process_transaction(tx).await.unwrap();

        // when we lock the token

        let lock_ix = LockV1Builder::new()
            .authority(delegate.pubkey())
            .metadata(asset.metadata)
            .edition(Some(asset.master_edition))
            .mint(asset.mint.pubkey())
            .token(asset.token)
            .spl_token_program(Some(spl_token_program))
            .payer(payer.pubkey())
            .instruction();

        let tx = Transaction::new_signed_with_payer(
            &[lock_ix],
            Some(&context.payer.pubkey()),
            &[&payer, &delegate],
            context.last_blockhash,
        );
        context.banks_client.process_transaction(tx).await.unwrap();

        // then the token is frozen

        let token_account = get_account(&mut context, &asset.token).await;
        let token = unpack::<Account>(&token_account.data).unwrap().base;
        assert!(token.is_frozen());

        // and the delegate is set

        assert!(token.delegate.is_some());
        assert_eq!(token.delegate.unwrap(), delegate.pubkey());
    }
}
