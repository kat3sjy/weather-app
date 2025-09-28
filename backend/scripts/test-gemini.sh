#!/usr/bin/env bash
set -euo pipefail

# Load env from backend/.env
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

MODEL="${GEMINI_MODEL:-gemini-1.5-flash}"
KEY="${GEMINI_API_KEY:-}"

if [[ -z "$KEY" ]]; then
  echo "GEMINI_API_KEY not set in backend/.env" >&2
  exit 1
fi

PROMPT="Ping from curl — reply with 'pong'."
URL="https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent"
BODY=$(printf '{"contents":[{"role":"user","parts":[{"text":"%s"}]}]}' "$PROMPT")

echo "POST $URL"
curl -sS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: $KEY" \
  -d "$BODY" \
  -w "\nHTTP %{http_code}\n"
