use mpl_utils::assert_signer;
use arch_program::{account::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey};

use crate::{
    assertions::{assert_owned_by, collection::assert_is_collection_delegated_authority},
    error::MetadataError,
    processor::all_accounts,
    state::{Key, Metadata, TokenMetadataAccount},
    utils::{close_program_account, SPL_TOKEN_ID},
};

pub fn process_revoke_collection_authority(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    all_accounts!(
        accounts,
        collection_authority_record,
        delegate_authority,
        revoke_authority,
        metadata_info,
        mint_info
    );
    let metadata = Metadata::from_account(metadata_info)?;

    assert_owned_by(metadata_info, program_id)?;
    assert_owned_by(mint_info, &SPL_TOKEN_ID)?;
    assert_signer(revoke_authority)?;

    if metadata.update_authority != *revoke_authority.key
        && *delegate_authority.key != *revoke_authority.key
    {
        return Err(MetadataError::RevokeCollectionAuthoritySignerIncorrect.into());
    }

    if metadata.mint != *mint_info.key {
        return Err(MetadataError::MintMismatch.into());
    }

    if collection_authority_record.try_data_is_empty()? {
        return Err(MetadataError::CollectionAuthorityDoesNotExist.into());
    }

    assert_is_collection_delegated_authority(
        collection_authority_record,
        delegate_authority.key,
        mint_info.key,
    )?;

    close_program_account(
        collection_authority_record,
        revoke_authority,
        Key::CollectionAuthorityRecord,
    )
}
