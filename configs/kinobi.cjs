const path = require("path");
const k = require("@metaplex-foundation/kinobi");

// Paths.
const clientDir = path.join(__dirname, "..", "clients");
const idlDir = path.join(__dirname, "..", "idls");

// Instanciate Kinobi.
const kinobi = k.createFromIdls([path.join(idlDir, "mpl_token_metadata.json")]);

// Update Accounts.
const metadataSeeds = [
  k.literalSeed("metadata"),
  k.programSeed(),
  k.variableSeed(
    "mint",
    k.publicKeyTypeNode(),
    "The address of the mint account"
  ),
];
kinobi.update(
  new k.UpdateAccountsVisitor({
    metadata: {
      size: 679,
      seeds: metadataSeeds,
    },
    masterEditionV2: {
      size: 282,
      name: "masterEdition",
      seeds: [...metadataSeeds, k.literalSeed("edition")],
    },
    tokenRecord: {
      size: 80,
      seeds: [
        ...metadataSeeds,
        k.literalSeed("token_record"),
        k.variableSeed(
          "token",
          k.publicKeyTypeNode(),
          "The address of the token account (ata or not)"
        ),
      ],
    },
    metadataDelegateRecord: {
      size: 98,
      seeds: [
        ...metadataSeeds,
        k.variableSeed(
          "delegateRole",
          k.linkTypeNode("metadataDelegateRoleSeed", { importFrom: "hooked" }),
          "The role of the metadata delegate"
        ),
        k.variableSeed(
          "updateAuthority",
          k.publicKeyTypeNode(),
          "The address of the metadata's update authority"
        ),
        k.variableSeed(
          "delegate",
          k.publicKeyTypeNode(),
          "The address of the delegate"
        ),
      ],
    },
    collectionAuthorityRecord: {
      seeds: [
        ...metadataSeeds,
        k.literalSeed("collection_authority"),
        k.variableSeed(
          "collectionAuthority",
          k.publicKeyTypeNode(),
          "The address of the collection authority"
        ),
      ],
    },
    useAuthorityRecord: {
      seeds: [
        ...metadataSeeds,
        k.literalSeed("user"),
        k.variableSeed(
          "useAuthority",
          k.publicKeyTypeNode(),
          "The address of the use authority"
        ),
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
  new k.SetInstructionAccountDefaultValuesVisitor([
    {
      account: "updateAuthority",
      ignoreIfOptional: true,
      ...k.identityDefault(),
    },
    {
      account: "metadata",
      ignoreIfOptional: true,
      ...k.pdaDefault("metadata"),
    },
    {
      account: "tokenRecord",
      ignoreIfOptional: true,
      ...k.pdaDefault("tokenRecord"),
    },
    {
      account: /^edition|masterEdition$/,
      ignoreIfOptional: true,
      ...k.pdaDefault("masterEdition"),
    },
  ])
);

// Update Instructions.
kinobi.update(
  new k.UpdateInstructionsVisitor({
    Create: {
      bytesCreatedOnChain: k.bytesFromNumber(
        82 + // Mint account.
          679 + // Metadata account.
          282 + // Master edition account.
          128 * 3, // 3 account headers.
        { includeHeader: false }
      ),
      accounts: {
        mint: { isSigner: "either" },
        updateAuthority: {
          isSigner: "either",
          defaultsTo: k.accountDefault("authority"),
        },
      },
    },
    Mint: {
      bytesCreatedOnChain: k.bytesFromNumber(
        165 + // Token account.
          47 + // Token Record account.
          128 * 2, // 2 account headers.
        { includeHeader: false }
      ),
    },
    updateMetadataAccount: {
      args: { updateAuthority: { name: "newUpdateAuthority" } },
    },
    updateMetadataAccountV2: {
      args: { updateAuthority: { name: "newUpdateAuthority" } },
    },
    // Deprecated instructions.
    "mplTokenMetadata.deprecatedCreateReservationList": { delete: true },
    "mplTokenMetadata.deprecatedSetReservationList": { delete: true },
  })
);

// Set account discriminators.
const key = (name) => ({
  field: "key",
  value: k.vEnum("Key", name),
});
kinobi.update(
  new k.SetAccountDiscriminatorFromFieldVisitor({
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
  new k.SetNumberWrappersVisitor({
    "AssetData.sellerFeeBasisPoints": {
      kind: "Amount",
      identifier: "%",
      decimals: 2,
    },
  })
);

// Set struct default values.
kinobi.update(
  new k.SetStructDefaultValuesVisitor({
    assetData: {
      symbol: k.vScalar(""),
      isMutable: k.vScalar(true),
      primarySaleHappened: k.vScalar(false),
      collection: k.vNone(),
      uses: k.vNone(),
      collectionDetails: k.vNone(),
      ruleSet: k.vNone(),
    },
    "createArgs.V1": {
      decimals: k.vNone(),
      printSupply: k.vNone(),
    },
    "updateArgs.V1": {
      newUpdateAuthority: k.vNone(),
      data: k.vNone(),
      primarySaleHappened: k.vNone(),
      isMutable: k.vNone(),
      collection: k.vEnum("CollectionToggle", "None", "empty"),
      collectionDetails: k.vEnum("CollectionDetailsToggle", "None", "empty"),
      uses: k.vEnum("UsesToggle", "None", "empty"),
      ruleSet: k.vEnum("RuleSetToggle", "None", "empty"),
      authorizationData: k.vNone(),
    },
    "mintArgs.V1": {
      authorizationData: k.vNone(),
    },
  })
);

// Unwrap types and structs.
kinobi.update(new k.UnwrapDefinedTypesVisitor(["Data", "AssetData"]));
kinobi.update(
  new k.FlattenStructVisitor({
    Metadata: ["data"],
    CreateMetadataAccountInstructionArgs: ["data"],
    "CreateArgs.V1": ["assetData"],
  })
);

// Create versioned instructions.
kinobi.update(
  new k.CreateSubInstructionsFromEnumArgsVisitor({
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
    defaultsTo: k.pdaDefault("metadata", {
      seeds: { mint: k.accountDefault("collectionMint") },
    }),
  },
  collectionMasterEdition: {
    defaultsTo: k.pdaDefault("masterEdition", {
      seeds: { mint: k.accountDefault("collectionMint") },
    }),
  },
};
kinobi.update(
  new k.UpdateInstructionsVisitor({
    createV1: {
      bytesCreatedOnChain: k.bytesFromResolver("resolveCreateV1Bytes"),
      accounts: {
        masterEdition: {
          defaultsTo: k.resolverDefault("resolveMasterEdition", [
            k.dependsOnAccount("mint"),
            k.dependsOnArg("tokenStandard"),
          ]),
        },
      },
      args: {
        isCollection: {
          type: k.boolTypeNode(),
          defaultsTo: k.valueDefault(k.vScalar(false)),
        },
        tokenStandard: {
          defaultsTo: k.valueDefault(k.vEnum("TokenStandard", "NonFungible")),
        },
        collectionDetails: {
          defaultsTo: k.resolverDefault("resolveCollectionDetails", [
            k.dependsOnArg("isCollection"),
          ]),
        },
        decimals: {
          defaultsTo: k.resolverDefault("resolveDecimals", [
            k.dependsOnArg("tokenStandard"),
          ]),
        },
        printSupply: {
          defaultsTo: k.resolverDefault("resolvePrintSupply", [
            k.dependsOnArg("tokenStandard"),
          ]),
        },
        creators: {
          defaultsTo: k.resolverDefault("resolveCreators", [
            k.dependsOnAccount("authority"),
          ]),
        },
      },
    },
    mintV1: {
      accounts: {
        masterEdition: {
          defaultsTo: k.resolverDefault("resolveMasterEdition", [
            k.dependsOnAccount("mint"),
            k.dependsOnArg("tokenStandard"),
          ]),
        },
        tokenOwner: {
          defaultsTo: k.resolverDefault("resolveMintTokenOwner", []),
        },
        token: {
          defaultsTo: k.pdaDefault("associatedToken", {
            importFrom: "mplEssentials",
            seeds: {
              mint: k.accountDefault("mint"),
              owner: k.accountDefault("tokenOwner"),
            },
          }),
        },
        tokenRecord: {
          defaultsTo: k.resolverDefault("resolveTokenRecord", [
            k.dependsOnAccount("mint"),
            k.dependsOnAccount("token"),
            k.dependsOnArg("tokenStandard"),
          ]),
        },
      },
      args: {
        tokenStandard: { type: k.linkTypeNode("tokenStandard") },
      },
    },
    verifyCollectionV1: { accounts: { ...collectionMintDefaults } },
    unverifyCollectionV1: { accounts: { ...collectionMintDefaults } },
  })
);

// Render JavaScript.
const jsDir = path.join(clientDir, "js", "src", "generated");
const prettier = require(path.join(clientDir, "js", ".prettierrc.json"));
kinobi.accept(new k.RenderJavaScriptVisitor(jsDir, { prettier }));
