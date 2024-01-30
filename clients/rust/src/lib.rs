mod generated;
pub mod hooked;
mod traits;
pub mod utils;

pub use generated::programs::MPL_TOKEN_METADATA_ID as ID;
pub use generated::*;

/// Maximum number of characters in a meetadata name.
pub const MAX_NAME_LENGTH: usize = 32;

/// Maximum number of characters in a metadata symbol.
pub const MAX_SYMBOL_LENGTH: usize = 10;

/// Maximum number of characters in a metadata uri.
pub const MAX_URI_LENGTH: usize = 200;

/// Maximum number of creators in a metadata.
pub const MAX_CREATOR_LIMIT: usize = 5;

/// Maximum number of bytes used by a creator data.
pub const MAX_CREATOR_LEN: usize = 32 + 1 + 1;

/// Maximum number of bytes used by a edition marker.
pub const MAX_EDITION_MARKER_SIZE: usize = 32;

/// Number of bits used by a edition marker.
pub const EDITION_MARKER_BIT_SIZE: u64 = 248;
