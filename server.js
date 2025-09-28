import express from "express";
import { exec } from "child_process";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3010;

// 🔐 Middleware de autenticación (como ya tienes con Bearer)
app.use((req, res, next) => {
  const auth = req.headers["authorization"];
  if (!auth || auth !== `Bearer ${process.env.TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// 🚀 Endpoint para enviar mensajes por WhatsApp
app.post("/send", async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message) {
    return res.status(400).json({ error: "Faltan parámetros: number o message" });
  }

  // Formatear número sin espacios ni +
  const cleanNumber = number.replace(/\D/g, "");

  // Escapar espacios en el mensaje
  const safeMessage = message.replace(/ /g, "%s");

  try {
    // 1️⃣ Abrir chat en WhatsApp
    await runCommand(
      `adb -s 127.0.0.1:5555 shell am start -a android.intent.action.VIEW -d "https://wa.me/${cleanNumber}"`
    );

    // 2️⃣ Escribir el mensaje
    await runCommand(
      `adb -s 127.0.0.1:5555 shell input text "${safeMessage}"`
    );

    // 3️⃣ Enviar (Enter)
    await runCommand(
      `adb -s 127.0.0.1:5555 shell input keyevent 66`
    );

    res.json({ success: true, number, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper para ejecutar comandos shell
function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || stdout || error.message));
      } else {
        resolve(stdout);
      }
    });
  });
}

app.listen(PORT, () => {
  console.log(`✅ ADB microservice running on port ${PORT}`);
});
