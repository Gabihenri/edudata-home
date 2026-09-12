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
command -v python3 >/dev/null 2>&1 || fail 'python3_not_found'

[ -n "${DATABASE_URL:-}" ] || fail 'DATABASE_URL_missing'

case "${DATABASE_URL}" in
  *production*|*prod*) fail 'production_database_identifier_detected' ;;
esac

# Deve refletir exatamente os harnesses executados pelo runner atual.
required_files=(
  'escala-substituicao/tests/global-allocation-v1.sql'
  'escala-substituicao/tests/global-allocation-adversarial-v1.sql'
  'escala-substituicao/tests/global-allocation-reproducibility-v1.sql'
  'escala-substituicao/tests/human-override-preservation-v1.sql'
  'escala-substituicao/tests/snapshot-reexecution-v1.sql'
  'escala-substituicao/tests/snapshot-change-state-v1.sql'
  'escala-substituicao/tests/round-persistence-v1.sql'
  'escala-substituicao/tests/regression-suite-v1.sql'
)

for file in "${required_files[@]}"; do
  [ -f "$file" ] || fail "missing:$file"
done

fixture='escala-substituicao/tests/round-persistence-fixture-v1.json'
fixture_check='escala-substituicao/tests/round-persistence-fixture-check-v1.sh'
[ -f "$fixture" ] || fail "missing:$fixture"
[ -f "$fixture_check" ] || fail "missing:$fixture_check"

# A fixture sintética pode ser validada sem tocar no banco externo.
# Isso não substitui a regressão PostgreSQL; apenas valida o artefato local.
bash "$fixture_check" | grep -q '^FIXTURE_CHECK=PASS$' || fail 'round_persistence_fixture_check_failed'

printf 'REGRESSION_PREFLIGHT=PASS\nFILES=%s\nSYNTHETIC_FIXTURE_CHECK=PASS\n' "${#required_files[@]}"

# Este preflight não executa os harnesses PostgreSQL e não conecta a fontes SED.
# O runner deve abortar se este preflight falhar.
