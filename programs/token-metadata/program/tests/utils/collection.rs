use crate::*;
use arch_program::borsh::try_from_slice_unchecked;
use token_metadata::{
    id, instruction,
    state::{Collection, Creator, Data, DataV2, Uses, PREFIX},
};

use solana_sdk::{
    pubkey::Pubkey, signature::Signer, signer::keypair::Keypair, transaction::Transaction,
    transport,
};

#[derive(Clone, Debug)]
pub struct TestCollection {
    pub pubkey: Pubkey,
    pub mint_pubkey: Pubkey,
    pub items: Vec<Pubkey>,
}

impl TestCollection {
    pub fn new() -> Self {
        let parent_nft = Metadata::new();

        TestCollection {
            pubkey: pubkey(),
            mint_pubkey: mint_keypair.pubkey(),
            items: vec![],
        }
    }
}
