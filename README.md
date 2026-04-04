<div align="center">

# OpenChat

### The open-source AI chat that shows its work.

*Every answer. Cited sources. Your model. Your data. Your rules.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](./LICENSE)
[![Version](https://img.shields.io/badge/version-0.0.2-purple.svg)](https://github.com/SentorLabs/openchat/releases)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-brightgreen.svg)](https://nodejs.org)
[![CI](https://github.com/SentorLabs/openchat/actions/workflows/ci.yml/badge.svg)](https://github.com/SentorLabs/openchat/actions/workflows/ci.yml)
[![Stars](https://img.shields.io/github/stars/SentorLabs/openchat?style=social)](https://github.com/SentorLabs/openchat/stargazers)

[**Quick Start**](#quick-start) · [**Features**](#features) · [**Deploy**](#deployment) · [**Contributing**](#contributing)

</div>

---

> Tired of AI that confidently makes things up? OpenChat grounds every response in real, verifiable sources — and you own everything: the model, the data, the deployment.

---

## How it works

![OpenChat workflow](docs/screenshots/openchat_workflow.png)

---

## Screenshots

<table>
  <tr>
    <td align="center"><b>Overview</b><br><img src="docs/screenshots/overview.png" alt="Overview"/></td>
    <td align="center"><b>Chat — cited sources</b><br><img src="docs/screenshots/chat.png" alt="Chat"/></td>
    <td align="center"><b>Settings</b><br><img src="docs/screenshots/settings.png" alt="Settings"/></td>
  </tr>
</table>

---

## Why OpenChat?

Most AI chat tools give you a great experience — until they change it. You have no say in the model, the personality, or where your conversations go.

OpenChat flips that:

| | OpenChat | Typical SaaS AI |
|---|---|---|
| Pick your model | ✅ Any provider | ❌ Locked in |
| Own your data | ✅ Your database | ❌ Their servers |
| Cited sources | ✅ Every response | ❌ Rarely |
| Self-hostable | ✅ Docker / Cloud | ❌ Subscription |
| Customise personality | ✅ Full control | ❌ Fixed prompts |

---

## Features

- **Multi-provider LLM** — Groq, OpenAI, Anthropic, Google Gemini, Ollama — swap with one env var, zero code changes
- **Cited sources** — every AI response includes a collapsible sources banner; no unverified claims
- **Persistent sessions** — full chat history in PostgreSQL, MySQL, or SQLite; survives restarts
- **Real-time streaming** — responses stream live with a typing cursor indicator
- **Settings UI** — change provider, model, API key, and database from the browser — no restart needed
- **Configurable personality** — tune the AI's tone, focus, and rules via `LLM_SYSTEM_PROMPT`
- **Dark-mode UI** — clean, minimal interface built with Next.js 16 and Tailwind CSS v4
- **Production-ready** — Docker, Cloud Foundry, GCP, AWS, and Azure deployment guides included

---

## Quick Start

> Get OpenChat running locally in under 2 minutes.

### 1. Clone and install

```bash
git clone https://github.com/SentorLabs/openchat.git
cd openchat
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

```env
LLM_PROVIDER=groq                        # groq | openai | anthropic | gemini | ollama
LLM_MODEL=llama-3.3-70b-versatile
LLM_API_KEY=your_api_key_here
DATABASE_URL=postgresql://postgres:password@localhost:5432/openchat
```

### 3. Run

```bash
createdb openchat   # auto-creates tables on first run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). That's it.

---

## LLM Providers

| Provider | `LLM_PROVIDER` | Example model | Free tier |
|---|---|---|---|
| [Groq](https://console.groq.com) | `groq` | `llama-3.3-70b-versatile` | ✅ Yes |
| [OpenAI](https://platform.openai.com) | `openai` | `gpt-4o` | ❌ No |
| [Anthropic](https://console.anthropic.com) | `anthropic` | `claude-opus-4-6` | ❌ No |
| [Google Gemini](https://aistudio.google.com) | `gemini` | `gemini-2.0-flash` | ✅ Yes |
| [Ollama](https://ollama.com) (local) | `ollama` | `llama3.2` | ✅ Free |

---

## Customising the AI Personality

```env
# Coding assistant
LLM_SYSTEM_PROMPT="You are a senior software engineer. Answer only technical questions with code examples."

# Strict research analyst
LLM_SYSTEM_PROMPT="You are a research analyst. Always cite primary sources. Never state unverified facts."

# Customer support agent
LLM_SYSTEM_PROMPT="You are a support agent for Acme Corp. Only answer questions about our product."
```

No redeploy needed — update the env var and restart.

---

## Deployment

<details>
<summary><b>Docker</b></summary>

```bash
docker build -t openchat .
docker run -p 3000:3000 \
  -e LLM_PROVIDER=groq \
  -e LLM_MODEL=llama-3.3-70b-versatile \
  -e LLM_API_KEY=your_key \
  -e DATABASE_URL=postgresql://... \
  openchat
```

</details>

<details>
<summary><b>SAP BTP Cloud Foundry</b></summary>

See **[DEPLOY.md](./DEPLOY.md)** for the full guide.

```bash
cf push -f deploy-postgres.yml
cf create-user-provided-service openchat-db -p '{"uri":"postgresql://..."}'
cf push -f manifest.yml
cf add-network-policy openchat --destination-app postgres-db --port 5432 --protocol tcp
cf set-env openchat LLM_PROVIDER groq
cf restage openchat
```

</details>

<details>
<summary><b>GCP / AWS / Azure</b></summary>

See **[DEPLOY.md](./DEPLOY.md)** for Cloud Run, App Runner, and Container Apps guides.

</details>

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Streaming chat endpoint
│   │   ├── sessions/route.ts      # List & create sessions
│   │   └── sessions/[id]/
│   │       └── messages/route.ts  # Load session messages
│   ├── about/page.tsx
│   ├── releases/page.tsx
│   ├── page.tsx                   # Main chat UI
│   └── globals.css
├── components/
│   ├── Nav.tsx                    # Top navigation bar
│   ├── Sidebar.tsx                # Session list panel
│   └── SourcesBanner.tsx          # Collapsible sources banner
└── lib/
    ├── db.ts                      # Multi-database adapter (PG / MySQL / SQLite)
    ├── llm.ts                     # Unified multi-provider LLM adapter
    ├── sources.ts                 # Parse & strip [SOURCES] blocks
    └── types.ts                   # Shared TypeScript interfaces
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL · MySQL · SQLite |
| LLM providers | Groq · OpenAI · Anthropic · Gemini · Ollama |
| Runtime | Node.js ≥ 20 |

---

## Contributing

OpenChat is built for the community. If you run your own AI assistant, you know what's missing — and PRs are welcome.

### Good first contributions

- **New LLM providers** — Mistral, Cohere, Together AI
- **UI improvements** — markdown rendering, code highlighting
- **Export features** — download chat history as PDF or Markdown
- **Auth support** — multi-user mode with authentication
- **Docker Compose** — ready-to-run compose file with Postgres

### How to contribute

```bash
git checkout -b feat/your-feature
# make your changes
npm run test && npm run build
# open a pull request
```

### Reporting issues

Open an issue with: steps to reproduce · expected vs actual · your `LLM_PROVIDER` · Node.js version.

---

## Database Schema

<details>
<summary>View schema (auto-created on first run)</summary>

```sql
CREATE TABLE sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT NOT NULL,
  sources    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

</details>

---

## License

Apache 2.0 — free to use, modify, and distribute, including for commercial use. See [LICENSE](./LICENSE).

---

<div align="center">

**If OpenChat saves you time, a ⭐ goes a long way.**

*Take control of your AI experience.*

</div>
