"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/generate", label: "Generate", icon: "✨" },
  { href: "/dashboard/catalog", label: "Square Menu", icon: "📋" },
  { href: "/dashboard/photos", label: "My Photos", icon: "📸" },
  { href: "/dashboard/website", label: "Website", icon: "🌐" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-900 transition-transform md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold">
            <span className="text-white">Plate</span>
            <span className="text-orange-500">AI</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-zinc-500 md:hidden"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`mb-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${
                  active
                    ? "bg-orange-500/10 text-orange-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 px-4 py-4">
          <div className="flex items-center gap-3">
            <UserButton />
            <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
              Free
            </span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-400"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <Link href="/" className="text-lg font-bold">
            <span className="text-white">Plate</span>
            <span className="text-orange-500">AI</span>
          </Link>
          <UserButton />
        </div>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
