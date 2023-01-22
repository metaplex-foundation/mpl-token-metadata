#![cfg(feature = "test-bpf")]

pub mod utils;

mod create_account_with_rent {
    use crate::utils::{airdrop, get_account, get_rent, program_test, send_transaction};
    use assert_matches::assert_matches;
    use borsh::BorshSerialize;
    use mpl_system_extras::instruction::{
        create_account_with_rent_instruction, SystemExtrasInstruction,
    };
    use solana_program::instruction::{AccountMeta, Instruction, InstructionError::Custom};
    use solana_program_test::*;
    use solana_sdk::{
        signature::{Keypair, Signer},
        transaction::{Transaction, TransactionError},
    };

    #[tokio::test]
    async fn test_it_creates_an_account_with_minimum_rent_from_given_space() {
        // Given a brand new account keypair.
        let mut context = program_test().start_with_context().await;
        let new_account = Keypair::new();

        // When we create an account with 42 bytes of space, without specifying
        // the lamports, using the "CreateAccountWithRent" instruction.
        let transaction = Transaction::new_signed_with_payer(
            &[create_account_with_rent_instruction(
                &context.payer.pubkey(),
                &new_account.pubkey(),
                42,
                mpl_system_extras::id(),
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer, &new_account],
            context.last_blockhash,
        );
        send_transaction(&mut context, transaction).await.unwrap();

        // Then the right account space was allocated.
        let account = get_account(&mut context, &new_account.pubkey()).await;
        assert_eq!(account.data.len(), 42);

        // And the right amount of lamports was transferred to the new account.
        let rent = get_rent(&mut context).await;
        assert_eq!(account.lamports, rent.minimum_balance(42));

        // And the right program owner was set.
        assert_eq!(account.owner, mpl_system_extras::id());
    }

    #[tokio::test]
    async fn test_creating_an_account_with_rent_debit_lamports_from_the_payer() {
        // Given a brand new account keypair and a payer with 10 SOL.
        let mut context = program_test().start_with_context().await;
        let new_account = Keypair::new();
        let payer = Keypair::new();
        airdrop(&mut context, &payer.pubkey(), 10_000_000_000).await;

        // When we create an account with rent using that payer.
        let transaction = Transaction::new_signed_with_payer(
            &[create_account_with_rent_instruction(
                &payer.pubkey(),
                &new_account.pubkey(),
                42,
                mpl_system_extras::id(),
            )],
            // Note that we let the context payer pay for the transaction fee
            // so that we can assert the exact amount of lamports transferred.
            Some(&context.payer.pubkey()),
            &[&context.payer, &payer, &new_account],
            context.last_blockhash,
        );
        send_transaction(&mut context, transaction).await.unwrap();

        // Then the right amount of lamports was transferred to the new account.
        let rent = get_rent(&mut context).await;
        let rent_lamports = rent.minimum_balance(42);
        let account = get_account(&mut context, &new_account.pubkey()).await;
        assert_eq!(account.lamports, rent_lamports);

        // And the same amount of lamports was debited from the payer.
        let payer_account = get_account(&mut context, &payer.pubkey()).await;
        assert_eq!(payer_account.lamports, 10_000_000_000 - rent_lamports);
    }

    #[tokio::test]
    async fn test_it_cannot_create_an_account_if_the_payer_has_not_enough_lamports() {
        // Given a brand new account keypair and a payer with 0 SOL.
        let mut context = program_test().start_with_context().await;
        let new_account = Keypair::new();
        let payer = Keypair::new();

        // When we try to create an account with rent using that payer.
        let transaction = Transaction::new_signed_with_payer(
            &[create_account_with_rent_instruction(
                &payer.pubkey(),
                &new_account.pubkey(),
                42,
                mpl_system_extras::id(),
            )],
            // Note that we let the context payer pay for the transaction
            // fee so that the transaction can be processed.
            Some(&context.payer.pubkey()),
            &[&context.payer, &payer, &new_account],
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
    async fn test_it_fail_if_we_provide_the_wrong_system_program() {
        // Given a brand new account keypair.
        let mut context = program_test().start_with_context().await;
        let new_account = Keypair::new();

        // And a fake system program.
        let fake_system_program = Keypair::new().pubkey();

        // When we create an account with 42 bytes of space, without specifying
        // the lamports, using the "CreateAccountWithRent" instruction.
        let transaction = Transaction::new_signed_with_payer(
            &[Instruction {
                program_id: mpl_system_extras::id(),
                accounts: vec![
                    AccountMeta::new(context.payer.pubkey(), true),
                    AccountMeta::new(new_account.pubkey(), true),
                    AccountMeta::new_readonly(fake_system_program, false),
                ],
                data: SystemExtrasInstruction::CreateAccountWithRent {
                    space: 42,
                    program_id: mpl_system_extras::id(),
                }
                .try_to_vec()
                .unwrap(),
            }],
            Some(&context.payer.pubkey()),
            &[&context.payer, &new_account],
            context.last_blockhash,
        );
        let result = send_transaction(&mut context, transaction).await;

        // Then we expect a custom program error.
        assert_matches!(
            result.unwrap_err().unwrap(),
            TransactionError::InstructionError(0, Custom(0))
        );
    }
}
