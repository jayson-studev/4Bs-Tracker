module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,       // Ganache GUI default
      network_id: "5777",
      from: "0x3C8aAB0d6e81e6054EB9428c07996D3F71B7fBdB", // Chairman as deployer
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
