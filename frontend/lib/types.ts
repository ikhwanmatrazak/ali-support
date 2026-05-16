export type Role = "admin" | "agent";

export interface Agent {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: number;
  whatsapp_number: string;
  name: string | null;
  created_at: string;
}

export type TicketStatus = "open" | "in_progress" | "resolved";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type SenderType = "customer" | "agent" | "system";

export interface Message {
  id: number;
  ticket_id: number;
  sender_type: SenderType;
  agent_id: number | null;
  content: string;
  media_url: string | null;
  media_type: string | null;
  is_internal_note: boolean;
  sent_at: string;
}

export interface Ticket {
  id: number;
  customer_id: number;
  assigned_agent_id: number | null;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  tags: string[];
  subject: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  customer: Customer;
  assigned_agent: Agent | null;
  messages: Message[];
}

export interface TicketListItem {
  id: number;
  customer: Customer;
  assigned_agent: Agent | null;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  subject: string | null;
  created_at: string;
  updated_at: string;
  last_message: string | null;
}

export interface KBArticle {
  id: number;
  title: string;
  content_en: string;
  content_bm: string | null;
  category: string | null;
  is_active: boolean;
  keywords: string[];
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: number;
  name: string;
  trigger_keyword: string | null;
  reply_en: string;
  reply_bm: string | null;
  is_active: boolean;
  is_greeting: boolean;
  created_at: string;
}

export interface OverviewStats {
  total_open: number;
  total_in_progress: number;
  total_resolved: number;
  avg_response_time_minutes: number | null;
  tickets_today: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface WSEvent {
  event: "new_ticket" | "ticket_updated" | "new_message" | "connected";
  payload: Record<string, unknown>;
}

export const CATEGORIES = [
  "Bug Report",
  "Account Issue",
  "Billing",
  "Feature Request",
  "General Inquiry",
  "Service Inquiry",
];

export const PRIORITY_COLOR: Record<TicketPriority, "default" | "primary" | "warning" | "danger"> = {
  low: "default",
  medium: "primary",
  high: "warning",
  urgent: "danger",
};

export const STATUS_COLOR: Record<TicketStatus, "warning" | "primary" | "success"> = {
  open: "warning",
  in_progress: "primary",
  resolved: "success",
};
