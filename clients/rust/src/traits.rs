//! Additional trait implementations for generated types.

use crate::generated::{
    types::{CollectionToggle, RuleSetToggle, UsesToggle},
    {instructions::UpdateV1InstructionArgs, types::CollectionDetailsToggle},
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
