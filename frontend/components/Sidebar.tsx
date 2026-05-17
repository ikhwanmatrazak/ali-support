"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import type { Agent } from "@/lib/types";

const nav = [
  { href: "/dashboard",            label: "Dashboard",      icon: "⊞" },
  { href: "/dashboard/tickets",    label: "Tickets",        icon: "✉" },
  { href: "/dashboard/customers",  label: "Customers",      icon: "👥" },
  { href: "/dashboard/kb",         label: "Knowledge Base", icon: "📖" },
  { href: "/dashboard/templates",  label: "Templates",      icon: "💬" },
  { href: "/dashboard/reports",    label: "Reports",        icon: "📊" },
];

const adminNav = [
  { href: "/dashboard/agents",   label: "Agents",   icon: "👤" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar({ agent }: { agent: Agent }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(href);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("agent");
    router.push("/login");
  }

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-screen sticky top-0 p-3 bg-slate-50 border-r border-slate-100">
      {/* Inner floating card */}
      <div className="flex flex-col h-full bg-slate-900 rounded-3xl overflow-hidden shadow-float">

        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-sm shadow-lg shadow-blue-500/30">
              AS
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-tight">Ali Support</div>
              <div className="text-slate-500 text-xs">v1.0</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all",
                isActive(item.href)
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          {agent.role === "admin" && (
            <>
              <div className="pt-4 pb-1.5 px-3">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Admin</p>
              </div>
              {adminNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all",
                    isActive(item.href)
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Agent + logout */}
        <div className="px-3 pb-4 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-2xl hover:bg-slate-800 transition-all group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {agent.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{agent.name}</div>
              <div className="text-xs text-slate-500 capitalize truncate">{agent.role}</div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="text-slate-600 hover:text-red-400 text-sm leading-none opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ⏻
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
