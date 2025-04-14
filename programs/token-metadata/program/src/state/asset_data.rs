use borsh::{BorshDeserialize, BorshSerialize};
use arch_program::pubkey::Pubkey;
use std::io::{Read, Write};

use super::*;

/// Data representation of an asset.
#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(PartialEq, Eq, Debug, Clone)]
pub struct AssetData {
    /// The name of the asset.
    pub name: String,
    /// The symbol for the asset.
    pub symbol: String,
    /// URI pointing to JSON representing the asset.
    pub uri: String,
    /// Royalty basis points that goes to creators in secondary sales (0-10000).
    pub seller_fee_basis_points: u16,
    /// Array of creators.
    pub creators: Option<Vec<Creator>>,
    // Immutable, once flipped, all sales of this metadata are considered secondary.
    pub primary_sale_happened: bool,
    // Whether or not the data struct is mutable (default is not).
    pub is_mutable: bool,
    /// Type of the token.
    pub token_standard: TokenStandard,
    /// Collection information.
    pub collection: Option<Collection>,
    /// Uses information.
    pub uses: Option<Uses>,
    /// Collection item details.
    pub collection_details: Option<CollectionDetails>,
    /// Programmable rule set for the asset.
    #[cfg_attr(
        feature = "serde-feature",
        serde(
            deserialize_with = "deser_option_pubkey",
            serialize_with = "ser_option_pubkey"
        )
    )]
    pub rule_set: Option<Pubkey>,
}

// Manually implement BorshSerialize for AssetData to handle Option<Pubkey>.
impl borsh::BorshSerialize for AssetData {
    fn serialize<W: std::io::Write>(&self, writer: &mut W)
        -> std::result::Result<(), borsh::maybestd::io::Error>
    {
        self.name.serialize(writer)?;
        self.symbol.serialize(writer)?;
        self.uri.serialize(writer)?;
        self.seller_fee_basis_points.serialize(writer)?;
        match &self.creators {
            Some(creators_list) => {
                true.serialize(writer)?;
                creators_list.serialize(writer)?;
            }
            None => {
                false.serialize(writer)?;
            }
        }
        self.primary_sale_happened.serialize(writer)?;
        self.is_mutable.serialize(writer)?;
        self.token_standard.serialize(writer)?;
        match &self.collection {
            Some(coll) => {
                true.serialize(writer)?;
                coll.serialize(writer)?;
            }
            None => {
                false.serialize(writer)?;
            }
        }
        match &self.uses {
            Some(u) => {
                true.serialize(writer)?;
                u.serialize(writer)?;
            }
            None => {
                false.serialize(writer)?;
            }
        }
        match &self.collection_details {
            Some(cd) => {
                true.serialize(writer)?;
                cd.serialize(writer)?;
            }
            None => {
                false.serialize(writer)?;
            }
        }
        match &self.rule_set {
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

// Manually implement BorshDeserialize for AssetData to handle Option<Pubkey>.
impl borsh::BorshDeserialize for AssetData {
    fn deserialize(buf: &mut &[u8])
        -> std::result::Result<Self, borsh::maybestd::io::Error>
    {
        let name = String::deserialize(buf)?;
        let symbol = String::deserialize(buf)?;
        let uri = String::deserialize(buf)?;
        let seller_fee_basis_points = u16::deserialize(buf)?;

        let has_creators = bool::deserialize(buf)?;
        let creators = if has_creators {
            Some(Vec::<Creator>::deserialize(buf)?)
        } else {
            None
        };

        let primary_sale_happened = bool::deserialize(buf)?;
        let is_mutable = bool::deserialize(buf)?;
        let token_standard = TokenStandard::deserialize(buf)?;

        let has_collection = bool::deserialize(buf)?;
        let collection = if has_collection {
            Some(Collection::deserialize(buf)?)
        } else {
            None
        };

        let has_uses = bool::deserialize(buf)?;
        let uses = if has_uses {
            Some(Uses::deserialize(buf)?)
        } else {
            None
        };

        let has_collection_details = bool::deserialize(buf)?;
        let collection_details = if has_collection_details {
            Some(CollectionDetails::deserialize(buf)?)
        } else {
            None
        };

        let has_rule_set = bool::deserialize(buf)?;
        let rule_set = if has_rule_set {
            let mut arr = [0u8; 32];
            buf.read_exact(&mut arr)?;
            Some(Pubkey::from_slice(&arr))
        } else {
            None
        };

        Ok(Self {
            name,
            symbol,
            uri,
            seller_fee_basis_points,
            creators,
            primary_sale_happened,
            is_mutable,
            token_standard,
            collection,
            uses,
            collection_details,
            rule_set,
        })
    }
}

impl AssetData {
    pub fn new(token_standard: TokenStandard, name: String, symbol: String, uri: String) -> Self {
        Self {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0,
            creators: None,
            primary_sale_happened: false,
            is_mutable: true,
            token_standard,
            collection: None,
            uses: None,
            collection_details: None,
            rule_set: None,
        }
    }

    pub fn as_data_v2(&self) -> DataV2 {
        DataV2 {
            collection: self.collection.clone(),
            creators: self.creators.clone(),
            name: self.name.clone(),
            seller_fee_basis_points: self.seller_fee_basis_points,
            symbol: self.symbol.clone(),
            uri: self.uri.clone(),
            uses: self.uses.clone(),
        }
    }

    pub fn as_data(&self) -> Data {
        Data {
            name: self.name.clone(),
            symbol: self.symbol.clone(),
            uri: self.uri.clone(),
            seller_fee_basis_points: self.seller_fee_basis_points,
            creators: self.creators.clone(),
        }
    }
}