"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Button, Input, Select, SelectItem, Spinner,
} from "@heroui/react";
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          placeholder="Search customer or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
          size="sm"
          variant="bordered"
        />
        <Select
          placeholder="Status"
          size="sm"
          className="w-40"
          variant="bordered"
          onChange={(e) => setStatus(e.target.value)}
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
        >
          {["", ...CATEGORIES].map((c) => (
            <SelectItem key={c} value={c}>{c || "All categories"}</SelectItem>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <Table aria-label="Tickets" className="shadow-none">
          <TableHeader>
            <TableColumn>ID</TableColumn>
            <TableColumn>Customer</TableColumn>
            <TableColumn>Subject</TableColumn>
            <TableColumn>Category</TableColumn>
            <TableColumn>Priority</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Agent</TableColumn>
            <TableColumn>Updated</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No tickets found">
            {tickets.map((t) => (
              <TableRow
                key={t.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/dashboard/tickets/${t.id}`)}
              >
                <TableCell className="text-gray-500 text-sm">#{t.id}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{t.customer.name || t.customer.whatsapp_number}</div>
                  <div className="text-xs text-gray-400">{t.customer.whatsapp_number}</div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate text-sm">{t.subject || t.last_message || "—"}</div>
                </TableCell>
                <TableCell><span className="text-xs text-gray-500">{t.category}</span></TableCell>
                <TableCell>
                  <Chip color={PRIORITY_COLOR[t.priority]} size="sm" variant="flat">
                    {t.priority}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip color={STATUS_COLOR[t.status]} size="sm" variant="flat">
                    {t.status.replace("_", " ")}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-500">{t.assigned_agent?.name || "Unassigned"}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true })}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
