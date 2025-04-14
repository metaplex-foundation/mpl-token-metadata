use arch_program::{account::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey};

use crate::{
    error::MetadataError,
    processor::all_accounts,
    utils::{
        fee::{levy, set_fee_flag, LevyArgs},
        process_mint_new_edition_from_master_edition_via_token_logic,
        MintNewEditionFromMasterEditionViaTokenLogicArgs, SPL_TOKEN_ID,
    },
};

pub fn process_mint_new_edition_from_master_edition_via_token<'a>(
    program_id: &'a Pubkey,
    accounts: &'a [AccountInfo<'a>],
    edition: u64,
) -> ProgramResult {
    all_accounts!(
        accounts,
        new_metadata_account,
        new_edition_account,
        master_edition_account,
        mint_info,
        edition_marker_info,
        mint_authority_info,
        payer_account,
        owner_account,
        token_account,
        update_authority_info,
        master_metadata_account,
        token_program_account,
        system_account
    );

    // only support SPL tokens
    if *token_program_account.key != SPL_TOKEN_ID {
        return Err(MetadataError::InvalidTokenProgram.into());
    }

    // Levy fees first, to fund the metadata account with rent + fee amount.
    levy(LevyArgs {
        payer_account,
        token_metadata_pda_info: new_metadata_account,
    })?;

    process_mint_new_edition_from_master_edition_via_token_logic(
        program_id,
        MintNewEditionFromMasterEditionViaTokenLogicArgs {
            new_metadata_account,
            new_edition_account,
            master_edition_account,
            mint_info,
            edition_marker_info,
            mint_authority_info,
            payer_account,
            owner_account,
            token_account,
            update_authority_info,
            master_metadata_account,
            token_program_account,
            system_account,
            holder_delegate_record_info: None,
            delegate_info: None,
        },
        edition,
    )?;

    // Set fee flag after metadata account is created.
    set_fee_flag(new_metadata_account)
}
