use super::*;
use borsh::{BorshDeserialize, BorshSerialize};
use std::io::{Read, Write};

const SIZE: usize = 98;

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(PartialEq, Eq, Debug, Clone, ShankAccount)]
/// SEEDS = [
///     "metadata",
///     program id,
///     mint id,
///     delegate role,
///     update authority id,
///     delegate id
/// ]
pub struct MetadataDelegateRecord {
    pub key: Key, // 1
    pub bump: u8, // 1
    #[cfg_attr(feature = "serde-feature", serde(with = "As::<DisplayFromStr>"))]
    pub mint: Pubkey, // 32
    #[cfg_attr(feature = "serde-feature", serde(with = "As::<DisplayFromStr>"))]
    pub delegate: Pubkey, // 32
    #[cfg_attr(feature = "serde-feature", serde(with = "As::<DisplayFromStr>"))]
    pub update_authority: Pubkey, // 32
}

impl BorshSerialize for MetadataDelegateRecord {
    fn serialize<W: Write>(&self, writer: &mut W) -> std::result::Result<(), borsh::maybestd::io::Error> {
        self.key.serialize(writer)?;
        self.bump.serialize(writer)?;
        writer.write_all(self.mint.as_ref())?;
        writer.write_all(self.delegate.as_ref())?;
        writer.write_all(self.update_authority.as_ref())?;
        Ok(())
    }
}

impl BorshDeserialize for MetadataDelegateRecord {
    fn deserialize(buf: &mut &[u8]) -> std::result::Result<Self, borsh::maybestd::io::Error> {
        let key = Key::deserialize(buf)?;
        let bump = u8::deserialize(buf)?;

        let mut mint_bytes = [0u8; 32];
        buf.read_exact(&mut mint_bytes)?;
        let mint = Pubkey::from_slice(&mint_bytes);

        let mut delegate_bytes = [0u8; 32];
        buf.read_exact(&mut delegate_bytes)?;
        let delegate = Pubkey::from_slice(&delegate_bytes);

        let mut update_auth_bytes = [0u8; 32];
        buf.read_exact(&mut update_auth_bytes)?;
        let update_authority = Pubkey::from_slice(&update_auth_bytes);

        Ok(Self {
            key,
            bump,
            mint,
            delegate,
            update_authority,
        })
    }
}

impl Default for MetadataDelegateRecord {
    fn default() -> Self {
        Self {
            key: Key::MetadataDelegate,
            bump: 255,
            mint: Pubkey::default(),
            delegate: Pubkey::default(),
            update_authority: Pubkey::default(),
        }
    }
}

impl TokenMetadataAccount for MetadataDelegateRecord {
    fn key() -> Key {
        Key::MetadataDelegate
    }

    fn size() -> usize {
        SIZE
    }
}

impl MetadataDelegateRecord {
    pub fn from_bytes(data: &[u8]) -> Result<MetadataDelegateRecord, ProgramError> {
        let delegate: MetadataDelegateRecord =
            try_from_slice_checked(data, Key::MetadataDelegate, MetadataDelegateRecord::size())?;
        Ok(delegate)
    }
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(PartialEq, Eq, Debug, Clone, ShankAccount)]
/// SEEDS = [
///     "metadata",
///     program id,
///     mint id,
///     delegate role,
///     holder id,
///     delegate id
/// ]
pub struct HolderDelegateRecord {
    pub key: Key, // 1
    pub bump: u8, // 1
    #[cfg_attr(feature = "serde-feature", serde(with = "As::<DisplayFromStr>"))]
    pub mint: Pubkey, // 32
    #[cfg_attr(feature = "serde-feature", serde(with = "As::<DisplayFromStr>"))]
    pub delegate: Pubkey, // 32
    #[cfg_attr(feature = "serde-feature", serde(with = "As::<DisplayFromStr>"))]
    pub update_authority: Pubkey, // 32
}

impl BorshSerialize for HolderDelegateRecord {
    fn serialize<W: Write>(&self, writer: &mut W) -> std::result::Result<(), borsh::maybestd::io::Error> {
        self.key.serialize(writer)?;
        self.bump.serialize(writer)?;
        writer.write_all(self.mint.as_ref())?;
        writer.write_all(self.delegate.as_ref())?;
        writer.write_all(self.update_authority.as_ref())?;
        Ok(())
    }
}

impl BorshDeserialize for HolderDelegateRecord {
    fn deserialize(buf: &mut &[u8]) -> std::result::Result<Self, borsh::maybestd::io::Error> {
        let key = Key::deserialize(buf)?;
        let bump = u8::deserialize(buf)?;

        let mut mint_bytes = [0u8; 32];
        buf.read_exact(&mut mint_bytes)?;
        let mint = Pubkey::from_slice(&mint_bytes);

        let mut delegate_bytes = [0u8; 32];
        buf.read_exact(&mut delegate_bytes)?;
        let delegate = Pubkey::from_slice(&delegate_bytes);

        let mut update_auth_bytes = [0u8; 32];
        buf.read_exact(&mut update_auth_bytes)?;
        let update_authority = Pubkey::from_slice(&update_auth_bytes);

        Ok(Self {
            key,
            bump,
            mint,
            delegate,
            update_authority,
        })
    }
}

impl Default for HolderDelegateRecord {
    fn default() -> Self {
        Self {
            key: Key::HolderDelegate,
            bump: 255,
            mint: Pubkey::default(),
            delegate: Pubkey::default(),
            update_authority: Pubkey::default(),
        }
    }
}

impl TokenMetadataAccount for HolderDelegateRecord {
    fn key() -> Key {
        Key::HolderDelegate
    }

    fn size() -> usize {
        SIZE
    }
}

impl HolderDelegateRecord {
    pub fn from_bytes(data: &[u8]) -> Result<HolderDelegateRecord, ProgramError> {
        let delegate: HolderDelegateRecord =
            try_from_slice_checked(data, Key::HolderDelegate, HolderDelegateRecord::size())?;
        Ok(delegate)
    }
}