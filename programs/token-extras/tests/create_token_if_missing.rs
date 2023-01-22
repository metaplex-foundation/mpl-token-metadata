#![cfg(feature = "test-bpf")]

pub mod utils;

mod create_token_if_missing {
    use crate::utils::{
        airdrop, create_mint, create_token, get_account, get_balance, get_rent, get_token,
        program_test, send_transaction,
    };
    use assert_matches::assert_matches;
    use borsh::BorshSerialize;
    use mpl_token_extras::instruction::{
        create_token_if_missing_instruction, TokenExtrasInstruction,
    };
    use solana_program::{
        instruction::{AccountMeta, Instruction, InstructionError::Custom},
        program_pack::Pack,
        system_program,
    };
    use solana_program_test::*;
    use solana_sdk::{
        account::{Account, AccountSharedData},
        signature::{Keypair, Signer},
        transaction::{Transaction, TransactionError},
    };
    use spl_associated_token_account::{
        get_associated_token_address, instruction::create_associated_token_account,
    };

    #[tokio::test]
    async fn test_it_creates_a_new_associated_token_if_missing() {
        // Given a mint/owner pair without an existing associated token account.
        let mut context = program_test().start_with_context().await;
        let mint = Keypair::new();
        let mint_authority = Keypair::new();
        let owner = Keypair::new();
        let new_token = get_associated_token_address(&owner.pubkey(), &mint.pubkey());
        create_mint(&mut context, &mint, &mint_authority.pubkey(), None)
            .await
            .unwrap();

        // When we call the "CreateTokenIfMissing" instruction.
        let transaction = Transaction::new_signed_with_payer(
            &[create_token_if_missing_instruction(
                &context.payer.pubkey(),
                &new_token,
                &mint.pubkey(),
                &owner.pubkey(),
                &new_token,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );
        send_transaction(&mut context, transaction).await.unwrap();

        // Then an associated token account was created with the expected data.
        let raw_account = get_account(&mut context, &new_token).await;
        let parsed_account = get_token(&mut context, &new_token).await;
        assert_eq!(raw_account.owner, spl_token::id());
        assert_eq!(parsed_account.mint, mint.pubkey());
        assert_eq!(parsed_account.owner, owner.pubkey());
    }

    #[tokio::test]
    async fn test_the_payer_pays_for_the_storage_fees_if_a_token_account_gets_created() {
        // Given a mint/owner pair without an existing associated token account.
        let mut context = program_test().start_with_context().await;
        let mint = Keypair::new();
        let mint_authority = Keypair::new();
        let owner = Keypair::new();
        let new_token = get_associated_token_address(&owner.pubkey(), &mint.pubkey());
        create_mint(&mut context, &mint, &mint_authority.pubkey(), None)
            .await
            .unwrap();

        // And a payer with 10 SOL.
        let payer = Keypair::new();
        airdrop(&mut context, &payer.pubkey(), 10_000_000_000).await;

        // When we call the "CreateTokenIfMissing" instruction.
        let transaction = Transaction::new_signed_with_payer(
            &[create_token_if_missing_instruction(
                &payer.pubkey(),
                &new_token,
                &mint.pubkey(),
                &owner.pubkey(),
                &new_token,
            )],
            // Note that we let the context payer pay for the transaction
            // to ensure the payer only pays for the storage fees.
            Some(&context.payer.pubkey()),
            &[&context.payer, &payer],
            context.last_blockhash,
        );
        send_transaction(&mut context, transaction).await.unwrap();

        // Then the payer was charged for the storage fees.
        let rent = get_rent(&mut context).await;
        let rent_exemption = rent.minimum_balance(spl_token::state::Account::LEN);
        let payer_balance = get_balance(&mut context, &payer.pubkey()).await;
        assert_eq!(payer_balance, 10_000_000_000 - rent_exemption);
    }

    #[tokio::test]
    async fn test_it_does_not_create_an_account_if_an_associated_token_account_already_exists() {
        // Given a payer with 10 SOL.
        let mut context = program_test().start_with_context().await;
        let payer = Keypair::new();
        airdrop(&mut context, &payer.pubkey(), 10_000_000_000).await;

        // And a mint/owner pair with an existing associated token account.
        let mint = Keypair::new();
        let mint_authority = Keypair::new();
        let owner = Keypair::new();
        let ata_token = get_associated_token_address(&owner.pubkey(), &mint.pubkey());
        create_mint(&mut context, &mint, &mint_authority.pubkey(), None)
            .await
            .unwrap();
        create_associated_token_account(
            &payer.pubkey(),
            &owner.pubkey(),
            &mint.pubkey(),
            &spl_token::id(),
        );

        // When we call the "CreateTokenIfMissing" instruction.
        let transaction = Transaction::new_signed_with_payer(
            &[create_token_if_missing_instruction(
                &context.payer.pubkey(),
                &ata_token,
                &mint.pubkey(),
                &owner.pubkey(),
                &ata_token,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );
        send_transaction(&mut context, transaction).await.unwrap();

        // Then the instruction succeeded but no new account was created.
        let payer_balance = get_balance(&mut context, &payer.pubkey()).await;
        assert_eq!(payer_balance, 10_000_000_000);
    }

    #[tokio::test]
    async fn test_it_does_not_create_an_account_if_a_regular_token_account_already_exists() {
        // Given a payer with 10 SOL.
        let mut context = program_test().start_with_context().await;
        let payer = Keypair::new();
        airdrop(&mut context, &payer.pubkey(), 10_000_000_000).await;

        // And a mint/owner pair with an existing regular token account.
        let mint = Keypair::new();
        let mint_authority = Keypair::new();
        let owner = Keypair::new();
        let regular_token = Keypair::new();
        let ata_token = get_associated_token_address(&owner.pubkey(), &mint.pubkey());
        create_mint(&mut context, &mint, &mint_authority.pubkey(), None)
            .await
            .unwrap();
        create_token(
            &mut context,
            &regular_token,
            &mint.pubkey(),
            &owner.pubkey(),
        )
        .await
        .unwrap();

        // When we call the "CreateTokenIfMissing" instruction.
        let transaction = Transaction::new_signed_with_payer(
            &[create_token_if_missing_instruction(
                &context.payer.pubkey(),
                &regular_token.pubkey(),
                &mint.pubkey(),
                &owner.pubkey(),
                &ata_token,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );
        send_transaction(&mut context, transaction).await.unwrap();

        // Then the instruction succeeded but no new account was created.
        let payer_balance = get_balance(&mut context, &payer.pubkey()).await;
        assert_eq!(payer_balance, 10_000_000_000);
    }

    #[tokio::test]
    async fn test_it_fail_if_we_provide_the_wrong_system_program() {
        // Given a mint/owner pair.
        let mut context = program_test().start_with_context().await;
        let mint = Keypair::new();
        let owner = Keypair::new();
        let new_token = get_associated_token_address(&owner.pubkey(), &mint.pubkey());

        // And a fake system program.
        let fake_system_program = Keypair::new().pubkey();

        // When we try to create a token account if missing.
        let transaction = Transaction::new_signed_with_payer(
            &[Instruction {
                program_id: mpl_token_extras::id(),
                accounts: vec![
                    AccountMeta::new(context.payer.pubkey(), true),
                    AccountMeta::new_readonly(new_token, false),
                    AccountMeta::new_readonly(mint.pubkey(), false),
                    AccountMeta::new_readonly(owner.pubkey(), false),
                    AccountMeta::new(new_token, false),
                    AccountMeta::new_readonly(fake_system_program, false),
                    AccountMeta::new_readonly(spl_token::id(), false),
                    AccountMeta::new_readonly(spl_associated_token_account::id(), false),
                ],
                data: TokenExtrasInstruction::CreateTokenIfMissing
                    .try_to_vec()
                    .unwrap(),
            }],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );
        let result = send_transaction(&mut context, transaction).await;

        // Then we expect a custom program error.
        assert_matches!(
            result.unwrap_err().unwrap(),
            TransactionError::InstructionError(0, Custom(0))
        );
    }

    #[tokio::test]
    async fn test_it_fail_if_we_provide_the_wrong_token_program() {
        // Given a mint/owner pair.
        let mut context = program_test().start_with_context().await;
        let mint = Keypair::new();
        let owner = Keypair::new();
        let new_token = get_associated_token_address(&owner.pubkey(), &mint.pubkey());

        // And a fake token program.
        let fake_token_program = Keypair::new().pubkey();

        // When we try to create a token account if missing.
        let transaction = Transaction::new_signed_with_payer(
            &[Instruction {
                program_id: mpl_token_extras::id(),
                accounts: vec![
                    AccountMeta::new(context.payer.pubkey(), true),
                    AccountMeta::new_readonly(new_token, false),
                    AccountMeta::new_readonly(mint.pubkey(), false),
                    AccountMeta::new_readonly(owner.pubkey(), false),
                    AccountMeta::new(new_token, false),
                    AccountMeta::new_readonly(system_program::id(), false),
                    AccountMeta::new_readonly(fake_token_program, false),
                    AccountMeta::new_readonly(spl_associated_token_account::id(), false),
                ],
                data: TokenExtrasInstruction::CreateTokenIfMissing
                    .try_to_vec()
                    .unwrap(),
            }],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );
        let result = send_transaction(&mut context, transaction).await;

        // Then we expect a custom program error.
        assert_matches!(
            result.unwrap_err().unwrap(),
            TransactionError::InstructionError(0, Custom(1))
        );
    }

    #[tokio::test]
    async fn test_it_fail_if_we_provide_the_wrong_ata_program() {
        // Given a mint/owner pair.
        let mut context = program_test().start_with_context().await;
        let mint = Keypair::new();
        let owner = Keypair::new();
        let new_token = get_associated_token_address(&owner.pubkey(), &mint.pubkey());

        // And a fake ata program.
        let fake_ata_program = Keypair::new().pubkey();

        // When we try to create a token account if missing.
        let transaction = Transaction::new_signed_with_payer(
            &[Instruction {
                program_id: mpl_token_extras::id(),
                accounts: vec![
                    AccountMeta::new(context.payer.pubkey(), true),
                    AccountMeta::new_readonly(new_token, false),
                    AccountMeta::new_readonly(mint.pubkey(), false),
                    AccountMeta::new_readonly(owner.pubkey(), false),
                    AccountMeta::new(new_token, false),
                    AccountMeta::new_readonly(system_program::id(), false),
                    AccountMeta::new_readonly(spl_token::id(), false),
                    AccountMeta::new_readonly(fake_ata_program, false),
                ],
                data: TokenExtrasInstruction::CreateTokenIfMissing
                    .try_to_vec()
                    .unwrap(),
            }],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );
        let result = send_transaction(&mut context, transaction).await;

        // Then we expect a custom program error.
        assert_matches!(
            result.unwrap_err().unwrap(),
            TransactionError::InstructionError(0, Custom(2))
        );
    }

    #[tokio::test]
    async fn test_it_fail_if_the_ata_account_does_not_match_the_mint_and_owner() {
        // Given a mint/owner pair with a wrong ata account.
        let mut context = program_test().start_with_context().await;
        let mint = Keypair::new();
        let owner = Keypair::new();
        let wrong_ata_token = Keypair::new();

        // When we try to call the "CreateTokenIfMissing" instruction.
        let transaction = Transaction::new_signed_with_payer(
            &[create_token_if_missing_instruction(
                &context.payer.pubkey(),
                &wrong_ata_token.pubkey(),
                &mint.pubkey(),
                &owner.pubkey(),
                &wrong_ata_token.pubkey(),
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );
        let result = send_transaction(&mut context, transaction).await;

        // Then we expect a custom program error.
        assert_matches!(
            result.unwrap_err().unwrap(),
            TransactionError::InstructionError(0, Custom(3))
        );
    }

    #[tokio::test]
    async fn test_it_fail_if_the_existing_token_account_is_not_owned_by_the_token_program() {
        // Given a mint/owner pair.
        let mut context = program_test().start_with_context().await;
        let mint = Keypair::new();
        let owner = Keypair::new();
        let ata_token = get_associated_token_address(&owner.pubkey(), &mint.pubkey());

        // And a token account owned by the wrong program.
        let wrong_token = Keypair::new();
        create_mint(&mut context, &mint, &Keypair::new().pubkey(), None)
            .await
            .unwrap();
        create_token(&mut context, &wrong_token, &mint.pubkey(), &owner.pubkey())
            .await
            .unwrap();
        let wrong_token_account = get_account(&mut context, &wrong_token.pubkey()).await;
        context.set_account(
            &wrong_token.pubkey(),
            &AccountSharedData::from(Account {
                owner: system_program::id(),
                ..wrong_token_account
            }),
        );

        // When we try to call the "CreateTokenIfMissing" instruction.
        let transaction = Transaction::new_signed_with_payer(
            &[create_token_if_missing_instruction(
                &context.payer.pubkey(),
                &wrong_token.pubkey(),
                &mint.pubkey(),
                &owner.pubkey(),
                &ata_token,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );
        let result = send_transaction(&mut context, transaction).await;

        // Then we expect a custom program error.
        assert_matches!(
            result.unwrap_err().unwrap(),
            TransactionError::InstructionError(0, Custom(4))
        );
    }

    #[tokio::test]
    async fn test_it_fail_if_the_existing_token_account_is_not_associated_with_the_given_mint() {
        // Given a mint/owner pair.
        let mut context = program_test().start_with_context().await;
        let mint = Keypair::new();
        let owner = Keypair::new();
        let ata_token = get_associated_token_address(&owner.pubkey(), &mint.pubkey());

        // And a token account associated with the wrong mint.
        let wrong_mint = Keypair::new();
        let wrong_token = Keypair::new();
        create_mint(&mut context, &wrong_mint, &Keypair::new().pubkey(), None)
            .await
            .unwrap();
        create_token(
            &mut context,
            &wrong_token,
            &wrong_mint.pubkey(),
            &owner.pubkey(),
        )
        .await
        .unwrap();

        // When we try to call the "CreateTokenIfMissing" instruction.
        let transaction = Transaction::new_signed_with_payer(
            &[create_token_if_missing_instruction(
                &context.payer.pubkey(),
                &wrong_token.pubkey(),
                &mint.pubkey(),
                &owner.pubkey(),
                &ata_token,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );
        let result = send_transaction(&mut context, transaction).await;

        // Then we expect a custom program error.
        assert_matches!(
            result.unwrap_err().unwrap(),
            TransactionError::InstructionError(0, Custom(5))
        );
    }

    #[tokio::test]
    async fn test_it_fail_if_the_existing_token_account_is_not_associated_with_the_given_owner() {
        // Given a mint/owner pair.
        let mut context = program_test().start_with_context().await;
        let mint = Keypair::new();
        let owner = Keypair::new();
        let ata_token = get_associated_token_address(&owner.pubkey(), &mint.pubkey());

        // And a token account associated with the wrong owner.
        let wrong_owner = Keypair::new();
        let wrong_token = Keypair::new();
        create_mint(&mut context, &mint, &Keypair::new().pubkey(), None)
            .await
            .unwrap();
        create_token(
            &mut context,
            &wrong_token,
            &mint.pubkey(),
            &wrong_owner.pubkey(),
        )
        .await
        .unwrap();

        // When we try to call the "CreateTokenIfMissing" instruction.
        let transaction = Transaction::new_signed_with_payer(
            &[create_token_if_missing_instruction(
                &context.payer.pubkey(),
                &wrong_token.pubkey(),
                &mint.pubkey(),
                &owner.pubkey(),
                &ata_token,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );
        let result = send_transaction(&mut context, transaction).await;

        // Then we expect a custom program error.
        assert_matches!(
            result.unwrap_err().unwrap(),
            TransactionError::InstructionError(0, Custom(6))
        );
    }

    #[tokio::test]
    async fn test_it_fail_if_the_non_existing_token_account_is_not_an_ata_account() {
        // Given a mint/owner pair.
        let mut context = program_test().start_with_context().await;
        let mint = Keypair::new();
        let owner = Keypair::new();
        let ata_token = get_associated_token_address(&owner.pubkey(), &mint.pubkey());

        // And a missing token that is not the associated token account.
        let missing_token = Keypair::new();

        // When we try to call the "CreateTokenIfMissing" instruction.
        let transaction = Transaction::new_signed_with_payer(
            &[create_token_if_missing_instruction(
                &context.payer.pubkey(),
                &missing_token.pubkey(),
                &mint.pubkey(),
                &owner.pubkey(),
                &ata_token,
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer],
            context.last_blockhash,
        );
        let result = send_transaction(&mut context, transaction).await;

        // Then we expect a custom program error.
        assert_matches!(
            result.unwrap_err().unwrap(),
            TransactionError::InstructionError(0, Custom(7))
        );
    }
}
