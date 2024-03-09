use std::fmt::{Display, Formatter, Result};

use crate::types::HolderDelegateRole;

pub type HolderDelegateRoleSeed = HolderDelegateRole;

impl Display for HolderDelegateRole {
    fn fmt(&self, f: &mut Formatter) -> Result {
        let message = match self {
            HolderDelegateRole::PrintDelegate => "print_delegate".to_string(),
        };

        write!(f, "{message}")
    }
}
