use super::*;
use arch_program::pubkey::Pubkey;
use borsh::{BorshDeserialize, BorshSerialize};
use std::io::{Read, Write};

pub const COLLECTION_AUTHORITY_RECORD_SIZE: usize = 35;

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(PartialEq, Eq, Debug, Clone)]
pub struct Collection {
    pub verified: bool,
    #[cfg_attr(feature = "serde-feature", serde(with = "As::<DisplayFromStr>"))]
    pub key: Pubkey,
}

impl BorshSerialize for Collection {
    fn serialize<W: Write>(&self, writer: &mut W) -> std::result::Result<(), borsh::maybestd::io::Error> {
        self.verified.serialize(writer)?;
        writer.write_all(self.key.as_ref())?;
        Ok(())
    }
}

impl BorshDeserialize for Collection {
    fn deserialize(buf: &mut &[u8]) -> std::result::Result<Self, borsh::maybestd::io::Error> {
        let verified = bool::deserialize(buf)?;
        let mut key_bytes = [0u8; 32];
        buf.read_exact(&mut key_bytes)?;
        Ok(Self {
            verified,
            key: Pubkey::from_slice(&key_bytes),
        })
    }
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(PartialEq, Eq, Debug, Clone, ShankAccount)]
pub struct CollectionAuthorityRecord {
    pub key: Key,                         //1
    pub bump: u8,                         //1
    pub update_authority: Option<Pubkey>, //33 (1 + 32)
}

impl BorshSerialize for CollectionAuthorityRecord {
    fn serialize<W: Write>(&self, writer: &mut W) -> std::result::Result<(), borsh::maybestd::io::Error> {
        self.key.serialize(writer)?;
        self.bump.serialize(writer)?;
        match &self.update_authority {
            Some(pubkey) => {
                true.serialize(writer)?;
                writer.write_all(pubkey.as_ref())?;
            }
            None => {
                false.serialize(writer)?;
            }
        }
        Ok(())
    }
}

impl BorshDeserialize for CollectionAuthorityRecord {
    fn deserialize(buf: &mut &[u8]) -> std::result::Result<Self, borsh::maybestd::io::Error> {
        let key = Key::deserialize(buf)?;
        let bump = u8::deserialize(buf)?;
        let has_authority = bool::deserialize(buf)?;
        let update_authority = if has_authority {
            let mut arr = [0u8; 32];
            buf.read_exact(&mut arr)?;
            Some(Pubkey::from_slice(&arr))
        } else {
            None
        };
        Ok(Self {
            key,
            bump,
            update_authority,
        })
    }
}

impl Default for CollectionAuthorityRecord {
    fn default() -> Self {
        CollectionAuthorityRecord {
            key: Key::CollectionAuthorityRecord,
            bump: 255,
            update_authority: None,
        }
    }
}

impl TokenMetadataAccount for CollectionAuthorityRecord {
    fn key() -> Key {
        Key::CollectionAuthorityRecord
    }

    fn size() -> usize {
        COLLECTION_AUTHORITY_RECORD_SIZE
    }
}

impl CollectionAuthorityRecord {
    pub fn from_bytes(b: &[u8]) -> Result<CollectionAuthorityRecord, ProgramError> {
        let ca: CollectionAuthorityRecord = try_from_slice_checked(
            b,
            Key::CollectionAuthorityRecord,
            COLLECTION_AUTHORITY_RECORD_SIZE,
        )?;
        Ok(ca)
    }
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(PartialEq, Eq, Debug, Clone)]
pub enum CollectionDetails {
    #[deprecated(
        since = "1.13.1",
        note = "The collection size tracking feature is deprecated and will soon be removed."
    )]
    V1 {
        size: u64,
    },
    V2 {
        padding: [u8; 8],
    },
}

impl BorshSerialize for CollectionDetails {
    fn serialize<W: Write>(&self, writer: &mut W) -> std::result::Result<(), borsh::maybestd::io::Error> {
        match self {
            CollectionDetails::V1 { size } => {
                0u8.serialize(writer)?;
                size.serialize(writer)?;
            }
            CollectionDetails::V2 { padding } => {
                1u8.serialize(writer)?;
                writer.write_all(padding)?;
            }
        }
        Ok(())
    }
}

impl BorshDeserialize for CollectionDetails {
    fn deserialize(buf: &mut &[u8]) -> std::result::Result<Self, borsh::maybestd::io::Error> {
        let tag = u8::deserialize(buf)?;
        match tag {
            0 => {
                let size = u64::deserialize(buf)?;
                Ok(CollectionDetails::V1 { size })
            }
            1 => {
                let mut padding = [0u8; 8];
                buf.read_exact(&mut padding)?;
                Ok(CollectionDetails::V2 { padding })
            }
            _ => Err(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "Unknown CollectionDetails variant",
            )),
        }
    }
}

#[cfg(test)]
mod tests {
    use arch_program::account::AccountInfo;
    use solana_sdk::{signature::Keypair, signer::Signer};

    use crate::{
        error::MetadataError,
        state::{CollectionAuthorityRecord, Key, TokenMetadataAccount, UseAuthorityRecord},
        ID,
    };

    #[test]
    fn successfully_deserialize() {
        let expected_data = CollectionAuthorityRecord::default();

        let mut buf = Vec::new();
        borsh::to_writer(&mut buf, &expected_data).unwrap();
        CollectionAuthorityRecord::pad_length(&mut buf).unwrap();

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
            false
        );

        let data = CollectionAuthorityRecord::from_account(&account).unwrap();
        assert_eq!(data.key, Key::CollectionAuthorityRecord);
        assert_eq!(data, expected_data);
    }

    #[test]
    fn deserializing_wrong_account_type_fails() {
        let wrong_type = UseAuthorityRecord::default();

        let mut buf = Vec::new();
        borsh::to_writer(&mut buf, &wrong_type).unwrap();

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
            false
        );

        let error = CollectionAuthorityRecord::from_account(&account).unwrap_err();
        assert_eq!(error, MetadataError::DataTypeMismatch.into());
    }
}