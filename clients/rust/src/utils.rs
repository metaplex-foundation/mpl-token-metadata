use crate::{errors::MplTokenMetadataError, types::TokenStandard};

/// The offset of the token standard byte in the master edition
/// from the end of the account data.
const TOKEN_STANDARD_OFFSET: usize = 1;

/// Removes all null bytes from a string.
pub fn clean(value: String) -> String {
    value.replace('\0', "")
}

/// Checks that the `master_edition` is Programmable NFT master edition.
pub fn assert_edition_is_programmable(edition_data: &[u8]) -> Result<(), MplTokenMetadataError> {
    if !edition_data.is_empty()
        && edition_data[edition_data.len() - TOKEN_STANDARD_OFFSET]
            == TokenStandard::ProgrammableNonFungible as u8
    {
        Ok(())
    } else {
        Err(MplTokenMetadataError::InvalidTokenStandard)
    }
}
