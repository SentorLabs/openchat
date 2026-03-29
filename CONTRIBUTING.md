# Contributing to OpenChat

Thank you for your interest in contributing to OpenChat! This project is maintained by [Sentorlabs](https://github.com/sentorlabs) and built for the community.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [What We're Looking For](#what-were-looking-for)
- [Code Style](#code-style)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

Be respectful, constructive, and collaborative. We welcome contributors of all skill levels.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/openchat.git
   cd openchat
   ```
3. **Add the upstream remote** so you can keep your fork in sync:
   ```bash
   git remote add upstream https://github.com/sentorlabs/openchat.git
   ```

---

## Development Setup

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- PostgreSQL ≥ 14
- An API key for at least one LLM provider (or a local Ollama instance)

### Install dependencies

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your values — see the [README](./README.md#environment-variables) for all options.

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Verify the build

Before submitting, make sure the production build passes:

```bash
npm run build
```

---

## How to Contribute

1. **Check existing issues** — look for open issues or discussions before starting new work
2. **Open an issue first** for significant changes — this avoids duplicate effort and lets us align on approach
3. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature
   # or
   git checkout -b fix/your-bug
   ```
4. **Make your changes** — keep commits focused and atomic
5. **Test your changes** — verify locally with at least one LLM provider
6. **Open a pull request** against `main` with a clear description

---

## What We're Looking For

- **New LLM providers** — Mistral, Cohere, Together AI, etc.
- **UI improvements** — markdown rendering, code highlighting, message formatting
- **Export features** — download chat history as PDF or Markdown
- **Auth support** — multi-user mode with authentication
- **Docker Compose** — a ready-to-run compose file with Postgres included
- **Bug fixes** — check the [issues tab](../../issues)
- **Documentation improvements** — clearer setup guides, examples, translations

---

## Code Style

- **TypeScript strict mode** — no `any` without a comment explaining why
- **One responsibility per file** — keep components and modules focused
- **Environment-driven config** — no hardcoded credentials, model names, or URLs
- **No unnecessary abstractions** — solve the current problem, not hypothetical future ones
- **Test your provider integration** locally before submitting

Run the linter before opening a PR:

```bash
npm run lint
```

---

## Submitting a Pull Request

- Target the `main` branch
- Write a clear title and description — explain *what* changed and *why*
- Reference any related issues (e.g. `Closes #42`)
- Keep PRs focused — one feature or fix per PR makes review faster
- Be responsive to review feedback

---

## Reporting Issues

Please open an issue with:

- Steps to reproduce
- Expected vs actual behaviour
- Your `LLM_PROVIDER` and Node.js version
- Any relevant log output or error messages

---

## License

By contributing, you agree that your contributions will be licensed under the [Apache 2.0 License](./LICENSE).

Copyright 2026 Sentorlabs.
