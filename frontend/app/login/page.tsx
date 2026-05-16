"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Input, Button } from "@heroui/react";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardBody className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">AS</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Ali Support</h1>
            <p className="text-gray-500 text-sm mt-1">Internal Support Dashboard</p>
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
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              variant="bordered"
            />
            <Button
              type="submit"
              color="primary"
              className="w-full"
              isLoading={loading}
              size="lg"
            >
              Sign In
            </Button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            Ali Support v1.0 · Powered by Baileys + FastAPI
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
