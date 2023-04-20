const path = require("path");
const {
  Kinobi,
  CreateSubInstructionsFromEnumArgsVisitor,
  RenderJavaScriptVisitor,
  SetAccountDiscriminatorFromFieldVisitor,
  SetInstructionAccountDefaultValuesVisitor,
  SetNumberWrappersVisitor,
  SetStructDefaultValuesVisitor,
  TypePublicKeyNode,
  TypeDefinedLinkNode,
  FlattenStructVisitor,
  UnwrapDefinedTypesVisitor,
  UpdateAccountsVisitor,
  UpdateInstructionsVisitor,
  vScalar,
  vNone,
  vEnum,
  AutoSetAccountGpaFieldsVisitor,
  TypeStructNode,
  TypeStructFieldNode,
  TypeBoolNode,
} = require("@metaplex-foundation/kinobi");

// Paths.
const clientDir = path.join(__dirname, "..", "clients");
const idlDir = path.join(__dirname, "..", "idls");

// Instanciate Kinobi.
const kinobi = new Kinobi([path.join(idlDir, "mpl_token_metadata.json")]);

// Update Accounts.
const metadataSeeds = [
  { kind: "literal", value: "metadata" },
  { kind: "programId" },
  {
    kind: "variable",
    name: "mint",
    description: "The address of the mint account",
    type: new TypePublicKeyNode(),
  },
];
kinobi.update(
  new UpdateAccountsVisitor({
    metadata: {
      size: 679,
      seeds: metadataSeeds,
    },
    masterEditionV2: {
      size: 282,
      name: "masterEdition",
      seeds: [...metadataSeeds, { kind: "literal", value: "edition" }],
    },
    tokenRecord: {
      size: 80,
      seeds: [
        ...metadataSeeds,
        { kind: "literal", value: "token_record" },
        {
          kind: "variable",
          name: "token",
          description: "The address of the token account (ata or not)",
          type: new TypePublicKeyNode(),
        },
      ],
    },
    metadataDelegateRecord: {
      size: 98,
      seeds: [
        ...metadataSeeds,
        {
          kind: "variable",
          name: "delegateRole",
          description: "The role of the metadata delegate",
          type: new TypeDefinedLinkNode("metadataDelegateRoleSeed", {
            dependency: "hooked",
          }),
        },
        {
          kind: "variable",
          name: "updateAuthority",
          description: "The address of the metadata's update authority",
          type: new TypePublicKeyNode(),
        },
        {
          kind: "variable",
          name: "delegate",
          description: "The address of delegate authority",
          type: new TypePublicKeyNode(),
        },
      ],
    },
    collectionAuthorityRecord: {
      seeds: [
        ...metadataSeeds,
        { kind: "literal", value: "collection_authority" },
        {
          kind: "variable",
          name: "collectionAuthority",
          description: "The address of the collection authority",
          type: new TypePublicKeyNode(),
        },
      ],
    },
    useAuthorityRecord: {
      seeds: [
        ...metadataSeeds,
        { kind: "literal", value: "user" },
        {
          kind: "variable",
          name: "useAuthority",
          description: "The address of the use authority",
          type: new TypePublicKeyNode(),
        },
      ],
    },
    // Deprecated nodes.
    "mplTokenMetadata.ReservationListV1": { delete: true },
    "mplTokenMetadata.ReservationListV2": { delete: true },
    "mplTokenMetadata.MasterEditionV1": { delete: true },
  })
);

// Set default values for instruction accounts.
kinobi.update(
  new SetInstructionAccountDefaultValuesVisitor([
    { account: "updateAuthority", kind: "identity", ignoreIfOptional: true },
    { account: "metadata", kind: "pda", ignoreIfOptional: true },
    { account: "tokenRecord", kind: "pda", ignoreIfOptional: true },
    {
      account: /^edition|masterEdition$/,
      kind: "pda",
      pdaAccount: "masterEdition",
      ignoreIfOptional: true,
    },
  ])
);

// Update Instructions.
kinobi.update(
  new UpdateInstructionsVisitor({
    Create: {
      bytesCreatedOnChain: {
        kind: "number",
        includeHeader: false,
        value:
          82 + // Mint account.
          679 + // Metadata account.
          282 + // Master edition account.
          128 * 3, // 3 account headers.
      },
      accounts: {
        mint: { isSigner: "either" },
        updateAuthority: {
          isSigner: "either",
          defaultsTo: { kind: "account", name: "authority" },
        },
      },
    },
    Mint: {
      bytesCreatedOnChain: {
        kind: "number",
        includeHeader: false,
        value:
          165 + // Token account.
          47 + // Token Record account.
          128 * 2, // 2 account headers.
      },
    },
    updateMetadataAccount: {
      args: { updateAuthority: "newUpdateAuthority" },
    },
    updateMetadataAccountV2: {
      args: { updateAuthority: "newUpdateAuthority" },
    },
    // Deprecated instructions.
    "mplTokenMetadata.deprecatedCreateReservationList": { delete: true },
    "mplTokenMetadata.deprecatedSetReservationList": { delete: true },
  })
);

// Set account discriminators.
const key = (name) => ({
  field: "key",
  value: vEnum("Key", name),
});
kinobi.update(
  new SetAccountDiscriminatorFromFieldVisitor({
    Edition: key("EditionV1"),
    Metadata: key("MetadataV1"),
    MasterEdition: key("MasterEditionV2"),
    EditionMarker: key("EditionMarker"),
    UseAuthorityRecord: key("UseAuthorityRecord"),
    CollectionAuthorityRecord: key("CollectionAuthorityRecord"),
    TokenOwnedEscrow: key("TokenOwnedEscrow"),
    TokenRecord: key("TokenRecord"),
    MetadataDelegate: key("MetadataDelegate"),
  })
);

// Wrap leaves.
kinobi.update(
  new SetNumberWrappersVisitor({
    "AssetData.sellerFeeBasisPoints": {
      kind: "Amount",
      identifier: "%",
      decimals: 2,
    },
  })
);

// Set struct default values.
kinobi.update(
  new SetStructDefaultValuesVisitor({
    assetData: {
      symbol: vScalar(""),
      isMutable: vScalar(true),
      primarySaleHappened: vScalar(false),
      collection: vNone(),
      uses: vNone(),
      collectionDetails: vNone(),
      ruleSet: vNone(),
    },
    "createArgs.V1": {
      decimals: vNone(),
      printSupply: vNone(),
    },
    "updateArgs.V1": {
      newUpdateAuthority: vNone(),
      data: vNone(),
      primarySaleHappened: vNone(),
      isMutable: vNone(),
      collection: vEnum("CollectionToggle", "None", "empty"),
      collectionDetails: vEnum("CollectionDetailsToggle", "None", "empty"),
      uses: vEnum("UsesToggle", "None", "empty"),
      ruleSet: vEnum("RuleSetToggle", "None", "empty"),
      authorizationData: vNone(),
    },
    "mintArgs.V1": {
      authorizationData: vNone(),
    },
  })
);

// Unwrap types and structs.
kinobi.update(new UnwrapDefinedTypesVisitor(["Data", "AssetData"]));
kinobi.update(
  new FlattenStructVisitor({
    Metadata: ["data"],
    CreateMetadataAccountInstructionArgs: ["data"],
    "CreateArgs.V1": ["assetData"],
  })
);

// Create versioned instructions.
kinobi.update(
  new CreateSubInstructionsFromEnumArgsVisitor({
    burn: "burnArgs",
    create: "createArgs",
    delegate: "delegateArgs",
    lock: "lockArgs",
    migrate: "migrateArgs",
    mint: "mintArgs",
    print: "printArgs",
    revoke: "revokeArgs",
    transfer: "transferArgs",
    unlock: "unlockArgs",
    update: "updateArgs",
    use: "useArgs",
    verify: "verificationArgs",
    unverify: "verificationArgs",
  })
);

// Update versioned instructions.
const collectionMintDefaults = {
  collectionMint: { isOptional: false, defaultsTo: null },
  collectionMetadata: {
    defaultsTo: {
      kind: "pda",
      pdaAccount: "metadata",
      seeds: { mint: { kind: "account", name: "collectionMint" } },
    },
  },
  collectionMasterEdition: {
    defaultsTo: {
      kind: "pda",
      pdaAccount: "masterEdition",
      seeds: { mint: { kind: "account", name: "collectionMint" } },
    },
  },
};
kinobi.update(
  new UpdateInstructionsVisitor({
    createV1: {
      bytesCreatedOnChain: {
        kind: "resolver",
        name: "resolveCreateV1Bytes",
        dependency: "hooked",
      },
      accounts: {
        masterEdition: {
          defaultsTo: {
            kind: "resolver",
            name: "resolveMasterEdition",
            dependency: "hooked",
            resolvedIsSigner: false,
            resolvedIsOptional: false,
            dependsOn: [
              { kind: "account", name: "mint" },
              { kind: "arg", name: "tokenStandard" },
            ],
          },
        },
      },
      extraArgs: new TypeStructNode("CreateExtraArgs", [
        new TypeStructFieldNode(
          { name: "isCollection", docs: [], defaultsTo: null },
          new TypeBoolNode()
        ),
      ]),
      argDefaults: {
        tokenStandard: {
          kind: "value",
          value: vEnum("TokenStandard", "NonFungible"),
        },
        isCollection: { kind: "value", value: vScalar(false) },
        collectionDetails: {
          kind: "resolver",
          name: "resolveCollectionDetails",
          dependsOn: [{ kind: "arg", name: "isCollection" }],
          dependency: "hooked",
        },
        decimals: {
          kind: "resolver",
          name: "resolveDecimals",
          dependsOn: [{ kind: "arg", name: "tokenStandard" }],
          dependency: "hooked",
        },
        printSupply: {
          kind: "resolver",
          name: "resolvePrintSupply",
          dependsOn: [{ kind: "arg", name: "tokenStandard" }],
          dependency: "hooked",
        },
        creators: {
          kind: "resolver",
          name: "resolveCreators",
          dependsOn: [{ kind: "account", name: "authority" }],
          dependency: "hooked",
        },
      },
    },
    mintV1: {
      accounts: {
        masterEdition: {
          defaultsTo: {
            kind: "resolver",
            name: "resolveMasterEdition",
            dependency: "hooked",
            resolvedIsSigner: false,
            resolvedIsOptional: false,
            dependsOn: [
              { kind: "account", name: "mint" },
              { kind: "arg", name: "tokenStandard" },
            ],
          },
        },
        tokenOwner: {
          defaultsTo: {
            kind: "resolver",
            name: "resolveMintTokenOwner",
            dependency: "hooked",
            resolvedIsSigner: false,
            resolvedIsOptional: false,
            dependsOn: [],
          },
        },
        token: {
          defaultsTo: {
            kind: "pda",
            pdaAccount: "associatedToken",
            dependency: "mplEssentials",
            seeds: {
              mint: { kind: "account", name: "mint" },
              owner: { kind: "account", name: "tokenOwner" },
            },
          },
        },
        tokenRecord: {
          defaultsTo: {
            kind: "resolver",
            name: "resolveTokenRecord",
            dependency: "hooked",
            resolvedIsSigner: false,
            resolvedIsOptional: false,
            dependsOn: [
              { kind: "account", name: "mint" },
              { kind: "account", name: "token" },
              { kind: "arg", name: "tokenStandard" },
            ],
          },
        },
      },
      extraArgs: new TypeStructNode("CreateExtraArgs", [
        new TypeStructFieldNode(
          { name: "tokenStandard", docs: [], defaultsTo: null },
          new TypeDefinedLinkNode("tokenStandard")
        ),
      ]),
    },
    verifyCollectionV1: { accounts: { ...collectionMintDefaults } },
    unverifyCollectionV1: { accounts: { ...collectionMintDefaults } },
  })
);

// Reset the gpaFields.
kinobi.update(new AutoSetAccountGpaFieldsVisitor({ override: true }));

// Render JavaScript.
const jsDir = path.join(clientDir, "js", "src", "generated");
const prettier = require(path.join(clientDir, "js", ".prettierrc.json"));
kinobi.accept(new RenderJavaScriptVisitor(jsDir, { prettier }));
