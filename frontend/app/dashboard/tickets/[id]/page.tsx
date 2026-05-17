"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Button, Chip, Select, SelectItem, Textarea, Spinner,
} from "@heroui/react";
import { formatDistanceToNow, format } from "date-fns";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { PRIORITY_COLOR, STATUS_COLOR, CATEGORIES } from "@/lib/types";
import type { Ticket, Agent, Message, KBArticle, Template } from "@/lib/types";

const STATUSES = ["open", "in_progress", "resolved"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [kb, setKb] = useState<KBArticle[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [reply, setReply] = useState("");
  const [isNote, setIsNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [kbSearch, setKbSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const [tRes, aRes, kRes, tmplRes] = await Promise.all([
      api.get<Ticket>(`/tickets/${id}`),
      api.get<Agent[]>("/agents"),
      api.get<KBArticle[]>("/kb"),
      api.get<Template[]>("/templates"),
    ]);
    setTicket(tRes.data);
    setAgents(aRes.data);
    setKb(kRes.data);
    setTemplates(tmplRes.data);
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/tickets/${id}/reply`, { content: reply, is_internal_note: isNote });
      setReply("");
      await load();
      toast.success(isNote ? "Note added" : "Reply sent to WhatsApp");
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function updateTicket(field: string, value: string | number | null) {
    try {
      await api.patch(`/tickets/${id}`, { [field]: value });
      await load();
    } catch {
      toast.error("Update failed");
    }
  }

  const filteredKb = kb.filter(
    (a) =>
      kbSearch === "" ||
      a.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
      a.keywords.some((k) => k.includes(kbSearch.toLowerCase()))
  );

  if (!ticket) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="flex h-full">
      {/* ── Chat thread ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-slate-400 text-sm font-mono">#{ticket.id}</span>
              <Chip color={STATUS_COLOR[ticket.status]} size="sm" variant="flat">
                {ticket.status.replace("_", " ")}
              </Chip>
              <Chip color={PRIORITY_COLOR[ticket.priority]} size="sm" variant="flat">
                {ticket.priority}
              </Chip>
            </div>
            <h1 className="text-base font-bold text-slate-800">{ticket.subject || "Support Ticket"}</h1>
            <div className="text-xs text-slate-400 mt-0.5">
              {ticket.customer.name || ticket.customer.whatsapp_number} ·{" "}
              {format(new Date(ticket.created_at), "dd MMM yyyy, h:mm a")}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select
              size="sm"
              variant="bordered"
              selectedKeys={[ticket.status]}
              className="w-36"
              onChange={(e) => updateTicket("status", e.target.value)}
              aria-label="Status"
              classNames={{ trigger: "rounded-2xl border-slate-200" }}
            >
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
            </Select>
            <Select
              size="sm"
              variant="bordered"
              selectedKeys={[ticket.priority]}
              className="w-32"
              onChange={(e) => updateTicket("priority", e.target.value)}
              aria-label="Priority"
              classNames={{ trigger: "rounded-2xl border-slate-200" }}
            >
              {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </Select>
            <Select
              size="sm"
              variant="bordered"
              selectedKeys={ticket.assigned_agent_id ? [String(ticket.assigned_agent_id)] : []}
              className="w-44"
              onChange={(e) => updateTicket("assigned_agent_id", e.target.value ? Number(e.target.value) : null)}
              aria-label="Assign agent"
              classNames={{ trigger: "rounded-2xl border-slate-200" }}
            >
              {[{ id: 0, name: "Unassigned" }, ...agents].map((a) => (
                <SelectItem key={String(a.id)} value={String(a.id)}>{a.name}</SelectItem>
              ))}
            </Select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 bg-slate-50">
          {ticket.messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} agents={agents} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Reply box */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex gap-2 mb-3 flex-wrap">
            <button
              onClick={() => setIsNote(false)}
              className={`px-4 py-1.5 rounded-2xl text-sm font-medium transition-all ${
                !isNote
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Reply to WhatsApp
            </button>
            <button
              onClick={() => setIsNote(true)}
              className={`px-4 py-1.5 rounded-2xl text-sm font-medium transition-all ${
                isNote
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Internal Note
            </button>

            {templates.filter((t) => !t.is_greeting).length > 0 && (
              <Select
                placeholder="Quick reply..."
                size="sm"
                variant="bordered"
                className="flex-1 max-w-xs"
                onChange={(e) => {
                  const tpl = templates.find((t) => String(t.id) === e.target.value);
                  if (tpl) setReply(tpl.reply_en);
                }}
                classNames={{ trigger: "rounded-2xl border-slate-200" }}
              >
                {templates
                  .filter((t) => !t.is_greeting)
                  .map((t) => (
                    <SelectItem key={String(t.id)} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
              </Select>
            )}
          </div>

          <Textarea
            placeholder={isNote ? "Add internal note (not sent to customer)..." : "Type your reply..."}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            minRows={3}
            variant="bordered"
            classNames={{
              inputWrapper: `rounded-2xl border-slate-200 ${isNote ? "border-amber-300 bg-amber-50/40" : ""}`,
            }}
          />
          <div className="flex justify-end mt-2">
            <Button
              className={`rounded-2xl font-semibold ${
                isNote
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-400/30"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
              }`}
              isLoading={sending}
              onClick={sendReply}
            >
              {isNote ? "Add Note" : "Send Reply"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-76 border-l border-slate-100 bg-white flex flex-col overflow-y-auto">
        {/* Customer info */}
        <div className="p-5 border-b border-slate-100">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Customer</div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(ticket.customer.name || ticket.customer.whatsapp_number).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">{ticket.customer.name || "Unknown"}</div>
              <div className="text-xs text-slate-400 font-mono">{ticket.customer.whatsapp_number}</div>
            </div>
          </div>
          <a
            href={`/dashboard/customers/${ticket.customer.id}`}
            className="text-xs text-blue-500 hover:text-blue-600 font-medium"
          >
            View full profile →
          </a>
        </div>

        {/* Category */}
        <div className="p-5 border-b border-slate-100">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Category</div>
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[ticket.category]}
            onChange={(e) => updateTicket("category", e.target.value)}
            classNames={{ trigger: "rounded-2xl border-slate-200" }}
          >
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </Select>
        </div>

        {/* Knowledge Base */}
        <div className="p-5 flex-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Knowledge Base</div>
          <input
            className="w-full text-sm border border-slate-200 rounded-2xl px-3 py-2 mb-3 outline-none focus:border-blue-400 bg-white"
            placeholder="Search KB..."
            value={kbSearch}
            onChange={(e) => setKbSearch(e.target.value)}
          />
          <div className="space-y-2">
            {filteredKb.slice(0, 5).map((article) => (
              <button
                key={article.id}
                onClick={() => setReply(article.content_en)}
                className="w-full text-left bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-2xl px-3 py-2.5 transition-all"
              >
                <div className="text-xs font-semibold text-slate-700">{article.title}</div>
                <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{article.content_en}</div>
                <div className="text-xs text-blue-500 mt-1">Click to use as reply</div>
              </button>
            ))}
            {filteredKb.length === 0 && (
              <div className="text-xs text-slate-400">No KB articles found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ msg, agents }: { msg: Message; agents: Agent[] }) {
  const isCustomer = msg.sender_type === "customer";
  const isSystem = msg.sender_type === "system";
  const agentName = msg.agent_id ? agents.find((a) => a.id === msg.agent_id)?.name || "Agent" : "System";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-blue-50 text-blue-600 text-xs px-4 py-2 rounded-full max-w-md text-center border border-blue-100">
          🤖 {msg.content}
        </div>
      </div>
    );
  }

  if (msg.is_internal_note) {
    return (
      <div className="flex justify-end">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl rounded-br-md px-4 py-3 max-w-sm">
          <div className="text-xs text-amber-600 mb-1 font-semibold">Internal Note — {agentName}</div>
          <div className="text-sm text-slate-700">{msg.content}</div>
          <div className="text-xs text-slate-400 mt-1.5 text-right">
            {format(new Date(msg.sent_at), "h:mm a")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-sm px-4 py-3 ${
          isCustomer
            ? "bg-white rounded-3xl rounded-bl-md shadow-soft text-slate-800 bubble-customer"
            : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl rounded-br-md shadow-lg shadow-blue-500/25 bubble-agent"
        }`}
      >
        {!isCustomer && (
          <div className="text-xs text-white/70 mb-1">{agentName}</div>
        )}
        {msg.media_url && msg.media_type === "image" && (
          <img src={msg.media_url} alt="attachment" className="rounded-2xl mb-2 max-w-full" />
        )}
        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
        <div className={`text-xs mt-1.5 ${isCustomer ? "text-slate-400" : "text-white/60"} text-right`}>
          {format(new Date(msg.sent_at), "h:mm a")}
        </div>
      </div>
    </div>
  );
}
