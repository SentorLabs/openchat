import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hub — OpenChat",
  description:
    "OpenChat hub: what it is, how to deploy it, and full documentation for configuration, providers, and databases.",
};

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "Real-time streaming chat",
    desc: "Every response streams token-by-token directly from your LLM of choice. No polling, no delays — just live output.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    title: "Persistent sessions",
    desc: "Conversations are stored in your own database — PostgreSQL, MySQL, or SQLite. Sessions survive restarts, reloads, and deploys.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    title: "Automatic source citations",
    desc: "Every AI answer ends with a collapsible sources banner — parsed from the model's response and displayed as clickable links.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: "Multi-provider LLM",
    desc: "OpenAI, Anthropic, Google Gemini, and Ollama — swap providers from the Settings UI without touching code or restarting.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    title: "Zero-restart config",
    desc: "Change your LLM provider, model, API key, database, or system prompt in the Settings UI. Changes take effect immediately.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: "Open source & self-hostable",
    desc: "Deploy on your own infrastructure — local, Docker, Cloud Foundry, GCP, AWS, or Azure. You own your data.",
  },
];

const PROVIDERS = [
  { name: "OpenAI", models: "gpt-4o · gpt-4o-mini · o3-mini", value: "openai", color: "#10b981" },
  { name: "Anthropic", models: "claude-opus-4-6 · claude-sonnet-4-6 · claude-haiku-4-5", value: "anthropic", color: "#a855f7" },
  { name: "Google Gemini", models: "gemini-2.0-flash · gemini-1.5-pro", value: "gemini", color: "#3b82f6" },
  { name: "Ollama (local)", models: "llama3.2 · mistral · phi4 · gemma3 · any local model", value: "ollama", color: "#f59e0b" },
];

const DATABASES = [
  {
    name: "PostgreSQL",
    example: "postgresql://user:pass@host:5432/openchat",
    note: "Recommended for production. Full UUID + JSONB support.",
  },
  {
    name: "MySQL",
    example: "mysql://user:pass@host:3306/openchat",
    note: "Fully supported. Placeholders translated automatically.",
  },
  {
    name: "SQLite",
    example: "/absolute/path/to/openchat.db  or  :memory:",
    note: "Perfect for local dev and single-instance deploys. Zero setup.",
  },
];

const ENV_VARS = [
  { key: "DATABASE_URL", required: true, desc: "Database connection string (PostgreSQL, MySQL, or SQLite file path)" },
  { key: "LLM_PROVIDER", required: true, desc: "openai | anthropic | gemini | ollama" },
  { key: "LLM_MODEL", required: true, desc: "Model name for your chosen provider (e.g. gpt-4o)" },
  { key: "LLM_API_KEY", required: false, desc: "API key — required for all providers except Ollama" },
  { key: "LLM_SYSTEM_PROMPT", required: false, desc: "Override the default system prompt" },
  { key: "OLLAMA_BASE_URL", required: false, desc: "Ollama base URL (default: http://localhost:11434)" },
];

const DEPLOY_TARGETS = [
  {
    name: "Local / Docker",
    badge: "Fastest start",
    badgeColor: "#10b981",
    badgeBg: "rgba(16,185,129,0.1)",
    steps: [
      { label: "Clone the repo", code: "git clone https://github.com/SentorLabs/openchat && cd openchat" },
      { label: "Copy and fill env file", code: "cp .env.example .env.local\n# Edit .env.local with your DATABASE_URL and LLM settings" },
      { label: "Install dependencies", code: "npm install" },
      { label: "Start the app", code: "npm run dev       # development\nnpm run build && npm start  # production" },
    ],
  },
  {
    name: "Docker Compose",
    badge: "Batteries included",
    badgeColor: "#3b82f6",
    badgeBg: "rgba(59,130,246,0.1)",
    steps: [
      { label: "Create docker-compose.yml", code: `services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://postgres:secret@db:5432/openchat
      LLM_PROVIDER: openai
      LLM_MODEL: gpt-4o
      LLM_API_KEY: \${LLM_API_KEY}
    depends_on: [db]
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: openchat
    volumes: [pgdata:/var/lib/postgresql/data]
volumes:
  pgdata:` },
      { label: "Run it", code: "LLM_API_KEY=sk-... docker compose up -d" },
    ],
  },
  {
    name: "Cloud Foundry / SAP BTP",
    badge: "Enterprise",
    badgeColor: "#a855f7",
    badgeBg: "rgba(168,85,247,0.1)",
    steps: [
      { label: "Create a PostgreSQL service", code: "cf create-service postgresql-db trial openchat-db" },
      { label: "Set your LLM env vars", code: "cf set-env openchat LLM_PROVIDER openai\ncf set-env openchat LLM_MODEL gpt-4o\ncf set-env openchat LLM_API_KEY sk-..." },
      { label: "Push the app", code: "cf push" },
      { label: "Automated script", code: "bash deployment/btp.sh" },
    ],
  },
  {
    name: "GCP Cloud Run",
    badge: "Serverless",
    badgeColor: "#f59e0b",
    badgeBg: "rgba(245,158,11,0.1)",
    steps: [
      { label: "Run the deployment script", code: "bash deployment/gcp.sh" },
      { label: "What it does", code: "# Creates Cloud SQL (PostgreSQL)\n# Stores DATABASE_URL in Secret Manager\n# Builds image via Cloud Build\n# Deploys to Cloud Run with Cloud SQL socket" },
    ],
  },
  {
    name: "AWS App Runner",
    badge: "Managed",
    badgeColor: "#f59e0b",
    badgeBg: "rgba(245,158,11,0.1)",
    steps: [
      { label: "Run the deployment script", code: "bash deployment/aws.sh" },
      { label: "What it does", code: "# Creates ECR repo and pushes image\n# Provisions RDS PostgreSQL\n# Stores secret in Secrets Manager\n# Creates IAM role and deploys App Runner" },
    ],
  },
  {
    name: "Azure Container Apps",
    badge: "Managed",
    badgeColor: "#3b82f6",
    badgeBg: "rgba(59,130,246,0.1)",
    steps: [
      { label: "Run the deployment script", code: "bash deployment/azure.sh" },
      { label: "What it does", code: "# Creates ACR and builds image\n# Provisions Azure DB for PostgreSQL\n# Creates Key Vault + managed identity\n# Deploys Container App" },
    ],
  },
];

// ── Components ────────────────────────────────────────────────────────────────

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  return (
    <div className="rounded-xl overflow-hidden text-xs font-mono" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid var(--border)" }}>
      {lang && (
        <div className="px-4 py-2 flex items-center gap-1.5" style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.03)" }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f56" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffbd2e" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#27c93f" }} />
          <span className="ml-auto" style={{ color: "var(--muted)" }}>{lang}</span>
        </div>
      )}
      <pre className="px-4 py-3 overflow-x-auto leading-relaxed" style={{ margin: 0, background: "transparent", border: "none", borderRadius: 0, padding: "0.75rem 1rem" }}>
        <code style={{ color: "#e2e8f0" }}>{code}</code>
      </pre>
    </div>
  );
}

function SectionHeading({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <div
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
        style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.25)" }}
      >
        {label}
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--foreground)" }}>{title}</h2>
      {subtitle && <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{subtitle}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HubPage() {
  return (
    <div className="flex-1 w-full" style={{ background: "var(--background)" }}>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(ellipse, #6366f1 0%, transparent 70%)" }}
          />
          <div
            className="absolute top-20 right-0 w-[300px] h-[300px] rounded-full opacity-10 blur-3xl"
            style={{ background: "radial-gradient(ellipse, #a855f7 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-16 text-center fade-in">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#a5b4fc" }} />
            Open Source · v0.0.2 · Self-Hostable
          </div>

          {/* Logo + Name */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <span
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold text-white pulse-glow"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
            >
              O
            </span>
            <h1 className="text-5xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
              OpenChat
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-xl leading-relaxed max-w-2xl mx-auto mb-3" style={{ color: "var(--muted)" }}>
            A self-hostable, multi-provider AI chat interface for{" "}
            <span style={{ color: "#a855f7" }}>fact-grounded research</span>.
            <br />Every answer is sourced. Every session persists. You own the data.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
            >
              Open Chat
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="#quickstart"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
              style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }}
            >
              Quick Start
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </a>
            <Link
              href="/releases"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
              style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }}
            >
              v0.0.2 Changelog →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Architecture Diagram ── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div
          className="rounded-2xl p-6 font-mono text-xs leading-relaxed overflow-x-auto"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="mb-3 text-xs font-sans font-medium" style={{ color: "var(--muted)" }}>Architecture overview</div>
          <pre style={{ color: "#e2e8f0", margin: 0, background: "transparent", border: "none", borderRadius: 0, padding: 0 }}>{`
  Browser
  ┌─────────────────────────────────────────────────┐
  │  Next.js App Router (React)                     │
  │                                                 │
  │  /          Chat UI + Sidebar + SourcesBanner   │
  │  /hub       This landing & docs page            │
  │  /about     Feature overview                    │
  │  /releases  Changelog                           │
  │  /settings  Runtime configuration UI            │
  └──────────────────┬──────────────────────────────┘
                     │  HTTP / Streaming (SSE)
  Server             ▼
  ┌─────────────────────────────────────────────────┐
  │  Next.js API Routes (Node.js runtime)           │
  │                                                 │
  │  POST /api/chat          ──► LLM Stream         │
  │  GET  /api/sessions      ──► DB: list sessions  │
  │  POST /api/sessions      ──► DB: new session    │
  │  GET  /api/sessions/:id/messages                │
  │  GET  /api/settings      ──► DB: read config    │
  │  POST /api/settings      ──► DB: save config    │
  │  POST /api/db-test       ──► DB: test URL       │
  └────────┬───────────────────────┬────────────────┘
           │                       │
    ┌──────▼──────┐        ┌───────▼────────┐
    │  Database   │        │   LLM Provider │
    │             │        │                │
    │  PostgreSQL │        │  OpenAI        │
    │  MySQL      │        │  Anthropic     │
    │  SQLite     │        │  Gemini        │
    └─────────────┘        │  Ollama        │
                           └────────────────┘
`}</pre>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <SectionHeading
          label="Features"
          title="Everything you need for AI-powered research"
          subtitle="Built on Next.js App Router with streaming, persistence, and citations as first-class citizens."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="mb-3" style={{ color: "#a855f7" }}>{f.icon}</div>
              <h3 className="text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quick Start ── */}
      <section id="quickstart" className="max-w-4xl mx-auto px-6 pb-20">
        <SectionHeading
          label="Quick Start"
          title="Up and running in minutes"
          subtitle="The fastest path from zero to a running OpenChat instance."
        />
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>1 · Clone and install</p>
            <CodeBlock code={`git clone https://github.com/SentorLabs/openchat
cd openchat
npm install`} />
          </div>
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>2 · Configure environment</p>
            <CodeBlock code={`cp .env.example .env.local

# Minimum required settings:
DATABASE_URL=:memory:          # SQLite in-memory for instant start
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
LLM_API_KEY=sk-...`} lang=".env.local" />
          </div>
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>3 · Start the development server</p>
            <CodeBlock code="npm run dev" />
          </div>
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="text-xs leading-relaxed" style={{ color: "#10b981" }}>
              Open <strong>http://localhost:3000</strong> — the database schema is created automatically on first run. Head to <strong>/settings</strong> to configure your LLM provider from the UI.
            </p>
          </div>
        </div>
      </section>

      {/* ── LLM Providers ── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <SectionHeading
          label="LLM Providers"
          title="Bring your own model"
          subtitle="Switch providers at any time from the Settings UI — no restart required."
        />
        <div className="space-y-3">
          {PROVIDERS.map((p) => (
            <div
              key={p.name}
              className="rounded-xl p-4 flex items-start gap-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-2 rounded-full shrink-0 mt-1.5"
                style={{ background: p.color, height: "calc(100% - 12px)", minHeight: "12px", maxHeight: "12px", borderRadius: "9999px" }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{p.name}</span>
                  <code
                    className="px-1.5 py-0.5 rounded text-xs"
                    style={{ background: "rgba(255,255,255,0.05)", color: "var(--muted)" }}
                  >
                    LLM_PROVIDER={p.value}
                  </code>
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{p.models}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Database Support ── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <SectionHeading
          label="Database"
          title="Your data, your database"
          subtitle="OpenChat auto-detects the dialect from the connection string and creates the schema on first run."
        />
        <div className="space-y-3 mb-6">
          {DATABASES.map((db) => (
            <div
              key={db.name}
              className="rounded-xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{db.name}</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>{db.note}</span>
              </div>
              <CodeBlock code={`DATABASE_URL=${db.example}`} lang="env" />
            </div>
          ))}
        </div>
        <div
          className="rounded-xl p-4 text-xs leading-relaxed"
          style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.2)", color: "var(--muted)" }}
        >
          <strong style={{ color: "#a855f7" }}>Runtime switching:</strong> Update the Database URL in{" "}
          <Link href="/settings" className="underline underline-offset-2" style={{ color: "#a855f7" }}>Settings</Link>{" "}
          and click <em>Save</em> — OpenChat reconnects immediately and re-creates the schema in the new database if needed.
        </div>
      </section>

      {/* ── Environment Variables ── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <SectionHeading
          label="Configuration"
          title="Environment variables reference"
          subtitle="All settings can also be configured at runtime from the Settings UI."
        />
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border)" }}>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--muted)" }}>Variable</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--muted)" }}>Required</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--muted)" }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {ENV_VARS.map((v, i) => (
                <tr
                  key={v.key}
                  style={{
                    borderBottom: i < ENV_VARS.length - 1 ? "1px solid var(--border)" : undefined,
                    background: i % 2 === 0 ? "var(--surface)" : "transparent",
                  }}
                >
                  <td className="px-4 py-3 font-mono" style={{ color: "#a855f7" }}>{v.key}</td>
                  <td className="px-4 py-3">
                    {v.required ? (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ color: "#f87171", background: "rgba(248,113,113,0.1)" }}>required</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ color: "var(--muted)", background: "rgba(255,255,255,0.05)" }}>optional</span>
                    )}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{v.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Deployment ── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <SectionHeading
          label="Deployment"
          title="Deploy anywhere"
          subtitle="Ready-to-run scripts for every major platform are in the deployment/ folder."
        />
        <div className="space-y-6">
          {DEPLOY_TARGETS.map((target) => (
            <div
              key={target.name}
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              {/* Target header */}
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
              >
                <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{target.name}</h3>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ color: target.badgeColor, background: target.badgeBg, border: `1px solid ${target.badgeColor}40` }}
                >
                  {target.badge}
                </span>
              </div>

              {/* Steps */}
              <div className="p-5 space-y-4" style={{ background: "rgba(0,0,0,0.2)" }}>
                {target.steps.map((step, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold mr-2"
                        style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}
                      >
                        {i + 1}
                      </span>
                      {step.label}
                    </p>
                    <CodeBlock code={step.code} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── System Prompt / Personality ── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <SectionHeading
          label="Customization"
          title="Configuring the AI personality"
          subtitle="Set a system prompt to give the AI a specific persona, domain focus, or response style."
        />
        <div className="space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            The system prompt is configurable from{" "}
            <Link href="/settings" className="underline underline-offset-2 hover:opacity-80" style={{ color: "#a855f7" }}>
              Settings → System Prompt
            </Link>
            {" "}or via the <code className="px-1 py-0.5 rounded text-xs" style={{ background: "rgba(0,0,0,0.3)", color: "#c4b5fd" }}>LLM_SYSTEM_PROMPT</code> environment variable.
            Sources citations are always appended on top of your system prompt — they cannot be disabled.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Research assistant (default)", code: "You are a helpful, precise AI assistant.\nLead with the direct answer. Use bold for key terms.\nSay \"I don't have reliable data on that\" rather than guessing." },
              { label: "Domain expert", code: "You are a senior software engineer.\nAnswer only technical questions with working,\nproduction-ready code. No filler text." },
            ].map((ex) => (
              <div key={ex.label}>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>{ex.label}</p>
                <CodeBlock code={ex.code} lang="system prompt" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div
          className="rounded-2xl p-8 text-center relative overflow-hidden"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full opacity-15 blur-3xl"
              style={{ background: "radial-gradient(ellipse, #6366f1 0%, transparent 70%)" }}
            />
          </div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
              Ready to start?
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
              Deploy in minutes — or open the chat and start researching right now.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
              >
                Open Chat →
              </Link>
              <a
                href="#quickstart"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
                style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }}
              >
                Read the docs ↑
              </a>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
                style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }}
              >
                About OpenChat →
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
