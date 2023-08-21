 <h1>
  Metaplex Token Metadata SDK
</h1>
<p>
  Rust library for interacting with <a href="https://github.com/metaplex-foundation/mpl-token-metadata">Token Metadata</a> program.
</p>
<p>
  <a href="https://github.com/metaplex-foundation/mpl-token-metadata/actions/workflows/build-sdk.yml"><img src="https://img.shields.io/github/actions/workflow/status/metaplex-foundation/mpl-token-metadata/main.yml?logo=GitHub" /></a>
  <a href="https://crates.io/crates/mpl-token-metadata"><img src="https://img.shields.io/crates/v/mpl-token-metadata?logo=rust" /></a>
</p>

 ## Getting started

From your project folder:
 ```bash
 cargo add mpl-token-metadata
 ```

 ## Structure

 The client SDK is divided into several modules:

 * `accounts`: structs representing the accounts of the program
 * `errors`: enums representing the program errors
 * `instructions`: structs to facilitate the creation of instructions, instruction arguments and CPI instructions
 * `types`: structs representing types used by the program

## Instruction Builders

One of the main features of the client SDK is to facilitate the creation of instructions. There are two "types" of instruction builders automatically generated – both support passing accounts by name and optional positional accounts.

### _Client_ instruction builders

This are intended to be used by off-chain client code. Each instruction is represented by a corresponding struct – e.g., `CreateV1`:
```rust
pub struct CreateV1 {
    /// Unallocated metadata account with address as pda of ['metadata', program id, mint id]
    pub metadata: solana_program::pubkey::Pubkey,
    /// Unallocated edition account with address as pda of ['metadata', program id, mint, 'edition']
    pub master_edition: Option<solana_program::pubkey::Pubkey>,
    /// Mint of token asset
    pub mint: (solana_program::pubkey::Pubkey, bool),
    /// Mint authority
    pub authority: solana_program::pubkey::Pubkey,
    /// Payer
    pub payer: solana_program::pubkey::Pubkey,
    /// Update authority for the metadata account
    pub update_authority: (solana_program::pubkey::Pubkey, bool),
    /// System program
    pub system_program: solana_program::pubkey::Pubkey,
    /// Instructions sysvar account
    pub sysvar_instructions: solana_program::pubkey::Pubkey,
    /// SPL Token program
    pub spl_token_program: solana_program::pubkey::Pubkey,
}
```

After filling in the instruction account fields, you can use the `instruction(...)` method to generate the corresponding `solana_program::instruction::Instruction`:
```rust
// instruction args
let mut args = CreateV1InstructionArgs::new(
    String::from("pNFT"),
    String::from("http://my.pnft"),
    500,
    None,
    TokenStandard::ProgrammableNonFungible,
);
args.print_supply = Some(PrintSupply::Zero);

// instruction accounts
let create_accounts = CreateV1 {
    metadata,
    master_edition: Some(master_edition),
    ...
};

// creates the instruction
let create_ix = create_accounts.instruction(args);
```

Alternatively, you can use the `CreateV1Builder` to create the appropriate instruction:
```rust
let create_ix = CreateV1Builder::new()
    .metadata(metadata)
    .master_edition(master_edition)
    .mint(mint_pubkey, true)
    .authority(payer_pubkey)
    .payer(payer_pubkey)
    .update_authority(payer_pubkey, true)
    .is_mutable(true)
    .primary_sale_happened(false)
    .name(String::from("pNFT"))
    .uri(String::from("http://my.pnft"))
    .seller_fee_basis_points(500)
    .token_standard(TokenStandard::ProgrammableNonFungible)
    .print_supply(PrintSupply::Zero)
    .build();
```

### _CPI_ instruction builders

These are builders to be used by on-chain code, which will CPI into Token Metadata. Following the same example as above, we have a `CreateV1Cpi` struct:
```rust
pub struct CreateV1Cpi<'a> {
    /// The program to invoke.
    pub __program: &'a solana_program::account_info::AccountInfo<'a>,
    /// Unallocated metadata account with address as pda of ['metadata', program id, mint id]
    pub metadata: &'a solana_program::account_info::AccountInfo<'a>,
    /// Unallocated edition account with address as pda of ['metadata', program id, mint, 'edition']
    pub master_edition: Option<&'a solana_program::account_info::AccountInfo<'a>>,
    /// Mint of token asset
    pub mint: (&'a solana_program::account_info::AccountInfo<'a>, bool),
    /// Mint authority
    pub authority: &'a solana_program::account_info::AccountInfo<'a>,
    /// Payer
    pub payer: &'a solana_program::account_info::AccountInfo<'a>,
    /// Update authority for the metadata account
    pub update_authority: (&'a solana_program::account_info::AccountInfo<'a>, bool),
    /// System program
    pub system_program: &'a solana_program::account_info::AccountInfo<'a>,
    /// Instructions sysvar account
    pub sysvar_instructions: &'a solana_program::account_info::AccountInfo<'a>,
    /// SPL Token program
    pub spl_token_program: &'a solana_program::account_info::AccountInfo<'a>,
    /// The arguments for the instruction.
    pub __args: CreateV1InstructionArgs,
}
```

After filling in the instruction account info and argument fields, you can use the `invoke()` or `invoke_signed(...)` method to perform the CPI:
```rust
// instruction args
let mut args = CreateV1InstructionArgs::new(
    String::from("pNFT"),
    String::from("http://my.pnft"),
    500,
    None,
    TokenStandard::ProgrammableNonFungible,
);
args.print_supply = Some(PrintSupply::Zero);

// instruction accounts
let cpi_create = CreateV1Cpi {
    __program: ctx.accounts.token_metadata_program,
    metadata: ctx.accounts.metadata,
    master_edition: Some(ctx.accounts.master_edition),
    ...
    __args: args,
};

// performs the CPI
cpi_create.invoke()?;
```

You can also use the `CreateV1CpiBuilder` to simplify the process:
```rust
let cpi_create = CreateV1CpiBuilder::new(ctx.accounts.token_metadata_program)
    .metadata(ctx.accounts.metadata)
    .master_edition(ctx.accounts.master_edition)
    .mint(ctx.accounts.mint_pubkey, true)
    .authority(ctx.accounts.payer_pubkey)
    .payer(ctx.accounts.payer_pubkey)
    .update_authority(ctx.accounts.payer_pubkey, true)
    .system_program(ctx.accounts.system_program)
    .sysvar_instructions(ctx.accounts.sysvar_instructions)
    .spl_token_program(ctx.accounts.spl_token_program)
    .is_mutable(true)
    .primary_sale_happened(false)
    .name(String::from("pNFT"))
    .uri(String::from("http://my.pnft"))
    .seller_fee_basis_points(500)
    .token_standard(TokenStandard::ProgrammableNonFungible)
    .print_supply(PrintSupply::Zero)
    .build();
cpi_create.invoke()?;
```

## PDA helpers

Account types (e.g., `Metadata`) have associated functions to find PDA or to create PDA `Pubkey`s:
```rust
impl Metadata {
    pub fn find_pda(mint: Pubkey) -> (solana_program::pubkey::Pubkey, u8) {
        solana_program::pubkey::Pubkey::find_program_address(
            &[
                "metadata".as_bytes(),
                crate::MPL_TOKEN_METADATA_ID.as_ref(),
                mint.as_ref(),
            ],
            &crate::MPL_TOKEN_METADATA_ID,
        )
    }
    pub fn create_pda(
        mint: Pubkey,
        bump: u8,
    ) -> Result<solana_program::pubkey::Pubkey, solana_program::pubkey::PubkeyError> {
        solana_program::pubkey::Pubkey::create_program_address(
            &[
                "metadata".as_bytes(),
                crate::MPL_TOKEN_METADATA_ID.as_ref(),
                mint.as_ref(),
                &[bump],
            ],
            &crate::MPL_TOKEN_METADATA_ID,
        )
    }
}
```
> If a bump seed is known, it is _cheaper_ (in terms of compute units) to use the `create_pda` function, in particular for on-chain code.

 ## Why using a client library (SDK)?

 Using a program crate as a dependency has its caveats. The main one is that you are bound to the same dependencies of that program, which tend to be quite a few. In many cases, this leads to dependency problems when trying to update crate versions. Secondly, the program crate is generated from the program source code, which its main purpose is to offer the functionality of the program, not necessarily a _friendly_ client API.

 Enter an SDK crate: minimal dependencies, useful helpers. By autogenerating a client SDK to include all `accounts`, `types`, `instructions` and `errors` from a program using the IDL, we can significantly reduce the number of dependencies. The autogenerated code can be refined by adding (manually-written) helpers.

 > **Note**
 > Although the SDK crate has 5 dependencies, in practice the only "real" dependency is the `solana-program` crate since the remaining 4 dependencies are also dependencies of the `solana-program`.

 ## Testing

 To run the SDK tests, run the following from the root directory of the repository:
 ```bash
 pnpm install
 ```
 and then:
 ```bash
 pnpm programs:sdk
 ```

 ## Documentation

 The crate documentation can be found [here](https://docs.rs/mpl-token-metadata/latest/mpl_token_metadata/).
