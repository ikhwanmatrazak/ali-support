"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Chip, Input, Select, SelectItem, Spinner } from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/lib/api";
import { PRIORITY_COLOR, STATUS_COLOR, CATEGORIES } from "@/lib/types";
import type { TicketListItem } from "@/lib/types";

const STATUSES = ["open", "in_progress", "resolved"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (category) params.set("category", category);
    const { data } = await api.get<TicketListItem[]>(`/tickets?${params.toString()}`);
    setTickets(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [search, status, priority, category]); // eslint-disable-line

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Tickets</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          placeholder="Search customer or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
          size="sm"
          variant="bordered"
          classNames={{
            inputWrapper: "rounded-2xl border-slate-200 bg-white hover:border-blue-400",
          }}
        />
        <Select
          placeholder="Status"
          size="sm"
          className="w-40"
          variant="bordered"
          onChange={(e) => setStatus(e.target.value)}
          classNames={{ trigger: "rounded-2xl border-slate-200 bg-white" }}
        >
          {["", ...STATUSES].map((s) => (
            <SelectItem key={s} value={s}>{s || "All status"}</SelectItem>
          ))}
        </Select>
        <Select
          placeholder="Priority"
          size="sm"
          className="w-40"
          variant="bordered"
          onChange={(e) => setPriority(e.target.value)}
          classNames={{ trigger: "rounded-2xl border-slate-200 bg-white" }}
        >
          {["", ...PRIORITIES].map((p) => (
            <SelectItem key={p} value={p}>{p || "All priorities"}</SelectItem>
          ))}
        </Select>
        <Select
          placeholder="Category"
          size="sm"
          className="w-48"
          variant="bordered"
          onChange={(e) => setCategory(e.target.value)}
          classNames={{ trigger: "rounded-2xl border-slate-200 bg-white" }}
        >
          {["", ...CATEGORIES].map((c) => (
            <SelectItem key={c} value={c}>{c || "All categories"}</SelectItem>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 text-slate-400">No tickets found</div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => router.push(`/dashboard/tickets/${t.id}`)}
              className="bg-white rounded-3xl shadow-soft px-5 py-4 flex items-center gap-4 cursor-pointer hover:shadow-card transition-all group"
            >
              <div className="text-slate-400 text-sm font-mono w-10 flex-shrink-0">#{t.id}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 text-sm truncate">
                  {t.subject || t.last_message || "—"}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {t.customer.name || t.customer.whatsapp_number} · {t.category}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Chip color={PRIORITY_COLOR[t.priority]} size="sm" variant="flat">
                  {t.priority}
                </Chip>
                <Chip color={STATUS_COLOR[t.status]} size="sm" variant="flat">
                  {t.status.replace("_", " ")}
                </Chip>
                <div className="text-xs text-slate-400 w-20 text-right hidden lg:block">
                  {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true })}
                </div>
                <span className="text-slate-300 group-hover:text-blue-400 transition-colors">›</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
