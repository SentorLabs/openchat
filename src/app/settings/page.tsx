"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { LLMProvider } from "@/lib/types";

const PROVIDERS: { value: LLMProvider; label: string; logo: string }[] = [
  { value: "openai",    label: "OpenAI",         logo: "⬡" },
  { value: "anthropic", label: "Anthropic",       logo: "◈" },
  { value: "gemini",    label: "Google Gemini",   logo: "✦" },
  { value: "ollama",    label: "Ollama (local)",  logo: "○" },
];

const MODEL_PLACEHOLDERS: Record<LLMProvider, string> = {
  openai:    "gpt-4o",
  anthropic: "claude-opus-4-6",
  gemini:    "gemini-2.0-flash",
  ollama:    "llama3.2",
};

const API_KEY_LABELS: Record<LLMProvider, string> = {
  openai:    "OpenAI API Key",
  anthropic: "Anthropic API Key",
  gemini:    "Google AI Studio API Key",
  ollama:    "API Key (not required for Ollama)",
};

const API_KEY_LINKS: Record<LLMProvider, string> = {
  openai:    "https://platform.openai.com/api-keys",
  anthropic: "https://console.anthropic.com/settings/keys",
  gemini:    "https://aistudio.google.com/app/apikey",
  ollama:    "",
};

const DB_EXAMPLES = [
  { label: "PostgreSQL",  hint: "postgresql://user:password@host:5432/dbname" },
  { label: "MySQL",       hint: "mysql://user:password@host:3306/dbname" },
  { label: "SQLite file", hint: "/absolute/path/to/openchat.db" },
  { label: "SQLite memory", hint: ":memory:" },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";
type TestStatus = "idle" | "testing" | "ok" | "error";

export default function SettingsPage() {
  const [provider, setProvider]           = useState<LLMProvider>("openai");
  const [model, setModel]                 = useState("");
  const [apiKey, setApiKey]               = useState("");
  const [apiKeySet, setApiKeySet]         = useState(false);
  const [systemPrompt, setSystemPrompt]   = useState("");
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState("http://localhost:11434");
  const [status, setStatus]               = useState<SaveStatus>("idle");
  const [loading, setLoading]             = useState(true);

  // Database state
  const [databaseUrl, setDatabaseUrl]     = useState("");
  const [dbDialect, setDbDialect]         = useState("");
  const [dbUrlSet, setDbUrlSet]           = useState(false);
  const [testStatus, setTestStatus]       = useState<TestStatus>("idle");
  const [testError, setTestError]         = useState("");

  // Load current settings on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.provider)      setProvider(d.provider);
        if (d.model)         setModel(d.model);
        if (d.apiKeySet)     setApiKeySet(true);
        if (d.systemPrompt)  setSystemPrompt(d.systemPrompt);
        if (d.ollamaBaseUrl) setOllamaBaseUrl(d.ollamaBaseUrl);
        if (d.dbDialect)     setDbDialect(d.dbDialect);
        if (d.dbUrlSet)      setDbUrlSet(true);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleTestDb() {
    if (!databaseUrl.trim()) return;
    setTestStatus("testing");
    setTestError("");
    try {
      const res = await fetch("/api/db-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Connection failed");
      setDbDialect(data.dialect ?? "");
      setDbUrlSet(true);
      setTestStatus("ok");
      setTimeout(() => setTestStatus("idle"), 4000);
    } catch (e) {
      setTestError(e instanceof Error ? e.message : String(e));
      setTestStatus("error");
      setTimeout(() => setTestStatus("idle"), 6000);
    }
  }

  async function handleSave() {
    setStatus("saving");
    try {
      const body: Record<string, string | boolean> = {
        provider,
        model,
        systemPrompt,
        ollamaBaseUrl,
      };
      if (apiKey) body.apiKey = apiKey;
      if (databaseUrl && databaseUrl !== "••••••••") body.databaseUrl = databaseUrl;

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      setApiKeySet(apiKey.length > 0 || apiKeySet);
      setApiKey("");
      if (databaseUrl) {
        setDbUrlSet(true);
        setDatabaseUrl("");
      }
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(168,85,247,0.2)", borderTopColor: "#a855f7" }} />
      </div>
    );
  }

  const apiKeyLink = API_KEY_LINKS[provider];

  return (
    <div className="flex-1 px-4 py-10 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 fade-in">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
          style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.25)" }}
        >
          Configuration
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "var(--foreground)" }}>
          Model settings
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Choose your AI provider, model, and API credentials. Settings are saved to your database and take effect immediately — no restart needed.
        </p>
      </div>

      <div className="space-y-6">

        {/* Database connection */}
        <Section
          title="Database"
          hint={
            dbUrlSet
              ? `Connected — ${dbDialect || "database"} detected. Enter a new URL to switch.`
              : "Set your database connection string. Supports PostgreSQL, MySQL, and SQLite."
          }
        >
          <div className="relative">
            <input
              type="password"
              value={databaseUrl}
              onChange={(e) => setDatabaseUrl(e.target.value)}
              placeholder={dbUrlSet ? "Enter new URL to replace current connection" : "postgresql://user:pass@host:5432/dbname"}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all font-mono pr-24"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                caretColor: "#a855f7",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(168,85,247,0.5)";
                e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(168,85,247,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow   = "none";
              }}
            />
            {dbUrlSet && !databaseUrl && (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                {dbDialect || "connected"}
              </span>
            )}
          </div>

          {/* Test connection button */}
          {databaseUrl.trim() && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={handleTestDb}
                disabled={testStatus === "testing"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-60"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}
              >
                {testStatus === "testing" && (
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                )}
                {testStatus === "ok"      && <span style={{ color: "var(--success)" }}>✓</span>}
                {testStatus === "error"   && <span style={{ color: "#f87171" }}>✗</span>}
                {testStatus === "testing" ? "Testing…" : testStatus === "ok" ? "Connected" : testStatus === "error" ? "Failed" : "Test connection"}
              </button>
              {testStatus === "ok" && (
                <span className="text-xs" style={{ color: "var(--success)" }}>
                  Schema initialised successfully
                </span>
              )}
            </div>
          )}
          {testStatus === "error" && testError && (
            <p className="mt-1.5 text-xs" style={{ color: "#f87171" }}>{testError}</p>
          )}

          {/* Format examples */}
          <div className="mt-3 flex flex-col gap-1">
            {DB_EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => setDatabaseUrl(ex.hint)}
                className="flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,85,247,0.4)";
                  (e.currentTarget as HTMLElement).style.color = "#c4b5fd";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.color = "var(--muted)";
                }}
              >
                <span className="opacity-60 w-24 shrink-0">{ex.label}</span>
                <code className="font-mono truncate">{ex.hint}</code>
              </button>
            ))}
          </div>
        </Section>

        {/* Provider selector */}
        <Section title="AI Provider" hint="Choose which AI service powers your assistant.">
          <div className="grid grid-cols-2 gap-3">
            {PROVIDERS.map((p) => {
              const active = provider === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => setProvider(p.value)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all cursor-pointer"
                  style={{
                    background: active ? "rgba(168,85,247,0.12)" : "var(--surface)",
                    border: active ? "1.5px solid rgba(168,85,247,0.5)" : "1.5px solid var(--border)",
                    color: active ? "#c4b5fd" : "var(--muted)",
                  }}
                >
                  <span className="text-lg opacity-70">{p.logo}</span>
                  <span>{p.label}</span>
                  {active && (
                    <span className="ml-auto w-2 h-2 rounded-full shrink-0" style={{ background: "#a855f7" }} />
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Model name */}
        <Section
          title="Model"
          hint={`Enter the exact model name for ${PROVIDERS.find((p) => p.value === provider)?.label}.`}
        >
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={MODEL_PLACEHOLDERS[provider]}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all font-mono"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              caretColor: "#a855f7",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(168,85,247,0.5)";
              e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(168,85,247,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow   = "none";
            }}
          />
          <ModelHints provider={provider} />
        </Section>

        {/* API Key */}
        <Section
          title={API_KEY_LABELS[provider]}
          hint={
            provider === "ollama"
              ? "Ollama runs locally — no API key required."
              : apiKeySet
              ? "A key is already saved. Enter a new value to replace it."
              : "Your key is encrypted in transit and stored in your own database."
          }
        >
          {provider !== "ollama" && (
            <>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={apiKeySet ? "Enter new key to replace saved key" : "sk-..."}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all font-mono pr-10"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                    caretColor: "#a855f7",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(168,85,247,0.5)";
                    e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(168,85,247,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow   = "none";
                  }}
                />
                {apiKeySet && (
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.2)" }}
                  >
                    saved
                  </span>
                )}
              </div>
              {apiKeyLink && (
                <p className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
                  Get your API key at{" "}
                  <a
                    href={apiKeyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                    style={{ color: "#a855f7" }}
                  >
                    {apiKeyLink.replace("https://", "")}
                  </a>
                </p>
              )}
            </>
          )}
          {provider === "ollama" && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}>
              <span>No key needed — Ollama runs on your machine.</span>
            </div>
          )}
        </Section>

        {/* Ollama base URL */}
        {provider === "ollama" && (
          <Section title="Ollama Base URL" hint="URL where your Ollama instance is running.">
            <input
              type="text"
              value={ollamaBaseUrl}
              onChange={(e) => setOllamaBaseUrl(e.target.value)}
              placeholder="http://localhost:11434"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all font-mono"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                caretColor: "#a855f7",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(168,85,247,0.5)";
                e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(168,85,247,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow   = "none";
              }}
            />
          </Section>
        )}

        {/* System prompt */}
        <Section
          title="System Prompt"
          hint="Define your assistant's personality, focus, and rules. Leave blank to use the default research-focused prompt."
        >
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={6}
            placeholder={`Example:\n"You are a senior software engineer. Answer only technical questions with working code examples. Be concise and precise."`}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none font-sans leading-relaxed"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              caretColor: "#a855f7",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(168,85,247,0.5)";
              e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(168,85,247,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow   = "none";
            }}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {PROMPT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setSystemPrompt(preset.prompt)}
                className="px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,85,247,0.4)";
                  (e.currentTarget as HTMLElement).style.color = "#c4b5fd";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.color = "var(--muted)";
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Save button */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--muted)" }}
          >
            ← Back to chat
          </Link>
          <button
            onClick={handleSave}
            disabled={status === "saving"}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all cursor-pointer disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
          >
            {status === "saving" && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {status === "saved"  && <span>✓</span>}
            {status === "error"  && <span>✗</span>}
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Error — try again" : "Save settings"}
          </button>
        </div>

        {status === "error" && (
          <p className="text-xs text-center" style={{ color: "#f87171" }}>
            Could not save settings. Check your database connection and try again.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="mb-3">
        <div className="text-sm font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>
          {title}
        </div>
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          {hint}
        </div>
      </div>
      {children}
    </div>
  );
}

function ModelHints({ provider }: { provider: LLMProvider }) {
  const hints: Record<LLMProvider, { model: string; desc: string }[]> = {
    openai: [
      { model: "gpt-4o",      desc: "Best quality" },
      { model: "gpt-4o-mini", desc: "Faster & cheaper" },
      { model: "o3-mini",     desc: "Reasoning" },
    ],
    anthropic: [
      { model: "claude-opus-4-6",   desc: "Most capable" },
      { model: "claude-sonnet-4-6", desc: "Balanced" },
      { model: "claude-haiku-4-5",  desc: "Fastest" },
    ],
    gemini: [
      { model: "gemini-2.0-flash",   desc: "Fast & capable" },
      { model: "gemini-1.5-pro",     desc: "Long context" },
    ],
    ollama: [
      { model: "llama3.2",  desc: "Meta Llama 3.2" },
      { model: "mistral",   desc: "Mistral 7B" },
      { model: "phi4",      desc: "Microsoft Phi-4" },
      { model: "gemma3",    desc: "Google Gemma 3" },
    ],
  };

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {hints[provider].map((h) => (
        <span
          key={h.model}
          className="px-2 py-0.5 rounded text-xs font-mono cursor-default"
          style={{ background: "rgba(168,85,247,0.08)", color: "rgba(196,181,253,0.7)", border: "1px solid rgba(168,85,247,0.15)" }}
          title={h.desc}
        >
          {h.model}
        </span>
      ))}
    </div>
  );
}

const PROMPT_PRESETS = [
  {
    label: "Research assistant",
    prompt: "You are a precise research assistant. Every response must be grounded in facts and end with cited sources. Never speculate — say \"I don't have reliable data on that\" when uncertain.",
  },
  {
    label: "Software engineer",
    prompt: "You are a senior software engineer. Answer only technical questions with working, production-ready code. Be concise. Prefer clarity over cleverness.",
  },
  {
    label: "Writing coach",
    prompt: "You are a writing coach focused on clarity, brevity, and impact. Give direct, actionable feedback. Cut filler words. Prefer active voice.",
  },
  {
    label: "Customer support",
    prompt: "You are a helpful customer support agent. Be friendly, concise, and solution-focused. Escalate to a human if the issue is outside your knowledge.",
  },
];
