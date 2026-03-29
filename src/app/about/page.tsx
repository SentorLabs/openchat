import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — OpenChat",
  description: "OpenChat is an open source AI chat UI with session management and pluggable LLM providers.",
};

const PRINCIPLES = [
  {
    icon: "🔌",
    title: "Bring Your Own Model",
    body: "OpenChat works with OpenAI, Anthropic, Google Gemini, and Ollama. Switch providers at any time from the Settings UI — no code changes, no restart.",
  },
  {
    icon: "💾",
    title: "Persistent Sessions",
    body: "Every conversation is stored in your database — PostgreSQL, MySQL, or SQLite. Switch chats, reload the page, or restart the server — your research history is always there.",
  },
  {
    icon: "🔗",
    title: "Cited Sources",
    body: "Every AI response includes cited sources, parsed and displayed as a collapsible banner. No unverified claims — just grounded, fact-checked answers.",
  },
  {
    icon: "🚀",
    title: "Self-Hostable",
    body: "Deploy anywhere — local machine, Docker, Cloud Foundry, GCP, AWS, or Azure. Everything is configured through environment variables or the Settings UI.",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Configure your provider", detail: "Set your LLM provider, model, and API key in Settings — changes take effect immediately, no restart needed." },
  { step: "02", title: "Ask a research question", detail: "Every conversation is a session stored in your database — your research history persists across reloads and restarts." },
  { step: "03", title: "Get sourced answers", detail: "Responses stream live from your chosen model and always include cited sources at the end." },
  { step: "04", title: "Explore and iterate", detail: "Switch models, update your system prompt, or start a new chat — all from the sidebar and Settings UI." },
];

export default function AboutPage() {
  return (
    <div className="flex-1 px-4 py-12 max-w-3xl mx-auto w-full">
      {/* Hero */}
      <div className="mb-12 fade-in">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-5"
          style={{
            background: "rgba(168,85,247,0.1)",
            color: "#a855f7",
            border: "1px solid rgba(168,85,247,0.25)",
          }}
        >
          About OpenChat
        </div>
        <h1
          className="text-4xl font-bold tracking-tight mb-4"
          style={{ color: "var(--foreground)" }}
        >
          Open source chat UI for{" "}
          <span style={{ color: "#a855f7" }}>fact-grounded research</span>
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
          OpenChat is a self-hostable chat interface built for research. Every response is grounded in facts
          and includes cited sources — configured entirely through the Settings UI or environment variables,
          no code changes needed.
        </p>
      </div>

      {/* Principles */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-5" style={{ color: "var(--foreground)" }}>
          Core features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRINCIPLES.map((p) => (
            <div
              key={p.title}
              className="rounded-xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="text-2xl mb-3">{p.icon}</div>
              <h3 className="font-semibold mb-1.5 text-sm" style={{ color: "var(--foreground)" }}>
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-5" style={{ color: "var(--foreground)" }}>
          How it works
        </h2>
        <div className="space-y-4">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="text-xs font-mono font-bold pt-0.5 w-8 shrink-0" style={{ color: "#a855f7" }}>
                {item.step}
              </div>
              <div>
                <div className="text-sm font-medium mb-0.5" style={{ color: "var(--foreground)" }}>
                  {item.title}
                </div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {item.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Config reference */}
      <section
        className="rounded-xl p-6 mb-8"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>
          Environment variables
        </h2>
        <div className="space-y-2 text-sm font-mono" style={{ color: "var(--muted)" }}>
          {[
            ["LLM_PROVIDER", "openai | anthropic | gemini | ollama"],
            ["LLM_MODEL", "Model name for your chosen provider"],
            ["LLM_API_KEY", "API key (not needed for Ollama)"],
            ["LLM_SYSTEM_PROMPT", "Optional — override the default system prompt"],
            ["DATABASE_URL", "PostgreSQL, MySQL, or SQLite connection string"],
            ["OLLAMA_BASE_URL", "Ollama base URL (default: http://localhost:11434)"],
          ].map(([key, desc]) => (
            <div key={key} className="flex gap-3">
              <span style={{ color: "#a855f7", minWidth: "180px" }}>{key}</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
          All settings can also be configured at runtime via{" "}
          <Link href="/settings" className="underline underline-offset-2 hover:opacity-80" style={{ color: "#a855f7" }}>
            Settings →
          </Link>
        </p>
      </section>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
        >
          Start researching
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
          See what&apos;s new in{" "}
          <Link href="/releases" className="underline underline-offset-2 hover:opacity-80" style={{ color: "#a855f7" }}>
            the latest release →
          </Link>
        </p>
      </div>
    </div>
  );
}
