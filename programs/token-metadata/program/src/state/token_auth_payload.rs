//! These types exist to give Shank a way to create the Payload type as it
//! cannnot create it from the remote type from mpl-token-auth-rules.
//! Care will need to be taken to ensure they stay synced with any changes in
//! mpl-token-auth-rules.

use std::collections::HashMap;

use borsh::{BorshDeserialize, BorshSerialize};
#[cfg(feature = "serde-feature")]
use serde::{Deserialize, Serialize};
use solana_program::pubkey::Pubkey;

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Eq, Debug, Clone)]
/// A seed path type used by the `DerivedKeyMatch` rule.
struct SeedsVec {
    /// The vector of derivation seeds.
    seeds: Vec<Vec<u8>>,
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Eq, Debug, Clone)]
/// A proof type used by the `PubkeyTreeMatch` rule.
struct ProofInfo {
    /// The merkle proof.
    proof: Vec<[u8; 32]>,
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Eq, Debug, Clone)]
/// Variants representing the different types represented in a payload.
enum PayloadType {
    /// A plain `Pubkey`.
    Pubkey(Pubkey),
    /// PDA derivation seeds.
    Seeds(SeedsVec),
    /// A merkle proof.
    MerkleProof(ProofInfo),
    /// A plain `u64` used for `Amount`.
    Number(u64),
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Eq, Debug, Clone, Default)]
/// A wrapper type for the payload hashmap.
struct Payload {
    /// The payload hashmap.
    map: HashMap<String, PayloadType>,
}
