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

manifest_files = re.findall(r"'R(?:0[1-9]|1[0-6])','([^']+)'", m)
runner_files = re.findall(r'\s+"([^"]+\.sql)"\s*$', r, re.MULTILINE)
preflight_paths = re.findall(r"'escala-substituicao/tests/([^']+\.sql)'", p)

expected = sorted(set(manifest_files))
runner_set = sorted(set(runner_files))
preflight_set = sorted(set(preflight_paths))

if len(manifest_files) != 16:
    raise SystemExit("FAIL_MANIFEST_CASE_COUNT")
if len(expected) != 8:
    raise SystemExit("FAIL_MANIFEST_HARNESS_COUNT")
if runner_set != expected:
    raise SystemExit("FAIL_RUNNER_HARNESS_ALIGNMENT")
if preflight_set != sorted(expected + ["regression-suite-v1.sql"]):
    raise SystemExit("FAIL_PREFLIGHT_HARNESS_ALIGNMENT")

print("PASS_MANIFEST_R01_R16")
print("PASS_8_HARNESSES")
print("PASS_RUNNER_ALIGNMENT")
print("PASS_PREFLIGHT_ALIGNMENT")
print("REGRESSION_CONSISTENCY=PASS")
print("STATUS=SYNTHETIC_STATIC_CHECK_ONLY")
print("GATE-FONTE-SED=RED/BLOCKED")
PY
