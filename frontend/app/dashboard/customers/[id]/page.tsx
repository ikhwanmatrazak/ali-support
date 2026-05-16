"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardBody, Chip, Button, Input, Spinner } from "@heroui/react";
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
    <div className="p-8 max-w-3xl">
      <Button variant="light" className="mb-4" onClick={() => router.push("/dashboard/customers")}>
        ← Back
      </Button>

      <Card className="mb-6">
        <CardBody className="p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Customer Profile</h1>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">WhatsApp Number</div>
              <div className="font-mono text-gray-800">{customer.whatsapp_number}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Member Since</div>
              <div className="text-gray-800">{format(new Date(customer.created_at), "dd MMM yyyy")}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-gray-500 mb-1">Display Name</div>
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  variant="bordered"
                  size="sm"
                  className="max-w-xs"
                />
                <Button size="sm" color="primary" isLoading={saving} onClick={saveName}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <h2 className="font-semibold text-gray-700 mb-3">Ticket History ({tickets.length})</h2>
      <div className="space-y-3">
        {tickets.map((t) => (
          <Card
            key={t.id}
            isPressable
            className="shadow-none border"
            onPress={() => router.push(`/dashboard/tickets/${t.id}`)}
          >
            <CardBody className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{t.subject || "Support Ticket"}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    #{t.id} · {format(new Date(t.created_at), "dd MMM yyyy")}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Chip color={STATUS_COLOR[t.status]} size="sm" variant="flat">
                    {t.status.replace("_", " ")}
                  </Chip>
                  <Chip color={PRIORITY_COLOR[t.priority]} size="sm" variant="flat">
                    {t.priority}
                  </Chip>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
        {tickets.length === 0 && <div className="text-gray-400 text-sm">No tickets yet</div>}
      </div>
    </div>
  );
}
