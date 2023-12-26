use mpl_token_metadata::accounts::Metadata;
use solana_program::{
    native_token::LAMPORTS_PER_SOL, program_pack::Pack, pubkey::Pubkey, system_instruction,
};
use solana_program_test::{BanksClientError, ProgramTestContext};
use solana_sdk::{
    signature::{Keypair, Signer},
    transaction::Transaction,
};
use spl_token_2022::{
    extension::{
        default_account_state::instruction::initialize_default_account_state,
        interest_bearing_mint, metadata_pointer,
        transfer_fee::instruction::initialize_transfer_fee_config, transfer_hook, ExtensionType,
    },
    instruction::{
        initialize_mint_close_authority, initialize_non_transferable_mint,
        initialize_permanent_delegate,
    },
    state::{Account, AccountState, Mint},
};

pub struct TokenManager {
    pub spl_token_program: Pubkey,
}

impl Default for TokenManager {
    fn default() -> Self {
        Self {
            spl_token_program: spl_token_2022::ID,
        }
    }
}

impl TokenManager {
    pub async fn create_mint(
        &self,
        context: &mut ProgramTestContext,
        mint: &Keypair,
        mint_authority: &Pubkey,
        freeze_authority: Option<&Pubkey>,
        decimals: u8,
    ) -> Result<(), BanksClientError> {
        self.create_mint_with_extensions(
            context,
            mint,
            mint_authority,
            freeze_authority,
            decimals,
            &[],
        )
        .await
    }

    pub async fn create_mint_with_extensions(
        &self,
        context: &mut ProgramTestContext,
        mint: &Keypair,
        mint_authority: &Pubkey,
        freeze_authority: Option<&Pubkey>,
        decimals: u8,
        extensions: &[ExtensionType],
    ) -> Result<(), BanksClientError> {
        let account_size = ExtensionType::try_calculate_account_len::<Mint>(extensions).unwrap();
        let rent = context.banks_client.get_rent().await.unwrap();

        let (metadata, _) = Metadata::find_pda(&mint.pubkey());
        let mut instructions = vec![];

        instructions.push(system_instruction::create_account(
            &context.payer.pubkey(),
            &mint.pubkey(),
            rent.minimum_balance(account_size),
            account_size as u64,
            &self.spl_token_program,
        ));

        // set up extentions

        if extensions.contains(&ExtensionType::MintCloseAuthority) {
            // the mint close authority must be the metadata account
            instructions.push(
                initialize_mint_close_authority(
                    &self.spl_token_program,
                    &mint.pubkey(),
                    Some(&metadata),
                )
                .unwrap(),
            );
        }

        if extensions.contains(&ExtensionType::TransferFeeConfig) {
            instructions.push(
                initialize_transfer_fee_config(
                    &self.spl_token_program,
                    &mint.pubkey(),
                    Some(&context.payer.pubkey()),
                    Some(&context.payer.pubkey()),
                    500u16,
                    LAMPORTS_PER_SOL,
                )
                .unwrap(),
            );
        }

        if extensions.contains(&ExtensionType::DefaultAccountState) {
            instructions.push(
                initialize_default_account_state(
                    &self.spl_token_program,
                    &mint.pubkey(),
                    &AccountState::Frozen,
                )
                .unwrap(),
            );
        }

        if extensions.contains(&ExtensionType::NonTransferable) {
            instructions.push(
                initialize_non_transferable_mint(&self.spl_token_program, &mint.pubkey()).unwrap(),
            );
        }

        if extensions.contains(&ExtensionType::InterestBearingConfig) {
            instructions.push(
                interest_bearing_mint::instruction::initialize(
                    &self.spl_token_program,
                    &mint.pubkey(),
                    None,
                    5i16,
                )
                .unwrap(),
            );
        }

        if extensions.contains(&ExtensionType::PermanentDelegate) {
            // mint authority as permanent delegate
            instructions.push(
                initialize_permanent_delegate(
                    &self.spl_token_program,
                    &mint.pubkey(),
                    mint_authority,
                )
                .unwrap(),
            );
        }

        if extensions.contains(&ExtensionType::TransferHook) {
            // token metadata as the transfer hook program
            instructions.push(
                transfer_hook::instruction::initialize(
                    &self.spl_token_program,
                    &mint.pubkey(),
                    Some(context.payer.pubkey()),
                    Some(mpl_token_metadata::ID),
                )
                .unwrap(),
            );
        }

        if extensions.contains(&ExtensionType::MetadataPointer) {
            // metadata as the metadata pointer address
            instructions.push(
                metadata_pointer::instruction::initialize(
                    &self.spl_token_program,
                    &mint.pubkey(),
                    None,
                    Some(metadata),
                )
                .unwrap(),
            );
        }

        // initialize the mint

        instructions.push(
            spl_token_2022::instruction::initialize_mint2(
                &self.spl_token_program,
                &mint.pubkey(),
                mint_authority,
                freeze_authority,
                decimals,
            )
            .unwrap(),
        );

        let tx = Transaction::new_signed_with_payer(
            &instructions,
            Some(&context.payer.pubkey()),
            &[&context.payer, mint],
            context.last_blockhash,
        );

        context.banks_client.process_transaction(tx).await
    }

    pub async fn create_token_account(
        &self,
        context: &mut ProgramTestContext,
        owner: &Pubkey,
        token_account: &Keypair,
        mint: &Pubkey,
        spl_token_program: Pubkey,
    ) -> Result<(), BanksClientError> {
        let spl_token_2022 = spl_token_program == spl_token_2022::ID;

        let length = if spl_token_2022 {
            ExtensionType::try_calculate_account_len::<Account>(&[ExtensionType::ImmutableOwner])
                .unwrap()
        } else {
            Account::LEN
        };
        let rent = context.banks_client.get_rent().await.unwrap();

        let mut instructions = vec![];

        instructions.push(system_instruction::create_account(
            &context.payer.pubkey(),
            &token_account.pubkey(),
            rent.minimum_balance(length),
            length as u64,
            &self.spl_token_program,
        ));

        if spl_token_2022 {
            instructions.push(
                spl_token_2022::instruction::initialize_immutable_owner(
                    &self.spl_token_program,
                    &token_account.pubkey(),
                )
                .unwrap(),
            );
        }

        instructions.push(
            spl_token_2022::instruction::initialize_account3(
                &self.spl_token_program,
                &token_account.pubkey(),
                mint,
                owner,
            )
            .unwrap(),
        );

        let tx = Transaction::new_signed_with_payer(
            &instructions,
            Some(&context.payer.pubkey()),
            &[&context.payer, token_account],
            context.last_blockhash,
        );

        context.banks_client.process_transaction(tx).await
    }

    pub async fn create_token_account_with_extensions(
        &self,
        context: &mut ProgramTestContext,
        owner: &Pubkey,
        token_account: &Keypair,
        mint: &Pubkey,
        extensions: &[ExtensionType],
    ) -> Result<(), BanksClientError> {
        let length = ExtensionType::try_calculate_account_len::<Account>(extensions).unwrap();
        let rent = context.banks_client.get_rent().await.unwrap();

        let mut instructions = vec![];

        instructions.push(system_instruction::create_account(
            &context.payer.pubkey(),
            &token_account.pubkey(),
            rent.minimum_balance(length),
            length as u64,
            &self.spl_token_program,
        ));

        if extensions.contains(&ExtensionType::ImmutableOwner) {
            instructions.push(
                spl_token_2022::instruction::initialize_immutable_owner(
                    &self.spl_token_program,
                    &token_account.pubkey(),
                )
                .unwrap(),
            );
        }

        instructions.push(
            spl_token_2022::instruction::initialize_account3(
                &self.spl_token_program,
                &token_account.pubkey(),
                mint,
                owner,
            )
            .unwrap(),
        );

        let tx = Transaction::new_signed_with_payer(
            &instructions,
            Some(&context.payer.pubkey()),
            &[&context.payer, token_account],
            context.last_blockhash,
        );

        context.banks_client.process_transaction(tx).await
    }
}
