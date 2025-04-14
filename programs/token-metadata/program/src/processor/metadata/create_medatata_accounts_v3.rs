use arch_program::{account::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey};

use crate::{
    processor::all_accounts,
    state::{CollectionDetails, DataV2},
    utils::{
        fee::{levy, set_fee_flag, LevyArgs},
        process_create_metadata_accounts_logic, CreateMetadataAccountsLogicArgs,
    },
};

pub fn process_create_metadata_accounts_v3<'a>(
    program_id: &'a Pubkey,
    accounts: &'a [AccountInfo<'a>],
    data: DataV2,
    is_mutable: bool,
    collection_details: Option<CollectionDetails>,
) -> ProgramResult {
    all_accounts!(
        accounts,
        metadata_account,
        mint_info,
        mint_authority_info,
        payer_account,
        update_authority_info,
        system_account
    );

    // Levy fees first, to fund the metadata account with rent + fee amount.
    levy(LevyArgs {
        payer_account,
        token_metadata_pda_info: metadata_account,
    })?;

    process_create_metadata_accounts_logic(
        program_id,
        CreateMetadataAccountsLogicArgs {
            metadata_account,
            mint_info,
            mint_authority_info,
            payer_account,
            update_authority_info,
            system_account,
        },
        data,
        false,
        is_mutable,
        false,
        true,
        collection_details,
        None,
        None,
    )?;

    // Set fee flag after metadata account is created.
    set_fee_flag(metadata_account)
}
