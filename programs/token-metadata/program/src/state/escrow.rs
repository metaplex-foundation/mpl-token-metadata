use super::*;
use borsh::{BorshDeserialize, BorshSerialize};
use std::io::{Read, Write}; 

pub const ESCROW_POSTFIX: &str = "escrow";

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(PartialEq, Eq, Debug, Clone, Copy)]
pub enum EscrowAuthority {
    TokenOwner,
    Creator(Pubkey),
}

impl borsh::BorshSerialize for EscrowAuthority {
    fn serialize<W: std::io::Write>(&self, writer: &mut W)
        -> std::result::Result<(), borsh::maybestd::io::Error>
    {
        match self {
            EscrowAuthority::TokenOwner => {
                // Mark variant 0
                0u8.serialize(writer)?;
            }
            EscrowAuthority::Creator(pubkey) => {
                // Mark variant 1
                1u8.serialize(writer)?;
                // Write the Pubkey as 32 bytes
                writer.write_all(pubkey.as_ref())?;
            }
        }
        Ok(())
    }
}

impl borsh::BorshDeserialize for EscrowAuthority {
    fn deserialize(buf: &mut &[u8])
        -> std::result::Result<Self, borsh::maybestd::io::Error>
    {
        let variant = u8::deserialize(buf)?;
        match variant {
            0 => Ok(EscrowAuthority::TokenOwner),
            1 => {
                let mut arr = [0u8; 32];
                buf.read_exact(&mut arr)?;
                Ok(EscrowAuthority::Creator(Pubkey::from_slice(&arr)))
            }
            _ => Err(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "Unknown EscrowAuthority variant",
            )),
        }
    }
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(PartialEq, Eq, Debug, Clone, ShankAccount)]
pub struct TokenOwnedEscrow {
    pub key: Key,
    pub base_token: Pubkey,
    pub authority: EscrowAuthority,
    pub bump: u8,
}

impl borsh::BorshSerialize for TokenOwnedEscrow {
    fn serialize<W: std::io::Write>(&self, writer: &mut W)
        -> std::result::Result<(), borsh::maybestd::io::Error>
    {
        self.key.serialize(writer)?;
        writer.write_all(self.base_token.as_ref())?;
        self.authority.serialize(writer)?;
        self.bump.serialize(writer)?;
        Ok(())
    }
}

impl borsh::BorshDeserialize for TokenOwnedEscrow {
    fn deserialize(buf: &mut &[u8])
        -> std::result::Result<Self, borsh::maybestd::io::Error>
    {
        let key = Key::deserialize(buf)?;

        let mut token_bytes = [0u8; 32];
        buf.read_exact(&mut token_bytes)?;
        let base_token = Pubkey::from_slice(&token_bytes);

        let authority = EscrowAuthority::deserialize(buf)?;
        let bump = u8::deserialize(buf)?;

        Ok(Self {
            key,
            base_token,
            authority,
            bump,
        })
    }
}

impl TokenMetadataAccount for TokenOwnedEscrow {
    fn key() -> Key {
        Key::TokenOwnedEscrow
    }

    fn size() -> usize {
        0
    }

    fn is_correct_account_type(data: &[u8], data_type: Key, _data_size: usize) -> bool {
        let key: Option<Key> = Key::from_u8(data[0]);
        match key {
            Some(key) => key == data_type || key == Key::Uninitialized,
            None => false,
        }
    }
}