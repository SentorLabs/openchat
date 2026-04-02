# OpenChat

> If OpenChat is useful to you, consider leaving a ⭐ — it helps others find the project.

**Your AI assistant. Your rules. Your experience.**

Today you can access models that answer your questions — but the experience is always someone else's. Fixed UI. Fixed prompts. Fixed personality. OpenChat is different: it gives you full ownership of the chat experience, running on whatever model you choose, deployed wherever you want, shaped exactly how you want it.

OpenChat is a free, open source chat UI with persistent session management, multi-provider LLM support, and cited sources built in. Bring your own model — Groq, OpenAI, Anthropic, Google Gemini, or a local Ollama instance — and get a production-quality research assistant that you fully control. Configure the personality, swap the model, deploy to your own infrastructure. No locked-in subscriptions, no data sent to third parties you didn't choose.

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

Most chat products give you a great experience — until they change it. You have no say in the model, the personality, or where your conversations go. OpenChat flips that:

- **You pick the model.** OpenAI, Anthropic, Gemini, Ollama, Groq — swap with one env var.
- **You own the experience.** Override the system prompt to tune the AI's personality, tone, and focus.
- **You own your data.** Conversations live in your own PostgreSQL database. Nothing leaves your infrastructure.
- **You control the deployment.** Run locally, on Docker, or in the cloud. SAP BTP Cloud Foundry guide included.

---

## Features

- **Multi-provider LLM support** — Groq, OpenAI, Anthropic, Google Gemini, Ollama — zero code changes to switch
- **Persistent sessions** — full chat history stored in PostgreSQL; survives restarts and reloads
- **Session sidebar** — browse, switch, and create conversations from the sidebar
- **Real-time streaming** — responses stream live with a typing cursor indicator
- **Cited sources** — every AI response includes a collapsible sources banner; no unverified claims
- **Configurable personality** — override the default system prompt via `LLM_SYSTEM_PROMPT`
- **Dark-mode UI** — clean, minimal interface built with Next.js 16 and Tailwind CSS v4
- **Cloud Foundry ready** — manifest and deployment guide for SAP BTP

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 14 (running locally or via Docker)
- An API key for your chosen LLM provider

### 1. Clone and install

```bash
git clone https://github.com/SentorLabs/openchat.git
cd openchat
npm install
```

### 2. Configure environment

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

```env
# Choose your provider: groq | openai | anthropic | gemini | ollama
LLM_PROVIDER=groq

# Model name for your chosen provider
LLM_MODEL=llama-3.3-70b-versatile

# API key (not required for Ollama)
LLM_API_KEY=your_api_key_here

# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:password@localhost:5432/openchat

# Optional: override the default system prompt
# LLM_SYSTEM_PROMPT="You are a helpful assistant focused on software engineering."
```

### 3. Create the database

```bash
createdb openchat
```

OpenChat automatically creates the required tables on first run — no manual migrations needed.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## LLM Provider Configuration

| Provider | `LLM_PROVIDER` | Example `LLM_MODEL` | Key required |
|---|---|---|---|
| [Groq](https://console.groq.com) | `groq` | `llama-3.3-70b-versatile` | Yes |
| [OpenAI](https://platform.openai.com) | `openai` | `gpt-4o` | Yes |
| [Anthropic](https://console.anthropic.com) | `anthropic` | `claude-opus-4-6` | Yes |
| [Google Gemini](https://aistudio.google.com) | `gemini` | `gemini-2.0-flash` | Yes |
| [Ollama](https://ollama.com) (local) | `ollama` | `llama3.2` | No |

For Ollama, also set `OLLAMA_BASE_URL` if your instance isn't on `http://localhost:11434`.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `LLM_PROVIDER` | Yes | `groq` | LLM backend to use |
| `LLM_MODEL` | Yes | — | Model name for your provider |
| `LLM_API_KEY` | Yes* | — | API key (*not needed for Ollama) |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `LLM_SYSTEM_PROMPT` | No | Built-in | Override the AI's system prompt |
| `OLLAMA_BASE_URL` | No | `http://localhost:11434` | Ollama base URL |

---

## Customising the AI Personality

The most powerful feature of OpenChat is the ability to define exactly what kind of assistant you want. Set `LLM_SYSTEM_PROMPT` to anything:

```env
# A focused coding assistant
LLM_SYSTEM_PROMPT="You are a senior software engineer. Answer only technical questions with code examples. Be concise."

# A research assistant with strict citation rules
LLM_SYSTEM_PROMPT="You are a research analyst. Always cite primary sources. Never state unverified facts."

# A customer support agent for your product
LLM_SYSTEM_PROMPT="You are a support agent for Acme Corp. Only answer questions about our product. Be friendly and brief."
```

No redeploy needed — just update the env var and restart.

---

## Deployment

### Docker (local or server)

```bash
docker build -t openchat .
docker run -p 3000:3000 \
  -e LLM_PROVIDER=groq \
  -e LLM_MODEL=llama-3.3-70b-versatile \
  -e LLM_API_KEY=your_key \
  -e DATABASE_URL=postgresql://... \
  openchat
```

### SAP BTP Cloud Foundry

See **[DEPLOY.md](./DEPLOY.md)** for the complete step-by-step guide including PostgreSQL deployment as a CF app and network policy configuration.

Quick summary:

```bash
# 1. Push Postgres as an internal CF app
cf push -f deploy-postgres.yml

# 2. Create the service binding
cf create-user-provided-service openchat-db -p '{"uri":"postgresql://..."}'

# 3. Push OpenChat
cf push -f manifest.yml

# 4. Network policy + env vars
cf add-network-policy openchat --destination-app postgres-db --port 5432 --protocol tcp
cf set-env openchat LLM_PROVIDER groq
cf set-env openchat LLM_MODEL llama-3.3-70b-versatile
cf set-env openchat LLM_API_KEY your_key
cf restage openchat
```

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
│   ├── about/page.tsx             # About page
│   ├── releases/page.tsx          # Changelog
│   ├── page.tsx                   # Main chat UI
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── Nav.tsx                    # Top navigation bar
│   ├── Sidebar.tsx                # Session list panel
│   └── SourcesBanner.tsx         # Collapsible sources banner
└── lib/
    ├── db.ts                      # PostgreSQL pool + schema init
    ├── llm.ts                     # Unified multi-provider LLM adapter
    ├── sources.ts                 # Parse & strip [SOURCES] blocks
    └── types.ts                   # Shared TypeScript interfaces
```

---

## Contributing

Contributions are welcome and appreciated. OpenChat is built for the community — if you run your own AI assistant, you know what's missing.

### Getting started

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes and add tests where relevant
4. Ensure the build passes: `npm run build`
5. Open a pull request with a clear description of the change

### What we're looking for

- **New LLM providers** — add support for Mistral, Cohere, Together AI, etc.
- **UI improvements** — message formatting, markdown rendering, code highlighting
- **Export features** — download chat history as PDF or Markdown
- **Auth support** — multi-user mode with authentication
- **Docker Compose** — a ready-to-run compose file with Postgres included
- **Bug fixes** — check the issues tab

### Code style

- TypeScript strict mode — no `any` without a comment explaining why
- Keep components focused — one responsibility per file
- Environment-driven configuration — no hardcoded credentials or model names
- Test your provider integration locally before submitting

### Reporting issues

Please open an issue with:

- Steps to reproduce
- Expected vs actual behaviour
- Your `LLM_PROVIDER` and Node.js version
- Any relevant log output

---

## Database Schema

OpenChat auto-creates these tables on first run:

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

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (via `node-postgres`) |
| LLM providers | Groq, OpenAI, Anthropic, Google Gemini, Ollama |
| Runtime | Node.js ≥ 20 |

---

## License

Apache 2.0 — see [LICENSE](./LICENSE) for details.

You are free to use, modify, and distribute OpenChat for any purpose, including commercial use. If you distribute derivative works, include a copy of the license and preserve attribution notices. If you build something great on top of it, we'd love to hear about it.

---

## Acknowledgements

OpenChat is a community project. Thank you to everyone who has contributed ideas, bug reports, and code. Built with Next.js, Tailwind CSS, and the open source AI ecosystem.

---

*Take control of your AI experience.*
