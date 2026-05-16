"use client";
import { useEffect, useState } from "react";
import {
  Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Select, SelectItem, useDisclosure,
} from "@heroui/react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { Agent } from "@/lib/types";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "agent" });
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get<Agent[]>("/agents");
    setAgents(data);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    setSaving(true);
    try {
      await api.post("/agents", form);
      toast.success("Agent created");
      onClose();
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to create agent");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(agent: Agent) {
    await api.patch(`/agents/${agent.id}`, { is_active: !agent.is_active });
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
        <Button
          color="primary"
          onClick={() => {
            setForm({ name: "", email: "", password: "", role: "agent" });
            onOpen();
          }}
        >
          + Add Agent
        </Button>
      </div>

      <Table aria-label="Agents">
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Email</TableColumn>
          <TableColumn>Role</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Joined</TableColumn>
          <TableColumn>Action</TableColumn>
        </TableHeader>
        <TableBody>
          {agents.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.name}</TableCell>
              <TableCell className="text-gray-500">{a.email}</TableCell>
              <TableCell>
                <Chip color={a.role === "admin" ? "primary" : "default"} size="sm" variant="flat">
                  {a.role}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip color={a.is_active ? "success" : "danger"} size="sm" variant="flat">
                  {a.is_active ? "Active" : "Inactive"}
                </Chip>
              </TableCell>
              <TableCell className="text-gray-400 text-sm">
                {format(new Date(a.created_at), "dd MMM yyyy")}
              </TableCell>
              <TableCell>
                <Button size="sm" variant="flat" onClick={() => toggleActive(a)}>
                  {a.is_active ? "Deactivate" : "Activate"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Add New Agent</ModalHeader>
          <ModalBody className="gap-3">
            <Input
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              variant="bordered"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              variant="bordered"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              variant="bordered"
            />
            <Select
              label="Role"
              selectedKeys={[form.role]}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              variant="bordered"
            >
              <SelectItem key="agent" value="agent">Agent</SelectItem>
              <SelectItem key="admin" value="admin">Admin</SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onClose}>Cancel</Button>
            <Button color="primary" isLoading={saving} onClick={create}>Create</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
