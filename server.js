const express = require("express");
const { execFile } = require("child_process");

const app = express();
app.use(express.json());

// === Config ===
const API_TOKEN  = process.env.API_TOKEN  || "cad4e21f28e4b78b1023886e087763c7c6501be3f6b2c86e5fbf8d2e7cc24d26";
const ADB_HOST   = process.env.ADB_HOST   || "10.0.2.1";       // bridge Docker en tu host
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
function adbArgs(extra = []) {
  return ["-H", ADB_HOST, "-P", ADB_PORT, ...extra];
}
function encodeForInputText(str = "") {
  return String(str)
    .replace(/%/g, "%25")
    .replace(/\\/g, "\\\\")
    .replace(/ /g, "%s");
}
function waitForDevice(cb) {
  const args = adbArgs(["-s", ADB_DEVICE, "wait-for-device"]);
  execFile("adb", args, { timeout: 20000 }, (err, stdout, stderr) => {
    if (err) cb(stderr || err.message);
    else cb(null);
  });
}

// === /adb : ejecutar comando libre ===
app.post("/adb", (req, res) => {
  const { command } = req.body || {};
  if (!command || typeof command !== "string") {
    return res.status(400).json({ error: "command requerido" });
  }
  const userArgs = command.trim().split(/\s+/);
  const args = adbArgs(userArgs);

  execFile("adb", args, { timeout: 20000 }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: (stderr || err.message) });
    res.json({ output: stdout.trim() });
  });
});

// === /send : abrir chat y enviar texto en WhatsApp ===
app.post("/send", (req, res) => {
  const { number, message } = req.body || {};
  if (!number || !message) {
    return res.status(400).json({ error: "number y message son requeridos" });
  }
  const text = encodeForInputText(message);

  waitForDevice((errWait) => {
    if (errWait) return res.status(500).json({ error: errWait });

    const openArgs = adbArgs([
      "-s", ADB_DEVICE, "shell", "am", "start",
      "-a", "android.intent.action.VIEW",
      "-d", `https://wa.me/${number}`
    ]);

    execFile("adb", openArgs, { timeout: 20000 }, (err1, out1, errOut1) => {
      if (err1) return res.status(500).json({ error: errOut1 || err1.message });

      setTimeout(() => {
        const typeArgs = adbArgs(["-s", ADB_DEVICE, "shell", "input", "text", text]);
        execFile("adb", typeArgs, { timeout: 20000 }, (err2, out2, errOut2) => {
          if (err2) return res.status(500).json({ error: errOut2 || err2.message });

          const enterArgs = adbArgs(["-s", ADB_DEVICE, "shell", "input", "keyevent", "66"]);
          execFile("adb", enterArgs, { timeout: 20000 }, (err3, out3, errOut3) => {
            if (err3) return res.status(500).json({ error: errOut3 || err3.message });
            res.json({ success: true, sent: { number, message } });
          });
        });
      }, 700);
    });
  });
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`✅ ADB microservice running on port ${PORT}`);
});
