use crate::{
    assertions::{assert_owner_in, metadata::assert_holding_amount},
    error::MetadataError,
    instruction::Resize,
    pda::{EDITION, PREFIX},
    state::{
        Edition, Key, MasterEditionV2, Metadata, TokenMetadataAccount, RESIZE_AUTHORITY,
        RESIZE_DESTINATION,
    },
    utils::{
        assert_derivation, assert_owned_by, clean_write_resize_edition,
        clean_write_resize_master_edition, metadata::clean_write_resize_metadata,
    },
};
use mpl_utils::{assert_signer, token::SPL_TOKEN_PROGRAM_IDS};
use solana_program::{account_info::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey};

pub fn process_resize<'a>(
    _program_id: &'a Pubkey,
    accounts: &'a [AccountInfo<'a>],
) -> ProgramResult {
    let ctx = Resize::to_context(accounts)?;

    // Assert signers
    let authority = if let Some(authority) = ctx.accounts.authority_info {
        authority
    } else {
        ctx.accounts.payer_info
    };
    assert_signer(authority)?;

    // Verify destination for when the claim period is over.
    if authority.key == &RESIZE_AUTHORITY && ctx.accounts.payer_info.key != &RESIZE_DESTINATION {
        return Err(MetadataError::InvalidFeeAccount.into());
    }

    // Check that the system program is correct.
    if ctx.accounts.system_program_info.key != &solana_program::system_program::ID {
        return Err(MetadataError::InvalidSystemProgram.into());
    }

    // The edition passed in is a valid Master Edition or Print Edition derivation
    // even if it is empty.
    let edition_info_path = Vec::from([
        PREFIX.as_bytes(),
        crate::ID.as_ref(),
        ctx.accounts.mint_info.key.as_ref(),
        EDITION.as_bytes(),
    ]);
    let _bump = assert_derivation(&crate::ID, ctx.accounts.edition_info, &edition_info_path)?;

    // Deserialize accounts.
    let mut metadata = Metadata::from_account_info(ctx.accounts.metadata_info)?;

    // This has a valid edition and therefore is an NFT.
    if !ctx.accounts.edition_info.data_is_empty() {
        // Assert program ownership.
        // metadata_info ownership checked in assert_holding_amount.
        // mint_info ownership checked in assert_holding_amount.
        // token_info ownership checked in assert_holding_amount.
        // metadata.mint == mint_info.key checked in assert_holding_amount.
        // token_account.mint == mint_info.key checked in assert_holding_amount.
        assert_owned_by(ctx.accounts.edition_info, &crate::ID)?;

        // If the post-claim period authority is not the resize authority, then they must hold the token account for the NFT.
        if authority.key == &RESIZE_AUTHORITY {
            assert_owned_by(ctx.accounts.metadata_info, &crate::ID)?;
            assert_owner_in(ctx.accounts.mint_info, &SPL_TOKEN_PROGRAM_IDS)?;

            if &metadata.mint != ctx.accounts.mint_info.key {
                return Err(MetadataError::MintMismatch.into());
            }
        } else {
            let token_info = if let Some(token_info) = ctx.accounts.token_info {
                token_info
            } else {
                return Err(MetadataError::MissingTokenAccount.into());
            };

            // For NFTs, the owner is the one who can resize the NFT,
            // so we need to check that the authority is the owner of the token account.
            assert_holding_amount(
                &crate::ID,
                authority,
                ctx.accounts.metadata_info,
                &metadata,
                ctx.accounts.mint_info,
                token_info,
                1,
            )?;
        }

        let key = ctx.accounts.edition_info.data.borrow()[0];
        if key == Key::MasterEditionV2 as u8 {
            let mut master_edition = MasterEditionV2::from_account_info(ctx.accounts.edition_info)?;

            clean_write_resize_master_edition(
                &mut master_edition,
                ctx.accounts.edition_info,
                ctx.accounts.payer_info,
                ctx.accounts.system_program_info,
            )?;
        } else if key == Key::EditionV1 as u8 {
            let mut edition = Edition::from_account_info(ctx.accounts.edition_info)?;

            clean_write_resize_edition(
                &mut edition,
                ctx.accounts.edition_info,
                ctx.accounts.payer_info,
                ctx.accounts.system_program_info,
            )?;
        }
    }
    // This must be a fungible token or asset.
    else {
        // Assert program ownership.
        assert_owned_by(ctx.accounts.metadata_info, &crate::ID)?;
        assert_owner_in(ctx.accounts.mint_info, &SPL_TOKEN_PROGRAM_IDS)?;
        // Mint account passed in matches the metadata mint.
        if &metadata.mint != ctx.accounts.mint_info.key {
            return Err(MetadataError::MintMismatch.into());
        }
        // No need to check edition ownership since it is empty for fungibles.

        // For fungibles only the resize authority can resize the asset.
        if authority.key != &RESIZE_AUTHORITY {
            return Err(MetadataError::UpdateAuthorityIncorrect.into());
        }
    }

    // Rewrite the metadata account and resize.
    clean_write_resize_metadata(
        &mut metadata,
        ctx.accounts.metadata_info,
        ctx.accounts.payer_info,
        ctx.accounts.system_program_info,
    )?;

    Ok(())
}
