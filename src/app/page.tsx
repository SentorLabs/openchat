"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import SourcesBanner from "@/components/SourcesBanner";
import { parseSources, stripSources } from "@/lib/sources";
import type { Session, UIMessage, DbMessage, Source } from "@/lib/types";

const SUGGESTED_QUERIES = [
  "What caused the 2008 financial crisis?",
  "How do mRNA vaccines work?",
  "What is quantum entanglement?",
  "What are the leading causes of climate change?",
];

function toUIMessage(m: DbMessage): UIMessage {
  return {
    ...m,
    displayContent: stripSources(m.content),
    sources: m.sources ?? parseSources(m.content),
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [booted, setBooted] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Bootstrap: load sessions, auto-open most recent
  useEffect(() => {
    async function boot() {
      try {
        const res = await fetch("/api/sessions");
        if (!res.ok) throw new Error(`GET /api/sessions ${res.status}`);
        const list: Session[] = await res.json();
        setSessions(Array.isArray(list) ? list : []);

        if (list.length > 0) {
          const latest = list[0];
          setActiveSessionId(latest.id);
          const msgRes = await fetch(`/api/sessions/${latest.id}/messages`);
          const msgs: DbMessage[] = msgRes.ok ? await msgRes.json() : [];
          setMessages(msgs.map(toUIMessage));
        } else {
          // No sessions yet — create one
          const newRes = await fetch("/api/sessions", { method: "POST" });
          if (!newRes.ok) throw new Error(`POST /api/sessions ${newRes.status}`);
          const newSession: Session = await newRes.json();
          setSessions([newSession]);
          setActiveSessionId(newSession.id);
        }
      } catch (err) {
        console.error("Boot error:", err);
        setSessions([]); // ensure sessions is always an array
      } finally {
        setBooted(true);
      }
    }
    boot();
  }, []);

  const handleNewChat = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions", { method: "POST" });
      if (!res.ok) throw new Error(`POST /api/sessions ${res.status}`);
      const session: Session = await res.json();
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
      inputRef.current?.focus();
    } catch (err) {
      console.error("New chat error:", err);
    }
  }, []);

  const handleSelectSession = useCallback(async (id: string) => {
    if (id === activeSessionId) return;
    setActiveSessionId(id);
    setMessages([]);
    try {
      const res = await fetch(`/api/sessions/${id}/messages`);
      const msgs: DbMessage[] = await res.json();
      setMessages(msgs.map(toUIMessage));
    } catch (err) {
      console.error("Load session error:", err);
    }
  }, [activeSessionId]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading || !activeSessionId) return;

    const userMsg: UIMessage = {
      id: crypto.randomUUID(),
      session_id: activeSessionId,
      role: "user",
      content: text.trim(),
      sources: null,
      created_at: new Date().toISOString(),
      displayContent: text.trim(),
    };
    const assistantMsgId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: assistantMsgId,
        session_id: activeSessionId,
        role: "assistant",
        content: "",
        sources: null,
        created_at: new Date().toISOString(),
        displayContent: "",
        isStreaming: true,
      },
    ]);
    setInput("");
    setIsLoading(true);

    // Optimistically update session title from first message
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId && s.title === "New Chat"
          ? { ...s, title: text.trim().slice(0, 60) }
          : s
      )
    );

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSessionId, message: text.trim() }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: accumulated, displayContent: stripSources(accumulated), isStreaming: true }
              : m
          )
        );
      }

      // Finalize — parse sources from complete response
      const sources: Source[] = parseSources(accumulated);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: accumulated,
                displayContent: stripSources(accumulated),
                sources,
                isStreaming: false,
              }
            : m
        )
      );

      // Refresh session list so updated_at + last_message preview are current
      const sessRes = await fetch("/api/sessions");
      if (sessRes.ok) {
        const updated: Session[] = await sessRes.json();
        setSessions(Array.isArray(updated) ? updated : []);
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: "⚠️ Something went wrong. Please try again.", displayContent: "⚠️ Something went wrong. Please try again.", isStreaming: false }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const isEmpty = messages.length === 0;

  if (!booted) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(168,85,247,0.2)", borderTopColor: "#a855f7" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-row flex-1 overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      {/* Main chat column */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Message area */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full px-4 pb-32 fade-in">
              <div
                className="mb-5 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white pulse-glow"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
              >
                O
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-2 text-center" style={{ color: "var(--foreground)" }}>
                What would you like to research?
              </h1>
              <p className="text-center max-w-sm mb-7 text-sm" style={{ color: "var(--muted)" }}>
                Ask anything — every answer is grounded in facts and backed by cited sources.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTED_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="text-left px-4 py-3 rounded-xl text-sm transition-all duration-150 cursor-pointer"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,85,247,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--muted)";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                    }}
                  >
                    <span className="mr-2 opacity-50">◈</span>{q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 pt-6 pb-4">
              <div className="max-w-2xl mx-auto space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`fade-in flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5 shrink-0"
                        style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
                      >
                        O
                      </div>
                    )}
                    <div className="max-w-[80%]">
                      <div
                        className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                        style={
                          msg.role === "user"
                            ? { background: "var(--accent)", color: "#fff", borderBottomRightRadius: "4px" }
                            : { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)", borderBottomLeftRadius: "4px" }
                        }
                      >
                        <MessageContent content={msg.displayContent} />
                        {msg.isStreaming && (
                          <span
                            className="cursor-blink ml-0.5 inline-block w-0.5 h-4 align-text-bottom"
                            style={{ background: "#a855f7" }}
                          />
                        )}
                      </div>
                      {msg.role === "assistant" && !msg.isStreaming && msg.sources && msg.sources.length > 0 && (
                        <SourcesBanner sources={msg.sources} />
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </div>
          )}
        </div>

        {/* Input bar — sticky inside scroll column */}
        <div
          className="shrink-0 px-4 pb-4 pt-3"
          style={{ background: "linear-gradient(to top, var(--background) 80%, transparent)" }}
        >
          <div className="max-w-2xl mx-auto">
            <div
              className="flex items-end gap-2 rounded-2xl p-2 transition-all"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              onFocusCapture={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,85,247,0.5)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(168,85,247,0.1)";
              }}
              onBlurCapture={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask anything — sources included…"
                disabled={isLoading}
                className="flex-1 resize-none bg-transparent text-sm outline-none px-2 py-1.5 max-h-32"
                style={{ color: "var(--foreground)", caretColor: "#a855f7" }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all text-white text-sm disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                style={{
                  background: input.trim() && !isLoading
                    ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
                    : "var(--surface-hover)",
                }}
              >
                {isLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-center mt-2 text-xs" style={{ color: "var(--muted)" }}>
              Responses are grounded in facts and include cited sources.{" "}
              <Link href="/about" className="underline underline-offset-2 hover:opacity-80" style={{ color: "#a855f7" }}>
                How it works →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  if (!content) return null;
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`"))
          return (
            <code key={i} className="px-1 py-0.5 rounded text-xs" style={{ background: "rgba(0,0,0,0.3)", color: "#c4b5fd" }}>
              {part.slice(1, -1)}
            </code>
          );
        if (part === "\n") return <br key={i} />;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
