"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import type { Agent } from "@/lib/types";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/dashboard/tickets", label: "Tickets", icon: "🎫" },
  { href: "/dashboard/customers", label: "Customers", icon: "👥" },
  { href: "/dashboard/kb", label: "Knowledge Base", icon: "📚" },
  { href: "/dashboard/templates", label: "Templates", icon: "💬" },
  { href: "/dashboard/reports", label: "Reports", icon: "📊" },
];

const adminNav = [
  { href: "/dashboard/agents", label: "Agents", icon: "👤" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

interface Props {
  agent: Agent;
}

export default function Sidebar({ agent }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("agent");
    router.push("/login");
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-bold text-white">
            AS
          </div>
          <div>
            <div className="font-bold text-sm">Ali Support</div>
            <div className="text-gray-400 text-xs">v1.0</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                ? "bg-primary text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {agent.role === "admin" && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">Admin</p>
            </div>
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Agent info + logout */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold text-primary">
            {agent.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{agent.name}</div>
            <div className="text-xs text-gray-400 truncate">{agent.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-left text-xs text-gray-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
