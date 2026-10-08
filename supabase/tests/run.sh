#!/usr/bin/env bash
# Roda migrations + testes de RLS contra um Postgres puro.
# Uso: PGHOST=... PGUSER=... PGPASSWORD=... bash supabase/tests/run.sh
# Sem PGHOST, sobe um cluster temporário com pg_ctl (precisa do Postgres instalado).
set -euo pipefail
cd "$(dirname "$0")/.."

cleanup() { :; }
if [[ -z "${PGHOST:-}" ]]; then
  PG_BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)"
  [[ -n "$PG_BIN" ]] || PG_BIN="$(dirname "$(command -v pg_ctl)")"
  TMP="$(mktemp -d)"
  "$PG_BIN/initdb" -D "$TMP/data" -U postgres -A trust >/dev/null
  "$PG_BIN/pg_ctl" -D "$TMP/data" -o "-k $TMP -p 54329 -c listen_addresses=''" -l "$TMP/log" start >/dev/null
  cleanup() { "$PG_BIN/pg_ctl" -D "$TMP/data" stop -m immediate >/dev/null; rm -rf "$TMP"; }
  export PGHOST="$TMP" PGPORT=54329 PGUSER=postgres
fi
trap cleanup EXIT

DB="margem_teste_$$"
psql -q -d postgres -c "create database $DB" >/dev/null
export PGDATABASE="$DB"
PSQL=(psql -q -v ON_ERROR_STOP=1 -X)

"${PSQL[@]}" -f tests/_stubs_supabase.sql
for f in migrations/*.sql; do
  echo "migration: $f"
  "${PSQL[@]}" -f "$f"
done
for t in tests/*_test.sql; do
  echo "teste:     $t"
  "${PSQL[@]}" -f "$t"
done
psql -q -d postgres -c "drop database $DB" >/dev/null
echo "OK — migrations e testes de RLS passaram."
