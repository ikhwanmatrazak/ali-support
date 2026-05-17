"use client";
import { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { api } from "@/lib/api";
import type { OverviewStats, TrendPoint } from "@/lib/types";

interface AgentPerfData {
  agent: { id: number; name: string };
  tickets_resolved: number;
  avg_response_time_minutes: number | null;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [perf, setPerf] = useState<AgentPerfData[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<OverviewStats>("/reports/overview"),
      api.get<TrendPoint[]>("/reports/trends?days=30"),
      api.get<AgentPerfData[]>("/reports/agent-performance"),
    ]).then(([s, t, p]) => {
      setStats(s.data);
      setTrends(t.data);
      setPerf(p.data);
    });
  }, []);

  if (!stats) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat label="Open" value={stats.total_open} sub="tickets" from="from-orange-400" to="to-amber-500" shadow="shadow-amber-400/30" />
        <MiniStat label="In Progress" value={stats.total_in_progress} sub="tickets" from="from-blue-500" to="to-indigo-600" shadow="shadow-blue-500/30" />
        <MiniStat label="Resolved" value={stats.total_resolved} sub="all time" from="from-emerald-400" to="to-teal-500" shadow="shadow-emerald-400/30" />
        <MiniStat
          label="Avg Response"
          value={stats.avg_response_time_minutes ? `${stats.avg_response_time_minutes.toFixed(0)}m` : "—"}
          sub="to first reply"
          from="from-violet-500"
          to="to-purple-600"
          shadow="shadow-violet-500/30"
        />
      </div>

      {/* Trend chart */}
      <div className="bg-white rounded-3xl shadow-soft p-6">
        <h2 className="font-semibold text-slate-700 mb-5">Ticket Volume — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trends}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", fontSize: "12px" }} />
            <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#g)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Agent performance bar chart */}
      <div className="bg-white rounded-3xl shadow-soft p-6">
        <h2 className="font-semibold text-slate-700 mb-5">Agent Performance</h2>
        <ResponsiveContainer width="100%" height={Math.max(180, perf.length * 48)}>
          <BarChart data={perf} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="agent.name" tick={{ fontSize: 12, fill: "#64748b" }} width={100} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", fontSize: "12px" }} />
            <Bar dataKey="tickets_resolved" fill="#3b82f6" radius={[0, 8, 8, 0]} name="Resolved" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Response time table */}
      <div className="bg-white rounded-3xl shadow-soft p-6">
        <h2 className="font-semibold text-slate-700 mb-4">Response Time by Agent</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-3 text-xs font-bold text-slate-400 uppercase tracking-widest px-4 pb-2">
            <span>Agent</span>
            <span className="text-right">Resolved</span>
            <span className="text-right">Avg Response</span>
          </div>
          {perf.map((p) => (
            <div key={p.agent.id} className="grid grid-cols-3 items-center bg-slate-50 rounded-2xl px-4 py-3 text-sm">
              <span className="font-medium text-slate-800">{p.agent.name}</span>
              <span className="text-right text-slate-600">{p.tickets_resolved}</span>
              <span className="text-right text-slate-600">
                {p.avg_response_time_minutes ? `${p.avg_response_time_minutes.toFixed(0)} min` : "—"}
              </span>
            </div>
          ))}
          {perf.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">No performance data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub, from, to, shadow }: {
  label: string;
  value: number | string;
  sub: string;
  from: string;
  to: string;
  shadow: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${from} ${to} rounded-3xl p-5 shadow-lg ${shadow} text-white`}>
      <div className="text-xs text-white/70 mb-1">{label}</div>
      <div className="text-2xl font-bold mb-0.5">{value}</div>
      <div className="text-xs text-white/60">{sub}</div>
    </div>
  );
}
