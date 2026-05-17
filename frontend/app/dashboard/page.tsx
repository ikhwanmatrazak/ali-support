"use client";
import { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
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
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Dashboard</h1>
      <p className="text-slate-500 text-sm mb-8">Welcome back — here&apos;s your support overview.</p>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GradCard
          label="Open Tickets"
          value={stats?.total_open ?? "—"}
          icon="🔓"
          from="from-orange-400"
          to="to-amber-500"
          shadow="shadow-amber-400/30"
        />
        <GradCard
          label="In Progress"
          value={stats?.total_in_progress ?? "—"}
          icon="⚡"
          from="from-blue-500"
          to="to-indigo-600"
          shadow="shadow-blue-500/30"
        />
        <GradCard
          label="Resolved"
          value={stats?.total_resolved ?? "—"}
          icon="✅"
          from="from-emerald-400"
          to="to-teal-500"
          shadow="shadow-emerald-400/30"
        />
        <GradCard
          label="Today"
          value={stats?.tickets_today ?? "—"}
          icon="📅"
          from="from-violet-500"
          to="to-purple-600"
          shadow="shadow-violet-500/30"
        />
      </div>

      {/* Avg response time */}
      {stats?.avg_response_time_minutes != null && (
        <div className="bg-white rounded-3xl shadow-soft p-5 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-xl shadow-lg shadow-sky-400/30 flex-shrink-0">
            ⏱️
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Average Response Time</div>
            <div className="text-xl font-bold text-slate-800">
              {stats.avg_response_time_minutes.toFixed(0)} min
            </div>
          </div>
        </div>
      )}

      {/* Trend chart */}
      <div className="bg-white rounded-3xl shadow-soft p-6">
        <h2 className="font-semibold text-slate-700 mb-5">Ticket Volume — Last 30 Days</h2>
        {trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", fontSize: "12px" }}
              />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#colorCount)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-400">
            {stats ? "No data yet" : <Spinner />}
          </div>
        )}
      </div>
    </div>
  );
}

function GradCard({
  label, value, icon, from, to, shadow,
}: {
  label: string;
  value: number | string;
  icon: string;
  from: string;
  to: string;
  shadow: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${from} ${to} rounded-3xl p-5 shadow-lg ${shadow} text-white`}>
      <div className="text-2xl mb-3">{icon}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-xs text-white/70">{label}</div>
    </div>
  );
}
