use super::*;

pub const MAX_EDITION_MARKER_SIZE: usize = 32;

pub const EDITION_MARKER_BIT_SIZE: u64 = 248;

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Eq, Debug, Clone, ShankAccount)]
pub struct EditionMarker {
    pub key: Key,
    pub ledger: [u8; 31],
}

impl Default for EditionMarker {
    fn default() -> Self {
        Self {
            key: Key::EditionMarker,
            ledger: [0; 31],
        }
    }
}

impl TokenMetadataAccount for EditionMarker {
    fn key() -> Key {
        Key::EditionMarker
    }

    fn size() -> usize {
        MAX_EDITION_MARKER_SIZE
    }
}

impl EditionMarker {
    fn get_edition_offset_from_starting_index(edition: u64) -> Result<usize, ProgramError> {
        Ok(edition
            .checked_rem(EDITION_MARKER_BIT_SIZE)
            .ok_or(MetadataError::NumericalOverflowError)? as usize)
    }

    fn get_index(offset_from_start: usize) -> Result<usize, ProgramError> {
        let index = offset_from_start
            .checked_div(8)
            .ok_or(MetadataError::NumericalOverflowError)?;

        if index > 30 {
            return Err(MetadataError::InvalidEditionIndex.into());
        }

        Ok(index)
    }

    fn get_offset_from_right(offset_from_start: usize) -> Result<u32, ProgramError> {
        Ok(7 - offset_from_start
            .checked_rem(8)
            .ok_or(MetadataError::NumericalOverflowError)? as u32)
    }

    pub fn get_index_and_mask(edition: u64) -> Result<(usize, u8), ProgramError> {
        let offset_from_start = EditionMarker::get_edition_offset_from_starting_index(edition)?;
        let index = EditionMarker::get_index(offset_from_start)?;
        let my_position_in_index_starting_from_right =
            EditionMarker::get_offset_from_right(offset_from_start)?;

        Ok((index, u8::pow(2, my_position_in_index_starting_from_right)))
    }

    pub fn edition_taken(&self, edition: u64) -> Result<bool, ProgramError> {
        let (index, mask) = EditionMarker::get_index_and_mask(edition)?;
        let applied_mask = self.ledger[index] & mask;
        Ok(applied_mask != 0)
    }

    pub fn insert_edition(&mut self, edition: u64) -> ProgramResult {
        let (index, mask) = EditionMarker::get_index_and_mask(edition)?;
        self.ledger[index] |= mask;
        Ok(())
    }

    pub fn save(self, account: &AccountInfo) -> ProgramResult {
        let mut edition_marker_data = account.try_borrow_mut_data()?;
        edition_marker_data[0..].fill(0);
        borsh::to_writer(&mut edition_marker_data[..], &self)
            .map_err(|_| ProgramError::InvalidAccountData)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use arch_program::account::AccountInfo;
    use solana_sdk::{signature::Keypair, signer::Signer};

    use crate::{
        error::MetadataError,
        state::{EditionMarker, Key, Metadata, TokenMetadataAccount},
        ID,
    };

    #[test]
    fn successfully_deserialize() {
        let expected_data = EditionMarker::default();

        let mut buf = Vec::new();
        borsh::to_writer(&mut buf, &expected_data).unwrap();
        EditionMarker::pad_length(&mut buf).unwrap();

        let pubkey = Keypair::new().pubkey();
        let owner = &ID;
        let mut lamports = 1_000_000_000;
        let mut data = buf.clone();

        let account = AccountInfo::new(
            &pubkey,
            false,
            true,
            &mut lamports,
            &mut data,
            owner,
            false,
        );

        let data = EditionMarker::from_account(&account).unwrap();
        assert_eq!(data.key, Key::EditionMarker);
        assert_eq!(data, expected_data);
    }

    #[test]
    fn deserializing_wrong_account_type_fails() {
        let wrong_type = Metadata::default();

        let mut buf = Vec::new();
        borsh::to_writer(&mut buf, &wrong_type).unwrap();
        Metadata::pad_length(&mut buf).unwrap();

        let pubkey = Keypair::new().pubkey();
        let owner = &ID;
        let mut lamports = 1_000_000_000;
        let mut data = buf.clone();

        let account = AccountInfo::new(
            &pubkey,
            false,
            true,
            &mut lamports,
            &mut data,
            owner,
            false,
        );

        let error = EditionMarker::from_account(&account).unwrap_err();
        assert_eq!(error, MetadataError::DataTypeMismatch.into());
    }
}