# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Metaplex Token Metadata is a Solana program that attaches additional data to Fungible or Non-Fungible tokens using Program Derived Addresses (PDAs) derived from Mint account addresses.

Program ID: `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`

## Development Commands

### Installation
```bash
pnpm install
```

### Building

**Build the Solana program:**
```bash
pnpm programs:build
```
Program binary outputs to `programs/.bin/`

**Build JS client:**
```bash
cd clients/js && pnpm build
```

**Build Rust client:**
```bash
cd clients/rust && cargo build
```

### Testing

**Run BPF (program) tests:**
```bash
pnpm programs:test
```
This runs tests with default features, `padded`, and `padded resize` feature combinations.

**Run specific program test:**
```bash
pnpm programs:test <test-name>
```

**Run TypeScript client tests:**
```bash
# Terminal 1: Start local validator
pnpm validator

# Terminal 2: Run tests
pnpm clients:js:test
```
Or from `clients/js/`:
```bash
pnpm build && pnpm test
```

**Run Rust client tests:**
```bash
pnpm clients:rust:test
```
Or from `clients/rust/`:
```bash
cargo test-sbf
```

**Run specific JS test:**
```bash
cd clients/js && pnpm test <test-file-pattern>
```

### Code Generation

**Generate IDL from Rust program:**
```bash
pnpm generate:idls
```
Uses Shank to parse Rust program and generate `idls/token_metadata.json`

**Generate client code from IDL:**
```bash
pnpm generate:clients
```
Uses Kinobi to generate TypeScript and Rust client code from the IDL

**Generate both:**
```bash
pnpm generate
```

### Validator Management

**Start local validator:**
```bash
pnpm validator
```
Runs Amman validator with config from `configs/validator.cjs`

**Start validator with debug output:**
```bash
pnpm validator:debug
```

**View validator logs:**
```bash
pnpm validator:logs
```

**Stop validator:**
```bash
pnpm validator:stop
```

## Architecture

### Project Structure

```
programs/token-metadata/
├── program/          # Main Solana program (Rust)
│   └── src/
│       ├── instruction/  # Instruction definitions
│       ├── processor/    # Instruction processors
│       │   ├── metadata/ # Metadata operations
│       │   ├── collection/ # Collection operations
│       │   ├── edition/  # Edition operations
│       │   ├── delegate/ # Delegation operations
│       │   ├── burn/     # Burn operations
│       │   └── ...
│       ├── state/        # Account state definitions
│       ├── assertions/   # Validation logic
│       ├── utils/        # Helper utilities
│       └── pda.rs        # PDA derivation functions
└── macro/            # Procedural macros for the program

clients/
├── js/               # TypeScript/JavaScript client
│   └── src/
│       ├── generated/  # Auto-generated from IDL (DO NOT EDIT)
│       ├── hooked/     # Manual overrides/extensions
│       └── ...
└── rust/             # Rust client SDK
    └── src/
        ├── generated/  # Auto-generated from IDL (DO NOT EDIT)
        ├── hooked/     # Manual overrides/extensions
        └── traits.rs   # Trait implementations

configs/
├── kinobi.cjs       # Client code generation config
├── shank.cjs        # IDL generation config
├── validator.cjs    # Local validator config
└── program-scripts/ # Build and test scripts
```

### Key Program Modules

- **state/**: Defines account structures (Metadata, MasterEdition, Edition, etc.)
- **processor/**: Contains business logic organized by feature:
  - `metadata/`: Create, update, and manage metadata accounts
  - `collection/`: Collection verification and management
  - `edition/`: Master editions and print editions
  - `delegate/`: Token delegation with various permission levels
  - `burn/`: Token burning for different token standards
  - `escrow/`: Escrow account management
  - `verification/`: Creator and collection verification
- **pda.rs**: PDA derivation functions for all account types
- **assertions/**: Validation logic shared across processors

### Code Generation Workflow

The repository uses a two-stage code generation process:

1. **Shank** (`pnpm generate:idls`): Parses Rust program source annotated with `#[derive(ShankInstruction)]` and generates `idls/token_metadata.json`

2. **Kinobi** (`pnpm generate:clients`): Transforms the IDL and generates:
   - TypeScript client in `clients/js/src/generated/`
   - Rust client in `clients/rust/src/generated/`

**IMPORTANT**: Never manually edit files in `generated/` directories. Instead:
- For program changes: Modify the Rust program source and regenerate
- For client customizations: Use the `hooked/` directories or update `configs/kinobi.cjs`

### Program Workspace

The `programs/token-metadata/` directory is a Cargo workspace with two members:
- `program/`: The main Solana program binary
- `macro/`: Procedural macros used by the program

### Client Libraries

Both clients (JS and Rust) follow the same pattern:
- `generated/`: Auto-generated code from IDL
- `hooked/`: Manual code that extends or overrides generated code
- Built on top of Metaplex framework (Umi for JS, native for Rust)

### Testing Strategy

- **BPF tests**: In `programs/token-metadata/program/src/` using Solana program test framework
- **Client tests**: Integration tests in `clients/js/test/` and `clients/rust/tests/`
- Client tests require a running validator with the program deployed
- Program features (`padded`, `resize`) affect account sizes and are tested separately

## Important Notes

- The program uses Solana 1.14.13 - 1.17 range (legacy codebase)
- The Rust client uses Solana 3.0 (newer SDK)
- When modifying instruction parameters or accounts, regenerate clients after updating the program
- The program binary must be rebuilt before running client tests against new changes
- PDA seeds are defined in `configs/kinobi.cjs` for client generation
