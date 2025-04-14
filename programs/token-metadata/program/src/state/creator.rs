use super::*;
use std::io::Read;

pub const MAX_CREATOR_LIMIT: usize = 5;

pub const MAX_CREATOR_LEN: usize = 32 + 1 + 1;

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(PartialEq, Debug, Clone, Eq, Hash)]
pub struct Creator {
    #[cfg_attr(feature = "serde-feature", serde(with = "As::<DisplayFromStr>"))]
    pub address: Pubkey,
    pub verified: bool,
    // In percentages, NOT basis points ;) Watch out!
    pub share: u8,
}

impl borsh::BorshSerialize for Creator {
    fn serialize<W: std::io::Write>(&self, writer: &mut W) -> std::result::Result<(), borsh::maybestd::io::Error> {
        writer.write_all(self.address.as_ref())?;
        self.verified.serialize(writer)?;
        self.share.serialize(writer)?;
        Ok(())
    }
}

impl borsh::BorshDeserialize for Creator {
    fn deserialize(buf: &mut &[u8]) -> std::result::Result<Self, borsh::maybestd::io::Error> {
        let mut address_bytes = [0u8; 32];
        buf.read_exact(&mut address_bytes)?;
        let verified = bool::deserialize(buf)?;
        let share = u8::deserialize(buf)?;
        Ok(Self {
            address: Pubkey::from_slice(&address_bytes),
            verified,
            share,
        })
    }
}