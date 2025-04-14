use crate::pubkey;
use arch_program::{account::AccountInfo, pubkey::Pubkey};
use mpl_utils::cmp_pubkeys;

// Define the addresses as byte arrays first, then create functions to get them
const BUBBLEGUM_PROGRAM_ADDRESS_BYTES: [u8; 32] = [
    186, 71, 21, 168, 126, 246, 56, 218, 220, 244, 69, 182, 135, 217, 251, 115, 203, 165, 115, 119,
    152, 229, 139, 172, 143, 126, 146, 20, 113, 176, 50, 153,
];

const BUBBLEGUM_SIGNER_BYTES: [u8; 32] = [
    125, 214, 192, 215, 51, 208, 154, 40, 142, 223, 191, 118, 142, 20, 239, 152, 33, 207, 184, 214,
    175, 126, 30, 120, 49, 234, 58, 169, 69, 24, 32, 147,
];

pub fn bubblegum_program_address() -> Pubkey {
    Pubkey::from(BUBBLEGUM_PROGRAM_ADDRESS_BYTES)
}

pub fn bubblegum_signer() -> Pubkey {
    Pubkey::from(BUBBLEGUM_SIGNER_BYTES)
}

// This flag activates certain program authority features of the Bubblegum program.
pub const BUBBLEGUM_ACTIVATED: bool = true;

pub fn find_compression_mint_authority(mint: &Pubkey) -> (Pubkey, u8) {
    let seeds = &[mint.as_ref()];
    Pubkey::find_program_address(seeds, &bubblegum_program_address())
}

pub fn is_decompression(mint: &AccountInfo, mint_authority_info: &AccountInfo) -> bool {
    if BUBBLEGUM_ACTIVATED
        && mint_authority_info.is_signer
        && cmp_pubkeys(mint_authority_info.owner, &bubblegum_program_address())
    {
        let (expected, _) = find_compression_mint_authority(mint.key);
        return cmp_pubkeys(mint_authority_info.key, &expected);
    }
    false
}
