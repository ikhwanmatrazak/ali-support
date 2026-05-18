"use client";
import { useEffect, useState } from "react";
import {
  Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Chip, useDisclosure, Textarea, Select, SelectItem,
} from "@heroui/react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { KBArticle } from "@/lib/types";

const CATEGORIES = ["General", "Bug Report", "Account Issue", "Billing", "Feature Request", "Service Inquiry"];

export default function KBPage() {
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<KBArticle | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [form, setForm] = useState({
    title: "", content_en: "", content_bm: "", category: "General", keywords: "",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    const params = search ? `?q=${encodeURIComponent(search)}` : "";
    const { data } = await api.get<KBArticle[]>(`/kb${params}`);
    setArticles(data);
  }

  useEffect(() => { load(); }, [search]); // eslint-disable-line

  function openNew() {
    setSelected(null);
    setForm({ title: "", content_en: "", content_bm: "", category: "General", keywords: "" });
    onOpen();
  }

  function openEdit(a: KBArticle) {
    setSelected(a);
    setForm({
      title: a.title,
      content_en: a.content_en,
      content_bm: a.content_bm || "",
      category: a.category || "General",
      keywords: a.keywords.join(", "),
    });
    onOpen();
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      };
      if (selected) {
        await api.put(`/kb/${selected.id}`, payload);
        toast.success("Article updated");
      } else {
        await api.post("/kb", payload);
        toast.success("Article created");
      }
      onClose();
      load();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function deleteArticle(id: number) {
    if (!confirm("Delete this article?")) return;
    await api.delete(`/kb/${id}`);
    toast.success("Deleted");
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Knowledge Base</h1>
        <Button
          className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 font-semibold"
          onClick={openNew}
        >
          + New Article
        </Button>
      </div>

      <Input
        placeholder="Search articles..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm mb-6"
        variant="bordered"
        classNames={{
          inputWrapper: "rounded-2xl border-slate-200 bg-white hover:border-blue-400",
        }}
      />

      {articles.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          No articles yet. Create your first knowledge base article.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {articles.map((a) => (
            <div key={a.id} className="bg-white rounded-3xl shadow-soft p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="font-semibold text-slate-800 text-sm leading-snug">{a.title}</div>
                <Chip size="sm" variant="flat" className="flex-shrink-0">{a.category}</Chip>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{a.content_en}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {a.keywords.slice(0, 6).map((k) => (
                  <span key={k} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{k}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(a)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteArticle(a.id)}
                  className="text-xs font-medium text-red-500 hover:text-red-600 px-3 py-1.5 rounded-2xl bg-red-50 hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside" classNames={{ base: "rounded-3xl" }}>
        <ModalContent>
          <ModalHeader className="text-slate-800">{selected ? "Edit Article" : "New Article"}</ModalHeader>
          <ModalBody className="gap-4">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              variant="bordered"
              classNames={{ inputWrapper: "rounded-2xl border-slate-200" }}
            />
            <Select
              label="Category"
              selectedKeys={[form.category]}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              variant="bordered"
              classNames={{ trigger: "rounded-2xl border-slate-200" }}
            >
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </Select>
            <Textarea
              label="Content (English)"
              value={form.content_en}
              onChange={(e) => setForm({ ...form, content_en: e.target.value })}
              variant="bordered"
              minRows={4}
              classNames={{ inputWrapper: "rounded-2xl border-slate-200" }}
            />
            <Textarea
              label="Content (Bahasa Malaysia) — optional"
              value={form.content_bm}
              onChange={(e) => setForm({ ...form, content_bm: e.target.value })}
              variant="bordered"
              minRows={3}
              classNames={{ inputWrapper: "rounded-2xl border-slate-200" }}
            />
            <Input
              label="Keywords (comma-separated)"
              placeholder="e.g. login, password, account"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              variant="bordered"
              description="Used for auto-matching incoming WhatsApp messages"
              classNames={{ inputWrapper: "rounded-2xl border-slate-200" }}
            />
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
