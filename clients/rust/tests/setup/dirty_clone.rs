use solana_sdk::signature::Keypair;

pub trait DirtyClone {
    fn dirty_clone(&self) -> Self;
}

impl DirtyClone for Keypair {
    fn dirty_clone(&self) -> Self {
        Keypair::new_from_array(*self.secret_bytes())
    }
}
