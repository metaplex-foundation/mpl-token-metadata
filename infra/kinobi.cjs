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
  path.join(idlDir, "spl_system.json"),
  path.join(idlDir, "spl_memo.json"),
  path.join(idlDir, "spl_token.json"),
  path.join(idlDir, "spl_associated_token.json"),
  path.join(idlDir, "mpl_system_extras.json"),
  path.join(idlDir, "mpl_token_extras.json"),
]);

// Rename nodes.
kinobi.update(
  new RenameNodesVisitor({
    splSystem: { prefix: "Sys" },
    splMemo: { prefix: "Memo" },
    splToken: { prefix: "Tok" },
    splAssociatedToken: { prefix: "Ata" },
    mplSystemExtras: { prefix: "SysEx" },
    mplTokenExtras: { prefix: "TokEx" },
  })
);

// Wrap leaves.
kinobi.update(
  new SetLeafWrappersVisitor({
    "splSystem.CreateAccount.lamports": { kind: "SolAmount" },
    "splSystem.TransferSol.amount": { kind: "SolAmount" },
  })
);

// Set default values for instruction accounts.
kinobi.update(
  new SetInstructionAccountDefaultValuesVisitor([
    { instruction: "TransferSol", account: "source", kind: "identity" },
    { instruction: "TransferAllSol", account: "source", kind: "identity" },
    { instruction: "MintTokensTo", account: "mintAuthority", kind: "identity" },
    {
      instruction: "CreateAssociatedToken",
      account: "owner",
      kind: "identity",
    },
    {
      instruction: "CreateAssociatedToken",
      account: "ata",
      kind: "pda",
      pdaAccount: "AssociatedToken",
      dependency: "root",
      seeds: {
        owner: { kind: "account", name: "owner" },
        mint: { kind: "account", name: "mint" },
      },
    },
    {
      instruction: "CreateTokenIfMissing",
      account: "ata",
      kind: "pda",
      pdaAccount: "AssociatedToken",
      dependency: "root",
      seeds: {
        owner: { kind: "account", name: "owner" },
        mint: { kind: "account", name: "mint" },
      },
    },
    {
      instruction: "CreateTokenIfMissing",
      account: "token",
      kind: "account",
      name: "ata",
    },
    { instruction: "CreateTokenIfMissing", account: "owner", kind: "identity" },
  ])
);

// Set instruction bytes created on chain.
kinobi.update(
  new SetInstructionBytesCreatedOnChainVisitor({
    CreateAccount: { kind: "arg", name: "space" },
    CreateAccountWithRent: { kind: "arg", name: "space" },
    CreateAssociatedToken: { kind: "account", name: "Token" },
  })
);

// Render JavaScript.
const jsDir = path.join(clientDir, "js", "src", "generated");
const prettier = require(path.join(clientDir, "js", ".prettierrc.json"));
kinobi.accept(new RenderJavaScriptVisitor(jsDir, { prettier }));
