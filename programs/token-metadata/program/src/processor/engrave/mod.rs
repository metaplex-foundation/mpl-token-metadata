use mpl_engraver::{
    instructions::{EngraveCpi, EngraveCpiAccounts, EngraveInstructionArgs},
    types::EngraveTarget,
};
use mpl_utils::assert_signer;
use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, program_error::ProgramError,
    program_memory::sol_memset, pubkey::Pubkey, sysvar,
};

use crate::{
    error::MetadataError,
    instruction::{Context, Engrave},
    state::{Metadata, TokenMetadataAccount, TokenStandard, EDITION, PREFIX},
    utils::{assert_derivation, assert_owned_by, check_token_standard},
};

pub fn engrave<'a>(program_id: &'a Pubkey, accounts: &'a [AccountInfo<'a>]) -> ProgramResult {
    let context = Engrave::to_context(accounts)?;

    engrave_v1(program_id, context)
}

fn engrave_v1(_program_id: &Pubkey, ctx: Context<Engrave>) -> ProgramResult {
    // Assert signers

    // Only the UA can Engrave a token
    assert_signer(ctx.accounts.update_authority_info)?;

    // Assert program ownership

    assert_owned_by(ctx.accounts.mint_info, &spl_token::ID)?;
    assert_owned_by(ctx.accounts.metadata_info, &crate::ID)?;

    if let Some(edition) = ctx.accounts.edition_info {
        assert_owned_by(edition, &crate::ID)?;
    }

    // Note that we do NOT check the ownership of authorization rules account here as this allows
    // `Update` to be used to correct a previously invalid `RuleSet`.  In practice the ownership of
    // authorization rules is checked by the Auth Rules program each time the program is invoked to
    // validate rules.

    // Check program IDs

    if ctx.accounts.system_program_info.key != &solana_program::system_program::ID {
        return Err(ProgramError::IncorrectProgramId);
    }
    if ctx.accounts.sysvar_instructions_info.key != &sysvar::instructions::ID {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Validate relationships

    // Metadata
    let metadata = Metadata::from_account_info(ctx.accounts.metadata_info)?;
    // Metadata mint must match mint account key.
    if metadata.mint != *ctx.accounts.mint_info.key {
        return Err(MetadataError::MintMismatch.into());
    }

    let _metadata_bump = assert_derivation(
        &crate::ID,
        ctx.accounts.metadata_info,
        &[
            PREFIX.as_bytes(),
            crate::ID.as_ref(),
            ctx.accounts.mint_info.key.as_ref(),
        ],
    )?;

    // Edition
    let edition_bump = if let Some(edition) = ctx.accounts.edition_info {
        // checks that we got the correct edition account
        assert_derivation(
            &crate::ID,
            edition,
            &[
                PREFIX.as_bytes(),
                crate::ID.as_ref(),
                ctx.accounts.mint_info.key.as_ref(),
                EDITION.as_bytes(),
            ],
        )?
    } else {
        0
    };

    // Find existing token standard from metadata or infer it.
    let existing_or_inferred_token_std = if let Some(token_standard) = metadata.token_standard {
        token_standard
    } else {
        check_token_standard(ctx.accounts.mint_info, ctx.accounts.edition_info)?
    };

    let edition_seeds = [
        PREFIX.as_bytes(),
        crate::ID.as_ref(),
        ctx.accounts.mint_info.key.as_ref(),
        EDITION.as_bytes(),
        &[edition_bump],
    ];

    // Check that the edition is passed in if the token standard is NonFungible.
    match ctx.accounts.edition_info {
        Some(edition_info) => {
            if matches!(
                existing_or_inferred_token_std,
                TokenStandard::FungibleAsset | TokenStandard::Fungible
            ) {
                return Err(MetadataError::InvalidMasterEdition.into());
            }

            // Prepare data for EngraveCpi
            let edition_data_vec = {
                let edition_data = edition_info.try_borrow_data()?;
                edition_data.to_vec() // Clone the data for the CPI call
            };

            // Perform operations on edition_info
            {
                let mut edition_data = edition_info.try_borrow_mut_data()?;
                let data_len = edition_data.len();
                sol_memset(*edition_data, 0, data_len);
                edition_info.assign(&mpl_engraver::ID);
                // Note: The mutable borrow ends here
            }

            // Now make the CPI call
            let cpi_engrave_edition = EngraveCpi::new(
                ctx.accounts.engraver_program_info,
                EngraveCpiAccounts {
                    authority: ctx.accounts.update_authority_info,
                    mint: ctx.accounts.mint_info,
                    metadata: ctx.accounts.metadata_info,
                    edition: edition_info, // Now safe to pass as it's not mutably borrowed
                    system_program: ctx.accounts.system_program_info,
                },
                EngraveInstructionArgs {
                    target: EngraveTarget::Edition,
                    data: edition_data_vec,
                },
            );

            cpi_engrave_edition.invoke_signed(&[&edition_seeds])?;

            // Prepare data for EngraveCpi
            let metadata_data_vec = {
                let metadata_data = ctx.accounts.metadata_info.try_borrow_data()?;
                metadata_data.to_vec() // Clone the data for the CPI call
            };

            // Perform operations on ctx.accounts.metadata_info
            {
                let mut metadata_data = ctx.accounts.metadata_info.try_borrow_mut_data()?;
                let data_len = metadata_data.len();
                sol_memset(*metadata_data, 0, data_len);
                ctx.accounts.metadata_info.assign(&mpl_engraver::ID);
                // Note: The mutable borrow ends here
            }

            // Now make the CPI call
            let cpi_engrave_metadata = EngraveCpi::new(
                ctx.accounts.engraver_program_info,
                EngraveCpiAccounts {
                    authority: ctx.accounts.update_authority_info,
                    mint: ctx.accounts.mint_info,
                    metadata: ctx.accounts.metadata_info,
                    edition: edition_info, // Now safe to pass as it's not mutably borrowed
                    system_program: ctx.accounts.system_program_info,
                },
                EngraveInstructionArgs {
                    target: EngraveTarget::Metadata,
                    data: metadata_data_vec,
                },
            );

            cpi_engrave_metadata.invoke_signed(&[&edition_seeds])?;
        }
        None => {
            if matches!(
                existing_or_inferred_token_std,
                TokenStandard::NonFungible
                    | TokenStandard::NonFungibleEdition
                    | TokenStandard::ProgrammableNonFungible
                    | TokenStandard::ProgrammableNonFungibleEdition
            ) {
                return Err(MetadataError::MissingEditionAccount.into());
            }
        }
    }

    Ok(())
}
