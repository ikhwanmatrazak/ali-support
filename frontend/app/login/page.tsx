"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Button } from "@heroui/react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("agent", JSON.stringify(data.agent));
      router.push("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}
    >
      {/* Background glow blobs */}
      <div
        className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
      />

      {/* Glass card */}
      <div className="relative w-full max-w-sm glass rounded-4xl p-8 shadow-float border border-white/10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/40 text-white text-xl font-extrabold">
            AS
          </div>
          <h1 className="text-2xl font-bold text-white">Ali Support</h1>
          <p className="text-slate-400 text-sm mt-1">Internal Support Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            variant="bordered"
            classNames={{
              inputWrapper:
                "rounded-2xl border-white/20 bg-white/5 hover:border-white/40 data-[focus=true]:border-blue-500",
              label: "text-slate-400",
              input: "text-white",
            }}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            variant="bordered"
            classNames={{
              inputWrapper:
                "rounded-2xl border-white/20 bg-white/5 hover:border-white/40 data-[focus=true]:border-blue-500",
              label: "text-slate-400",
              input: "text-white",
            }}
          />
          <Button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:opacity-90"
            isLoading={loading}
            size="lg"
          >
            Sign In
          </Button>
        </form>

        <p className="text-xs text-slate-600 text-center mt-6">
          Ali Support v1.0 · Powered by Baileys + FastAPI
        </p>
      </div>
    </div>
  );
}
