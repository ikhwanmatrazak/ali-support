"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner } from "@heroui/react";
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Customers</h1>
      <Input
        placeholder="Search by name or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm mb-6"
        variant="bordered"
      />
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <Table aria-label="Customers">
          <TableHeader>
            <TableColumn>Phone Number</TableColumn>
            <TableColumn>Name</TableColumn>
            <TableColumn>Joined</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No customers found">
            {customers.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/dashboard/customers/${c.id}`)}
              >
                <TableCell className="font-mono text-sm">{c.whatsapp_number}</TableCell>
                <TableCell>{c.name || <span className="text-gray-400 italic">Unknown</span>}</TableCell>
                <TableCell className="text-gray-400 text-sm">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
