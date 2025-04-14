use super::*;
use crate::{
    assertions::{
        collection::assert_collection_update_is_valid, metadata::assert_data_valid,
        uses::assert_valid_use,
    },
    instruction::{CollectionDetailsToggle, CollectionToggle, RuleSetToggle, UpdateArgs},
    utils::{
        metadata::{clean_write_metadata, meta_deser_unchecked},
        puff_out_data_fields,
    },
};
use spl_token_2022::state::Account;
use std::io::{Read, Write};

pub const MAX_NAME_LENGTH: usize = 32;

pub const MAX_SYMBOL_LENGTH: usize = 10;

pub const MAX_URI_LENGTH: usize = 200;

pub const MAX_METADATA_LEN: usize = 1 // key
+ 32             // update auth pubkey
+ 32             // mint pubkey
+ MAX_DATA_SIZE
+ 1              // primary sale
+ 1              // mutable
+ 9              // nonce (pretty sure this only needs to be 2)
+ 2              // token standard
+ 34             // collection
+ 18             // uses
+ 10             // collection details
+ 35             // programmable config
+ 1; // Fee flag

pub const MAX_DATA_SIZE: usize = 4
    + MAX_NAME_LENGTH
    + 4
    + MAX_SYMBOL_LENGTH
    + 4
    + MAX_URI_LENGTH
    + 2
    + 1
    + 4
    + MAX_CREATOR_LIMIT * MAX_CREATOR_LEN;

// The last byte of the account contains the fee flag, indicating
// if the account has fees available for retrieval.
pub const METADATA_FEE_FLAG_OFFSET: usize = 1;

#[macro_export]
macro_rules! metadata_seeds {
    ($mint:expr) => {{
        let path = vec!["metadata".as_bytes(), $crate::id().as_ref(), $mint.as_ref()];
        let (_, bump) = Pubkey::find_program_address(&path, &$crate::id());
        &[
            "metadata".as_bytes(),
            $crate::id().as_ref(),
            $mint.as_ref(),
            &[bump],
        ]
    }};
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, ShankAccount)]
pub struct Metadata {
    /// Account discriminator.
    pub key: Key,
    /// Address of the update authority.
    #[cfg_attr(feature = "serde-feature", serde(with = "As::<DisplayFromStr>"))]
    pub update_authority: Pubkey,
    /// Address of the mint.
    #[cfg_attr(feature = "serde-feature", serde(with = "As::<DisplayFromStr>"))]
    pub mint: Pubkey,
    /// Asset data.
    pub data: Data,
    // Immutable, once flipped, all sales of this metadata are considered secondary.
    pub primary_sale_happened: bool,
    // Whether or not the data struct is mutable, default is not
    pub is_mutable: bool,
    /// nonce for easy calculation of editions, if present
    pub edition_nonce: Option<u8>,
    /// Since we cannot easily change Metadata, we add the new DataV2 fields here at the end.
    pub token_standard: Option<TokenStandard>,
    /// Collection
    pub collection: Option<Collection>,
    /// Uses
    pub uses: Option<Uses>,
    /// Collection Details
    pub collection_details: Option<CollectionDetails>,
    /// Programmable Config
    pub programmable_config: Option<ProgrammableConfig>,
}

impl borsh::ser::BorshSerialize for Metadata {
    fn serialize<W: std::io::Write>(
        &self,
        writer: &mut W,
    ) -> std::result::Result<(), borsh::maybestd::io::Error> {
        self.key.serialize(writer)?;
        writer.write_all(self.update_authority.as_ref())?;
        writer.write_all(self.mint.as_ref())?;
        self.data.serialize(writer)?;
        self.primary_sale_happened.serialize(writer)?;
        self.is_mutable.serialize(writer)?;
        self.edition_nonce.serialize(writer)?;
        self.token_standard.serialize(writer)?;
        self.collection.serialize(writer)?;
        self.uses.serialize(writer)?;
        self.collection_details.serialize(writer)?;
        self.programmable_config.serialize(writer)?;
        Ok(())
    }
}

impl Metadata {
    pub fn save(&self, data: &mut [u8]) -> Result<(), BorshError> {
        let mut bytes = Vec::with_capacity(MAX_METADATA_LEN);
        borsh::to_writer(&mut bytes, self)?;
        data[..bytes.len()].copy_from_slice(&bytes);
        Ok(())
    }

    pub(crate) fn update_v1<'a>(
        &mut self,
        args: UpdateArgs,
        update_authority: &AccountInfo<'a>,
        metadata: &AccountInfo<'a>,
        token: Option<Account>,
        token_standard: TokenStandard,
    ) -> ProgramResult {
        self.token_standard = Some(token_standard);

        match &args {
            UpdateArgs::V1 {
                new_update_authority,
                uses,
                collection_details,
                ..
            }
            | UpdateArgs::AsUpdateAuthorityV2 {
                new_update_authority,
                uses,
                collection_details,
                ..
            } => {
                if let Some(authority) = new_update_authority {
                    self.update_authority = *authority;
                }

                if uses.is_some() {
                    let uses_option = uses.clone().to_option();
                    assert_valid_use(&uses_option, &self.uses)?;
                    self.uses = uses_option;
                }

                if let CollectionDetailsToggle::Set(collection_details) = collection_details {
                    if self.collection_details.is_some() {
                        return Err(MetadataError::SizedCollection.into());
                    }

                    self.collection_details = Some(collection_details.clone());
                }
            }
            _ => (),
        }

        match &args {
            UpdateArgs::V1 { data, .. }
            | UpdateArgs::AsUpdateAuthorityV2 { data, .. }
            | UpdateArgs::AsDataDelegateV2 { data, .. }
            | UpdateArgs::AsDataItemDelegateV2 { data, .. } => {
                if let Some(data) = data {
                    if !self.is_mutable {
                        return Err(MetadataError::DataIsImmutable.into());
                    }

                    assert_data_valid(
                        data,
                        update_authority.key,
                        self,
                        false,
                        update_authority.is_signer,
                    )?;
                    self.data = data.clone();
                }
            }
            _ => (),
        }

        match &args {
            UpdateArgs::V1 {
                primary_sale_happened,
                is_mutable,
                ..
            }
            | UpdateArgs::AsUpdateAuthorityV2 {
                primary_sale_happened,
                is_mutable,
                ..
            }
            | UpdateArgs::AsAuthorityItemDelegateV2 {
                primary_sale_happened,
                is_mutable,
                ..
            } => {
                if let Some(primary_sale) = primary_sale_happened {
                    if *primary_sale || !self.primary_sale_happened {
                        self.primary_sale_happened = *primary_sale
                    } else {
                        return Err(MetadataError::PrimarySaleCanOnlyBeFlippedToTrue.into());
                    }
                }

                if let Some(mutable) = is_mutable {
                    if !mutable || self.is_mutable {
                        self.is_mutable = *mutable
                    } else {
                        return Err(MetadataError::IsMutableCanOnlyBeFlippedToFalse.into());
                    }
                }
            }
            _ => (),
        }

        #[allow(deprecated)]
        if let UpdateArgs::AsAuthorityItemDelegateV2 {
            new_update_authority: Some(_authority),
            ..
        } = &args
        {
            return Err(MetadataError::CannotChangeUpdateAuthorityWithDelegate.into());
        };

        match &args {
            UpdateArgs::V1 { collection, .. }
            | UpdateArgs::AsUpdateAuthorityV2 { collection, .. }
            | UpdateArgs::AsCollectionDelegateV2 { collection, .. }
            | UpdateArgs::AsCollectionItemDelegateV2 { collection, .. } => match collection {
                CollectionToggle::Set(_) => {
                    let collection_option = collection.clone().to_option();
                    assert_collection_update_is_valid(false, &self.collection, &collection_option)?;
                    self.collection = collection_option;
                }
                CollectionToggle::Clear => {
                    if let Some(current_collection) = self.collection.as_ref() {
                        if current_collection.verified {
                            return Err(MetadataError::CannotUpdateVerifiedCollection.into());
                        }
                        self.collection = None;
                    }
                }
                CollectionToggle::None => {}
            },
            _ => (),
        };

        match &args {
            UpdateArgs::V1 { rule_set, .. }
            | UpdateArgs::AsUpdateAuthorityV2 { rule_set, .. }
            | UpdateArgs::AsProgrammableConfigDelegateV2 { rule_set, .. }
            | UpdateArgs::AsProgrammableConfigItemDelegateV2 { rule_set, .. } => {
                if matches!(rule_set, RuleSetToggle::Clear | RuleSetToggle::Set(_)) {
                    if token_standard != TokenStandard::ProgrammableNonFungible
                        && token_standard != TokenStandard::ProgrammableNonFungibleEdition
                    {
                        return Err(MetadataError::InvalidTokenStandard.into());
                    }

                    let token = token.ok_or(MetadataError::MissingTokenAccount)?;

                    if token.delegate.is_some() {
                        return Err(MetadataError::CannotUpdateAssetWithDelegate.into());
                    }

                    self.programmable_config =
                        rule_set
                            .clone()
                            .to_option()
                            .map(|rule_set| ProgrammableConfig::V1 {
                                rule_set: Some(rule_set),
                            });
                }
            }
            _ => (),
        };

        puff_out_data_fields(self);
        clean_write_metadata(self, metadata)
    }

    pub fn into_asset_data(self) -> AssetData {
        let mut asset_data = AssetData::new(
            self.token_standard.unwrap_or(TokenStandard::NonFungible),
            self.data.name,
            self.data.symbol,
            self.data.uri,
        );
        asset_data.seller_fee_basis_points = self.data.seller_fee_basis_points;
        asset_data.creators = self.data.creators;
        asset_data.primary_sale_happened = self.primary_sale_happened;
        asset_data.is_mutable = self.is_mutable;
        asset_data.collection = self.collection;
        asset_data.uses = self.uses;
        asset_data.collection_details = self.collection_details;
        asset_data.rule_set =
            if let Some(ProgrammableConfig::V1 { rule_set }) = self.programmable_config {
                rule_set
            } else {
                None
            };

        asset_data
    }
}

impl Default for Metadata {
    fn default() -> Self {
        Metadata {
            key: Key::MetadataV1,
            update_authority: Pubkey::default(),
            mint: Pubkey::default(),
            data: Data::default(),
            primary_sale_happened: false,
            is_mutable: false,
            edition_nonce: None,
            token_standard: None,
            collection: None,
            uses: None,
            collection_details: None,
            programmable_config: None,
        }
    }
}

impl TokenMetadataAccount for Metadata {
    fn key() -> Key {
        Key::MetadataV1
    }

    fn size() -> usize {
        0
    }
}

impl borsh::de::BorshDeserialize for Metadata {
    fn deserialize(buf: &mut &[u8]) -> ::core::result::Result<Self, BorshError> {
        let md = meta_deser_unchecked(buf)?;
        Ok(md)
    }
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(PartialEq, Eq, Debug, Clone)]
pub enum PrintSupply {
    Zero,
    Limited(u64),
    Unlimited,
}

impl PrintSupply {
    pub fn to_option(&self) -> Option<u64> {
        match self {
            PrintSupply::Zero => Some(0),
            PrintSupply::Limited(supply) => Some(*supply),
            PrintSupply::Unlimited => None,
        }
    }
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(PartialEq, Eq, Debug, Clone)]
pub enum ProgrammableConfig {
    V1 {
        #[cfg_attr(
            feature = "serde-feature",
            serde(
                deserialize_with = "deser_option_pubkey",
                serialize_with = "ser_option_pubkey"
            )
        )]
        rule_set: Option<Pubkey>,
    },
}

impl borsh::ser::BorshSerialize for ProgrammableConfig {
    fn serialize<W: std::io::Write>(
        &self,
        writer: &mut W,
    ) -> std::result::Result<(), borsh::maybestd::io::Error> {
        match self {
            ProgrammableConfig::V1 { rule_set } => {
                0u8.serialize(writer)?;
                match rule_set {
                    Some(pk) => {
                        1u8.serialize(writer)?;
                        writer.write_all(pk.as_ref())?;
                    }
                    None => {
                        0u8.serialize(writer)?;
                    }
                }
            }
        }
        Ok(())
    }
}

impl borsh::de::BorshDeserialize for ProgrammableConfig {
    fn deserialize(buf: &mut &[u8]) -> std::result::Result<Self, borsh::maybestd::io::Error> {
        let tag = u8::deserialize(buf)?;
        match tag {
            0 => {
                let is_some = u8::deserialize(buf)?;
                let rule_set = if is_some == 1 {
                    let mut arr = [0u8; 32];
                    buf.read_exact(&mut arr)?;
                    Some(Pubkey::from_slice(&arr))
                } else {
                    None
                };
                Ok(ProgrammableConfig::V1 { rule_set })
            }
            _ => Err(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "Unknown ProgrammableConfig variant",
            )),
        }
    }
}

#[cfg(test)]
mod tests {
    use arch_program::account::AccountInfo;
    use borsh::BorshDeserialize;
    use solana_sdk::{signature::Keypair, signer::Signer};

    use crate::{
        error::MetadataError,
        state::{
            CollectionAuthorityRecord, Edition, EditionMarker, Key, MasterEditionV2, Metadata,
            TokenMetadataAccount, UseAuthorityRecord,
        },
        utils::metadata::tests::{expected_pesky_metadata, pesky_data},
        ID,
    };

    #[test]
    fn successfully_deserialize_corrupted_metadata() {
        let expected_metadata = expected_pesky_metadata();
        let mut corrupted_data = pesky_data();

        let metadata = Metadata::deserialize(&mut corrupted_data).unwrap();

        assert_eq!(metadata, expected_metadata);
    }

    #[test]
    fn successfully_deserialize_metadata() {
        let expected_metadata = expected_pesky_metadata();

        let mut buf = Vec::new();
        borsh::to_writer(&mut buf, &expected_metadata).unwrap();

        let pubkey = Keypair::new().pubkey();
        let owner = &ID;
        let mut lamports = 1_000_000_000;
        let mut data = buf.clone();

        let md_account =
            AccountInfo::new(&pubkey, false, true, &mut lamports, &mut data, owner, false);

        let md = Metadata::from_account(&md_account).unwrap();
        assert_eq!(md.key, Key::MetadataV1);
        assert_eq!(md, expected_metadata);
    }

    #[test]
    fn fail_to_deserialize_metadata_with_wrong_owner() {
        let expected_metadata = expected_pesky_metadata();

        let mut buf = Vec::new();
        borsh::to_writer(&mut buf, &expected_metadata).unwrap();

        let pubkey = Keypair::new().pubkey();
        let invalid_owner = Keypair::new().pubkey();
        let mut lamports = 1_000_000_000;
        let mut data = buf.clone();

        let md_account = AccountInfo::new(
            &pubkey,
            false,
            true,
            &mut lamports,
            &mut data,
            &invalid_owner,
            false,
        );

        let error = Metadata::from_account(&md_account).unwrap_err();
        assert_eq!(error, MetadataError::IncorrectOwner.into());
    }

    #[test]
    fn fail_to_deserialize_master_edition_into_metadata() {
        let master_edition = MasterEditionV2 {
            key: Key::MasterEditionV2,
            supply: 0,
            max_supply: Some(0),
        };
        let mut buf = Vec::new();
        borsh::to_writer(&mut buf, &master_edition).unwrap();

        let pubkey = Keypair::new().pubkey();
        let owner = &ID;
        let mut lamports = 1_000_000_000;
        let mut data = buf.clone();

        let account =
            AccountInfo::new(&pubkey, false, true, &mut lamports, &mut data, owner, false);

        let err = Metadata::from_account(&account).unwrap_err();
        assert_eq!(err, MetadataError::DataTypeMismatch.into());
    }

    #[test]
    fn fail_to_deserialize_edition_into_metadata() {
        let parent = Keypair::new().pubkey();
        let edition = 1;

        let edition = Edition {
            key: Key::EditionV1,
            parent,
            edition,
        };

        let mut buf = Vec::new();
        borsh::to_writer(&mut buf, &edition).unwrap();

        let pubkey = Keypair::new().pubkey();
        let owner = &ID;
        let mut lamports = 1_000_000_000;
        let mut data = buf.clone();

        let account =
            AccountInfo::new(&pubkey, false, true, &mut lamports, &mut data, owner, false);

        let err = Metadata::from_account(&account).unwrap_err();
        assert_eq!(err, MetadataError::DataTypeMismatch.into());
    }

    #[test]
    fn fail_to_deserialize_use_authority_record_into_metadata() {
        let use_record = UseAuthorityRecord {
            key: Key::UseAuthorityRecord,
            allowed_uses: 14,
            bump: 255,
        };

        let mut buf = Vec::new();
        borsh::to_writer(&mut buf, &use_record).unwrap();

        let pubkey = Keypair::new().pubkey();
        let owner = &ID;
        let mut lamports = 1_000_000_000;
        let mut data = buf.clone();

        let account =
            AccountInfo::new(&pubkey, false, true, &mut lamports, &mut data, owner, false);

        let err = Metadata::from_account(&account).unwrap_err();
        assert_eq!(err, MetadataError::DataTypeMismatch.into());
    }

    #[test]
    fn fail_to_deserialize_collection_authority_record_into_metadata() {
        let collection_record = CollectionAuthorityRecord {
            key: Key::CollectionAuthorityRecord,
            bump: 255,
            update_authority: None,
        };

        let mut buf = Vec::new();
        borsh::to_writer(&mut buf, &collection_record).unwrap();

        let pubkey = Keypair::new().pubkey();
        let owner = &ID;
        let mut lamports = 1_000_000_000;
        let mut data = buf.clone();

        let account =
            AccountInfo::new(&pubkey, false, true, &mut lamports, &mut data, owner, false);

        let err = Metadata::from_account(&account).unwrap_err();
        assert_eq!(err, MetadataError::DataTypeMismatch.into());
    }

    #[test]
    fn fail_to_deserialize_edition_marker_into_metadata() {
        let edition_marker = EditionMarker {
            key: Key::EditionMarker,
            ledger: [0; 31],
        };

        let mut buf = Vec::new();
        borsh::to_writer(&mut buf, &edition_marker).unwrap();

        let pubkey = Keypair::new().pubkey();
        let owner = &ID;
        let mut lamports = 1_000_000_000;
        let mut data = buf.clone();

        let account =
            AccountInfo::new(&pubkey, false, true, &mut lamports, &mut data, owner, false);

        let err = Metadata::from_account(&account).unwrap_err();
        assert_eq!(err, MetadataError::DataTypeMismatch.into());
    }
}
