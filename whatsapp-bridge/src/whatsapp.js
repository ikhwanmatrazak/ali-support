import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  downloadMediaMessage,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import pino from "pino";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";

const logger = pino({ level: "silent" });

const SESSIONS_DIR = "./sessions";
const MEDIA_DIR = "./media";
const BACKEND_WEBHOOK = process.env.BACKEND_WEBHOOK_URL || "http://backend:8000/webhook/whatsapp/incoming";
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || "change_me_bridge_secret";

fs.mkdirSync(SESSIONS_DIR, { recursive: true });
fs.mkdirSync(MEDIA_DIR, { recursive: true });

let sock = null;
let isConnected = false;
let qrString = null;
let reconnectTimer = null;

export function getConnectionStatus() {
  return { isConnected, qrString };
}

export async function sendMessage(to, message) {
  if (!sock || !isConnected) {
    throw new Error("WhatsApp not connected");
  }
  // Normalize phone: strip non-digits, append @s.whatsapp.net
  const jid = to.replace(/\D/g, "") + "@s.whatsapp.net";
  await sock.sendMessage(jid, { text: message });
}

export async function connectWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSIONS_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger,
    auth: state,
    printQRInTerminal: false,
    browser: ["Ali Support", "Chrome", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrString = qr;
      console.log("\n📱 Scan this QR code with WhatsApp:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      isConnected = true;
      qrString = null;
      console.log("✅ WhatsApp connected!");
    }

    if (connection === "close") {
      isConnected = false;
      const shouldReconnect =
        lastDisconnect?.error instanceof Boom &&
        lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;

      console.log("⚠️  WhatsApp disconnected. Reconnecting:", shouldReconnect);

      if (shouldReconnect) {
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectWhatsApp, 5000);
      } else {
        console.log("🚫 Logged out. Delete sessions/ folder and restart to re-scan QR.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue; // ignore messages sent by us
      if (!msg.message) continue;

      const from = msg.key.remoteJid?.replace("@s.whatsapp.net", "");
      if (!from) continue;

      let content = "";
      let mediaUrl = null;
      let mediaType = null;

      const msgContent = msg.message;

      if (msgContent.conversation) {
        content = msgContent.conversation;
      } else if (msgContent.extendedTextMessage?.text) {
        content = msgContent.extendedTextMessage.text;
      } else if (msgContent.imageMessage) {
        content = msgContent.imageMessage.caption || "[Image]";
        mediaType = "image";
        try {
          const buffer = await downloadMediaMessage(msg, "buffer", {});
          const filename = `${msg.key.id}.jpg`;
          const filepath = path.join(MEDIA_DIR, filename);
          fs.writeFileSync(filepath, buffer);
          mediaUrl = `/media/${filename}`;
        } catch (e) {
          console.error("Failed to download image:", e.message);
        }
      } else if (msgContent.documentMessage) {
        content = msgContent.documentMessage.caption || msgContent.documentMessage.fileName || "[Document]";
        mediaType = "document";
      } else if (msgContent.audioMessage) {
        content = "[Voice Note]";
        mediaType = "audio";
      } else {
        // Unsupported message type — skip silently
        continue;
      }

      // Forward to FastAPI backend
      try {
        await fetch(BACKEND_WEBHOOK, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-bridge-secret": BRIDGE_SECRET,
          },
          body: JSON.stringify({
            from_number: from,
            message_id: msg.key.id,
            content,
            media_url: mediaUrl,
            media_type: mediaType,
            timestamp: msg.messageTimestamp,
          }),
        });
      } catch (e) {
        console.error("Failed to forward message to backend:", e.message);
      }
    }
  });
}
