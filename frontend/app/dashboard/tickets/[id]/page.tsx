"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Button, Chip, Select, SelectItem, Textarea, Card, CardBody, Spinner, Divider,
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
      {/* ── Chat thread ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-6 border-b bg-white flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-500 text-sm">#{ticket.id}</span>
              <Chip color={STATUS_COLOR[ticket.status]} size="sm" variant="flat">
                {ticket.status.replace("_", " ")}
              </Chip>
              <Chip color={PRIORITY_COLOR[ticket.priority]} size="sm" variant="flat">
                {ticket.priority}
              </Chip>
            </div>
            <h1 className="text-lg font-bold text-gray-900">{ticket.subject || "Support Ticket"}</h1>
            <div className="text-sm text-gray-500 mt-0.5">
              {ticket.customer.name || ticket.customer.whatsapp_number} ·{" "}
              {format(new Date(ticket.created_at), "dd MMM yyyy, h:mm a")}
            </div>
          </div>

          {/* Quick controls */}
          <div className="flex gap-2 flex-wrap">
            <Select
              size="sm"
              variant="bordered"
              selectedKeys={[ticket.status]}
              className="w-36"
              onChange={(e) => updateTicket("status", e.target.value)}
              aria-label="Status"
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
            >
              {[{ id: 0, name: "Unassigned" }, ...agents].map((a) => (
                <SelectItem key={String(a.id)} value={String(a.id)}>{a.name}</SelectItem>
              ))}
            </Select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50">
          {ticket.messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} agents={agents} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Reply box */}
        <div className="p-4 bg-white border-t">
          <div className="flex gap-2 mb-2">
            <Button
              size="sm"
              variant={isNote ? "bordered" : "solid"}
              color="primary"
              onClick={() => setIsNote(false)}
            >
              Reply to WhatsApp
            </Button>
            <Button
              size="sm"
              variant={isNote ? "solid" : "bordered"}
              color="warning"
              onClick={() => setIsNote(true)}
            >
              Internal Note
            </Button>

            {/* Canned templates */}
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
            className={isNote ? "border-yellow-300" : ""}
          />
          <div className="flex justify-end mt-2">
            <Button
              color={isNote ? "warning" : "primary"}
              isLoading={sending}
              onClick={sendReply}
            >
              {isNote ? "Add Note" : "Send Reply"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Right panel: KB + customer info ──────────────────────────── */}
      <div className="w-80 border-l bg-white flex flex-col overflow-y-auto">
        {/* Customer info */}
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-700 mb-3">Customer</h3>
          <div className="text-sm text-gray-900 font-medium">{ticket.customer.name || "Unknown"}</div>
          <div className="text-xs text-gray-500">{ticket.customer.whatsapp_number}</div>
          <a
            href={`/dashboard/customers/${ticket.customer.id}`}
            className="text-xs text-primary underline mt-1 inline-block"
          >
            View full profile →
          </a>
        </div>

        {/* Category */}
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-700 mb-2">Category</h3>
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[ticket.category]}
            onChange={(e) => updateTicket("category", e.target.value)}
          >
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </Select>
        </div>

        {/* Knowledge Base suggestions */}
        <div className="p-4 flex-1">
          <h3 className="font-semibold text-gray-700 mb-2">Knowledge Base</h3>
          <input
            className="w-full text-sm border rounded-lg px-3 py-1.5 mb-3 outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Search KB..."
            value={kbSearch}
            onChange={(e) => setKbSearch(e.target.value)}
          />
          <div className="space-y-2">
            {filteredKb.slice(0, 5).map((article) => (
              <Card
                key={article.id}
                isPressable
                className="shadow-none border"
                onPress={() => setReply(article.content_en)}
              >
                <CardBody className="py-2 px-3">
                  <div className="text-xs font-medium text-gray-800">{article.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{article.content_en}</div>
                  <div className="text-xs text-primary mt-1">Click to use as reply</div>
                </CardBody>
              </Card>
            ))}
            {filteredKb.length === 0 && (
              <div className="text-xs text-gray-400">No KB articles found</div>
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
        <div className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full max-w-md text-center">
          🤖 Auto-reply: {msg.content}
        </div>
      </div>
    );
  }

  if (msg.is_internal_note) {
    return (
      <div className="flex justify-end">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 max-w-sm">
          <div className="text-xs text-yellow-600 mb-1 font-medium">Internal Note — {agentName}</div>
          <div className="text-sm text-gray-800">{msg.content}</div>
          <div className="text-xs text-gray-400 mt-1 text-right">
            {format(new Date(msg.sent_at), "h:mm a")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-sm px-4 py-2.5 rounded-2xl ${
          isCustomer
            ? "bg-white border shadow-sm bubble-customer text-gray-800"
            : "bg-primary text-white bubble-agent"
        }`}
      >
        {!isCustomer && (
          <div className="text-xs opacity-80 mb-1">{agentName}</div>
        )}
        {msg.media_url && msg.media_type === "image" && (
          <img
            src={msg.media_url}
            alt="attachment"
            className="rounded-lg mb-2 max-w-full"
          />
        )}
        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
        <div className={`text-xs mt-1 ${isCustomer ? "text-gray-400" : "text-white/70"} text-right`}>
          {format(new Date(msg.sent_at), "h:mm a")}
        </div>
      </div>
    </div>
  );
}
