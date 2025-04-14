use mpl_utils::assert_signer;
use arch_program::{account::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey};

use crate::{
    assertions::assert_owned_by,
    error::MetadataError,
    processor::all_accounts,
    state::{Metadata, TokenMetadataAccount},
};

pub fn process_sign_metadata(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    all_accounts!(accounts, metadata_info, creator_info);

    assert_signer(creator_info)?;
    assert_owned_by(metadata_info, program_id)?;

    let mut metadata = Metadata::from_account(metadata_info)?;

    if let Some(creators) = &mut metadata.data.creators {
        let mut found = false;
        for creator in creators {
            if creator.address == *creator_info.key {
                creator.verified = true;
                found = true;
                break;
            }
        }
        if !found {
            return Err(MetadataError::CreatorNotFound.into());
        }
    } else {
        return Err(MetadataError::NoCreatorsPresentOnMetadata.into());
    }
    metadata.save(&mut metadata_info.try_borrow_mut_data()?)?;

    Ok(())
}
