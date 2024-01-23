const path = require("path");
const k = require("@metaplex-foundation/kinobi");

// Paths.
const clientDir = path.join(__dirname, "..", "clients");
const idlDir = path.join(__dirname, "..", "idls");

// Instanciate Kinobi.
const kinobi = k.createFromIdls([path.join(idlDir, "token_metadata.json")]);

kinobi.update(
  new k.UpdateProgramsVisitor({
    tokenMetadata: {
      name: "mplTokenMetadata",
    },
  })
);

// Update Accounts.
const metadataSeeds = [
  k.stringConstantSeed("metadata"),
  k.programSeed(),
  k.publicKeySeed("mint", "The address of the mint account"),
];
kinobi.update(
  new k.UpdateAccountsVisitor({
    metadata: {
      size: null,
      seeds: metadataSeeds,
    },
    masterEditionV2: {
      size: null,
      name: "masterEdition",
      seeds: [...metadataSeeds, k.stringConstantSeed("edition")],
    },
    editionMarker: {
      seeds: [
        ...metadataSeeds,
        k.stringConstantSeed("edition"),
        k.stringSeed(
          "editionMarker",
          "The floor of the edition number divided by 248 as a string. I.e. ⌊edition/248⌋."
        ),
      ],
    },
    editionMarkerV2: {
      seeds: [
        ...metadataSeeds,
        k.stringConstantSeed("edition"),
        k.stringConstantSeed("marker"),
      ],
    },
    tokenRecord: {
      size: 80,
      seeds: [
        ...metadataSeeds,
        k.stringConstantSeed("token_record"),
        k.publicKeySeed(
          "token",
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
        k.publicKeySeed(
          "updateAuthority",
          "The address of the metadata's update authority"
        ),
        k.publicKeySeed("delegate", "The address of the delegate authority"),
      ],
    },
    collectionAuthorityRecord: {
      seeds: [
        ...metadataSeeds,
        k.stringConstantSeed("collection_authority"),
        k.publicKeySeed(
          "collectionAuthority",
          "The address of the collection authority"
        ),
      ],
    },
    useAuthorityRecord: {
      seeds: [
        ...metadataSeeds,
        k.stringConstantSeed("user"),
        k.publicKeySeed("useAuthority", "The address of the use authority"),
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
    {
      account: "authorizationRulesProgram",
      ...k.conditionalDefault("account", "authorizationRules", {
        ifTrue: k.programDefault(
          "mplTokenAuthRules",
          "auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg"
        ),
      }),
    },
    {
      account: "splAtaProgram",
      ...k.programDefault(
        "splAssociatedTokenProgram",
        "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
      ),
    },
  ])
);

// Update Instructions.
const ataPdaDefault = (mint = "mint", owner = "owner") =>
  k.pdaDefault("associatedToken", {
    importFrom: "mplToolbox",
    seeds: { mint: k.accountDefault(mint), owner: k.accountDefault(owner) },
  });
kinobi.update(
  new k.UpdateInstructionsVisitor({
    create: {
      bytesCreatedOnChain: k.bytesFromNumber(
        82 + // Mint account.
        679 + // Metadata account.
        282 + // Master edition account.
        128 * 3, // 3 account headers.
        false
      ),
      accounts: {
        mint: { isSigner: "either" },
        updateAuthority: {
          isSigner: "either",
          defaultsTo: k.accountDefault("authority"),
        },
        splTokenProgram: {
          defaultsTo: k.conditionalResolverDefault(
            k.resolverDefault("resolveIsNonFungibleOrIsMintSigner", [
              k.dependsOnAccount("mint"),
              k.dependsOnArg("tokenStandard"),
            ]),
            {
              ifTrue: k.programDefault(
                "splToken",
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
              ),
            }
          ),
        },
      },
    },
    mint: {
      bytesCreatedOnChain: k.bytesFromNumber(
        165 + // Token account.
        47 + // Token Record account.
        128 * 2, // 2 account headers.
        false
      ),
      accounts: {
        masterEdition: {
          defaultsTo: k.conditionalResolverDefault(
            k.resolverDefault("resolveIsNonFungible", [
              k.dependsOnArg("tokenStandard"),
            ]),
            {
              ifTrue: k.pdaDefault("masterEdition", {
                seeds: { mint: k.accountDefault("mint") },
              }),
            }
          ),
        },
        tokenOwner: {
          defaultsTo: k.resolverDefault("resolveOptionalTokenOwner", []),
        },
        token: {
          defaultsTo: ataPdaDefault("mint", "tokenOwner"),
        },
        tokenRecord: {
          defaultsTo: k.conditionalDefault("arg", "tokenStandard", {
            value: k.vEnum("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaDefault("tokenRecord", {
              seeds: {
                mint: k.accountDefault("mint"),
                token: k.accountDefault("token"),
              },
            }),
          }),
        },
      },
      args: {
        tokenStandard: { type: k.linkTypeNode("tokenStandard") },
      },
    },
    transfer: {
      accounts: {
        token: {
          defaultsTo: ataPdaDefault("mint", "tokenOwner"),
        },
        tokenOwner: {
          defaultsTo: k.identityDefault(),
        },
        edition: {
          defaultsTo: k.conditionalDefault("arg", "tokenStandard", {
            value: k.vEnum("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaDefault("masterEdition", {
              seeds: { mint: k.accountDefault("mint") },
            }),
          }),
        },
        ownerTokenRecord: {
          name: "tokenRecord",
          defaultsTo: k.conditionalDefault("arg", "tokenStandard", {
            value: k.vEnum("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaDefault("tokenRecord", {
              seeds: {
                mint: k.accountDefault("mint"),
                token: k.accountDefault("token"),
              },
            }),
          }),
        },
        destination: {
          name: "destinationToken",
          defaultsTo: ataPdaDefault("mint", "destinationOwner"),
        },
        destinationTokenRecord: {
          defaultsTo: k.conditionalDefault("arg", "tokenStandard", {
            value: k.vEnum("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaDefault("tokenRecord", {
              seeds: {
                mint: k.accountDefault("mint"),
                token: k.accountDefault("destinationToken"),
              },
            }),
          }),
        },
      },
      args: {
        tokenStandard: { type: k.linkTypeNode("tokenStandard") },
      },
    },
    delegate: {
      accounts: {
        masterEdition: {
          defaultsTo: k.conditionalResolverDefault(
            k.resolverDefault("resolveIsNonFungible", [
              k.dependsOnArg("tokenStandard"),
            ]),
            {
              ifTrue: k.pdaDefault("masterEdition", {
                seeds: { mint: k.accountDefault("mint") },
              }),
            }
          ),
        },
      },
      args: {
        tokenStandard: {
          type: k.linkTypeNode("tokenStandard"),
        },
      },
    },
    revoke: {
      accounts: {
        masterEdition: {
          defaultsTo: k.conditionalResolverDefault(
            k.resolverDefault("resolveIsNonFungible", [
              k.dependsOnArg("tokenStandard"),
            ]),
            {
              ifTrue: k.pdaDefault("masterEdition", {
                seeds: { mint: k.accountDefault("mint") },
              }),
            }
          ),
        },
      },
      args: {
        tokenStandard: {
          type: k.linkTypeNode("tokenStandard"),
        },
      },
    },
    lock: {
      accounts: {
        tokenOwner: {
          defaultsTo: k.resolverDefault("resolveOptionalTokenOwner", []),
        },
        token: {
          defaultsTo: ataPdaDefault("mint", "tokenOwner"),
        },
        edition: {
          defaultsTo: k.conditionalResolverDefault(
            k.resolverDefault("resolveIsNonFungible", [
              k.dependsOnArg("tokenStandard"),
            ]),
            {
              ifTrue: k.pdaDefault("masterEdition", {
                seeds: { mint: k.accountDefault("mint") },
              }),
            }
          ),
        },
        tokenRecord: {
          defaultsTo: k.conditionalDefault("arg", "tokenStandard", {
            value: k.vEnum("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaDefault("tokenRecord", {
              seeds: {
                mint: k.accountDefault("mint"),
                token: k.accountDefault("token"),
              },
            }),
          }),
        },
        splTokenProgram: {
          defaultsTo: k.conditionalDefault("arg", "tokenStandard", {
            value: k.vEnum("TokenStandard", "ProgrammableNonFungible"),
            ifFalse: k.programDefault(
              "splToken",
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            ),
          }),
        },
      },
      args: {
        tokenStandard: { type: k.linkTypeNode("tokenStandard") },
      },
    },
    unlock: {
      accounts: {
        tokenOwner: {
          defaultsTo: k.resolverDefault("resolveOptionalTokenOwner", []),
        },
        token: {
          defaultsTo: ataPdaDefault("mint", "tokenOwner"),
        },
        edition: {
          defaultsTo: k.conditionalResolverDefault(
            k.resolverDefault("resolveIsNonFungible", [
              k.dependsOnArg("tokenStandard"),
            ]),
            {
              ifTrue: k.pdaDefault("masterEdition", {
                seeds: { mint: k.accountDefault("mint") },
              }),
            }
          ),
        },
        tokenRecord: {
          defaultsTo: k.conditionalDefault("arg", "tokenStandard", {
            value: k.vEnum("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaDefault("tokenRecord", {
              seeds: {
                mint: k.accountDefault("mint"),
                token: k.accountDefault("token"),
              },
            }),
          }),
        },
        splTokenProgram: {
          defaultsTo: k.conditionalDefault("arg", "tokenStandard", {
            value: k.vEnum("TokenStandard", "ProgrammableNonFungible"),
            ifFalse: k.programDefault(
              "splToken",
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            ),
          }),
        },
      },
      args: {
        tokenStandard: { type: k.linkTypeNode("tokenStandard") },
      },
    },
    burn: {
      accounts: {
        token: {
          isOptional: false,
          defaultsTo: k.pdaDefault("associatedToken", {
            importFrom: "mplToolbox",
            seeds: {
              mint: k.accountDefault("mint"),
              owner: k.argDefault("tokenOwner"),
            },
          }),
        },
        edition: {
          defaultsTo: k.conditionalResolverDefault(
            k.resolverDefault("resolveIsNonFungible", [
              k.dependsOnArg("tokenStandard"),
            ]),
            {
              ifTrue: k.pdaDefault("masterEdition", {
                seeds: { mint: k.accountDefault("mint") },
              }),
            }
          ),
        },
        masterEdition: {
          defaultsTo: k.conditionalDefault("account", "masterEditionMint", {
            ifTrue: k.pdaDefault("masterEdition", {
              seeds: { mint: k.accountDefault("masterEditionMint") },
            }),
          }),
        },
        tokenRecord: {
          defaultsTo: k.conditionalDefault("arg", "tokenStandard", {
            value: k.vEnum("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaDefault("tokenRecord", {
              seeds: {
                mint: k.accountDefault("mint"),
                token: k.accountDefault("token"),
              },
            }),
          }),
        },
      },
      args: {
        tokenOwner: {
          type: k.publicKeyTypeNode(),
          defaultsTo: k.identityDefault(),
        },
        tokenStandard: { type: k.linkTypeNode("tokenStandard") },
      },
    },
    updateMetadataAccountV2: {
      args: { updateAuthority: { name: "newUpdateAuthority" } },
    },
    // Deprecated instructions.
    createMetadataAccount: { delete: true },
    createMetadataAccountV2: { delete: true },
    createMasterEdition: { delete: true },
    updateMetadataAccount: { delete: true },
    deprecatedCreateReservationList: { delete: true },
    deprecatedSetReservationList: { delete: true },
    deprecatedCreateMasterEdition: { delete: true },
    deprecatedMintPrintingTokens: { delete: true },
    deprecatedMintPrintingTokensViaToken: { delete: true },
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
    "updateArgs.AsUpdateAuthorityV2": { tokenStandard: k.vNone() },
    "updateArgs.AsAuthorityItemDelegateV2": { tokenStandard: k.vNone() },
  })
);

// Set more struct default values dynamically.
kinobi.update(
  new k.TransformNodesVisitor([
    {
      selector: { kind: "structFieldTypeNode", name: "amount" },
      transformer: (node) => {
        k.assertStructFieldTypeNode(node);
        return k.structFieldTypeNode({
          ...node,
          defaultsTo: { strategy: "optional", value: k.vScalar(1) },
        });
      },
    },
    {
      selector: (node) => {
        const names = [
          "authorizationData",
          "decimals",
          "printSupply",
          "newUpdateAuthority",
          "data",
          "primarySaleHappened",
          "isMutable",
        ];
        return (
          k.isStructFieldTypeNode(node) &&
          k.isOptionTypeNode(node.child) &&
          names.includes(node.name)
        );
      },
      transformer: (node) => {
        k.assertStructFieldTypeNode(node);
        return k.structFieldTypeNode({
          ...node,
          defaultsTo: { strategy: "optional", value: k.vNone() },
        });
      },
    },
    {
      selector: (node) => {
        const toggles = [
          "collectionToggle",
          "collectionDetailsToggle",
          "usesToggle",
          "ruleSetToggle",
        ];
        return (
          k.isStructFieldTypeNode(node) &&
          k.isLinkTypeNode(node.child) &&
          toggles.includes(node.child.name)
        );
      },
      transformer: (node) => {
        k.assertStructFieldTypeNode(node);
        return k.structFieldTypeNode({
          ...node,
          defaultsTo: {
            strategy: "optional",
            value: k.vEnum(node.child.name, "None", "empty"),
          },
        });
      },
    },
  ])
);

// Unwrap types and structs.
kinobi.update(new k.UnwrapDefinedTypesVisitor(["AssetData"]));
kinobi.update(new k.UnwrapTypeDefinedLinksVisitor(["metadata.data"]));
kinobi.update(
  new k.FlattenStructVisitor({
    Metadata: ["data"],
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
const tokenDelegateDefaults = {
  accounts: {
    token: {
      isOptional: false,
      defaultsTo: k.pdaDefault("associatedToken", {
        importFrom: "mplToolbox",
        seeds: {
          mint: k.accountDefault("mint"),
          owner: k.argDefault("tokenOwner"),
        },
      }),
    },
    tokenRecord: {
      defaultsTo: k.conditionalDefault("arg", "tokenStandard", {
        value: k.vEnum("TokenStandard", "ProgrammableNonFungible"),
        ifTrue: k.pdaDefault("tokenRecord", {
          seeds: {
            mint: k.accountDefault("mint"),
            token: k.accountDefault("token"),
          },
        }),
      }),
    },
    delegateRecord: { defaultsTo: k.pdaDefault("tokenRecord") },
    splTokenProgram: {
      defaultsTo: k.programDefault(
        "splToken",
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
      ),
    },
  },
  args: {
    tokenOwner: {
      type: k.publicKeyTypeNode(),
      defaultsTo: k.identityDefault(),
    },
  },
};
const metadataDelegateDefaults = (role) => ({
  accounts: {
    delegateRecord: {
      defaultsTo: k.pdaDefault("metadataDelegateRecord", {
        seeds: {
          mint: k.accountDefault("mint"),
          delegateRole: k.valueDefault(k.vEnum("MetadataDelegateRole", role)),
          updateAuthority: k.argDefault("updateAuthority"),
          delegate: k.accountDefault("delegate"),
        },
      }),
    },
  },
  args: {
    updateAuthority: {
      type: k.publicKeyTypeNode(),
      defaultsTo: k.accountDefault("authority"),
    },
  },
});
const updateAsMetadataDelegateDefaults = (role) => ({
  accounts: {
    delegateRecord: {
      defaultsTo: k.pdaDefault("metadataDelegateRecord", {
        seeds: {
          mint: k.accountDefault("mint"),
          delegateRole: k.valueDefault(k.vEnum("MetadataDelegateRole", role)),
          updateAuthority: k.argDefault("updateAuthority"),
          delegate: k.accountDefault("authority"),
        },
      }),
    },
    token:
      role === "ProgrammableConfigItem"
        ? { isOptional: false, defaultsTo: null }
        : undefined,
  },
  args: {
    updateAuthority: {
      type: k.publicKeyTypeNode(),
      defaultsTo: k.identityDefault(),
    },
  },
});
const updateAsMetadataCollectionDelegateDefaults = (role) => ({
  accounts: {
    delegateRecord: {
      defaultsTo: k.pdaDefault("metadataDelegateRecord", {
        seeds: {
          mint: k.argDefault("delegateMint"),
          delegateRole: k.valueDefault(k.vEnum("MetadataDelegateRole", role)),
          updateAuthority: k.argDefault("delegateUpdateAuthority"),
          delegate: k.accountDefault("authority"),
        },
      }),
    },
    token:
      role === "ProgrammableConfig"
        ? { isOptional: false, defaultsTo: null }
        : undefined,
  },
  args: {
    delegateMint: {
      type: k.publicKeyTypeNode(),
      defaultsTo: k.accountDefault("mint"),
    },
    delegateUpdateAuthority: {
      type: k.publicKeyTypeNode(),
      defaultsTo: k.identityDefault(),
    },
  },
});
const verifyCollectionDefaults = {
  accounts: {
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
  },
};
kinobi.update(
  new k.UpdateInstructionsVisitor({
    createV1: {
      bytesCreatedOnChain: k.bytesFromResolver("resolveCreateV1Bytes"),
      accounts: {
        masterEdition: {
          defaultsTo: k.conditionalResolverDefault(
            k.resolverDefault("resolveIsNonFungible", [
              k.dependsOnArg("tokenStandard"),
            ]),
            {
              ifTrue: k.pdaDefault("masterEdition", {
                seeds: { mint: k.accountDefault("mint") },
              }),
            }
          ),
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
    printV1: {
      accounts: {
        editionMint: { isSigner: "either" },
        editionMintAuthority: {
          defaultsTo: k.accountDefault("masterTokenAccountOwner"),
        },
        masterTokenAccountOwner: { defaultsTo: k.identityDefault() },
        editionTokenAccountOwner: { defaultsTo: k.identityDefault() },
        editionMetadata: {
          defaultsTo: k.pdaDefault("metadata", {
            seeds: { mint: k.accountDefault("editionMint") },
          }),
        },
        edition: {
          defaultsTo: k.pdaDefault("masterEdition", {
            seeds: { mint: k.accountDefault("editionMint") },
          }),
        },
        editionMarkerPda: {
          defaultsTo: k.conditionalDefault("arg", "tokenStandard", {
            value: k.vEnum("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaDefault("editionMarkerV2", {
              seeds: { mint: k.argDefault("masterEditionMint") },
            }),
            ifFalse: k.pdaDefault("editionMarkerFromEditionNumber", {
              importFrom: "hooked",
              seeds: {
                mint: k.argDefault("masterEditionMint"),
                editionNumber: k.argDefault("editionNumber"),
              },
            }),
          }),
        },
        editionTokenAccount: {
          defaultsTo: ataPdaDefault("editionMint", "editionTokenAccountOwner"),
        },
        masterTokenAccount: {
          defaultsTo: k.pdaDefault("associatedToken", {
            importFrom: "mplToolbox",
            seeds: {
              mint: k.argDefault("masterEditionMint"),
              owner: k.accountDefault("masterTokenAccountOwner"),
            },
          }),
        },
        masterMetadata: {
          defaultsTo: k.pdaDefault("metadata", {
            seeds: { mint: k.argDefault("masterEditionMint") },
          }),
        },
        masterEdition: {
          defaultsTo: k.pdaDefault("masterEdition", {
            seeds: { mint: k.argDefault("masterEditionMint") },
          }),
        },
        editionTokenRecord: {
          defaultsTo: k.conditionalDefault("arg", "tokenStandard", {
            value: k.vEnum("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaDefault("tokenRecord", {
              seeds: {
                mint: k.accountDefault("editionMint"),
                token: k.accountDefault("editionTokenAccount"),
              },
            }),
          }),
        },
      },
      args: {
        edition: { name: "editionNumber" },
        masterEditionMint: { type: k.publicKeyTypeNode() },
        tokenStandard: { type: k.linkTypeNode("tokenStandard") },
      },
    },
    // Update.
    updateAsAuthorityItemDelegateV2:
      updateAsMetadataDelegateDefaults("AuthorityItem"),
    updateAsCollectionDelegateV2:
      updateAsMetadataCollectionDelegateDefaults("Collection"),
    updateAsDataDelegateV2: updateAsMetadataCollectionDelegateDefaults("Data"),
    updateAsProgrammableConfigDelegateV2:
      updateAsMetadataCollectionDelegateDefaults("ProgrammableConfig"),
    updateAsDataItemDelegateV2: updateAsMetadataDelegateDefaults("DataItem"),
    updateAsCollectionItemDelegateV2:
      updateAsMetadataDelegateDefaults("CollectionItem"),
    updateAsProgrammableConfigItemDelegateV2: updateAsMetadataDelegateDefaults(
      "ProgrammableConfigItem"
    ),
    // Delegate.
    delegateCollectionV1: metadataDelegateDefaults("Collection"),
    delegateSaleV1: tokenDelegateDefaults,
    delegateTransferV1: tokenDelegateDefaults,
    delegateDataV1: metadataDelegateDefaults("Data"),
    delegateUtilityV1: tokenDelegateDefaults,
    delegateStakingV1: tokenDelegateDefaults,
    delegateStandardV1: {
      ...tokenDelegateDefaults,
      accounts: {
        ...tokenDelegateDefaults.accounts,
        tokenRecord: { defaultsTo: k.programIdDefault() },
      },
    },
    delegateLockedTransferV1: tokenDelegateDefaults,
    delegateProgrammableConfigV1:
      metadataDelegateDefaults("ProgrammableConfig"),
    delegateAuthorityItemV1: metadataDelegateDefaults("AuthorityItem"),
    delegateDataItemV1: metadataDelegateDefaults("DataItem"),
    delegateCollectionItemV1: metadataDelegateDefaults("CollectionItem"),
    delegateProgrammableConfigItemV1: metadataDelegateDefaults(
      "ProgrammableConfigItem"
    ),
    // Revoke.
    revokeCollectionV1: metadataDelegateDefaults("Collection"),
    revokeSaleV1: tokenDelegateDefaults,
    revokeTransferV1: tokenDelegateDefaults,
    revokeDataV1: metadataDelegateDefaults("Data"),
    revokeUtilityV1: tokenDelegateDefaults,
    revokeStakingV1: tokenDelegateDefaults,
    revokeStandardV1: {
      ...tokenDelegateDefaults,
      accounts: {
        ...tokenDelegateDefaults.accounts,
        tokenRecord: { defaultsTo: k.programIdDefault() },
      },
    },
    revokeLockedTransferV1: tokenDelegateDefaults,
    revokeProgrammableConfigV1: metadataDelegateDefaults("ProgrammableConfig"),
    revokeMigrationV1: tokenDelegateDefaults,
    revokeAuthorityItemV1: metadataDelegateDefaults("AuthorityItem"),
    revokeDataItemV1: metadataDelegateDefaults("DataItem"),
    revokeCollectionItemV1: metadataDelegateDefaults("CollectionItem"),
    revokeProgrammableConfigItemV1: metadataDelegateDefaults(
      "ProgrammableConfigItem"
    ),
    // Verify collection.
    verifyCollectionV1: verifyCollectionDefaults,
    unverifyCollectionV1: verifyCollectionDefaults,
  })
);

// Render JavaScript.
const jsDir = path.join(clientDir, "js", "src", "generated");
const prettier = require(path.join(clientDir, "js", ".prettierrc.json"));
kinobi.accept(new k.RenderJavaScriptVisitor(jsDir, { prettier }));

// Render Rust.
const crateDir = path.join(clientDir, "rust");
const rustDir = path.join(clientDir, "rust", "src", "generated");
kinobi.accept(
  new k.RenderRustVisitor(rustDir, {
    formatCode: true,
    crateFolder: crateDir,
    renderParentInstructions: true,
  })
);
