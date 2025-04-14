use std::collections::HashMap;
use borsh::{BorshDeserialize, BorshSerialize};
#[cfg(feature = "serde-feature")]
use serde::{Deserialize, Serialize};
use arch_program::pubkey::Pubkey;
use std::io::{Read, Write};

/// These types exist to give Shank a way to create the Payload type as it
/// cannnot create it from the remote type from mpl-token-auth-rules.
/// Care will need to be taken to ensure they stay synced with any changes in
/// mpl-token-auth-rules.

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(PartialEq, Eq, Debug, Clone)]
struct SeedsVec {
    seeds: Vec<Vec<u8>>,
}

impl BorshSerialize for SeedsVec {
    fn serialize<W: std::io::Write>(&self, writer: &mut W)
        -> std::result::Result<(), borsh::maybestd::io::Error>
    {
        self.seeds.serialize(writer)
    }
}

impl BorshDeserialize for SeedsVec {
    fn deserialize(buf: &mut &[u8])
        -> std::result::Result<Self, borsh::maybestd::io::Error>
    {
        Ok(Self {
            seeds: Vec::<Vec<u8>>::deserialize(buf)?,
        })
    }
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(PartialEq, Eq, Debug, Clone)]
struct ProofInfo {
    proof: Vec<[u8; 32]>,
}

impl BorshSerialize for ProofInfo {
    fn serialize<W: std::io::Write>(&self, writer: &mut W)
        -> std::result::Result<(), borsh::maybestd::io::Error>
    {
        self.proof.serialize(writer)
    }
}

impl BorshDeserialize for ProofInfo {
    fn deserialize(buf: &mut &[u8])
        -> std::result::Result<Self, borsh::maybestd::io::Error>
    {
        Ok(Self {
            proof: Vec::<[u8; 32]>::deserialize(buf)?,
        })
    }
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(PartialEq, Eq, Debug, Clone)]
enum PayloadType {
    Pubkey(Pubkey),
    Seeds(SeedsVec),
    MerkleProof(ProofInfo),
    Number(u64),
}

impl BorshSerialize for PayloadType {
    fn serialize<W: std::io::Write>(&self, writer: &mut W)
        -> std::result::Result<(), borsh::maybestd::io::Error>
    {
        match self {
            PayloadType::Pubkey(pk) => {
                0u8.serialize(writer)?;
                writer.write_all(pk.as_ref())?;
            }
            PayloadType::Seeds(sv) => {
                1u8.serialize(writer)?;
                sv.serialize(writer)?;
            }
            PayloadType::MerkleProof(pi) => {
                2u8.serialize(writer)?;
                pi.serialize(writer)?;
            }
            PayloadType::Number(n) => {
                3u8.serialize(writer)?;
                n.serialize(writer)?;
            }
        }
        Ok(())
    }
}

impl BorshDeserialize for PayloadType {
    fn deserialize(buf: &mut &[u8])
        -> std::result::Result<Self, borsh::maybestd::io::Error>
    {
        let tag = u8::deserialize(buf)?;
        match tag {
            0 => {
                let mut arr = [0u8; 32];
                buf.read_exact(&mut arr)?;
                Ok(PayloadType::Pubkey(Pubkey::from_slice(&arr)))
            }
            1 => Ok(PayloadType::Seeds(SeedsVec::deserialize(buf)?)),
            2 => Ok(PayloadType::MerkleProof(ProofInfo::deserialize(buf)?)),
            3 => Ok(PayloadType::Number(u64::deserialize(buf)?)),
            _ => Err(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "Unknown PayloadType variant",
            )),
        }
    }
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(PartialEq, Eq, Debug, Clone, Default)]
struct Payload {
    map: HashMap<String, PayloadType>,
}

impl BorshSerialize for Payload {
    fn serialize<W: std::io::Write>(&self, writer: &mut W)
        -> std::result::Result<(), borsh::maybestd::io::Error>
    {
        self.map.serialize(writer)
    }
}

impl BorshDeserialize for Payload {
    fn deserialize(buf: &mut &[u8])
        -> std::result::Result<Self, borsh::maybestd::io::Error>
    {
        Ok(Self {
            map: HashMap::<String, PayloadType>::deserialize(buf)?,
        })
    }
}