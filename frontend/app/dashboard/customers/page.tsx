"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Spinner } from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = search ? `?q=${encodeURIComponent(search)}` : "";
    api.get<Customer[]>(`/customers${params}`).then((r) => {
      setCustomers(r.data);
      setLoading(false);
    });
  }, [search]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Customers</h1>
      <Input
        placeholder="Search by name or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm mb-6"
        variant="bordered"
        classNames={{
          inputWrapper: "rounded-2xl border-slate-200 bg-white hover:border-blue-400",
        }}
      />
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : customers.length === 0 ? (
        <div className="text-center py-20 text-slate-400">No customers found</div>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <div
              key={c.id}
              onClick={() => router.push(`/dashboard/customers/${c.id}`)}
              className="bg-white rounded-3xl shadow-soft px-5 py-4 flex items-center gap-4 cursor-pointer hover:shadow-card transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(c.name || c.whatsapp_number).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 text-sm">
                  {c.name || <span className="text-slate-400 italic">Unknown</span>}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">{c.whatsapp_number}</div>
              </div>
              <div className="text-xs text-slate-400 flex-shrink-0 hidden sm:block">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
              </div>
              <span className="text-slate-300 group-hover:text-blue-400 transition-colors">›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
