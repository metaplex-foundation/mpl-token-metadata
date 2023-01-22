use solana_program::{program_pack::Pack, pubkey::Pubkey, rent::Rent, system_instruction};
use solana_program_test::{BanksClientError, ProgramTest, ProgramTestContext};
use solana_sdk::{
    account::Account,
    signature::{Keypair, Signer},
    transaction::Transaction,
};

pub fn program_test() -> ProgramTest {
    ProgramTest::new("mpl_token_extras", mpl_token_extras::id(), None)
}

pub async fn send_transaction(
    context: &mut ProgramTestContext,
    transaction: Transaction,
) -> Result<(), BanksClientError> {
    context.banks_client.process_transaction(transaction).await
}

pub async fn airdrop(context: &mut ProgramTestContext, receiver: &Pubkey, amount: u64) -> () {
    let transaction = Transaction::new_signed_with_payer(
        &[system_instruction::transfer(
            &context.payer.pubkey(),
            receiver,
            amount,
        )],
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );

    send_transaction(context, transaction).await.unwrap()
}

pub async fn get_account(context: &mut ProgramTestContext, pubkey: &Pubkey) -> Account {
    context
        .banks_client
        .get_account(*pubkey)
        .await
        .expect("account not found")
        .expect("account empty")
}

pub async fn get_balance(context: &mut ProgramTestContext, pubkey: &Pubkey) -> u64 {
    let account = context
        .banks_client
        .get_account(*pubkey)
        .await
        .expect("account not found");

    match account {
        Some(account) => account.lamports,
        None => 0,
    }
}

pub async fn get_rent(context: &mut ProgramTestContext) -> Rent {
    context.banks_client.get_rent().await.unwrap()
}

pub async fn create_mint(
    context: &mut ProgramTestContext,
    mint: &Keypair,
    mint_authority: &Pubkey,
    freeze_authority: Option<&Pubkey>,
) -> Result<(), BanksClientError> {
    let rent = context.banks_client.get_rent().await.unwrap();

    let tx = Transaction::new_signed_with_payer(
        &[
            system_instruction::create_account(
                &context.payer.pubkey(),
                &mint.pubkey(),
                rent.minimum_balance(spl_token::state::Mint::LEN),
                spl_token::state::Mint::LEN as u64,
                &spl_token::id(),
            ),
            spl_token::instruction::initialize_mint(
                &spl_token::id(),
                &mint.pubkey(),
                mint_authority,
                freeze_authority,
                0,
            )
            .unwrap(),
        ],
        Some(&context.payer.pubkey()),
        &[&context.payer, mint],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await
}

pub async fn create_token(
    context: &mut ProgramTestContext,
    account: &Keypair,
    mint: &Pubkey,
    owner: &Pubkey,
) -> Result<(), BanksClientError> {
    let rent = context.banks_client.get_rent().await.unwrap();

    let tx = Transaction::new_signed_with_payer(
        &[
            system_instruction::create_account(
                &context.payer.pubkey(),
                &account.pubkey(),
                rent.minimum_balance(spl_token::state::Account::LEN),
                spl_token::state::Account::LEN as u64,
                &spl_token::id(),
            ),
            spl_token::instruction::initialize_account(
                &spl_token::id(),
                &account.pubkey(),
                mint,
                owner,
            )
            .unwrap(),
        ],
        Some(&context.payer.pubkey()),
        &[&context.payer, account],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await
}

pub async fn get_token(
    context: &mut ProgramTestContext,
    pubkey: &Pubkey,
) -> spl_token::state::Account {
    let account = get_account(context, pubkey).await;
    spl_token::state::Account::unpack(&account.data).unwrap()
}
