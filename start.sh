#!/bin/sh
# OpenChat quick start — no API key, no Docker, no database setup.
# Requires: Node.js >=20, npm, curl

set -e

# ── 1. Install Ollama if not present ─────────────────────────────────────────
if ! command -v ollama >/dev/null 2>&1; then
  echo "Installing Ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
else
  echo "Ollama already installed."
fi

# ── 2. Start Ollama in the background ────────────────────────────────────────
if ! pgrep -x ollama >/dev/null 2>&1; then
  echo "Starting Ollama..."
  ollama serve &
  sleep 3
fi

# ── 3. Pull Gemma 3 4B if not already downloaded ─────────────────────────────
if ! ollama list | grep -q "gemma3:4b"; then
  echo "Pulling Gemma 3 4B (~3 GB, one-time download)..."
  ollama pull gemma3:4b
else
  echo "Gemma 3 4B already available."
fi

# ── 4. Install Node dependencies ─────────────────────────────────────────────
echo "Installing dependencies..."
npm install

# ── 5. Write .env.local ───────────────────────────────────────────────────────
if [ ! -f .env.local ]; then
  echo "Writing .env.local..."
  cat > .env.local <<EOF
LLM_PROVIDER=ollama
LLM_MODEL=gemma3:4b
OLLAMA_BASE_URL=http://localhost:11434
DATABASE_URL=./openchat.db
EOF
else
  echo ".env.local already exists — skipping."
fi

# ── 6. Done ───────────────────────────────────────────────────────────────────
echo ""
echo "All set! Starting OpenChat..."
echo "Open http://localhost:3000 in your browser."
echo ""
npm run dev
