"use client";

import { useState } from "react";
import type { Session } from "@/lib/types";

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 sm:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={onToggle}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className="flex flex-col shrink-0 z-30 h-full"
        style={{
          width: isOpen ? "256px" : "48px",
          minWidth: isOpen ? "256px" : "48px",
          transition: "width 0.2s ease, min-width 0.2s ease",
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {/* Header: hamburger toggle only */}
        <div
          className="flex items-center justify-center shrink-0 h-14"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: "var(--muted)" }}
            title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        {/* New Chat button */}
        <div className="p-2 shrink-0">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              padding: isOpen ? "10px 12px" : "10px 0",
            }}
            title="New Chat"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {isOpen && "New Chat"}
          </button>
        </div>

        {/* Sessions list — hidden in collapsed rail */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {sessions.length === 0 && (
              <p className="text-xs px-2 py-3" style={{ color: "var(--muted)" }}>
                No chats yet. Start one above.
              </p>
            )}
            {sessions.map((s) => {
              const active = s.id === activeSessionId;
              const hovered = s.id === hoveredId;
              return (
                <div
                  key={s.id}
                  className="relative mb-0.5"
                  onMouseEnter={() => setHoveredId(s.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <button
                    onClick={() => onSelectSession(s.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer"
                    style={{
                      background: active ? "var(--surface-hover)" : "transparent",
                      borderLeft: active ? "2px solid #a855f7" : "2px solid transparent",
                      paddingRight: hovered ? "2rem" : undefined,
                    }}
                  >
                    <div
                      className="text-sm font-medium truncate mb-0.5"
                      style={{ color: active ? "var(--foreground)" : "var(--muted)" }}
                    >
                      {s.title}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className="text-xs truncate flex-1"
                        style={{ color: "var(--muted)", opacity: 0.6 }}
                      >
                        {s.last_message ?? "No messages yet"}
                      </div>
                      <div
                        className="text-xs shrink-0"
                        style={{ color: "var(--muted)", opacity: 0.5 }}
                      >
                        {relativeDate(s.updated_at)}
                      </div>
                    </div>
                  </button>
                  {hovered && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded transition-colors cursor-pointer"
                      style={{ color: "var(--muted)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                      title="Delete chat"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </>
  );
}
