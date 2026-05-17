"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
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
      style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #ffffff 50%, #f5f0ff 100%)" }}
    >
      {/* Subtle background blobs */}
      <div
        className="absolute top-[-8%] left-[-4%] w-96 h-96 rounded-full opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, #93c5fd, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-8%] right-[-4%] w-96 h-96 rounded-full opacity-25 pointer-events-none"
        style={{ background: "radial-gradient(circle, #c4b5fd, transparent 70%)" }}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-white rounded-4xl p-8 shadow-float border border-slate-100">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 text-white text-xl font-extrabold">
            AS
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Ali Support</h1>
          <p className="text-slate-400 text-sm mt-1">Internal Support Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email field */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@ali-support.my"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:opacity-90 transition-all disabled:opacity-60 mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          Ali Support v1.0 · Powered by Baileys + FastAPI
        </p>
      </div>
    </div>
  );
}
