use std::fmt::{Display, Formatter, Result};

use crate::types::MetadataDelegateRole;

pub struct MetadataDelegateRoleSeed(MetadataDelegateRole);

impl Display for MetadataDelegateRoleSeed {
    fn fmt(&self, f: &mut Formatter) -> Result {
        let message = match self.0 {
            MetadataDelegateRole::AuthorityItem => "authority_item_delegate".to_string(),
            MetadataDelegateRole::Collection => "collection_delegate".to_string(),
            MetadataDelegateRole::Use => "use_delegate".to_string(),
            MetadataDelegateRole::Data => "data_delegate".to_string(),
            MetadataDelegateRole::ProgrammableConfig => "programmable_config_delegate".to_string(),
            MetadataDelegateRole::DataItem => "data_item_delegate".to_string(),
            MetadataDelegateRole::CollectionItem => "collection_item_delegate".to_string(),
            MetadataDelegateRole::ProgrammableConfigItem => "prog_config_item_delegate".to_string(),
        };

        write!(f, "{message}")
    }
}

impl From<MetadataDelegateRole> for MetadataDelegateRoleSeed {
    fn from(role: MetadataDelegateRole) -> Self {
        MetadataDelegateRoleSeed(role)
    }
}
