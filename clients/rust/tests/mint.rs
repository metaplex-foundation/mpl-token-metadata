#[cfg(feature = "test-sbf")]
pub mod setup;
use setup::*;

use solana_program_test::*;
use solana_sdk::signature::{Keypair, Signer};

use mpl_token_metadata::{
    accounts::{MasterEdition, Metadata},
    types::{Key, TokenStandard},
};

mod mint {

    use super::*;

    #[tokio::test]
    async fn mint_nonfungible() {
        let mut context = program_test().start_with_context().await;

        // when we mint a non-fungible asset

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
            )
            .await
            .unwrap();

        // then metadata account is created with correct information.

        let metadata_account =
            get_account(&mut context, &Metadata::find_pda(&asset.mint.pubkey()).0).await;
        let metadata = Metadata::safe_deserialize(&metadata_account.data).unwrap();
        assert_eq!(metadata.key, Key::MetadataV1);
        assert_eq!(metadata.token_standard, Some(TokenStandard::NonFungible));

        // and the master edition is created with correct information.

        let master_edition_account = get_account(
            &mut context,
            &MasterEdition::find_pda(&asset.mint.pubkey()).0,
        )
        .await;
        let master_edition = MasterEdition::safe_deserialize(&master_edition_account.data).unwrap();

        assert_eq!(master_edition.key, Key::MasterEditionV2);
    }
}
