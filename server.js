const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");

const app = express();
app.use(bodyParser.json());

// Test route
app.get("/", (req, res) => {
  res.send("ADB microservice is running 🚀");
});

// Execute ADB shell commands
app.post("/shell", (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: "Missing command" });
  }

  exec(`adb ${command}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr });
    }
    res.json({ output: stdout });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ADB microservice running on port ${PORT}`);
});
