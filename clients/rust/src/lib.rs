mod generated;
pub mod hooked;

pub use generated::programs::MPL_TOKEN_METADATA_ID as ID;
use generated::types::TokenStandard;
pub use generated::*;

/// Removes all null bytes from a string.
pub fn clean(value: String) -> String {
    value.replace('\0', "")
}

impl Copy for TokenStandard {}
