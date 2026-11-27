#!/usr/bin/env bash
# Applies every migration to a throwaway Postgres database and runs the SQL
# test suite in supabase/tests (RLS, constraints, and RPC behaviour).
#
# Usage:
#   npm run test:db                      # starts a temporary local Postgres (needs initdb/pg_ctl)
#   DATABASE_URL=postgres://... npm run test:db   # uses an existing, disposable server (CI)
#
# The target database is DROPPED and recreated. Never point this at Supabase.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB_NAME="collegepath_test"
TMP_CLUSTER=""

cleanup() {
  if [[ -n "$TMP_CLUSTER" ]]; then
    pg_ctl -D "$TMP_CLUSTER/data" -m immediate stop >/dev/null 2>&1 || true
    rm -rf "$TMP_CLUSTER"
  fi
}
trap cleanup EXIT

if [[ -z "${DATABASE_URL:-}" ]]; then
  command -v initdb >/dev/null || { echo "initdb not found; install PostgreSQL 15+ or set DATABASE_URL" >&2; exit 1; }
  TMP_CLUSTER="$(mktemp -d)"
  PORT=$((20000 + RANDOM % 10000))
  initdb -D "$TMP_CLUSTER/data" -U postgres --auth=trust >/dev/null
  pg_ctl -D "$TMP_CLUSTER/data" -o "-p $PORT -k $TMP_CLUSTER -c listen_addresses=''" -l "$TMP_CLUSTER/log" -w start >/dev/null
  ADMIN_URL="postgresql://postgres@/postgres?host=$TMP_CLUSTER&port=$PORT"
  TEST_URL="postgresql://postgres@/$DB_NAME?host=$TMP_CLUSTER&port=$PORT"
else
  ADMIN_URL="$DATABASE_URL"
  TEST_URL="${DATABASE_URL%/*}/$DB_NAME"
fi

PSQL=(psql -X -q -v ON_ERROR_STOP=1)

"${PSQL[@]}" "$ADMIN_URL" -c "drop database if exists $DB_NAME" -c "create database $DB_NAME" >/dev/null
"${PSQL[@]}" "$TEST_URL" -f "$ROOT/supabase/tests/setup/supabase_stub.sql" >/dev/null

for migration in "$ROOT"/supabase/migrations/*.sql; do
  echo "migrate  $(basename "$migration")"
  "${PSQL[@]}" "$TEST_URL" -f "$migration" >/dev/null
done

failed=0
for test in "$ROOT"/supabase/tests/*.test.sql; do
  if "${PSQL[@]}" "$TEST_URL" -f "$test" >/dev/null 2>"$ROOT/.test-db.err"; then
    echo "pass     $(basename "$test")"
  else
    echo "FAIL     $(basename "$test")"
    sed 's/^/         /' "$ROOT/.test-db.err"
    failed=1
  fi
done
rm -f "$ROOT/.test-db.err"

exit $failed
