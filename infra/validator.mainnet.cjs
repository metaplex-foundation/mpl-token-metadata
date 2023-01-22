const localnet = require("./validator.cjs");

module.exports = {
  ...localnet,
  validator: {
    ...localnet.validator,
    programs: [],
    accountsCluster: "https://metaplex.mainnet.rpcpool.com/",
    accounts: (localnet.validator.programs ?? []).map((program) => ({
      ...program,
      accountId: program.programId,
      executable: true,
    })),
  },
};
