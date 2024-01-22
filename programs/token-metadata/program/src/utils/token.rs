use solana_program::{
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack},
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};
use spl_token_2022::{
    extension::{
        immutable_owner::ImmutableOwner,
        metadata_pointer::{self, MetadataPointer},
        mint_close_authority::MintCloseAuthority,
        non_transferable::NonTransferable,
        BaseStateWithExtensions, ExtensionType, StateWithExtensions,
    },
    instruction::initialize_mint_close_authority,
    native_mint::DECIMALS,
    state::{Account, Mint},
};

use crate::{error::MetadataError, state::TokenStandard};

/// List of SPL Token-2022 `Mint` account extension types that are allowed on
/// non-fungible assets.
const NON_FUNGIBLE_MINT_EXTENSIONS: &[ExtensionType] = &[
    ExtensionType::MintCloseAuthority,
    ExtensionType::NonTransferable,
    ExtensionType::MetadataPointer,
];
/// List of SPL Token-2022 `Account` (token) account extension types that are allowed
/// on non-fungible assets.
const NON_FUNGIBLE_TOKEN_EXTENSIONS: &[ExtensionType] = &[
    ExtensionType::ImmutableOwner,
    ExtensionType::NonTransferableAccount,
];

/// Creates a mint account for the given token standard.
///
/// When creating a mint with spl-token-2022, the following extensions are enabled:
///
/// - mint close authority extension enabled and set to the metadata account
/// - metadata pointer extension enabled and set to the metadata account
pub(crate) fn create_mint<'a>(
    mint: &'a AccountInfo<'a>,
    metadata: &'a AccountInfo<'a>,
    authority: &'a AccountInfo<'a>,
    payer: &'a AccountInfo<'a>,
    token_standard: TokenStandard,
    decimals: Option<u8>,
    spl_token_program: &'a AccountInfo<'a>,
) -> ProgramResult {
    let spl_token_2022 = matches!(spl_token_program.key, &spl_token_2022::ID);

    let mint_account_size = if spl_token_2022 {
        ExtensionType::try_calculate_account_len::<Mint>(&[
            ExtensionType::MintCloseAuthority,
            ExtensionType::MetadataPointer,
        ])?
    } else {
        Mint::LEN
    };

    invoke(
        &system_instruction::create_account(
            payer.key,
            mint.key,
            Rent::get()?.minimum_balance(mint_account_size),
            mint_account_size as u64,
            spl_token_program.key,
        ),
        &[payer.clone(), mint.clone()],
    )?;

    if spl_token_2022 {
        let account_infos = vec![mint.clone(), metadata.clone(), spl_token_program.clone()];

        invoke(
            &initialize_mint_close_authority(spl_token_program.key, mint.key, Some(metadata.key))?,
            &account_infos,
        )?;

        invoke(
            &metadata_pointer::instruction::initialize(
                spl_token_program.key,
                mint.key,
                None,
                Some(*metadata.key),
            )?,
            &account_infos,
        )?;
    }

    let decimals = match token_standard {
        // for NonFungible variants, we ignore the argument and
        // always use 0 decimals
        TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible => 0,
        // for Fungile variants, we either use the specified decimals or the default
        // DECIMALS from spl-token
        TokenStandard::FungibleAsset | TokenStandard::Fungible => match decimals {
            Some(decimals) => decimals,
            // if decimals not provided, use the default
            None => DECIMALS,
        },
        _ => {
            return Err(MetadataError::InvalidTokenStandard.into());
        }
    };

    // initializing the mint account
    invoke(
        &spl_token_2022::instruction::initialize_mint2(
            spl_token_program.key,
            mint.key,
            authority.key,
            Some(authority.key),
            decimals,
        )?,
        &[mint.clone(), authority.clone()],
    )
}

/// Validates the mint account for the given token standard.
///
/// For all token standards, the validation consists of checking that the mint:
/// - is initialized
/// - (token-2022) if mint close authority extension enabled, must be set to the metadata account
/// - (token-2022) if metadata pointer extension enabled, must be set to the metadata account
///
/// For non-fungibles assets, the validation consists of checking that the mint:
/// - has no more than 1 supply
/// - has 0 decimals
/// - (token-2022) has no other extensions enabled apart from `ExtensionType::MintCloseAuthority`,
///    `ExtensionType::NonTransferable` and `ExtensionType::MetadataPointer`
///
/// For programmable non-fungibles assets, the validation consists of checking that the mint:
/// - supply is equal to 0
/// - has 0 decimals
/// - (token-2022) has no other extensions enabled apart from `ExtensionType::MintCloseAuthority`,
///   `ExtensionType::NonTransferable` and `ExtensionType::MetadataPointer`
pub(crate) fn validate_mint(
    mint: &AccountInfo,
    metadata: &AccountInfo,
    token_standard: TokenStandard,
) -> Result<Mint, ProgramError> {
    let mint_data = &mint.data.borrow();
    let mint = StateWithExtensions::<Mint>::unpack(mint_data)?;

    if !mint.base.is_initialized() {
        return Err(MetadataError::Uninitialized.into());
    }

    if matches!(
        token_standard,
        TokenStandard::NonFungible | TokenStandard::ProgrammableNonFungible
    ) {
        // validates the mint extensions
        mint.get_extension_types()?
            .iter()
            .try_for_each(|extension_type| {
                if !NON_FUNGIBLE_MINT_EXTENSIONS.contains(extension_type) {
                    msg!("Invalid mint extension: {:?}", extension_type);
                    return Err(MetadataError::InvalidMintExtensionType);
                }
                Ok(())
            })?;
    }

    // For all token standards:
    //
    // 1) if the mint close authority extension is enabled, it must
    //    be set to be the metadata account; and
    if let Ok(extension) = mint.get_extension::<MintCloseAuthority>() {
        let close_authority: Option<Pubkey> = extension.close_authority.into();
        if close_authority.is_none() || close_authority != Some(*metadata.key) {
            return Err(MetadataError::InvalidMintCloseAuthority.into());
        }
    }

    // 2) if the metadata pointer extension is enabled, it must be set
    //    to the metadata account address
    if let Ok(extension) = mint.get_extension::<MetadataPointer>() {
        let authority: Option<Pubkey> = extension.authority.into();
        let metadata_address: Option<Pubkey> = extension.metadata_address.into();

        if authority.is_some() {
            msg!("Metadata pointer extension: authority must be None");
            return Err(MetadataError::InvalidMetadataPointer.into());
        }

        if metadata_address != Some(*metadata.key) {
            msg!("Metadata pointer extension: metadata address mismatch");
            return Err(MetadataError::InvalidMetadataPointer.into());
        }
    }

    Ok(mint.base)
}

/// Validates a token account for the given token standard.
///
/// For non-fungible assets, the validation consists of checking that the token account
/// has not other extension than the `ExtensionType::ImmutableOwner`.
pub(crate) fn validate_token(
    mint: &AccountInfo,
    token: &AccountInfo,
    token_owner: Option<&AccountInfo>,
    spl_token_program: &AccountInfo,
    token_standard: Option<TokenStandard>,
    required_amount: Option<u64>,
) -> Result<Account, ProgramError> {
    if token.owner != spl_token_program.key {
        return Err(MetadataError::IncorrectOwner.into());
    }

    let token_data = &token.data.borrow();
    let token = StateWithExtensions::<Account>::unpack(token_data)?;

    if token.base.mint != *mint.key {
        return Err(MetadataError::MintMismatch.into());
    }

    if let Some(token_owner) = token_owner {
        if token.base.owner != *token_owner.key {
            return Err(MetadataError::IncorrectOwner.into());
        }
    }

    if let Some(amount) = required_amount {
        if token.base.amount != amount {
            return Err(MetadataError::NotEnoughTokens.into());
        }
    }

    if matches!(
        token_standard,
        Some(TokenStandard::NonFungible) | Some(TokenStandard::ProgrammableNonFungible)
    ) {
        // validates the mint extensions
        token
            .get_extension_types()?
            .iter()
            .try_for_each(|extension_type| {
                if !NON_FUNGIBLE_TOKEN_EXTENSIONS.contains(extension_type) {
                    msg!("Invalid token extension: {:?}", extension_type);
                    return Err(MetadataError::InvalidTokenExtensionType);
                }
                Ok(())
            })?;
    }

    let mint_data = &mint.data.borrow();
    let mint = StateWithExtensions::<Mint>::unpack(mint_data)?;

    // if the mint has the NonTransferable extension set, then the token
    // must have the ImmutableOwner extension set
    if let Ok(_extension) = mint.get_extension::<NonTransferable>() {
        if let Err(_err) = token.get_extension::<ImmutableOwner>() {
            return Err(MetadataError::MissingImmutableOwnerExtension.into());
        }
    }

    Ok(token.base)
}
