const path = require("path");
const {
  Kinobi,
  RenderJavaScriptVisitor,
  SetInstructionAccountDefaultValuesVisitor,
  SetLeafWrappersVisitor,
  RenameNodesVisitor,
  SetInstructionBytesCreatedOnChainVisitor,
} = require("@lorisleiva/kinobi");

// Paths.
const clientDir = path.join(__dirname, "..", "clients");
const idlDir = path.join(__dirname, "..", "idls");

// Instanciate Kinobi.
const kinobi = new Kinobi([
  path.join(idlDir, "mpl_token_auth_rules.json"),
  path.join(idlDir, "mpl_token_metadata.json"),
]);

// Rename nodes.
kinobi.update(
  new RenameNodesVisitor({
    mplTokenAuthRules: {
      prefix: "Ta",
      types: { Key: "TokenAuthRulesKey" },
    },
    mplTokenMetadata: {
      prefix: "Tm",
      types: {
        Key: "TokenMetadataKey",
        Payload: "TmPayload",
        PayloadType: "TmPayloadType",
      },
    },
  })
);

// Wrap leaves.
kinobi.update(
  new SetLeafWrappersVisitor({
    // "splSystem.CreateAccount.lamports": { kind: "SolAmount" },
  })
);

// Set default values for instruction accounts.
kinobi.update(
  new SetInstructionAccountDefaultValuesVisitor([
    // { instruction: "TransferSol", account: "source", kind: "identity" },
  ])
);

// Set instruction bytes created on chain.
kinobi.update(
  new SetInstructionBytesCreatedOnChainVisitor({
    // CreateAccount: { kind: "arg", name: "space" },
  })
);

// Render JavaScript.
const jsDir = path.join(clientDir, "js", "src", "generated");
const prettier = require(path.join(clientDir, "js", ".prettierrc.json"));
kinobi.accept(new RenderJavaScriptVisitor(jsDir, { prettier }));
