import { AnchorIdl, rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import {
  renderJavaScriptUmiVisitor,
  renderJavaScriptVisitor,
  renderRustVisitor,
} from "@codama/renderers";
import {
  programNode,
  rootNode,
  accountValueNode,
  argumentValueNode,
  assertIsNode,
  booleanTypeNode,
  booleanValueNode,
  bottomUpTransformerVisitor,
  conditionalValueNode,
  constantPdaSeedNodeFromProgramId,
  constantPdaSeedNodeFromString,
  createFromRoot,
  createSubInstructionsFromEnumArgsVisitor,
  definedTypeLinkNode,
  enumValueNode,
  flattenStructVisitor,
  identityValueNode,
  instructionAccountNode,
  instructionNode,
  isNode,
  noneValueNode,
  numberValueNode,
  pdaNode,
  pdaLinkNode,
  pdaSeedValueNode,
  pdaValueNode,
  programIdValueNode,
  publicKeyTypeNode,
  publicKeyValueNode,
  RegisteredPdaSeedNode,
  resolverValueNode,
  setAccountDiscriminatorFromFieldVisitor,
  setInstructionAccountDefaultValuesVisitor,
  setNumberWrappersVisitor,
  setStructDefaultValuesVisitor,
  stringTypeNode,
  stringValueNode,
  structFieldTypeNode,
  unwrapDefinedTypesVisitor,
  unwrapTypeDefinedLinksVisitor,
  updateAccountsVisitor,
  updateInstructionsVisitor,
  updateProgramsVisitor,
  variablePdaSeedNode,
} from "codama";
import path from "node:path";
import fs from "node:fs";
// import TokenMetadataIdl from "../idls/token_metadata.json" with { type: "json" };

// Paths.
const clientDir = path.join(__dirname, "..", "clients");

const json = fs.readFileSync(path.join(__dirname, "..", "idls", "token_metadata.json"), "utf8");

// Initialize codama.
const codama = createFromRoot(rootNodeFromAnchor(JSON.parse(json)));

codama.update(
  updateProgramsVisitor({
    tokenMetadata: {
      name: "mplTokenMetadata",
    },
  })
);

// Update Accounts.
const metadataSeeds = [
  constantPdaSeedNodeFromString("utf8", "metadata"),
  constantPdaSeedNodeFromProgramId(),
  variablePdaSeedNode(
    "mint",
    publicKeyTypeNode(),
    "The address of the mint account"
  ),
];
codama.update(
  updateAccountsVisitor({
    metadata: {
      size: null,
      seeds: metadataSeeds,
    },
    masterEditionV1: {
      size: null,
      name: "deprecatedMasterEditionV1",
      seeds: [
        ...metadataSeeds,
        constantPdaSeedNodeFromString("utf8", "edition"),
      ],
    },
    masterEditionV2: {
      size: null,
      name: "masterEdition",
      seeds: [
        ...metadataSeeds,
        constantPdaSeedNodeFromString("utf8", "edition"),
      ],
    },
    editionMarker: {
      seeds: [
        ...metadataSeeds,
        constantPdaSeedNodeFromString("utf8", "edition"),
        variablePdaSeedNode(
          "editionMarker",
          stringTypeNode("utf8"),
          "The floor of the edition number divided by 248 as a string. I.e. ⌊edition/248⌋."
        ),
      ],
    },
    editionMarkerV2: {
      seeds: [
        ...metadataSeeds,
        constantPdaSeedNodeFromString("utf8", "edition"),
        constantPdaSeedNodeFromString("utf8", "marker"),
      ],
    },
    tokenRecord: {
      size: 80,
      seeds: [
        ...metadataSeeds,
        constantPdaSeedNodeFromString("utf8", "token_record"),
        variablePdaSeedNode(
          "token",
          publicKeyTypeNode(),
          "The address of the token account (ata or not)"
        ),
      ],
    },
    metadataDelegateRecord: {
      size: 98,
      seeds: [
        ...metadataSeeds,
        variablePdaSeedNode(
          "delegateRole",
          definedTypeLinkNode("metadataDelegateRoleSeed", "hooked"),
          "The role of the metadata delegate"
        ),
        variablePdaSeedNode(
          "updateAuthority",
          publicKeyTypeNode(),
          "The address of the metadata's update authority"
        ),
        variablePdaSeedNode(
          "delegate",
          publicKeyTypeNode(),
          "The address of the delegate authority"
        ),
      ],
    },
    collectionAuthorityRecord: {
      seeds: [
        ...metadataSeeds,
        constantPdaSeedNodeFromString("utf8", "collection_authority"),
        variablePdaSeedNode(
          "collectionAuthority",
          publicKeyTypeNode(),
          "The address of the collection authority"
        ),
      ],
    },
    holderDelegateRecord: {
      size: 98,
      seeds: [
        ...metadataSeeds,
        variablePdaSeedNode(
          "delegateRole",
          definedTypeLinkNode("holderDelegateRoleSeed", "hooked"),
          "The role of the holder delegate"
        ),
        variablePdaSeedNode(
          "owner",
          publicKeyTypeNode(),
          "The address of the owner of the token"
        ),
        variablePdaSeedNode(
          "delegate",
          publicKeyTypeNode(),
          "The address of the delegate authority"
        ),
      ],
    },
    useAuthorityRecord: {
      seeds: [
        ...metadataSeeds,
        constantPdaSeedNodeFromString("utf8", "user"),
        variablePdaSeedNode(
          "useAuthority",
          publicKeyTypeNode(),
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
codama.update(
  setInstructionAccountDefaultValuesVisitor([
    {
      account: "updateAuthority",
      ignoreIfOptional: true,
      defaultValue: identityValueNode(),
    },
    {
      account: "metadata",
      ignoreIfOptional: true,
      defaultValue: pdaValueNode("metadata"),
    },
    {
      account: "tokenRecord",
      ignoreIfOptional: true,
      defaultValue: pdaValueNode("tokenRecord"),
    },
    {
      account: /^edition|masterEdition$/,
      ignoreIfOptional: true,
      defaultValue: pdaValueNode("masterEdition"),
    },
    {
      account: "authorizationRulesProgram",
      defaultValue: conditionalValueNode({
        condition: accountValueNode("authorizationRules"),
        ifTrue: publicKeyValueNode(
          "auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg",
          "mplTokenAuthRules"
        ),
      }),
    },
  ])
);

// Update Instructions.
// const ataPdaDefault = (mint = "mint", owner = "owner") =>
//   pdaValueNode(pdaLinkNode("associatedToken", "mplToolbox"), [
//     pdaSeedValueNode("mint", accountValueNode(mint)),
//     pdaSeedValueNode("owner", accountValueNode(owner)),
//   ]);

codama.update(bottomUpTransformerVisitor([
  {
    //first transform
    select: '[rootNode]',
    transform: (node) => {
      assertIsNode(node, 'rootNode');
      return rootNode(
        node.program,
        [
          ...node.additionalPrograms,
          programNode({
            name: "associatedToken",
            publicKey: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
            version: "1.1.1",
            origin: "shank",
            pdas: [
              pdaNode({
                name: "associatedToken",
                seeds: [
                  variablePdaSeedNode("owner", publicKeyTypeNode()),
                  variablePdaSeedNode("tokenProgram", publicKeyTypeNode()),
                  variablePdaSeedNode("mint", publicKeyTypeNode()),
                ]
              })
            ]

          })
        ])
    },
  }
]))

const ataPdaDefault = (mint = "mint", owner = "owner") =>
  pdaValueNode((pdaLinkNode('associatedToken', 'associatedToken')),
    [
      pdaSeedValueNode("owner", accountValueNode(owner)),
      pdaSeedValueNode("tokenProgram", publicKeyValueNode("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")),
      pdaSeedValueNode("mint", accountValueNode(mint)),
    ],
  );

codama.update(
  updateInstructionsVisitor({
    create: {
      //   byteDeltas: [
      //     instructionByteDeltaNode(
      //       numberValueNode(
      //         82 + // Mint account.
      //         679 + // Metadata account.
      //         282 + // Master edition account.
      //         128 * 3 // 3 account headers.
      //       ),
      //       { withHeader: false }
      //     ),
      //   ],
      accounts: {
        mint: { isSigner: "either" },
        updateAuthority: {
          isSigner: "either",
          defaultValue: accountValueNode("authority"),
        },
        splTokenProgram: {
          defaultValue: conditionalValueNode({
            condition: resolverValueNode("resolveIsNonFungibleOrIsMintSigner", {
              dependsOn: [
                accountValueNode("mint"),
                argumentValueNode("tokenStandard"),
              ],
            }),
            ifTrue: publicKeyValueNode(
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              "splToken"
            ),
          }),
        },
      },
    },
    mint: {
      //   byteDeltas: [
      //     instructionByteDeltaNode(
      //       numberValueNode(
      //         165 + // Token account.
      //         47 + // Token Record account.
      //         128 * 2 // 2 account headers.
      //       ),
      //       { withHeader: false }
      //     ),
      //   ],
      accounts: {
        masterEdition: {
          defaultValue: conditionalValueNode({
            condition: resolverValueNode("resolveIsNonFungible", {
              dependsOn: [argumentValueNode("tokenStandard")],
            }),
            ifTrue: pdaValueNode("masterEdition"),
          }),
        },
        tokenOwner: {
          defaultValue: resolverValueNode("resolveOptionalTokenOwner"),
        },
        token: {
          defaultValue: ataPdaDefault("mint", "tokenOwner"),
        },
        tokenRecord: {
          defaultValue: conditionalValueNode({
            condition: argumentValueNode("tokenStandard"),
            value: enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: pdaValueNode("tokenRecord"),
          }),
        },
      },
      arguments: {
        tokenStandard: { type: definedTypeLinkNode("tokenStandard") },
      },
    },
    transfer: {
      accounts: {
        token: {
          defaultValue: ataPdaDefault("mint", "tokenOwner"),
        },
        tokenOwner: {
          defaultValue: identityValueNode(),
        },
        edition: {
          defaultValue: conditionalValueNode({
            condition: argumentValueNode("tokenStandard"),
            value: enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: pdaValueNode("masterEdition"),
          }),
        },
        ownerTokenRecord: {
          name: "tokenRecord",
          defaultValue: conditionalValueNode({
            condition: argumentValueNode("tokenStandard"),
            value: enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: pdaValueNode("tokenRecord"),
          }),
        },
        destination: {
          name: "destinationToken",
          defaultValue: ataPdaDefault("mint", "destinationOwner"),
        },
        destinationTokenRecord: {
          defaultValue: conditionalValueNode({
            condition: argumentValueNode("tokenStandard"),
            value: enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: pdaValueNode("tokenRecord", [
              pdaSeedValueNode("token", accountValueNode("destinationToken")),
            ]),
          }),
        },
      },
      arguments: {
        tokenStandard: { type: definedTypeLinkNode("tokenStandard") },
      },
    },
    delegate: {
      accounts: {
        masterEdition: {
          defaultValue: conditionalValueNode({
            condition: resolverValueNode("resolveIsNonFungible", {
              dependsOn: [argumentValueNode("tokenStandard")],
            }),
            ifTrue: pdaValueNode("masterEdition"),
          }),
        },
      },
      arguments: {
        tokenStandard: {
          type: definedTypeLinkNode("tokenStandard"),
        },
      },
    },
    revoke: {
      accounts: {
        masterEdition: {
          defaultValue: conditionalValueNode({
            condition: resolverValueNode("resolveIsNonFungible", {
              dependsOn: [argumentValueNode("tokenStandard")],
            }),
            ifTrue: pdaValueNode("masterEdition"),
          }),
        },
      },
      arguments: {
        tokenStandard: {
          type: definedTypeLinkNode("tokenStandard"),
        },
      },
    },
    lock: {
      accounts: {
        tokenOwner: {
          defaultValue: resolverValueNode("resolveOptionalTokenOwner"),
        },
        token: {
          defaultValue: ataPdaDefault("mint", "tokenOwner"),
        },
        edition: {
          defaultValue: conditionalValueNode({
            condition: resolverValueNode("resolveIsNonFungible", {
              dependsOn: [argumentValueNode("tokenStandard")],
            }),
            ifTrue: pdaValueNode("masterEdition"),
          }),
        },
        tokenRecord: {
          defaultValue: conditionalValueNode({
            condition: argumentValueNode("tokenStandard"),
            value: enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: pdaValueNode("tokenRecord"),
          }),
        },
        splTokenProgram: {
          defaultValue: conditionalValueNode({
            condition: argumentValueNode("tokenStandard"),
            value: enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifFalse: publicKeyValueNode(
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              "splToken"
            ),
          }),
        },
      },
      arguments: {
        tokenStandard: { type: definedTypeLinkNode("tokenStandard") },
      },
    },
    unlock: {
      accounts: {
        tokenOwner: {
          defaultValue: resolverValueNode("resolveOptionalTokenOwner"),
        },
        token: {
          defaultValue: ataPdaDefault("mint", "tokenOwner"),
        },
        edition: {
          defaultValue: conditionalValueNode({
            condition: resolverValueNode("resolveIsNonFungible", {
              dependsOn: [argumentValueNode("tokenStandard")],
            }),
            ifTrue: pdaValueNode("masterEdition"),
          }),
        },
        tokenRecord: {
          defaultValue: conditionalValueNode({
            condition: argumentValueNode("tokenStandard"),
            value: enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: pdaValueNode("tokenRecord"),
          }),
        },
        splTokenProgram: {
          defaultValue: conditionalValueNode({
            condition: argumentValueNode("tokenStandard"),
            value: enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifFalse: publicKeyValueNode(
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              "splToken"
            ),
          }),
        },
      },
      arguments: {
        tokenStandard: { type: definedTypeLinkNode("tokenStandard") },
      },
    },
    burn: {
      accounts: {
        token: {
          isOptional: false,
          defaultValue: pdaValueNode(
            pdaLinkNode("associatedToken", "mplToolbox"),
            [
              pdaSeedValueNode("mint", accountValueNode("mint")),
              pdaSeedValueNode("owner", argumentValueNode("tokenOwner")),
            ]
          ),
        },
        edition: {
          defaultValue: conditionalValueNode({
            condition: resolverValueNode("resolveIsNonFungible", {
              dependsOn: [argumentValueNode("tokenStandard")],
            }),
            ifTrue: pdaValueNode("masterEdition"),
          }),
        },
        masterEdition: {
          defaultValue: conditionalValueNode({
            condition: accountValueNode("masterEditionMint"),
            ifTrue: pdaValueNode("masterEdition", [
              pdaSeedValueNode("mint", accountValueNode("masterEditionMint")),
            ]),
          }),
        },
        tokenRecord: {
          defaultValue: conditionalValueNode({
            condition: argumentValueNode("tokenStandard"),
            value: enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: pdaValueNode("tokenRecord"),
          }),
        },
      },
      arguments: {
        tokenOwner: {
          type: publicKeyTypeNode(),
          defaultValue: identityValueNode(),
        },
        tokenStandard: { type: definedTypeLinkNode("tokenStandard") },
      },
    },
    print: {
      accounts: {
        editionMint: { isSigner: "either" },
        editionTokenAccountOwner: { defaultValue: identityValueNode() },
        editionMetadata: {
          defaultValue: pdaValueNode("metadata", [
            pdaSeedValueNode("mint", accountValueNode("editionMint")),
          ]),
        },
        edition: {
          defaultValue: pdaValueNode("masterEdition", [
            pdaSeedValueNode("mint", accountValueNode("editionMint")),
          ]),
        },
        editionTokenAccount: {
          defaultValue: ataPdaDefault(
            "editionMint",
            "editionTokenAccountOwner"
          ),
        },
        masterTokenAccount: {
          defaultValue: pdaValueNode(
            pdaLinkNode("associatedToken", "mplToolbox"),
            [
              pdaSeedValueNode("mint", argumentValueNode("masterEditionMint")),
              pdaSeedValueNode(
                "owner",
                accountValueNode("masterTokenAccountOwner")
              ),
            ]
          ),
        },
        masterMetadata: {
          defaultValue: pdaValueNode("metadata", [
            pdaSeedValueNode("mint", argumentValueNode("masterEditionMint")),
          ]),
        },
        masterEdition: {
          defaultValue: pdaValueNode("masterEdition", [
            pdaSeedValueNode("mint", argumentValueNode("masterEditionMint")),
          ]),
        },
        editionTokenRecord: {
          defaultValue: conditionalValueNode({
            condition: argumentValueNode("tokenStandard"),
            value: enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: pdaValueNode("tokenRecord", [
              pdaSeedValueNode("mint", accountValueNode("editionMint")),
              pdaSeedValueNode(
                "token",
                accountValueNode("editionTokenAccount")
              ),
            ]),
          }),
        },
      },
      arguments: {
        masterEditionMint: { type: publicKeyTypeNode() },
        tokenStandard: { type: definedTypeLinkNode("tokenStandard") },
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
  value: enumValueNode("Key", name),
});
codama.update(
  setAccountDiscriminatorFromFieldVisitor({
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
codama.update(
  setNumberWrappersVisitor({
    "AssetData.sellerFeeBasisPoints": {
      kind: "Amount",
      decimals: 2,
      unit: "%",
    },
  })
);

// Set struct default values.
codama.update(
  setStructDefaultValuesVisitor({
    assetData: {
      symbol: stringValueNode(""),
      isMutable: booleanValueNode(true),
      primarySaleHappened: booleanValueNode(false),
      collection: noneValueNode(),
      uses: noneValueNode(),
      collectionDetails: noneValueNode(),
      ruleSet: noneValueNode(),
    },
    "updateArgs.AsUpdateAuthorityV2": { tokenStandard: noneValueNode() },
    "updateArgs.AsAuthorityItemDelegateV2": {
      tokenStandard: noneValueNode(),
    },
  })
);

// Set more struct default values dynamically.
codama.update(
  bottomUpTransformerVisitor([
    {
      select: "[structFieldTypeNode|instructionArgumentNode]amount",
      transform: (node) => {
        assertIsNode(node, ["structFieldTypeNode", "instructionArgumentNode"]);
        return {
          ...node,
          defaultValueStrategy: "optional",
          defaultValue: numberValueNode(1),
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
          isNode(node[0], ["structFieldTypeNode", "instructionArgumentNode"]) &&
          isNode(node[0].type, "optionTypeNode") &&
          names.includes(node[0].name)
        );
      },
      transform: (node) => {
        assertIsNode(node, ["structFieldTypeNode", "instructionArgumentNode"]);
        return {
          ...node,
          defaultValueStrategy: "optional",
          defaultValue: noneValueNode(),
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
          isNode(node[0], "structFieldTypeNode") &&
          isNode(node[0].type, "definedTypeLinkNode") &&
          toggles.includes(node[0].type.name)
        );
      },
      transform: (node) => {
        assertIsNode(node, "structFieldTypeNode");
        assertIsNode(node.type, "definedTypeLinkNode");
        return structFieldTypeNode({
          ...node,
          defaultValueStrategy: "optional",
          defaultValue: enumValueNode(node.type, "None"),
        });
      },
    },
  ])
);

// Unwrap types and structs.
codama.update(unwrapDefinedTypesVisitor(["AssetData"]));
codama.update(unwrapTypeDefinedLinksVisitor(["metadata.data"]));
codama.update(
  flattenStructVisitor({
    Metadata: ["data"],
    "CreateArgs.V1": ["assetData"],
  })
);

// Create versioned instructions.
codama.update(
  createSubInstructionsFromEnumArgsVisitor({
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

codama.update(
  bottomUpTransformerVisitor([
    {
      select: "[instructionNode]printV2",
      transform: (node) => {
        assertIsNode(node, ["instructionNode"]);
        return instructionNode({
          ...node,
          accounts: [
            ...node.accounts,
            instructionAccountNode({
              name: "holderDelegateRecord",
              isOptional: true,
              docs: [
                "The Delegate Record authorizing escrowless edition printing",
              ],
              isSigner: false,
              isWritable: false,
            }),
            instructionAccountNode({
              name: "delegate",
              isOptional: true,
              isSigner: true,
              docs: [
                "The authority printing the edition for a delegated print",
              ],
              isWritable: false,
            }),
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
      defaultValue: pdaValueNode(pdaLinkNode("associatedToken", "mplToolbox"), [
        pdaSeedValueNode("mint", accountValueNode("mint")),
        pdaSeedValueNode("owner", argumentValueNode("tokenOwner")),
      ]),
    },
    tokenRecord: {
      defaultValue: conditionalValueNode({
        condition: argumentValueNode("tokenStandard"),
        value: enumValueNode("TokenStandard", "ProgrammableNonFungible"),
        ifTrue: pdaValueNode("tokenRecord"),
      }),
    },
    delegateRecord: { defaultValue: pdaValueNode("tokenRecord") },
    splTokenProgram: {
      defaultValue: publicKeyValueNode(
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        "splToken"
      ),
    },
  },
  arguments: {
    tokenOwner: {
      type: publicKeyTypeNode(),
      defaultValue: identityValueNode(),
    },
  },
};
const metadataDelegateDefaults = (role) => ({
  accounts: {
    delegateRecord: {
      defaultValue: pdaValueNode("metadataDelegateRecord", [
        pdaSeedValueNode(
          "delegateRole",
          enumValueNode("MetadataDelegateRole", role)
        ),
        pdaSeedValueNode(
          "updateAuthority",
          argumentValueNode("updateAuthority")
        ),
      ]),
    },
  },
  arguments: {
    updateAuthority: {
      type: publicKeyTypeNode(),
      defaultValue: accountValueNode("authority"),
    },
  },
});
const updateAsMetadataDelegateDefaults = (role) => ({
  accounts: {
    delegateRecord: {
      defaultValue: pdaValueNode("metadataDelegateRecord", [
        pdaSeedValueNode(
          "delegateRole",
          enumValueNode("MetadataDelegateRole", role)
        ),
        pdaSeedValueNode(
          "updateAuthority",
          argumentValueNode("updateAuthority")
        ),
        pdaSeedValueNode("delegate", accountValueNode("authority")),
      ]),
    },
    token:
      role === "ProgrammableConfigItem"
        ? { isOptional: false, defaultValue: null }
        : { isOptional: true, defaultValue: null },
  },
  arguments: {
    updateAuthority: {
      type: publicKeyTypeNode(),
      defaultValue: identityValueNode(),
    },
  },
});
const updateAsMetadataCollectionDelegateDefaults = (role) => ({
  accounts: {
    delegateRecord: {
      defaultValue: pdaValueNode("metadataDelegateRecord", [
        pdaSeedValueNode("mint", argumentValueNode("delegateMint")),
        pdaSeedValueNode(
          "delegateRole",
          enumValueNode("MetadataDelegateRole", role)
        ),
        pdaSeedValueNode(
          "updateAuthority",
          argumentValueNode("delegateUpdateAuthority")
        ),
        pdaSeedValueNode("delegate", accountValueNode("authority")),
      ]),
    },
    token:
      role === "ProgrammableConfig"
        ? { isOptional: false, defaultValue: null }
        : { isOptional: true, defaultValue: null },
  },
  arguments: {
    delegateMint: {
      type: publicKeyTypeNode(),
      defaultValue: accountValueNode("mint"),
    },
    delegateUpdateAuthority: {
      type: publicKeyTypeNode(),
      defaultValue: identityValueNode(),
    },
  },
});
const verifyCollectionDefaults = {
  accounts: {
    collectionMint: { isOptional: false, defaultValue: null },
    collectionMetadata: {
      defaultValue: pdaValueNode("metadata", [
        pdaSeedValueNode("mint", accountValueNode("collectionMint")),
      ]),
    },
    collectionMasterEdition: {
      defaultValue: pdaValueNode("masterEdition", [
        pdaSeedValueNode("mint", accountValueNode("collectionMint")),
      ]),
    },
  },
};
codama.update(
  updateInstructionsVisitor({
    createV1: {
      //   byteDeltas: [
      //     instructionByteDeltaNode(resolverValueNode("resolveCreateV1Bytes")),
      //   ],
      accounts: {
        masterEdition: {
          defaultValue: conditionalValueNode({
            condition: resolverValueNode("resolveIsNonFungible", {
              dependsOn: [argumentValueNode("tokenStandard")],
            }),
            ifTrue: pdaValueNode("masterEdition"),
          }),
        },
      },
      arguments: {
        isCollection: {
          type: booleanTypeNode(),
          defaultValue: booleanValueNode(false),
        },
        tokenStandard: {
          defaultValue: enumValueNode("TokenStandard", "NonFungible"),
        },
        collectionDetails: {
          defaultValue: resolverValueNode("resolveCollectionDetails", {
            dependsOn: [argumentValueNode("isCollection")],
          }),
        },
        decimals: {
          defaultValue: resolverValueNode("resolveDecimals", {
            dependsOn: [argumentValueNode("tokenStandard")],
          }),
        },
        printSupply: {
          defaultValue: resolverValueNode("resolvePrintSupply", {
            dependsOn: [argumentValueNode("tokenStandard")],
          }),
        },
        creators: {
          defaultValue: resolverValueNode("resolveCreators", {
            dependsOn: [accountValueNode("authority")],
          }),
        },
      },
    },
    printV1: {
      accounts: {
        editionMarkerPda: {
          defaultValue: conditionalValueNode({
            condition: argumentValueNode("tokenStandard"),
            value: enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: pdaValueNode("editionMarkerV2", [
              pdaSeedValueNode("mint", argumentValueNode("masterEditionMint")),
            ]),
            ifFalse: pdaValueNode(
              pdaLinkNode("editionMarkerFromEditionNumber", "hooked"),
              [
                pdaSeedValueNode(
                  "mint",
                  argumentValueNode("masterEditionMint")
                ),
                pdaSeedValueNode(
                  "editionNumber",
                  argumentValueNode("editionNumber")
                ),
              ]
            ),
          }),
        },
        editionMintAuthority: {
          defaultValue: accountValueNode("masterTokenAccountOwner"),
        },
        masterTokenAccountOwner: {
          defaultValue: identityValueNode(),
          isSigner: true,
        },
      },
      arguments: { edition: { name: "editionNumber" } },
    },
    printV2: {
      accounts: {
        editionMarkerPda: {
          defaultValue: conditionalValueNode({
            condition: argumentValueNode("tokenStandard"),
            value: enumValueNode("TokenStandard", "ProgrammableNonFungible"),
            ifTrue: pdaValueNode("editionMarkerV2", [
              pdaSeedValueNode("mint", argumentValueNode("masterEditionMint")),
            ]),
            ifFalse: pdaValueNode(
              pdaLinkNode("editionMarkerFromEditionNumber", "hooked"),
              [
                pdaSeedValueNode(
                  "mint",
                  argumentValueNode("masterEditionMint")
                ),
                pdaSeedValueNode(
                  "editionNumber",
                  argumentValueNode("editionNumber")
                ),
              ]
            ),
          }),
        },
        editionMintAuthority: {
          defaultValue: conditionalValueNode({
            condition: accountValueNode("holderDelegateRecord"),
            ifTrue: conditionalValueNode({
              condition: accountValueNode("delegate"),
              ifTrue: accountValueNode("delegate"),
              ifFalse: accountValueNode("payer"),
            }),
            ifFalse: identityValueNode(),
          }),
        },
        masterTokenAccountOwner: {
          defaultValue: conditionalValueNode({
            condition: accountValueNode("holderDelegateRecord"),
            ifFalse: identityValueNode(),
          }),
        },
      },
      arguments: { edition: { name: "editionNumber" } },
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
        tokenRecord: { defaultValue: programIdValueNode() },
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
        tokenRecord: { defaultValue: programIdValueNode() },
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
const jsDirWeb3js2 = path.join(clientDir, "js", "web3js2", "src", "generated");
// const jsDirUmi = path.join(clientDir, "js", "umi", "src", "generated");
const prettier = require(path.join(clientDir, "js", "web3js2", ".prettierrc.json"));

codama.accept(
  renderJavaScriptVisitor(jsDirWeb3js2, { prettierOptions: prettier })
);
// codama.accept(
//   renderJavaScriptUmiVisitor(jsDirUmi, { prettierOptions: prettier })
// );

// Render Rust.
// const crateDir = path.join(clientDir, "rust");
// const rustDir = path.join(clientDir, "rust", "src", "generated");
// codama.accept(
//   renderRustVisitor(rustDir, {
//     formatCode: true,
//     crateFolder: crateDir,
//     renderParentInstructions: true,
//   })
// );
