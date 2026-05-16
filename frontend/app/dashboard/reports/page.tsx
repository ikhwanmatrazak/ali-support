"use client";
import { useEffect, useState } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { api } from "@/lib/api";
import type { OverviewStats, TrendPoint } from "@/lib/types";

// AgentPerf type extends schemas
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
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>

      {/* Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Open" value={stats.total_open} sub="tickets" />
        <Stat label="In Progress" value={stats.total_in_progress} sub="tickets" />
        <Stat label="Resolved" value={stats.total_resolved} sub="all time" />
        <Stat
          label="Avg Response"
          value={stats.avg_response_time_minutes ? `${stats.avg_response_time_minutes.toFixed(0)} min` : "—"}
          sub="to first reply"
        />
      </div>

      {/* Trend chart */}
      <Card>
        <CardBody>
          <h2 className="font-semibold text-gray-700 mb-4">Ticket Volume — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006FEE" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#006FEE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#006FEE" fill="url(#g)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Agent performance */}
      <Card>
        <CardBody>
          <h2 className="font-semibold text-gray-700 mb-4">Agent Performance</h2>
          <ResponsiveContainer width="100%" height={Math.max(200, perf.length * 50)}>
            <BarChart data={perf} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="agent.name" tick={{ fontSize: 12 }} width={100} />
              <Tooltip />
              <Bar dataKey="tickets_resolved" fill="#006FEE" radius={[0, 4, 4, 0]} name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Agent table */}
      <Card>
        <CardBody>
          <h2 className="font-semibold text-gray-700 mb-4">Response Time by Agent</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b">
                <th className="text-left py-2">Agent</th>
                <th className="text-right py-2">Tickets Resolved</th>
                <th className="text-right py-2">Avg Response</th>
              </tr>
            </thead>
            <tbody>
              {perf.map((p) => (
                <tr key={p.agent.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{p.agent.name}</td>
                  <td className="text-right text-gray-600">{p.tickets_resolved}</td>
                  <td className="text-right text-gray-600">
                    {p.avg_response_time_minutes ? `${p.avg_response_time_minutes.toFixed(0)} min` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub: string }) {
  return (
    <Card>
      <CardBody>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-2xl font-bold text-gray-900 my-1">{value}</div>
        <div className="text-xs text-gray-400">{sub}</div>
      </CardBody>
    </Card>
  );
}
