#!/usr/bin/env bash
set -euo pipefail

# Read a key's value from .env literally (supports optional quotes)
read_env_var() {
  local key="$1" file="$2" line val
  line="$(grep -E "^[[:space:]]*${key}[[:space:]]*=" "$file" | tail -n1 || true)"
  [[ -z "${line:-}" ]] && return 1
  val="${line#*=}"
  val="${val#"${val%%[![:space:]]*}"}"   # ltrim
  val="${val%"${val##*[![:space:]]}"}"   # rtrim
  # strip surrounding single or double quotes
  [[ "${val:0:1}" == "'" && "${val: -1}" == "'" ]] && val="${val:1:-1}"
  [[ "${val:0:1}" == '"' && "${val: -1}" == '"' ]] && val="${val:1:-1}"
  printf '%s' "$val"
}

# Derive DB name from a MongoDB URI's path or authSource
db_from_uri() {
  local uri="$1" rest path seg auth
  rest="${uri#mongodb://}"; rest="${rest#mongodb+srv://}"
  [[ "$rest" != */* ]] && return 1
  path="${rest#*/}"                # after first slash
  seg="${path%%\?*}"               # before '?'
  seg="${seg%%/*}"                 # first path segment only
  if [[ -n "$seg" ]]; then
    printf '%s' "$seg"; return 0
  fi
  if [[ "$path" == *"authSource="* ]]; then
    auth="$(printf '%s' "$path" | sed -n 's/.*[?&]authSource=\([^&]*\).*/\1/p')"
    [[ -n "$auth" ]] && { printf '%s' "$auth"; return 0; }
  fi
  return 1
}

# Redact password in a MongoDB URI for logging
redact_uri() {
  printf '%s' "$1" | sed -E 's#(mongodb(\+srv)?://[^:@/]+):[^@/]+@#\1:***@#'
}

# Locate backend/.env
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"

# Prefer env var if already exported, else read from .env literally
URI="${MONGO_URI:-${MONGODB_URI:-}}"
if [[ -z "${URI:-}" && -f "$ENV_FILE" ]]; then
  URI="$(read_env_var MONGO_URI "$ENV_FILE" || true)"
  [[ -z "${URI:-}" ]] && URI="$(read_env_var MONGODB_URI "$ENV_FILE" || true)"
fi

# --- NEW: parse args ---
DB_NAME=""
MODE_ALL=0
EXTRA_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --db=*)
      DB_NAME="${1#*=}"
      shift
      ;;
    --db)
      DB_NAME="$2"
      shift 2
      ;;
    -d)
      DB_NAME="$2"
      shift 2
      ;;
    -A|--all)
      MODE_ALL=1
      shift
      ;;
    *)
      # Keep supporting positional DB name for backward compatibility
      if [[ -z "$DB_NAME" && "$1" != "-"* ]]; then
        DB_NAME="$1"
        shift
      else
        EXTRA_ARGS+=("$1")
        shift
      fi
      ;;
  esac
done

# Fallbacks if no DB specified via CLI
if [[ -z "$DB_NAME" && -n "$MONGODB_DB" ]]; then
  DB_NAME="$MONGODB_DB"
fi
# Optional: infer from URI if you already had logic for that
if [[ -z "$DB_NAME" ]]; then
  DB_NAME="$(db_from_uri "$URI" || true)"
fi

if ! command -v mongosh >/dev/null 2>&1; then
  echo "mongosh not found. Install MongoDB Shell: https://www.mongodb.com/try/download/shell" >&2
  exit 1
fi

if [[ -z "${URI:-}" ]]; then
  echo "Set MONGO_URI (or MONGODB_URI) in backend/.env" >&2
  exit 1
fi

if (( MODE_ALL == 1 )); then
  echo "Connecting: $(redact_uri "$URI")"
  echo "Inspecting ALL databases..."
  mongosh "$URI" --quiet <<'MONGO'
const dbs = db.adminCommand({ listDatabases: 1 }).databases.map(d => d.name);
if (!dbs || dbs.length === 0) {
  print("No databases visible (permission or empty).");
} else {
  dbs.forEach(dbName => {
    const d = db.getSiblingDB(dbName);
    print("\nDatabase: " + d.getName());
    const cols = d.getCollectionNames();
    if (!cols || cols.length === 0) {
      print("  No collections.");
    } else {
      cols.forEach(c => {
        const col = d.getCollection(c);
        let count = 0;
        try { count = col.countDocuments({}); } catch (e) {
          try { count = col.estimatedDocumentCount(); } catch (e2) { count = 0; }
        }
        print("  - " + c + " (" + count + ")");
        if (count > 0) {
          try {
            const docs = col.find({}).limit(5).toArray();
            if (docs.length) printjson(docs);
          } catch (e) { print("    (error reading docs: " + e + ")"); }
        } else {
          print("    (no documents)");
        }
      });
    }
  });
}
MONGO
  exit 0
fi

if [[ -z "${DB_NAME:-}" ]]; then
  echo "Connecting: $(redact_uri "$URI")"
  echo "Opening mongosh. Try inside: show dbs; use <db>; show collections; db.<collection>.countDocuments()"
  exec mongosh "$URI"
fi

echo "Connecting: $(redact_uri "$URI")"
echo "Inspecting database: ${DB_NAME} (source: cli)"

DB_NAME="$DB_NAME" mongosh "$URI" --quiet <<'MONGO'
const dbName = process.env.DB_NAME;
const dbSel = db.getSiblingDB(dbName);
print("Database: " + dbSel.getName());
const cols = dbSel.getCollectionNames();
if (!cols || cols.length === 0) {
  print("No collections.");
} else {
  print("Collections and sample docs:");
  cols.forEach(function(c) {
    const col = dbSel.getCollection(c);
    let count = 0;
    try { count = col.countDocuments({}); } catch (e) {
      try { count = col.estimatedDocumentCount(); } catch (e2) { count = 0; }
    }
    print("- " + c + " (" + count + ")");
    if (count > 0) {
      try {
        const docs = col.find({}).limit(5).toArray();
        if (docs.length) {
          printjson(docs);
        } else {
          print("  (no documents)");
        }
      } catch (e) { print("  (error reading docs: " + e + ")"); }
    } else {
      print("  (no documents)");
    }
  });
}
MONGO
