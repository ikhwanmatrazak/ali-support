"use client";
import { useEffect, useState } from "react";
import { Card, CardBody, Chip } from "@heroui/react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";
import type { OverviewStats, TrendPoint } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);

  useEffect(() => {
    api.get<OverviewStats>("/reports/overview").then((r) => setStats(r.data));
    api.get<TrendPoint[]>("/reports/trends?days=30").then((r) => setTrends(r.data));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Open Tickets" value={stats?.total_open ?? "—"} color="warning" icon="🔓" />
        <StatCard label="In Progress" value={stats?.total_in_progress ?? "—"} color="primary" icon="⚡" />
        <StatCard label="Resolved" value={stats?.total_resolved ?? "—"} color="success" icon="✅" />
        <StatCard label="Today" value={stats?.tickets_today ?? "—"} color="default" icon="📅" />
      </div>

      {/* Avg response time */}
      {stats?.avg_response_time_minutes !== null && (
        <Card className="mb-8">
          <CardBody className="flex flex-row items-center gap-4 py-4">
            <span className="text-2xl">⏱️</span>
            <div>
              <div className="text-sm text-gray-500">Average Response Time</div>
              <div className="text-xl font-bold text-gray-900">
                {stats?.avg_response_time_minutes?.toFixed(0)} min
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Trend chart */}
      <Card>
        <CardBody>
          <h2 className="font-semibold text-gray-700 mb-4">Ticket Volume — Last 30 Days</h2>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006FEE" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#006FEE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#006FEE" fill="url(#colorCount)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400">No data yet</div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  color: "warning" | "primary" | "success" | "default";
  icon: string;
}) {
  return (
    <Card>
      <CardBody className="py-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg">{icon}</span>
          <Chip color={color} size="sm" variant="flat">&nbsp;</Chip>
        </div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500 mt-1">{label}</div>
      </CardBody>
    </Card>
  );
}
