use borsh::BorshDeserialize;

use crate::{
    errors::MplTokenMetadataError,
    types::{Key, TokenStandard},
};

/// The offset of the token standard byte in the master edition
/// from the end of the account data.
const TOKEN_STANDARD_OFFSET: usize = 1;

/// Removes all null bytes from a string.
pub fn clean(value: String) -> String {
    value.replace('\0', "")
}

/// Checks that the `master_edition` is Programmable NFT master edition.
pub fn assert_edition_is_programmable(edition_data: &[u8]) -> Result<(), MplTokenMetadataError> {
    if edition_data.len() > TOKEN_STANDARD_OFFSET {
        // the first byte is the account key
        let key = Key::deserialize(&mut &edition_data[0..1])
            .map_err(|_error| MplTokenMetadataError::InvalidEditionKey)?;

        return match key {
            Key::MasterEditionV1 | Key::MasterEditionV2 => {
                // the last byte is the token standard
                let standard = TokenStandard::deserialize(
                    &mut &edition_data[edition_data.len() - TOKEN_STANDARD_OFFSET..],
                )
                .map_err(|_error| MplTokenMetadataError::InvalidTokenStandard)?;

                return match standard {
                    TokenStandard::ProgrammableNonFungible
                    | TokenStandard::ProgrammableNonFungibleEdition => Ok(()),
                    _ => Err(MplTokenMetadataError::InvalidTokenStandard),
                };
            }
            _ => Err(MplTokenMetadataError::InvalidEditionKey),
        };
    }

    Err(MplTokenMetadataError::InvalidMasterEditionAccountLength)
}
