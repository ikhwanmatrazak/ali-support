"use client";
import { useEffect, useState } from "react";
import {
  Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Chip, useDisclosure, Textarea, Switch,
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
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Auto-Reply Templates</h1>
          <p className="text-sm text-slate-500 mt-1">
            Greeting templates are sent automatically on first message. Others are quick replies for agents.
          </p>
        </div>
        <Button
          className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 font-semibold flex-shrink-0"
          onClick={openNew}
        >
          + New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-20 text-slate-400">No templates yet.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-3xl shadow-soft p-5">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-semibold text-slate-800 text-sm">{t.name}</span>
                {t.is_greeting && <Chip color="success" size="sm" variant="flat">Greeting</Chip>}
                {!t.is_active && <Chip color="default" size="sm" variant="flat">Inactive</Chip>}
              </div>
              {t.trigger_keyword && (
                <div className="text-xs text-slate-500 mb-2">
                  Trigger: <code className="bg-slate-100 px-1.5 py-0.5 rounded-lg">{t.trigger_keyword}</code>
                </div>
              )}
              <div className="text-xs text-slate-600 bg-slate-50 rounded-2xl p-3 mb-4 line-clamp-2">
                {t.reply_en}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(t)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  Edit
                </button>
                {!t.is_greeting && (
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-600 px-3 py-1.5 rounded-2xl bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalContent className="rounded-3xl">
          <ModalHeader className="text-slate-800">{selected ? "Edit Template" : "New Template"}</ModalHeader>
          <ModalBody className="gap-4">
            <Input
              label="Template Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-slate-200" }}
            />
            <Input
              label="Trigger Keyword (optional)"
              placeholder="e.g. refund, billing"
              value={form.trigger_keyword}
              onChange={(e) => setForm({ ...form, trigger_keyword: e.target.value })}
              variant="bordered"
              description="If set, this template is also used for auto-reply matching"
              classNames={{ inputWrapper: "rounded-2xl border-slate-200" }}
            />
            <Textarea
              label="Reply (English)"
              value={form.reply_en}
              onChange={(e) => setForm({ ...form, reply_en: e.target.value })}
              variant="bordered"
              minRows={3}
              description="Use {ticket_id} to insert ticket number"
              classNames={{ inputWrapper: "rounded-2xl border-slate-200" }}
            />
            <Textarea
              label="Reply (Bahasa Malaysia) — optional"
              value={form.reply_bm}
              onChange={(e) => setForm({ ...form, reply_bm: e.target.value })}
              variant="bordered"
              minRows={3}
              classNames={{ inputWrapper: "rounded-2xl border-slate-200" }}
            />
            <Switch
              isSelected={form.is_greeting}
              onValueChange={(v) => setForm({ ...form, is_greeting: v })}
            >
              Send as greeting on first message
            </Switch>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" className="rounded-2xl" onClick={onClose}>Cancel</Button>
            <Button
              className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
              isLoading={saving}
              onClick={save}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
