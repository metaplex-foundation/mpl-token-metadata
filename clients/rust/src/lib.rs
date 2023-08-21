mod generated;
pub mod hooked;

pub use generated::MPL_TOKEN_METADATA_ID as ID;
pub use generated::*;

/// Removes all null bytes from a string.
pub fn clean(value: String) -> String {
    value.replace('\0', "")
}
