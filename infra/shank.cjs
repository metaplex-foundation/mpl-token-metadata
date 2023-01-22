const path = require("path");
const { generateIdl } = require("@lorisleiva/shank-js");

const idlDir = path.join(__dirname, "..", "idls");
const binaryInstallDir = path.join(__dirname, "..", ".crates");
const programDir = path.join(__dirname, "..", "programs");

generateIdl({
  generator: "shank",
  programName: "mpl_token_metadata",
  programId: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
  idlDir,
  binaryInstallDir,
  programDir: path.join(programDir, "token-metadata"),
});
