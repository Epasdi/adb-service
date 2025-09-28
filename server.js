const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");

const app = express();
app.use(bodyParser.json());

// --- Middleware de auth sencillo ---
const TOKEN = process.env.API_TOKEN || "TU_TOKEN_SEGURO";
app.use((req, res, next) => {
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// --- Endpoint genérico /adb (ejecutar cualquier comando adb) ---
app.post("/adb", (req, res) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ error: "command requerido" });
  }

  exec(`adb ${command}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr || error.message });
    }
    res.json({ output: stdout.trim() });
  });
});

// --- Endpoint /send (enviar mensaje a WhatsApp vía adb) ---
app.post("/send", (req, res) => {
  const { number, message } = req.body;
  if (!number || !message) {
    return res.status(400).json({ error: "number y message son requeridos" });
  }

  // abrir chat de whatsapp
  const openChat = `adb -s 127.0.0.1:5555 shell am start -a android.intent.action.VIEW -d "https://wa.me/${number}"`;

  // sanitizar mensaje: reemplazar espacios por %s
  const safeMessage = message.replace(/ /g, "%s");

  const typeMessage = `adb -s 127.0.0.1:5555 shell input text "${safeMessage}"`;
  const sendEnter = `adb -s 127.0.0.1:5555 shell input keyevent 66`;

  exec(`${openChat} && ${typeMessage} && ${sendEnter}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr || error.message });
    }
    res.json({ success: true, sent: { number, message } });
  });
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`✅ ADB microservice running on port ${PORT}`);
});
