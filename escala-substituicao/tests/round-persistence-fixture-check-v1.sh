#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
FIXTURE="$SCRIPT_DIR/round-persistence-fixture-v1.json"

command -v python3 >/dev/null 2>&1 || {
  echo "FIXTURE_CHECK=BLOCKED: python3 is required" >&2
  exit 2
}

FIXTURE="$FIXTURE" python3 - <<'PY'
import json
import os
import sys

path = os.environ["FIXTURE"]
with open(path, "r", encoding="utf-8") as handle:
    data = json.load(handle)

assert data["contract"] == "round-persistence-v1"
assert data["source_status"] == "SYNTHETIC_ONLY"
assert data["sed_gate"] == "RED/BLOCKED"

rounds = data["rounds"]
assert [item["round_version"] for item in rounds] == [1, 2, 3]
assert [item["round_id"] for item in rounds] == ["RUN-001-R01", "RUN-001-R02", "RUN-001-R03"]
assert [item["snapshot_id"] for item in rounds] == ["SNAP-001", "SNAP-002", "SNAP-003"]

occurrences = [item["occurrences"][0] for item in rounds]
assert [item["occurrence_id"] for item in occurrences] == ["O1", "O1", "O1"]

assert occurrences[0]["recommendation"]["candidate_id"] == "P1"
assert occurrences[1]["recommendation"]["candidate_id"] == "P1"
assert occurrences[1]["human_decision"]["candidate_id"] == "P2"
assert occurrences[1]["validation_state"] == "HUMAN_OVERRIDDEN"
assert occurrences[2]["recommendation"]["candidate_id"] == "P3"
assert occurrences[2]["human_decision"] is None

assert rounds[1]["invalidated_previous_round"] == rounds[0]["round_id"]
assert rounds[2]["invalidated_previous_round"] == rounds[1]["round_id"]

print("PASS_FIXTURE_JSON_VALID")
print("PASS_ROUND_SEQUENCE")
print("PASS_OCCURRENCE_RECONSTRUCTION")
print("PASS_OVERRIDE_SEPARATION")
print("PASS_INVALIDATION_CHAIN")
print("FIXTURE_CHECK=PASS")
PY
