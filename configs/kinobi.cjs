const path = require("path");
const k = require("@metaplex-foundation/kinobi");

// Paths.
const clientDir = path.join(__dirname, "..", "clients");
const idlDir = path.join(__dirname, "..", "idls");

// Instanciate Kinobi.
const kinobi = k.createFromIdls([path.join(idlDir, "token_metadata.json")]);

kinobi.update(
  k.updateProgramsVisitor({
    tokenMetadata: {
      name: "mplTokenMetadata",
    },
  })
);

// Update Accounts.
const metadataSeeds = [
  k.constantPdaSeedNodeFromString("metadata"),
  k.programIdPdaSeedNode(),
  k.variablePdaSeedNode(
    "mint",
    k.publicKeyTypeNode(),
    "The address of the mint account"
  ),
];
kinobi.update(
  k.updateAccountsVisitor({
    metadata: {
      size: null,
      seeds: metadataSeeds,
    },
    masterEditionV1: {
      size: null,
      name: "deprecatedMasterEditionV1",
      seeds: [...metadataSeeds, k.constantPdaSeedNodeFromString("edition")],
    },
    masterEditionV2: {
      size: null,
      name: "masterEdition",
      seeds: [...metadataSeeds, k.constantPdaSeedNodeFromString("edition")],
    },
    editionMarker: {
      seeds: [
        ...metadataSeeds,
        k.constantPdaSeedNodeFromString("edition"),
        k.variablePdaSeedNode(
          "editionMarker",
          k.stringTypeNode({ size: k.remainderSizeNode() }),
          "The floor of the edition number divided by 248 as a string. I.e. ⌊edition/248⌋."
        ),
      ],
    },
    editionMarkerV2: {
      seeds: [
        ...metadataSeeds,
        k.constantPdaSeedNodeFromString("edition"),
        k.constantPdaSeedNodeFromString("marker"),
      ],
    },
    tokenRecord: {
      size: 80,
      seeds: [
        ...metadataSeeds,
        k.constantPdaSeedNodeFromString("token_record"),
        k.variablePdaSeedNode(
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
        k.variablePdaSeedNode(
          "delegateRole",
          k.definedTypeLinkNode("metadataDelegateRoleSeed", "hooked"),
          "The role of the metadata delegate"
        ),
        k.variablePdaSeedNode(
          "updateAuthority",
          k.publicKeyTypeNode(),
          "The address of the metadata's update authority"
        ),
        k.variablePdaSeedNode(
          "delegate",
          k.publicKeyTypeNode(),
          "The address of the delegate authority"
        ),
      ],
    },
    collectionAuthorityRecord: {
      seeds: [
        ...metadataSeeds,
        k.constantPdaSeedNodeFromString("collection_authority"),
        k.variablePdaSeedNode(
          "collectionAuthority",
          k.publicKeyTypeNode(),
          "The address of the collection authority"
        ),
      ],
    },
    holderDelegateRecord: {
      size: 98,
      seeds: [
        ...metadataSeeds,
        k.variablePdaSeedNode(
          "delegateRole",
          k.definedTypeLinkNode("holderDelegateRoleSeed", "hooked"),
          "The role of the holder delegate"
        ),
        k.variablePdaSeedNode(
          "owner",
          k.publicKeyTypeNode(),
          "The address of the owner of the token"
        ),
        k.variablePdaSeedNode(
          "delegate",
          k.publicKeyTypeNode(),
          "The address of the delegate authority"
        ),
      ],
    },
    useAuthorityRecord: {
      seeds: [
        ...metadataSeeds,
        k.constantPdaSeedNodeFromString("user"),
        k.variablePdaSeedNode(
          "useAuthority",
          k.publicKeyTypeNode(),
          "The address of the use authority"
        ),
      ],
    },
    // Deprecated nodes.
    "mplTokenMetadata.ReservationListV1": { delete: true },
    "mplTokenMetadata.ReservationListV2": { delete: true },
  })
);

// Set default values for instruction accounts.
kinobi.update(
  k.setInstructionAccountDefaultValuesVisitor([
    {
      account: "updateAuthority",
      ignoreIfOptional: true,
      defaultValue: k.identityValueNode(),
    },
    {
      account: "metadata",
      ignoreIfOptional: true,
      defaultValue: k.pdaValueNode("metadata"),
    },
    {
      account: "tokenRecord",
      ignoreIfOptional: true,
      defaultValue: k.pdaValueNode("tokenRecord"),
    },
    {
      account: /^edition|masterEdition$/,
      ignoreIfOptional: true,
      defaultValue: k.pdaValueNode("masterEdition"),
    },
    {
      account: "authorizationRulesProgram",
      defaultValue: k.conditionalValueNode({
        condition: k.accountValueNode("authorizationRules"),
        ifTrue: k.publicKeyValueNode(
          "auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg",
          "mplTokenAuthRules"
        )
      }),
    },
  ])
);

// Update Instructions.
const ataPdaDefault = (mint = "mint", owner = "owner") =>
  k.pdaValueNode(k.pdaLinkNode("associatedToken", "mplToolbox"), [
    k.pdaSeedValueNode("mint", k.accountValueNode(mint)),
    k.pdaSeedValueNode("owner", k.accountValueNode(owner))
  ]);
kinobi.update(
  k.updateInstructionsVisitor({
    create: {
      byteDeltas: [
        k.instructionByteDeltaNode(
          k.numberValueNode(
            82 + // Mint account.
            679 + // Metadata account.
            282 + // Master edition account.
            128 * 3 // 3 account headers.
          ),
          { withHeader: false }
        ),
      ],
      accounts: {
        mint: { isSigner: "either" },
        updateAuthority: {
          isSigner: "either",
          defaultValue: k.accountValueNode("authority"),
        },
        splTokenProgram: {
          defaultValue: k.conditionalValueNode({
            condition: k.resolverValueNode(
              "resolveIsNonFungibleOrIsMintSigner",
              {
                dependsOn: [
                  k.accountValueNode("mint"),
                  k.argumentValueNode("tokenStandard"),
                ],
              }
            ),
            ifTrue: k.publicKeyValueNode(
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              "splToken"
            ),
          }),
        },
      },
    },
    mint: {
      byteDeltas: [
        k.instructionByteDeltaNode(
          k.numberValueNode(
            165 + // Token account.
            47 + // Token Record account.
            128 * 2 // 2 account headers.
          ),
          { withHeader: false }
        ),
      ],
      accounts: {
        masterEdition: {
          defaultValue: k.conditionalValueNode({
            condition: k.resolverValueNode("resolveIsNonFungible", {
              dependsOn: [k.argumentValueNode("tokenStandard")],
            }),
            ifTrue: k.pdaValueNode("masterEdition"),
          }),
        },
        tokenOwner: {
          defaultValue: k.resolverValueNode("resolveOptionalTokenOwner"),
        },
        token: {
          defaultValue: ataPdaDefault("mint", "tokenOwner"),
        },
        tokenRecord: {
          defaultValue: k.conditionalValueNode({
            condition: k.argumentValueNode("tokenStandard"),
            value: k.enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaValueNode("tokenRecord"),
          }),
        },
      },
      arguments: {
        tokenStandard: { type: k.definedTypeLinkNode("tokenStandard") },
      },
    },
    transfer: {
      accounts: {
        token: {
          defaultValue: ataPdaDefault("mint", "tokenOwner"),
        },
        tokenOwner: {
          defaultValue: k.identityValueNode(),
        },
        edition: {
          defaultValue: k.conditionalValueNode({
            condition: k.argumentValueNode("tokenStandard"),
            value: k.enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaValueNode("masterEdition"),
          }),
        },
        ownerTokenRecord: {
          name: "tokenRecord",
          defaultValue: k.conditionalValueNode({
            condition: k.argumentValueNode("tokenStandard"),
            value: k.enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaValueNode("tokenRecord"),
          }),
        },
        destination: {
          name: "destinationToken",
          defaultValue: ataPdaDefault("mint", "destinationOwner"),
        },
        destinationTokenRecord: {
          defaultValue: k.conditionalValueNode({
            condition: k.argumentValueNode("tokenStandard"),
            value: k.enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaValueNode("tokenRecord", [
              k.pdaSeedValueNode(
                "token",
                k.accountValueNode("destinationToken")
              ),
            ]),
          }),
        },
      },
      arguments: {
        tokenStandard: { type: k.definedTypeLinkNode("tokenStandard") },
      },
    },
    delegate: {
      accounts: {
        masterEdition: {
          defaultValue: k.conditionalValueNode({
            condition: k.resolverValueNode("resolveIsNonFungible", {
              dependsOn: [k.argumentValueNode("tokenStandard")],
            }),
            ifTrue: k.pdaValueNode("masterEdition"),
          }),
        },
      },
      arguments: {
        tokenStandard: {
          type: k.definedTypeLinkNode("tokenStandard"),
        },
      },
    },
    revoke: {
      accounts: {
        masterEdition: {
          defaultValue: k.conditionalValueNode({
            condition: k.resolverValueNode("resolveIsNonFungible", {
              dependsOn: [k.argumentValueNode("tokenStandard")],
            }),
            ifTrue: k.pdaValueNode("masterEdition"),
          }),
        },
      },
      arguments: {
        tokenStandard: {
          type: k.definedTypeLinkNode("tokenStandard"),
        },
      },
    },
    lock: {
      accounts: {
        tokenOwner: {
          defaultValue: k.resolverValueNode("resolveOptionalTokenOwner"),
        },
        token: {
          defaultValue: ataPdaDefault("mint", "tokenOwner"),
        },
        edition: {
          defaultValue: k.conditionalValueNode({
            condition: k.resolverValueNode("resolveIsNonFungible", {
              dependsOn: [k.argumentValueNode("tokenStandard")],
            }),
            ifTrue: k.pdaValueNode("masterEdition"),
          }),
        },
        tokenRecord: {
          defaultValue: k.conditionalValueNode({
            condition: k.argumentValueNode("tokenStandard"),
            value: k.enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaValueNode("tokenRecord"),
          }),
        },
        splTokenProgram: {
          defaultValue: k.conditionalValueNode({
            condition: k.argumentValueNode("tokenStandard"),
            value: k.enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifFalse: k.publicKeyValueNode(
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              "splToken"
            ),
          }),
        },
      },
      arguments: {
        tokenStandard: { type: k.definedTypeLinkNode("tokenStandard") },
      },
    },
    unlock: {
      accounts: {
        tokenOwner: {
          defaultValue: k.resolverValueNode("resolveOptionalTokenOwner"),
        },
        token: {
          defaultValue: ataPdaDefault("mint", "tokenOwner"),
        },
        edition: {
          defaultValue: k.conditionalValueNode({
            condition: k.resolverValueNode("resolveIsNonFungible", {
              dependsOn: [k.argumentValueNode("tokenStandard")],
            }),
            ifTrue: k.pdaValueNode("masterEdition"),
          }),
        },
        tokenRecord: {
          defaultValue: k.conditionalValueNode({
            condition: k.argumentValueNode("tokenStandard"),
            value: k.enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaValueNode("tokenRecord"),
          }),
        },
        splTokenProgram: {
          defaultValue: k.conditionalValueNode({
            condition: k.argumentValueNode("tokenStandard"),
            value: k.enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifFalse: k.publicKeyValueNode(
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              "splToken"
            ),
          }),
        },
      },
      arguments: {
        tokenStandard: { type: k.definedTypeLinkNode("tokenStandard") },
      },
    },
    burn: {
      accounts: {
        token: {
          isOptional: false,
          defaultValue: k.pdaValueNode(
            k.pdaLinkNode("associatedToken", "mplToolbox"),
            [
              k.pdaSeedValueNode("mint", k.accountValueNode("mint")),
              k.pdaSeedValueNode("owner", k.argumentValueNode("tokenOwner")),
            ]
          ),
        },
        edition: {
          defaultValue: k.conditionalValueNode({
            condition: k.resolverValueNode("resolveIsNonFungible", {
              dependsOn: [k.argumentValueNode("tokenStandard")],
            }),
            ifTrue: k.pdaValueNode("masterEdition"),
          }),
        },
        masterEdition: {
          defaultValue: k.conditionalValueNode({
            condition: k.accountValueNode("masterEditionMint"),
            ifTrue: k.pdaValueNode("masterEdition", [
              k.pdaSeedValueNode(
                "mint",
                k.accountValueNode("masterEditionMint")
              ),
            ]),
          }),
        },
        tokenRecord: {
          defaultValue: k.conditionalValueNode({
            condition: k.argumentValueNode("tokenStandard"),
            value: k.enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaValueNode("tokenRecord"),
          }),
        },
      },
      arguments: {
        tokenOwner: {
          type: k.publicKeyTypeNode(),
          defaultValue: k.identityValueNode(),
        },
        tokenStandard: { type: k.definedTypeLinkNode("tokenStandard") },
      },
    },
    print: {
      accounts: {
        editionMint: { isSigner: "either" },
        editionTokenAccountOwner: { defaultValue: k.identityValueNode() },
        editionMetadata: {
          defaultValue: k.pdaValueNode("metadata", [
            k.pdaSeedValueNode("mint", k.accountValueNode("editionMint")),
          ]),
        },
        edition: {
          defaultValue: k.pdaValueNode("masterEdition", [
            k.pdaSeedValueNode("mint", k.accountValueNode("editionMint")),
          ]),
        },
        editionTokenAccount: {
          defaultValue: ataPdaDefault("editionMint", "editionTokenAccountOwner"),
        },
        masterTokenAccount: {
          defaultValue: k.pdaValueNode(
            k.pdaLinkNode("associatedToken", "mplToolbox"),
            [
              k.pdaSeedValueNode(
                "mint",
                k.argumentValueNode("masterEditionMint")
              ),
              k.pdaSeedValueNode(
                "owner",
                k.accountValueNode("masterTokenAccountOwner")
              ),
            ]
          ),
        },
        masterMetadata: {
          defaultValue: k.pdaValueNode("metadata", [
            k.pdaSeedValueNode(
              "mint",
              k.argumentValueNode("masterEditionMint")
            ),
          ]),
        },
        masterEdition: {
          defaultValue: k.pdaValueNode("masterEdition", [
            k.pdaSeedValueNode(
              "mint",
              k.argumentValueNode("masterEditionMint")
            ),
          ]),
        },
        editionTokenRecord: {
          defaultValue: k.conditionalValueNode({
            condition: k.argumentValueNode("tokenStandard"),
            value: k.enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaValueNode("tokenRecord", [
              k.pdaSeedValueNode(
                "mint",
                k.accountValueNode("editionMint")
              ),
              k.pdaSeedValueNode(
                "token",
                k.accountValueNode("editionTokenAccount")
              ),
            ])
          }),
        },
      },
      arguments: {
        masterEditionMint: { type: k.publicKeyTypeNode() },
        tokenStandard: { type: k.definedTypeLinkNode("tokenStandard") },
      },
    },
    updateMetadataAccountV2: {
      arguments: { updateAuthority: { name: "newUpdateAuthority" } },
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
  value: k.enumValueNode("Key", name),
});
kinobi.update(
  k.setAccountDiscriminatorFromFieldVisitor({
    Edition: key("EditionV1"),
    Metadata: key("MetadataV1"),
    MasterEdition: key("MasterEditionV2"),
    EditionMarker: key("EditionMarker"),
    UseAuthorityRecord: key("UseAuthorityRecord"),
    CollectionAuthorityRecord: key("CollectionAuthorityRecord"),
    TokenOwnedEscrow: key("TokenOwnedEscrow"),
    TokenRecord: key("TokenRecord"),
    MetadataDelegate: key("MetadataDelegate"),
    DeprecatedMasterEditionV1: key("MasterEditionV1"),
    HolderDelegate: key("HolderDelegate"),
  })
);

// Wrap leaves.
kinobi.update(
  k.setNumberWrappersVisitor({
    "AssetData.sellerFeeBasisPoints": {
      kind: "Amount",
      decimals: 2,
      unit: "%",
    },
  })
);

// Set struct default values.
kinobi.update(
  k.setStructDefaultValuesVisitor({
    assetData: {
      symbol: k.stringValueNode(""),
      isMutable: k.booleanValueNode(true),
      primarySaleHappened: k.booleanValueNode(false),
      collection: k.noneValueNode(),
      uses: k.noneValueNode(),
      collectionDetails: k.noneValueNode(),
      ruleSet: k.noneValueNode(),
    },
    "updateArgs.AsUpdateAuthorityV2": { tokenStandard: k.noneValueNode() },
    "updateArgs.AsAuthorityItemDelegateV2": {
      tokenStandard: k.noneValueNode(),
    },
  })
);

// Set more struct default values dynamically.
kinobi.update(
  k.bottomUpTransformerVisitor([
    {
      select: "[structFieldTypeNode|instructionArgumentNode]amount",
      transform: (node) => {
        k.assertIsNode(node, [
          "structFieldTypeNode",
          "instructionArgumentNode",
        ]);
        return {
          ...node,
          defaultValueStrategy: "optional",
          defaultValue: k.numberValueNode(1),
        };
      },
    },
    {
      select: (node) => {
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
          k.isNode(node, ["structFieldTypeNode", "instructionArgumentNode"]) &&
          k.isNode(node.type, "optionTypeNode") &&
          names.includes(node.name)
        );
      },
      transform: (node) => {
        k.assertIsNode(node, [
          "structFieldTypeNode",
          "instructionArgumentNode",
        ]);
        return {
          ...node,
          defaultValueStrategy: "optional",
          defaultValue: k.noneValueNode()
        };
      },
    },
    {
      select: (node) => {
        const toggles = [
          "collectionToggle",
          "collectionDetailsToggle",
          "usesToggle",
          "ruleSetToggle",
        ];
        return (
          k.isNode(node, "structFieldTypeNode") &&
          k.isNode(node.type, "definedTypeLinkNode") &&
          toggles.includes(node.type.name)
        );
      },
      transform: (node) => {
        k.assertIsNode(node, "structFieldTypeNode");
        k.assertIsNode(node.type, "definedTypeLinkNode");
        return k.structFieldTypeNode({
          ...node,
          defaultValueStrategy: "optional",
          defaultValue: k.enumValueNode(node.type, "None"),
        });
      },
    },
  ])
);

// Unwrap types and structs.
kinobi.update(k.unwrapDefinedTypesVisitor(["AssetData"]));
kinobi.update(k.unwrapTypeDefinedLinksVisitor(["metadata.data"]));
kinobi.update(
  k.flattenStructVisitor({
    Metadata: ["data"],
    "CreateArgs.V1": ["assetData"],
  })
);

// Create versioned instructions.
kinobi.update(
  k.createSubInstructionsFromEnumArgsVisitor({
    burn: "burnArgs",
    create: "createArgs",
    delegate: "delegateArgs",
    lock: "lockArgs",
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

kinobi.update(
  k.bottomUpTransformerVisitor([
    {
      select: "[instructionNode]printV2",
      transform: (node) => {
        k.assertIsNode(node, [
          "instructionNode"
        ]);
        return k.instructionNode({
          ...node,
          accounts: [
            ...node.accounts,
            k.instructionAccountNode({
              name: "holderDelegateRecord",
              isOptional: true,
              docs: ["The Delegate Record authorizing escrowless edition printing"],
            }),
            k.instructionAccountNode({
              name: "delegate",
              isOptional: true,
              isSigner: true,
              docs: ["The authority printing the edition for a delegated print"],
            })
          ],
        });
      },
    },
  ])
);

// Update versioned instructions.
const tokenDelegateDefaults = {
  accounts: {
    token: {
      isOptional: false,
      defaultValue: k.pdaValueNode(
        k.pdaLinkNode("associatedToken", "mplToolbox"),
        [
          k.pdaSeedValueNode("mint", k.accountValueNode("mint")),
          k.pdaSeedValueNode("owner", k.argumentValueNode("tokenOwner")),
        ]
      ),
    },
    tokenRecord: {
      defaultValue: k.conditionalValueNode({
        condition: k.argumentValueNode("tokenStandard"),
        value: k.enumValueNode("TokenStandard", "ProgrammableNonFungible"),
        ifTrue: k.pdaValueNode("tokenRecord"),
      }),
    },
    delegateRecord: { defaultValue: k.pdaValueNode("tokenRecord") },
    splTokenProgram: {
      defaultValue: k.publicKeyValueNode(
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        "splToken"
      ),
    },
  },
  arguments: {
    tokenOwner: {
      type: k.publicKeyTypeNode(),
      defaultValue: k.identityValueNode(),
    },
  },
};
const metadataDelegateDefaults = (role) => ({
  accounts: {
    delegateRecord: {
      defaultValue: k.pdaValueNode("metadataDelegateRecord", [
        k.pdaSeedValueNode(
          "delegateRole",
          k.enumValueNode("MetadataDelegateRole", role)
        ),
        k.pdaSeedValueNode(
          "updateAuthority",
          k.argumentValueNode("updateAuthority")
        ),
      ]),
    },
  },
  arguments: {
    updateAuthority: {
      type: k.publicKeyTypeNode(),
      defaultValue: k.accountValueNode("authority"),
    },
  },
});
const updateAsMetadataDelegateDefaults = (role) => ({
  accounts: {
    delegateRecord: {
      defaultValue: k.pdaValueNode("metadataDelegateRecord", [
        k.pdaSeedValueNode(
          "delegateRole",
          k.enumValueNode("MetadataDelegateRole", role)
        ),
        k.pdaSeedValueNode(
          "updateAuthority",
          k.argumentValueNode("updateAuthority")
        ),
        k.pdaSeedValueNode("delegate", k.accountValueNode("authority")),
      ]),
    },
    token:
      role === "ProgrammableConfigItem"
        ? { isOptional: false, defaultValue: null }
        : undefined,
  },
  arguments: {
    updateAuthority: {
      type: k.publicKeyTypeNode(),
      defaultValue: k.identityValueNode(),
    },
  },
});
const updateAsMetadataCollectionDelegateDefaults = (role) => ({
  accounts: {
    delegateRecord: {
      defaultValue: k.pdaValueNode("metadataDelegateRecord", [
        k.pdaSeedValueNode("mint", k.argumentValueNode("delegateMint")),
        k.pdaSeedValueNode(
          "delegateRole",
          k.enumValueNode("MetadataDelegateRole", role)
        ),
        k.pdaSeedValueNode(
          "updateAuthority",
          k.argumentValueNode("delegateUpdateAuthority")
        ),
        k.pdaSeedValueNode("delegate", k.accountValueNode("authority")),
      ]),
    },
    token:
      role === "ProgrammableConfig"
        ? { isOptional: false, defaultValue: null }
        : undefined,
  },
  arguments: {
    delegateMint: {
      type: k.publicKeyTypeNode(),
      defaultValue: k.accountValueNode("mint"),
    },
    delegateUpdateAuthority: {
      type: k.publicKeyTypeNode(),
      defaultValue: k.identityValueNode(),
    },
  },
});
const verifyCollectionDefaults = {
  accounts: {
    collectionMint: { isOptional: false, defaultValue: null },
    collectionMetadata: {
      defaultValue: k.pdaValueNode("metadata", [
        k.pdaSeedValueNode("mint", k.accountValueNode("collectionMint")),
      ]),
    },
    collectionMasterEdition: {
      defaultValue: k.pdaValueNode("masterEdition", [
        k.pdaSeedValueNode("mint", k.accountValueNode("collectionMint")),
      ]),
    },
  },
};
kinobi.update(
  k.updateInstructionsVisitor({
    createV1: {
      byteDeltas: [
        k.instructionByteDeltaNode(k.resolverValueNode("resolveCreateV1Bytes")),
      ],
      accounts: {
        masterEdition: {
          defaultValue: k.conditionalValueNode({
            condition: k.resolverValueNode("resolveIsNonFungible", {
              dependsOn: [k.argumentValueNode("tokenStandard")],
            }),
            ifTrue: k.pdaValueNode("masterEdition"),
          }),
        },
      },
      arguments: {
        isCollection: {
          type: k.booleanTypeNode(),
          defaultValue: k.booleanValueNode(false),
        },
        tokenStandard: {
          defaultValue: k.enumValueNode("TokenStandard", "NonFungible"),
        },
        collectionDetails: {
          defaultValue: k.resolverValueNode("resolveCollectionDetails", {
            dependsOn: [k.argumentValueNode("isCollection")],
          }),
        },
        decimals: {
          defaultValue: k.resolverValueNode("resolveDecimals", {
            dependsOn: [k.argumentValueNode("tokenStandard")],
          }),
        },
        printSupply: {
          defaultValue: k.resolverValueNode("resolvePrintSupply", {
            dependsOn: [k.argumentValueNode("tokenStandard")],
          }),
        },
        creators: {
          defaultValue: k.resolverValueNode("resolveCreators", {
            dependsOn: [k.accountValueNode("authority")],
          }),
        },
      },
    },
    printV1: {
      accounts: {
        editionMarkerPda: {
          defaultValue: k.conditionalValueNode({
            condition: k.argumentValueNode("tokenStandard"),
            value: k.enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaValueNode("editionMarkerV2", [
              k.pdaSeedValueNode(
                "mint",
                k.argumentValueNode("masterEditionMint")
              ),
            ]),
            ifFalse: k.pdaValueNode(
              k.pdaLinkNode("editionMarkerFromEditionNumber", "hooked"),
              [
                k.pdaSeedValueNode(
                  "mint",
                  k.argumentValueNode("masterEditionMint")
                ),
                k.pdaSeedValueNode(
                  "editionNumber",
                  k.argumentValueNode("editionNumber")
                ),
              ]
            ),
          }),
        },
        editionMintAuthority: {
          defaultValue: k.accountValueNode("masterTokenAccountOwner"),
        },
        masterTokenAccountOwner: {
          defaultValue: k.identityValueNode(),
          isSigner: true
        },
      },
      arguments: { edition: { name: "editionNumber" }, },
    },
    printV2: {
      accounts: {
        editionMarkerPda: {
          defaultValue: k.conditionalValueNode({
            condition: k.argumentValueNode("tokenStandard"),
            value: k.enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: k.pdaValueNode("editionMarkerV2", [
              k.pdaSeedValueNode(
                "mint",
                k.argumentValueNode("masterEditionMint")
              ),
            ]),
            ifFalse: k.pdaValueNode(
              k.pdaLinkNode("editionMarkerFromEditionNumber", "hooked"),
              [
                k.pdaSeedValueNode(
                  "mint",
                  k.argumentValueNode("masterEditionMint")
                ),
                k.pdaSeedValueNode(
                  "editionNumber",
                  k.argumentValueNode("editionNumber")
                ),
              ]
            ),
          }),
        },
        editionMintAuthority: {
          defaultValue: k.conditionalValueNode({
            condition: k.accountValueNode("holderDelegateRecord"),
              ifTrue: k.conditionalValueNode({
                  condition: k.accountValueNode("delegate"),
                  ifTrue: k.accountValueNode("delegate"),
                  ifFalse: k.accountValueNode("payer"),
              }),
            ifFalse: k.identityValueNode(),
          }),
        },
        masterTokenAccountOwner: {
          defaultValue: k.conditionalValueNode({
            condition: k.accountValueNode("holderDelegateRecord"),
            ifFalse: k.identityValueNode(),
          }),
        },
      },
      arguments: { edition: { name: "editionNumber" }, },
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
        tokenRecord: { defaultValue: k.programIdValueNode() },
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
        tokenRecord: { defaultValue: k.programIdValueNode() },
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
const { pdaLinkNode } = require("@metaplex-foundation/kinobi");
kinobi.accept(k.renderJavaScriptVisitor(jsDir, { prettier }));

// Render Rust.
const crateDir = path.join(clientDir, "rust");
const rustDir = path.join(clientDir, "rust", "src", "generated");
kinobi.accept(
  k.renderRustVisitor(rustDir, {
    formatCode: true,
    crateFolder: crateDir,
    renderParentInstructions: true,
  })
);
