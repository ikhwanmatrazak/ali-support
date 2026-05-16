"use client";
import { useEffect, useState } from "react";
import {
  Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Card, CardBody, Chip, useDisclosure, Textarea, Switch,
} from "@heroui/react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { Template } from "@/lib/types";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [form, setForm] = useState({
    name: "", trigger_keyword: "", reply_en: "", reply_bm: "", is_greeting: false,
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get<Template[]>("/templates");
    setTemplates(data);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setSelected(null);
    setForm({ name: "", trigger_keyword: "", reply_en: "", reply_bm: "", is_greeting: false });
    onOpen();
  }

  function openEdit(t: Template) {
    setSelected(t);
    setForm({
      name: t.name,
      trigger_keyword: t.trigger_keyword || "",
      reply_en: t.reply_en,
      reply_bm: t.reply_bm || "",
      is_greeting: t.is_greeting,
    });
    onOpen();
  }

  async function save() {
    setSaving(true);
    try {
      if (selected) {
        await api.put(`/templates/${selected.id}`, form);
        toast.success("Template updated");
      } else {
        await api.post("/templates", form);
        toast.success("Template created");
      }
      onClose();
      load();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(id: number) {
    if (!confirm("Delete this template?")) return;
    await api.delete(`/templates/${id}`);
    toast.success("Deleted");
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auto-Reply Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Greeting templates are sent automatically on first message. Others are quick replies for agents.
          </p>
        </div>
        <Button color="primary" onClick={openNew}>+ New Template</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((t) => (
          <Card key={t.id} className="shadow-none border">
            <CardBody className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-800 text-sm">{t.name}</span>
                {t.is_greeting && <Chip color="success" size="sm" variant="flat">Greeting</Chip>}
                {!t.is_active && <Chip color="default" size="sm" variant="flat">Inactive</Chip>}
              </div>
              {t.trigger_keyword && (
                <div className="text-xs text-gray-500 mb-1">Trigger: <code>{t.trigger_keyword}</code></div>
              )}
              <p className="text-xs text-gray-600 line-clamp-2 bg-gray-50 rounded p-2 mb-3">{t.reply_en}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="flat" onClick={() => openEdit(t)}>Edit</Button>
                {!t.is_greeting && (
                  <Button size="sm" variant="flat" color="danger" onClick={() => deleteTemplate(t.id)}>Delete</Button>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{selected ? "Edit Template" : "New Template"}</ModalHeader>
          <ModalBody className="gap-4">
            <Input
              label="Template Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              variant="bordered"
            />
            <Input
              label="Trigger Keyword (optional)"
              placeholder="e.g. refund, billing"
              value={form.trigger_keyword}
              onChange={(e) => setForm({ ...form, trigger_keyword: e.target.value })}
              variant="bordered"
              description="If set, this template is also used for auto-reply matching"
            />
            <Textarea
              label="Reply (English)"
              value={form.reply_en}
              onChange={(e) => setForm({ ...form, reply_en: e.target.value })}
              variant="bordered"
              minRows={3}
              description="Use {ticket_id} to insert ticket number"
            />
            <Textarea
              label="Reply (Bahasa Malaysia) — optional"
              value={form.reply_bm}
              onChange={(e) => setForm({ ...form, reply_bm: e.target.value })}
              variant="bordered"
              minRows={3}
            />
            <Switch
              isSelected={form.is_greeting}
              onValueChange={(v) => setForm({ ...form, is_greeting: v })}
            >
              Send as greeting on first message
            </Switch>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onClose}>Cancel</Button>
            <Button color="primary" isLoading={saving} onClick={save}>Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
