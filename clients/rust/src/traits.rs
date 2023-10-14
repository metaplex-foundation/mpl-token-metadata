//! Additional trait implementations for generated types.

use std::io::{Error, ErrorKind};

use borsh::BorshDeserialize;
use solana_program::pubkey::Pubkey;

use crate::{
    accounts::{MasterEdition, Metadata, TokenRecord},
    errors::MplTokenMetadataError,
    generated::{
        types::{CollectionToggle, RuleSetToggle, UsesToggle},
        {instructions::UpdateV1InstructionArgs, types::CollectionDetailsToggle},
    },
    types::{
        Collection, CollectionDetails, Data, Key, ProgrammableConfig, TokenDelegateRole,
        TokenStandard, TokenState, Uses,
    },
};

impl Default for UpdateV1InstructionArgs {
    fn default() -> Self {
        Self {
            new_update_authority: None,
            data: None,
            primary_sale_happened: None,
            is_mutable: None,
            collection: CollectionToggle::None,
            collection_details: CollectionDetailsToggle::None,
            uses: UsesToggle::None,
            rule_set: RuleSetToggle::None,
            authorization_data: None,
        }
    }
}

// Master Edition

impl MasterEdition {
    pub fn safe_deserialize(data: &[u8]) -> Result<Self, borsh::maybestd::io::Error> {
        if data.is_empty() || data[0] != Key::MasterEditionV2 as u8 {
            return Err(borsh::maybestd::io::Error::new(
                ErrorKind::Other,
                "DataTypeMismatch",
            ));
        }
        // mutable "pointer" to the account data
        let mut data = data;
        let result = Self::deserialize(&mut data)?;

        Ok(result)
    }
}

// Metadata

impl Metadata {
    pub fn safe_deserialize(data: &[u8]) -> Result<Self, borsh::maybestd::io::Error> {
        if data.is_empty() || data[0] != Key::MetadataV1 as u8 {
            return Err(borsh::maybestd::io::Error::new(
                ErrorKind::Other,
                "DataTypeMismatch",
            ));
        }
        // mutable "pointer" to the account data
        let mut data = data;
        let result = Self::deserialize_unchecked(&mut data)?;

        Ok(result)
    }

    fn deserialize_unchecked(buf: &mut &[u8]) -> Result<Self, borsh::maybestd::io::Error> {
        // Metadata corruption shouldn't appear until after edition_nonce.
        let key: Key = BorshDeserialize::deserialize(buf)?;
        let update_authority: Pubkey = BorshDeserialize::deserialize(buf)?;
        let mint: Pubkey = BorshDeserialize::deserialize(buf)?;
        let data: Data = BorshDeserialize::deserialize(buf)?;
        let primary_sale_happened: bool = BorshDeserialize::deserialize(buf)?;
        let is_mutable: bool = BorshDeserialize::deserialize(buf)?;
        let edition_nonce: Option<u8> = BorshDeserialize::deserialize(buf)?;

        // V1.2
        let token_standard_res: Result<Option<TokenStandard>, borsh::maybestd::io::Error> =
            BorshDeserialize::deserialize(buf);
        let collection_res: Result<Option<Collection>, borsh::maybestd::io::Error> =
            BorshDeserialize::deserialize(buf);
        let uses_res: Result<Option<Uses>, borsh::maybestd::io::Error> =
            BorshDeserialize::deserialize(buf);

        // V1.3
        let collection_details_res: Result<Option<CollectionDetails>, borsh::maybestd::io::Error> =
            BorshDeserialize::deserialize(buf);

        // pNFT - Programmable Config
        let programmable_config_res: Result<
            Option<ProgrammableConfig>,
            borsh::maybestd::io::Error,
        > = BorshDeserialize::deserialize(buf);

        // We can have accidentally valid, but corrupted data, particularly on the Collection struct,
        // so to increase probability of catching errors. If any of these deserializations fail, set
        // all values to None.
        let (token_standard, collection, uses) =
            match (token_standard_res, collection_res, uses_res) {
                (Ok(token_standard_res), Ok(collection_res), Ok(uses_res)) => {
                    (token_standard_res, collection_res, uses_res)
                }
                _ => (None, None, None),
            };

        // V1.3
        let collection_details = match collection_details_res {
            Ok(details) => details,
            Err(_) => None,
        };

        // Programmable Config
        let programmable_config = programmable_config_res.unwrap_or(None);

        let metadata = Metadata {
            key,
            update_authority,
            mint,
            name: data.name,
            seller_fee_basis_points: data.seller_fee_basis_points,
            symbol: data.symbol,
            uri: data.uri,
            creators: data.creators,
            primary_sale_happened,
            is_mutable,
            edition_nonce,
            token_standard,
            collection,
            uses,
            collection_details,
            programmable_config,
        };

        Ok(metadata)
    }
}

// Token Record

const LOCKED_TRANSFER_SIZE: usize = 33;

impl TokenRecord {
    pub fn safe_deserialize(data: &[u8]) -> Result<TokenRecord, Error> {
        // we perform a manual deserialization since we are potentially dealing
        // with accounts of different sizes
        let length = TokenRecord::LEN as i64 - data.len() as i64;

        // we use the account length in the 'is_correct_account_type' since we are
        // manually checking that the account length is valid
        if !(length == 0 || length == LOCKED_TRANSFER_SIZE as i64)
            || data[0] != Key::TokenRecord as u8
        {
            return Err(Error::new(
                ErrorKind::InvalidData,
                MplTokenMetadataError::DataTypeMismatch,
            ));
        }
        // mutable "pointer" to the account data
        let mut data = data;

        let key: Key = BorshDeserialize::deserialize(&mut data)?;
        let bump: u8 = BorshDeserialize::deserialize(&mut data)?;
        let state: TokenState = BorshDeserialize::deserialize(&mut data)?;
        let rule_set_revision: Option<u64> = BorshDeserialize::deserialize(&mut data)?;
        let delegate: Option<Pubkey> = BorshDeserialize::deserialize(&mut data)?;
        let delegate_role: Option<TokenDelegateRole> = BorshDeserialize::deserialize(&mut data)?;

        let locked_transfer: Option<Pubkey> = if length == 0 {
            BorshDeserialize::deserialize(&mut data)?
        } else {
            None
        };

        Ok(TokenRecord {
            key,
            bump,
            state,
            rule_set_revision,
            delegate,
            delegate_role,
            locked_transfer,
        })
    }
}
