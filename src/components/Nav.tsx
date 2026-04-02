"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Chat" },
  { href: "/hub", label: "Docs" },
  { href: "/about", label: "About" },
  { href: "/releases", label: "Releases" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(15,17,23,0.85)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--border)",
      }}
    >
      <div className="w-full px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold pulse-glow"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
          >
            O
          </span>
          <span className="font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
            OpenChat
          </span>
        </Link>

        {/* Navigation links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  background: active ? "var(--accent-glow)" : "transparent",
                  color: active ? "var(--accent)" : "var(--muted)",
                  border: active ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side: Settings icon + status badge */}
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            title="Settings"
            style={{
              background: pathname === "/settings" ? "rgba(168,85,247,0.12)" : "transparent",
              color: pathname === "/settings" ? "#a855f7" : "var(--muted)",
              border: pathname === "/settings" ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
            style={{
              background: "rgba(16,185,129,0.1)",
              color: "var(--success)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--success)" }}
            />
            Online
          </div>
        </div>
      </div>
    </nav>
  );
}
