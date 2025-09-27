// server.js (versión CommonJS)
const express = require("express");
const { exec } = require("child_process");

const app = express();
app.use(express.json());

// Configuración
const PORT = process.env.PORT || 3010;
const TOKEN =
  process.env.TOKEN ||
  "cad4e21f28e4b78b1023886e087763c7c6501be3f6b2c86e5fbf8d2e7cc24d26";

// Middleware de autenticación
app.use((req, res, next) => {
  const auth = req.headers["authorization"];
  if (!auth || auth !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// Endpoint principal: ejecutar comandos ADB
app.post("/adb", (req, res) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ error: "No command provided" });
  }

  exec(`adb ${command}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr || error.message });
    }
    res.json({ output: stdout.trim() });
  });
});

// Arrancar el servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ ADB microservice running on port ${PORT}`);
});
