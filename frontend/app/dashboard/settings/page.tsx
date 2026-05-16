"use client";
import { useEffect, useState } from "react";
import { Card, CardBody, Button, Chip, Spinner } from "@heroui/react";
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
    <div className="p-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* WhatsApp Bridge Status */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">WhatsApp Bridge</h2>
            <Button size="sm" variant="flat" onClick={checkStatus}>Refresh</Button>
          </div>

          {loading ? (
            <Spinner />
          ) : bridge === null ? (
            <Chip color="danger" variant="flat">Bridge not reachable</Chip>
          ) : bridge.whatsapp_connected ? (
            <div className="flex items-center gap-3">
              <Chip color="success" variant="flat">Connected</Chip>
              <span className="text-sm text-gray-500">WhatsApp is online and receiving messages</span>
            </div>
          ) : (
            <div>
              <Chip color="warning" variant="flat" className="mb-4">Not Connected — Scan QR</Chip>
              {qr ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Open WhatsApp on your phone → Linked Devices → Link a device → Scan this QR:
                  </p>
                  <QRCodeDisplay value={qr} />
                </div>
              ) : (
                <p className="text-sm text-gray-500">Waiting for QR code to be generated...</p>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Default credentials reminder */}
      <Card className="border-amber-200 bg-amber-50">
        <CardBody className="p-4">
          <h3 className="font-semibold text-amber-800 mb-1">Default Admin Credentials</h3>
          <p className="text-sm text-amber-700">
            Email: <code>admin@ali-support.my</code> · Password: <code>Admin@1234</code>
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Change these immediately after first login via your agent profile.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

function QRCodeDisplay({ value }: { value: string }) {
  // Render QR as text art using the raw qr string from Baileys
  return (
    <div className="bg-white border rounded-xl p-4 inline-block">
      <pre className="text-[6px] leading-[6px] font-mono select-none">{value}</pre>
    </div>
  );
}
