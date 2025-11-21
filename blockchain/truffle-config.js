module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,       // Ganache GUI default
      network_id: "5777",
      from: "0x4d4F83388d5c49d512Ed32765d4a92A5A8fa16aD", // Chairman as deployer
    },
  },
  mocha: {
    timeout: 100000,
  },
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: { enabled: true, runs: 200 }
      }
    }
  },
  db: { enabled: false }
};
