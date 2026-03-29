import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Releases — OpenChat",
  description: "Version history and release notes for OpenChat.",
};

const RELEASES = [
  {
    version: "0.0.2",
    date: "March 2026",
    tag: "Latest",
    tagColor: "#34d399",
    tagBg: "rgba(52,211,153,0.1)",
    tagBorder: "rgba(52,211,153,0.25)",
    changes: [
      { type: "new", text: "Multi-database support: PostgreSQL, MySQL, and SQLite — configurable via DATABASE_URL or the Settings UI at runtime." },
      { type: "new", text: "Settings UI: configure LLM provider, model, API key, database connection, and system prompt directly from the browser — no server restart required." },
      { type: "new", text: "Database test connection button with live dialect detection feedback." },
      { type: "improve", text: "Source citation parser handles all model output formats: markdown links, pipe-separated, quoted titles, and plain text fallback." },
      { type: "improve", text: "Sources instruction is appended at the API layer, ensuring citations work with any custom system prompt." },
      { type: "fix", text: "Fixed POST /api/sessions returning an empty body on error, which caused 'Unexpected end of JSON input' in the browser." },
      { type: "fix", text: "Fixed partial [SOURCES] block leaking into the chat bubble during streaming." },
    ],
  },
  {
    version: "0.0.1",
    date: "March 2026",
    tag: "Initial Release",
    tagColor: "#a855f7",
    tagBg: "rgba(168,85,247,0.1)",
    tagBorder: "rgba(168,85,247,0.25)",
    changes: [
      { type: "new", text: "Multi-provider LLM support: OpenAI, Anthropic, Google Gemini, and Ollama — configured entirely via environment variables." },
      { type: "new", text: "Persistent session management backed by PostgreSQL — conversations survive restarts and page reloads." },
      { type: "new", text: "Sidebar with full chat history, session switching, and New Chat button." },
      { type: "new", text: "Real-time streaming chat interface with live cursor indicator." },
      { type: "new", text: "Automatic source citation — every AI response ends with a collapsible sources banner, grounding answers in verifiable references." },
      { type: "new", text: "Configurable system prompt via LLM_SYSTEM_PROMPT environment variable." },
      { type: "new", text: "Cloud Foundry deployment support with manifest and deploy guides." },
    ],
  },
];

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "#a5b4fc", bg: "rgba(165,180,252,0.1)" },
  improve: { label: "Improved", color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  fix: { label: "Fix", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
};

export default function ReleasesPage() {
  return (
    <div className="flex-1 px-4 py-12 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="mb-10 fade-in">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-5"
          style={{
            background: "rgba(168,85,247,0.1)",
            color: "#a855f7",
            border: "1px solid rgba(168,85,247,0.25)",
          }}
        >
          Changelog
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4" style={{ color: "var(--foreground)" }}>
          Release notes
        </h1>
        <p className="text-lg" style={{ color: "var(--muted)" }}>
          Version history and improvements to OpenChat.
        </p>
      </div>

      {/* Releases */}
      <div className="space-y-8">
        {RELEASES.map((release) => (
          <article
            key={release.version}
            className="rounded-2xl p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold font-mono" style={{ color: "var(--foreground)" }}>
                    v{release.version}
                  </h2>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ color: release.tagColor, background: release.tagBg, border: `1px solid ${release.tagBorder}` }}
                  >
                    {release.tag}
                  </span>
                </div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>{release.date}</div>
              </div>
            </div>
            <ul className="space-y-3">
              {release.changes.map((change, i) => {
                const meta = TYPE_LABELS[change.type];
                return (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span
                      className="shrink-0 px-1.5 py-0.5 rounded text-xs font-medium mt-0.5"
                      style={{ color: meta.color, background: meta.bg }}
                    >
                      {meta.label}
                    </span>
                    <span style={{ color: "var(--foreground)" }}>{change.text}</span>
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>

      {/* Footer CTA */}
      <div
        className="mt-10 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div>
          <div className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
            Ready to research?
          </div>
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            Configure your LLM provider and get fact-grounded answers with cited sources.
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/hub"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            Docs & deploy →
          </Link>
          <Link
            href="/about"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)" }}
          >
            How it works →
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
          >
            Start researching
          </Link>
        </div>
      </div>
    </div>
  );
}
