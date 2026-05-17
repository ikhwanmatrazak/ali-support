"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Chip, Button, Input, Spinner } from "@heroui/react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { STATUS_COLOR, PRIORITY_COLOR } from "@/lib/types";
import type { Customer, Ticket } from "@/lib/types";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Customer>(`/customers/${id}`),
      api.get<Ticket[]>(`/customers/${id}/tickets`),
    ]).then(([cRes, tRes]) => {
      setCustomer(cRes.data);
      setName(cRes.data.name || "");
      setTickets(tRes.data);
    });
  }, [id]);

  async function saveName() {
    setSaving(true);
    try {
      const { data } = await api.patch<Customer>(`/customers/${id}`, { name });
      setCustomer(data);
      toast.success("Customer name updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  if (!customer) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="p-8 max-w-2xl">
      <button
        onClick={() => router.push("/dashboard/customers")}
        className="text-sm text-slate-500 hover:text-slate-800 mb-6 flex items-center gap-1 transition-colors"
      >
        ← Back to Customers
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-3xl shadow-soft p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-400/30">
            {(customer.name || customer.whatsapp_number).charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{customer.name || "Unknown Customer"}</h1>
            <div className="text-sm text-slate-400 font-mono mt-0.5">{customer.whatsapp_number}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="text-xs text-slate-500 mb-1">WhatsApp</div>
            <div className="font-mono text-slate-700 text-sm">{customer.whatsapp_number}</div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="text-xs text-slate-500 mb-1">Member Since</div>
            <div className="text-slate-700 text-sm">{format(new Date(customer.created_at), "dd MMM yyyy")}</div>
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 mb-2">Display Name</div>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              variant="bordered"
              size="sm"
              placeholder="Enter display name"
              classNames={{
                inputWrapper: "rounded-2xl border-slate-200 bg-white hover:border-blue-400",
              }}
            />
            <Button
              size="sm"
              className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 flex-shrink-0"
              isLoading={saving}
              onClick={saveName}
            >
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Ticket history */}
      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
        Ticket History ({tickets.length})
      </div>
      <div className="space-y-2">
        {tickets.map((t) => (
          <div
            key={t.id}
            onClick={() => router.push(`/dashboard/tickets/${t.id}`)}
            className="bg-white rounded-3xl shadow-soft px-5 py-4 flex items-center gap-4 cursor-pointer hover:shadow-card transition-all group"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800">{t.subject || "Support Ticket"}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                #{t.id} · {format(new Date(t.created_at), "dd MMM yyyy")}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Chip color={STATUS_COLOR[t.status]} size="sm" variant="flat">
                {t.status.replace("_", " ")}
              </Chip>
              <Chip color={PRIORITY_COLOR[t.priority]} size="sm" variant="flat">
                {t.priority}
              </Chip>
              <span className="text-slate-300 group-hover:text-blue-400 transition-colors">›</span>
            </div>
          </div>
        ))}
        {tickets.length === 0 && (
          <div className="text-slate-400 text-sm text-center py-8">No tickets yet</div>
        )}
      </div>
    </div>
  );
}
