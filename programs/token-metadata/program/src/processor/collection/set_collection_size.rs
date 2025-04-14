use arch_program::{
    account::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    pubkey::Pubkey,
};

use crate::{
    assertions::{assert_owned_by, collection::assert_has_collection_authority},
    error::MetadataError,
    instruction::SetCollectionSizeArgs,
    state::{CollectionDetails, Metadata, TokenMetadataAccount},
    utils::{clean_write_metadata, SPL_TOKEN_ID},
};

pub fn set_collection_size(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    args: SetCollectionSizeArgs,
) -> ProgramResult {
    let size = args.size;

    let account_iter = &mut accounts.iter();

    let parent_nft_metadata_account = next_account_info(account_iter)?;
    let collection_update_authority_account = next_account_info(account_iter)?;
    let collection_mint_account = next_account_info(account_iter)?;

    // Owned by token-metadata program.
    assert_owned_by(parent_nft_metadata_account, program_id)?;

    // Mint owned by spl token program.
    assert_owned_by(collection_mint_account, &SPL_TOKEN_ID)?;

    let mut metadata = Metadata::from_account(parent_nft_metadata_account)?;

    // Check that the update authority or delegate is a signer.
    if !collection_update_authority_account.is_signer {
        return Err(MetadataError::UpdateAuthorityIsNotSigner.into());
    }

    let delegated_collection_authority_opt = account_iter.next();

    assert_has_collection_authority(
        collection_update_authority_account,
        &metadata,
        collection_mint_account.key,
        delegated_collection_authority_opt,
    )?;

    // Only unsized collections can have the size set, and only once.
    if metadata.collection_details.is_some() {
        return Err(MetadataError::SizedCollection.into());
    } else {
        metadata.collection_details = {
            #[allow(deprecated)]
            Some(CollectionDetails::V1 { size })
        };
    }

    clean_write_metadata(&mut metadata, parent_nft_metadata_account)
}
