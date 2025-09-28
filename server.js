const express = require("express");
const { execFile } = require("child_process");

const app = express();
app.use(express.json());

// === Config ===
const API_TOKEN  = process.env.API_TOKEN
  || "cad4e21f28e4b78b1023886e087763c7c6501be3f6b2c86e5fbf8d2e7cc24d26";
const ADB_HOST   = process.env.ADB_HOST   || "127.0.0.1";         // host.docker.internal (mac/win) o 172.17.0.1 (linux+docker)
const ADB_PORT   = process.env.ADB_PORT   || "5037";
const ADB_DEVICE = process.env.ADB_DEVICE || "127.0.0.1:5555";

// === Auth middleware ===
app.use((req, res, next) => {
  const auth = req.headers.authorization || "";
  const ok = auth.startsWith("Bearer ") && auth.slice(7) === API_TOKEN;
  if (!ok) return res.status(401).json({ error: "Unauthorized" });
  next();
});

// Helpers
function adbArgs(extra = []) { return ["-H", ADB_HOST, "-P", ADB_PORT, ...extra]; }
function exf(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 20000, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout.toString());
    });
  });
}
function encodeForInputText(s = "") {
  return String(s).replace(/%/g, "%25").replace(/\\/g, "\\\\").replace(/ /g, "%s");
}

async function ensureDevice() {
  // ¿Está ya en la lista?
  const out = await exf("adb", adbArgs(["devices"]));
  if (out.includes(ADB_DEVICE + "\tdevice")) return;

  // Si aparece unauthorized, devolvemos error claro
  if (out.includes(ADB_DEVICE + "\tunauthorized")) {
    throw new Error(`ADB ${ADB_DEVICE} aparece 'unauthorized'. Revisa el diálogo de autorización en el teléfono/emulador y vuelve a intentar.`);
  }

  // Intentar conectar
  await exf("adb", adbArgs(["connect", ADB_DEVICE]));
  const out2 = await exf("adb", adbArgs(["devices"]));
  if (!out2.includes(ADB_DEVICE + "\tdevice")) {
    throw new Error(`No se pudo conectar ${ADB_DEVICE}. devices=\n${out2.trim()}`);
  }
}

// === /adb : ejecutar comando libre ===
app.post("/adb", async (req, res) => {
  try {
    const { command } = req.body || {};
    if (!command || typeof command !== "string") {
      return res.status(400).json({ error: "command requerido" });
    }
    const userArgs = command.trim().split(/\s+/);
    const out = await exf("adb", adbArgs(userArgs));
    res.json({ output: out.trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === /send : abrir chat y enviar texto en WhatsApp ===
app.post("/send", async (req, res) => {
  try {
    const { number, message } = req.body || {};
    if (!number || !message) {
      return res.status(400).json({ error: "number y message son requeridos" });
    }

    await ensureDevice();

    // Abrir conversación
    await exf("adb", adbArgs([
      "-s", ADB_DEVICE, "shell", "am", "start",
      "-a", "android.intent.action.VIEW",
      "-d", `https://wa.me/${number}`
    ]));

    // pequeño delay para que abra
    await new Promise(r => setTimeout(r, 700));

    // Escribir y enviar
    await exf("adb", adbArgs(["-s", ADB_DEVICE, "shell", "input", "text", encodeForInputText(message)]));
    await exf("adb", adbArgs(["-s", ADB_DEVICE, "shell", "input", "keyevent", "66"]));

    res.json({ success: true, sent: { number, message } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`✅ ADB microservice running on port ${PORT}`));
