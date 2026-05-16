import "dotenv/config";
import express from "express";
import { connectWhatsApp, sendMessage, getConnectionStatus } from "./whatsapp.js";

const app = express();
app.use(express.json());

const PORT = process.env.BRIDGE_PORT || 3001;
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || "change_me_bridge_secret";

function authenticate(req, res, next) {
  const secret = req.headers["x-bridge-secret"];
  if (secret !== BRIDGE_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

// ── Health / status ──────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  const { isConnected, qrString } = getConnectionStatus();
  res.json({ status: "ok", whatsapp_connected: isConnected, has_qr: !!qrString });
});

// QR code endpoint (for the dashboard to display)
app.get("/qr", authenticate, (req, res) => {
  const { isConnected, qrString } = getConnectionStatus();
  if (isConnected) {
    return res.json({ connected: true });
  }
  if (!qrString) {
    return res.json({ connected: false, qr: null, message: "QR not yet generated" });
  }
  res.json({ connected: false, qr: qrString });
});

// ── Send message (called by FastAPI backend) ──────────────────────────────────
app.post("/send-message", authenticate, async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: "to and message are required" });
  }
  try {
    await sendMessage(to, message);
    res.json({ ok: true });
  } catch (err) {
    console.error("Send error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌐 WhatsApp bridge listening on port ${PORT}`);
});

connectWhatsApp().catch(console.error);
