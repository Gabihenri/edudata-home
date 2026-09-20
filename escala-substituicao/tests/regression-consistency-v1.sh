#!/usr/bin/env bash
set -euo pipefail

# Escala de Substituição — verificador estático da cadeia de regressão v1
# STATUS: SYNTHETIC / HARNESS-SAFE
# GATE-FONTE-SED: RED/BLOCKED
# Não executa PostgreSQL e não substitui a regressão executável.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="$ROOT_DIR/regression-suite-v1.sql"
RUNNER="$ROOT_DIR/run-regression-suite-v1.sh"
PREFLIGHT="$ROOT_DIR/regression-preflight.sh"

for file in "$MANIFEST" "$RUNNER" "$PREFLIGHT"; do
  [ -f "$file" ] || { echo "REGRESSION_CONSISTENCY=FAIL"; echo "REASON=missing:$file"; exit 1; }
done

python3 - "$MANIFEST" "$RUNNER" "$PREFLIGHT" <<'PY'
import re
import sys
from pathlib import Path

manifest, runner, preflight = map(Path, sys.argv[1:])

m = manifest.read_text(encoding="utf-8")
r = runner.read_text(encoding="utf-8")
p = preflight.read_text(encoding="utf-8")

# Ler somente as linhas da tabela test_registry evita confundir referências
# documentais, como BASELINE_HARNESS, com casos R01–R16.
registry_match = re.search(
    r"SELECT \* FROM \(VALUES(?P<rows>.*?)\) v\(test_id,test_case,harness,severity,invariant\)",
    m,
    re.DOTALL,
)
if not registry_match:
    raise SystemExit("FAIL_MANIFEST_REGISTRY_NOT_FOUND")

registry_rows = registry_match.group("rows")
manifest_files = re.findall(
    r"\('R(?:0[1-9]|1[0-6])','([^']+)'",
    registry_rows,
)

runner_files = re.findall(r'\s+"([^"]+\.sql)"\s*$', r, re.MULTILINE)
preflight_paths = re.findall(r"'tests/([^']+\.sql)'", p)

expected = sorted(set(manifest_files))
expected_basenames = sorted(Path(item).name for item in expected)
runner_set = sorted(set(runner_files))
preflight_set = sorted(set(preflight_paths))

baseline = "global-allocation-v1.sql"
expected_runner = sorted(set(expected_basenames + [baseline]))
expected_preflight = sorted(set(expected_basenames + ["regression-suite-v1.sql", baseline]))

if len(manifest_files) != 16:
    raise SystemExit("FAIL_MANIFEST_CASE_COUNT")
if len(expected) != 7:
    raise SystemExit("FAIL_MANIFEST_HARNESS_COUNT")
if runner_set != expected_runner:
    raise SystemExit("FAIL_RUNNER_HARNESS_ALIGNMENT")
if preflight_set != expected_preflight:
    raise SystemExit("FAIL_PREFLIGHT_HARNESS_ALIGNMENT")

print("PASS_MANIFEST_R01_R16")
print("PASS_7_MANIFEST_HARNESSES_PLUS_BASELINE")
print("PASS_RUNNER_ALIGNMENT")
print("PASS_PREFLIGHT_ALIGNMENT")
print("REGRESSION_CONSISTENCY=PASS")
print("STATUS=SYNTHETIC_STATIC_CHECK_ONLY")
print("GATE-FONTE-SED=RED/BLOCKED")
PY
