"use client";
import { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "@/lib/api";

interface BridgeStatus {
  whatsapp_connected: boolean;
  has_qr: boolean;
}

interface QRResponse {
  connected: boolean;
  qr: string | null;
}

export default function SettingsPage() {
  const [bridge, setBridge] = useState<BridgeStatus | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function checkStatus() {
    try {
      const { data } = await api.get<BridgeStatus>("/bridge/status");
      setBridge(data);
      if (!data.whatsapp_connected && data.has_qr) {
        const { data: qrData } = await api.get<QRResponse>("/bridge/qr");
        setQr(qrData.qr);
      } else {
        setQr(null);
      }
    } catch {
      setBridge(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Settings</h1>

      {/* WhatsApp Bridge Status */}
      <div className="bg-white rounded-3xl shadow-soft p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg shadow-lg shadow-emerald-400/30">
              📱
            </div>
            <div>
              <div className="font-semibold text-slate-800">WhatsApp Bridge</div>
              <div className="text-xs text-slate-400">Baileys connection status</div>
            </div>
          </div>
          <button
            onClick={checkStatus}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <Spinner />
        ) : bridge === null ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
            <span className="text-sm text-red-600 font-medium">Bridge not reachable</span>
          </div>
        ) : bridge.whatsapp_connected ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse"></div>
            <span className="text-sm text-emerald-700 font-medium">Connected — receiving messages</span>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl mb-4">
              <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
              <span className="text-sm text-amber-700 font-medium">Not Connected — scan QR to link</span>
            </div>
            {qr ? (
              <div>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                  Open WhatsApp on your phone → <strong>Linked Devices</strong> → <strong>Link a device</strong> → Scan this QR:
                </p>
                <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 inline-block">
                  <QRCodeSVG value={qr} size={220} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Waiting for QR code to be generated...</p>
            )}
          </div>
        )}
      </div>

      {/* Credentials reminder */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-lg">⚠️</span>
          <span className="font-semibold text-amber-800 text-sm">Default Admin Credentials</span>
        </div>
        <p className="text-sm text-amber-700 mb-1">
          Email: <code className="bg-amber-100 px-1.5 py-0.5 rounded-lg">admin@ali-support.my</code>
          {" "}· Password: <code className="bg-amber-100 px-1.5 py-0.5 rounded-lg">Admin@1234</code>
        </p>
        <p className="text-xs text-amber-600 mt-2">
          Change these immediately after first login.
        </p>
      </div>
    </div>
  );
}
