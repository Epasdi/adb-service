module.exports = {
  apps: [
    {
      name: "adb-service",
      script: "server.js",
      env: {
        PORT: 3010,
        TOKEN: "cad4e21f28e4b78b1023886e087763c7c6501be3f6b2c86e5fbf8d2e7cc24d26"
      }
    }
  ]
};
