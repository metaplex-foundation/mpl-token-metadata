use solana_client::nonblocking::rpc_client::RpcClient;
use mpl_token_metadata::accounts::Metadata;
use solana_sdk::pubkey::Pubkey;

#[tokio::main(flavor = "multi_thread")]
async fn main() {
    let conn = RpcClient::new("https://api.mainnet-beta.solana.com".to_string());

    // USDC https://solscan.io/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
    let token: Pubkey = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".parse().unwrap(); 

    let (metadata_account, _) = Metadata::find_pda(&token);
    dbg!(metadata_account);

    let account = conn.get_account(&metadata_account).await.unwrap();

    dbg!(&account);

    let meta_data = Metadata::safe_deserialize(&account.data).unwrap();
    dbg!(meta_data);
}
