#!/usr/bin/env bash
set -euo pipefail

# Escala de Substituição — runner da regressão v1
# STATUS: SYNTHETIC / HARNESS-SAFE
# GATE-FONTE-SED: RED/BLOCKED
# Requer PostgreSQL client (psql) e DATABASE_URL apontando para banco de teste.
# Nunca executar contra banco de produção.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PREFLIGHT="$ROOT_DIR/regression-preflight.sh"

if [[ ! -x "$PREFLIGHT" ]]; then
  echo "ERROR: preflight ausente ou sem permissão de execução: $PREFLIGHT" >&2
  exit 2
fi

if ! "$PREFLIGHT"; then
  echo "REGRESSION_SUITE_STATUS=BLOCKED"
  exit 2
fi

HARNESS_FILES=(
  "global-allocation-v1.sql"
  "global-allocation-adversarial-v1.sql"
  "global-allocation-determinism-v1.sql"
  "human-override-preservation-v1.sql"
)

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

failures=0
executed=0

for file in "${HARNESS_FILES[@]}"; do
  path="$ROOT_DIR/$file"
  output="$TMP_DIR/${file}.out"
  executed=$((executed + 1))

  echo "==> Executando $file"
  if ! psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -At -f "$path" >"$output" 2>&1; then
    echo "FAIL: erro de execução em $file"
    cat "$output"
    failures=$((failures + 1))
    continue
  fi

  cat "$output"

  if grep -Eq '(^|[|[:space:]])FAIL_[A-Z0-9_]+($|[|[:space:]])' "$output"; then
    echo "FAIL: asserção falhou em $file"
    failures=$((failures + 1))
  else
    echo "PASS: $file"
  fi
done

echo
if [[ "$failures" -eq 0 ]]; then
  echo "REGRESSION_SUITE_STATUS=PASS"
  echo "HARNESS_FILES_EXECUTED=$executed"
  echo "NOTA: PASS significa somente que os harnesses sintéticos executados não reportaram FAIL."
  echo "GATE-FONTE-SED=RED/BLOCKED"
  exit 0
fi

echo "REGRESSION_SUITE_STATUS=FAIL"
echo "HARNESS_FILES_EXECUTED=$executed"
echo "HARNESS_FAILURES=$failures"
echo "GATE-FONTE-SED=RED/BLOCKED"
exit 1
