"use client";
import { useEffect, useState } from "react";
import {
  Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
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
        <h1 className="text-2xl font-bold text-slate-800">Agents</h1>
        <Button
          className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 font-semibold"
          onClick={() => {
            setForm({ name: "", email: "", password: "", role: "agent" });
            onOpen();
          }}
        >
          + Add Agent
        </Button>
      </div>

      <div className="space-y-2">
        {agents.map((a) => (
          <div
            key={a.id}
            className="bg-white rounded-3xl shadow-soft px-5 py-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {a.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-800 text-sm">{a.name}</div>
              <div className="text-xs text-slate-400">{a.email}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Chip color={a.role === "admin" ? "primary" : "default"} size="sm" variant="flat">
                {a.role}
              </Chip>
              <Chip color={a.is_active ? "success" : "danger"} size="sm" variant="flat">
                {a.is_active ? "Active" : "Inactive"}
              </Chip>
              <span className="text-xs text-slate-400 hidden sm:block">
                {format(new Date(a.created_at), "dd MMM yyyy")}
              </span>
              <Button
                size="sm"
                variant="flat"
                className="rounded-2xl"
                onClick={() => toggleActive(a)}
              >
                {a.is_active ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        ))}
        {agents.length === 0 && (
          <div className="text-center py-20 text-slate-400">No agents yet</div>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={onClose} classNames={{ base: "rounded-3xl" }}>
        <ModalContent>
          <ModalHeader className="text-slate-800">Add New Agent</ModalHeader>
          <ModalBody className="gap-3">
            <Input
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-slate-200" }}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-slate-200" }}
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-slate-200" }}
            />
            <Select
              label="Role"
              selectedKeys={[form.role]}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              variant="bordered"
              classNames={{ trigger: "rounded-2xl border-slate-200" }}
            >
              <SelectItem key="agent" value="agent">Agent</SelectItem>
              <SelectItem key="admin" value="admin">Admin</SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" className="rounded-2xl" onClick={onClose}>Cancel</Button>
            <Button
              className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
              isLoading={saving}
              onClick={create}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
