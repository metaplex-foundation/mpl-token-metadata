#![cfg(feature = "test-bpf")]

pub mod utils;

mod transfer_all_sol {
    use crate::utils::{airdrop, get_balance, program_test, send_transaction};
    use assert_matches::assert_matches;
    use borsh::BorshSerialize;
    use mpl_system_extras::instruction::{transfer_all_sol_instruction, SystemExtrasInstruction};
    use solana_program::instruction::{AccountMeta, Instruction, InstructionError::Custom};
    use solana_program_test::*;
    use solana_sdk::{
        signature::{Keypair, Signer},
        transaction::{Transaction, TransactionError},
    };

    #[tokio::test]
    async fn test_it_transfers_all_lamports_from_a_source_account() {
        // Given a source account with 10 SOL and a destination account with 0 SOL.
        let mut context = program_test().start_with_context().await;
        let source = Keypair::new();
        let destination = Keypair::new();
        airdrop(&mut context, &source.pubkey(), 10_000_000_000).await;

        // When we transfer all the lamports from the source account to the destination account.
        let transaction = Transaction::new_signed_with_payer(
            &[transfer_all_sol_instruction(
                &source.pubkey(),
                &destination.pubkey(),
            )],
            Some(&context.payer.pubkey()),
            &[&context.payer, &source],
            context.last_blockhash,
        );
        send_transaction(&mut context, transaction).await.unwrap();

        // Then the source account now has 0 SOL.
        let source_balance = get_balance(&mut context, &source.pubkey()).await;
        assert_eq!(source_balance, 0);

        // And the destination account now has 10 SOL.
        let destination_balance = get_balance(&mut context, &destination.pubkey()).await;
        assert_eq!(destination_balance, 10_000_000_000);
    }

    #[tokio::test]
    async fn test_it_transfer_all_lamports_minus_transaction_fees_if_source_is_the_fee_payer() {
        // Given a source account with 10 SOL and a destination account with 0 SOL.
        let mut context = program_test().start_with_context().await;
        let source = Keypair::new();
        let destination = Keypair::new();
        airdrop(&mut context, &source.pubkey(), 10_000_000_000).await;

        // When we transfer all the lamports from the source account to the destination account
        // Such as the source account is the transaction fee payer.
        let transaction = Transaction::new_signed_with_payer(
            &[transfer_all_sol_instruction(
                &source.pubkey(),
                &destination.pubkey(),
            )],
            Some(&source.pubkey()),
            &[&source],
            context.last_blockhash,
        );
        send_transaction(&mut context, transaction).await.unwrap();

        // Then the source account now has 0 SOL.
        let source_balance = get_balance(&mut context, &source.pubkey()).await;
        assert_eq!(source_balance, 0);

        // And the destination account now has 10 SOL minus the transaction fees.
        let destination_balance = get_balance(&mut context, &destination.pubkey()).await;
        assert!(destination_balance < 10_000_000_000);
        assert!(destination_balance >= 9_999_000_000);
    }

    #[tokio::test]
    async fn test_it_fail_if_we_provide_the_wrong_system_program() {
        // Given a source account with 10 SOL and a destination account with 0 SOL.
        let mut context = program_test().start_with_context().await;
        let source = Keypair::new();
        let destination = Keypair::new();
        airdrop(&mut context, &source.pubkey(), 10_000_000_000).await;

        // And a fake system program.
        let fake_system_program = Keypair::new().pubkey();

        // When we transfer all the lamports from the source account to the destination account
        let transaction = Transaction::new_signed_with_payer(
            &[Instruction {
                program_id: mpl_system_extras::id(),
                accounts: vec![
                    AccountMeta::new(source.pubkey(), true),
                    AccountMeta::new(destination.pubkey(), false),
                    AccountMeta::new_readonly(fake_system_program, false),
                ],
                data: SystemExtrasInstruction::TransferAllSol
                    .try_to_vec()
                    .unwrap(),
            }],
            Some(&source.pubkey()),
            &[&source],
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
