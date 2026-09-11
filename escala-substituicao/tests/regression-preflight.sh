#!/usr/bin/env bash
set -u

# Escala de Substituição — preflight da regressão v1
# STATUS: SYNTHETIC / HARNESS-SAFE
# GATE-FONTE-SED: RED/BLOCKED

fail() {
  printf 'REGRESSION_PREFLIGHT=FAIL\nREASON=%s\n' "$1"
  exit 1
}

command -v psql >/dev/null 2>&1 || fail 'psql_not_found'

[ -n "${DATABASE_URL:-}" ] || fail 'DATABASE_URL_missing'

case "${DATABASE_URL}" in
  *production*|*prod*) fail 'production_database_identifier_detected' ;;
esac

required_files=(
  'escala-substituicao/tests/global-allocation-v1.sql'
  'escala-substituicao/tests/global-allocation-adversarial-v1.sql'
  'escala-substituicao/tests/global-allocation-determinism-v1.sql'
  'escala-substituicao/tests/human-override-preservation-v1.sql'
  'escala-substituicao/tests/regression-suite-v1.sql'
)

for file in "${required_files[@]}"; do
  [ -f "$file" ] || fail "missing:$file"
done

printf 'REGRESSION_PREFLIGHT=PASS\nFILES=%s\n' "${#required_files[@]}"

# Este preflight não executa nenhum teste e não conecta a fontes externas.
# O runner deve abortar se este preflight falhar.