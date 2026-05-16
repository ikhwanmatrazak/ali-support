"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import { useWebSocket } from "@/lib/useWebSocket";
import type { Agent, WSEvent } from "@/lib/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("agent");
    const token = localStorage.getItem("token");
    if (!raw || !token) {
      router.push("/login");
      return;
    }
    setAgent(JSON.parse(raw));
  }, [router]);

  // Real-time sound + notification
  const handleWS = useCallback((event: WSEvent) => {
    if (event.event === "new_ticket") {
      const payload = event.payload as { customer?: { name?: string; whatsapp_number?: string } };
      const name = payload.customer?.name || payload.customer?.whatsapp_number || "Customer";
      toast(`New ticket from ${name}`, { icon: "🎫" });
      // Browser notification
      if (Notification.permission === "granted") {
        new Notification("New Support Ticket", { body: `From: ${name}` });
      }
      // Play sound
      playNotificationSound();
    } else if (event.event === "new_message") {
      playNotificationSound();
    }
  }, []);

  useWebSocket(handleWS);

  useEffect(() => {
    // Request notification permission on mount
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  if (!agent) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar agent={agent} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    // audio context not available
  }
}
