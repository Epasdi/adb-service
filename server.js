const express = require("express");
const { exec } = require("child_process");

const app = express();
app.use(express.json());

// Healthcheck
app.get("/", (req, res) => {
  res.send("OK");
});

// Endpoint /adb
app.post("/adb", (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: "command requerido" });

  exec(`adb -s 127.0.0.1:5555 ${command}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr || error.message });
    }
    res.json({ output: stdout });
  });
});

// Endpoint /send
app.post("/send", (req, res) => {
  const { number, message } = req.body;
  if (!number || !message) {
    return res.status(400).json({ error: "number y message son requeridos" });
  }

  exec(`adb -s 127.0.0.1:5555 shell input text '${message}'`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr || error.message });
    }
    res.json({ success: true, sent: { number, message } });
  });
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`ADB microservice running on port ${PORT}`);
});
