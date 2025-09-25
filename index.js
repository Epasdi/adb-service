import express from "express";
import { exec } from "child_process";

const app = express();
app.use(express.json());

app.post("/send", (req, res) => {
  const { device, message } = req.body;

  if (!device || !message) {
    return res.status(400).json({ error: "device and message are required" });
  }

  // Coordenadas del dump (ajusta si cambian)
  const entryTap = "398 2163";
  const sendTap = "1003 2154";
  const safeMessage = message.replace(/ /g, "_");

  const cmd = `
    adb -s ${device} shell input tap ${entryTap} &&
    adb -s ${device} shell input text "${safeMessage}" &&
    adb -s ${device} shell input tap ${sendTap}
  `;

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr);
      return res.status(500).json({ error: "ADB command failed", details: stderr });
    }
    res.json({ success: true, stdout });
  });
});

app.listen(3000, () => {
  console.log("🚀 ADB microservice running on port 3000");
});
