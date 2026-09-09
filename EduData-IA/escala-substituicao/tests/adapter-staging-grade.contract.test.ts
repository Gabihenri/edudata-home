type MatchStatus = "resolved" | "ambiguous" | "unresolved";

type Fixture = {
  id: string;
  expected: "publishable" | "review" | "blocked" | "idempotent" | "new_version";
  matching: MatchStatus;
  structural: "valid" | "invalid";
  temporal: "valid" | "invalid" | "overlap";
  duplicate: boolean;
  sameSourceHash?: boolean;
  correctedSource?: boolean;
};

const worstMatch = (statuses: MatchStatus[]): MatchStatus =>
  statuses.includes("unresolved")
    ? "unresolved"
    : statuses.includes("ambiguous")
      ? "ambiguous"
      : "resolved";

const overlaps = (
  a: { start: string; end: string },
  b: { start: string; end: string },
): boolean => a.start < b.end && b.start < a.end;

const classify = (fixture: Fixture) => {
  if (fixture.sameSourceHash) return "idempotent" as const;
  if (fixture.correctedSource) return "new_version" as const;
  if (fixture.structural === "invalid" || fixture.temporal !== "valid") {
    return "blocked" as const;
  }
  if (fixture.matching !== "resolved" || fixture.duplicate) return "review" as const;
  return "publishable" as const;
};

const fixtures: Fixture[] = [
  { id: "F01", expected: "publishable", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false },
  { id: "F02", expected: "review", matching: "ambiguous", structural: "valid", temporal: "valid", duplicate: false },
  { id: "F03", expected: "blocked", matching: "unresolved", structural: "valid", temporal: "valid", duplicate: false },
  { id: "F04", expected: "blocked", matching: "resolved", structural: "invalid", temporal: "valid", duplicate: false },
  { id: "F05", expected: "blocked", matching: "resolved", structural: "valid", temporal: "invalid", duplicate: false },
  { id: "F06", expected: "blocked", matching: "resolved", structural: "valid", temporal: "overlap", duplicate: false },
  { id: "F07", expected: "review", matching: "resolved", structural: "valid", temporal: "valid", duplicate: true },
  { id: "F08", expected: "idempotent", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, sameSourceHash: true },
  { id: "F09", expected: "new_version", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, correctedSource: true },
  { id: "F10", expected: "blocked", matching: "resolved", structural: "valid", temporal: "invalid", duplicate: false },
];

// Self-contained contract suite. It intentionally has no framework dependency yet:
// the repository currently has no test runner configured. Assertions use Node's
// built-in assert module so the contract remains executable once a runner is adopted.
import assert from "node:assert/strict";

for (const fixture of fixtures) {
  assert.equal(classify(fixture), fixture.expected, fixture.id);
}

assert.equal(worstMatch(["resolved", "resolved"]), "resolved");
assert.equal(worstMatch(["resolved", "ambiguous", "resolved"]), "ambiguous");
assert.equal(worstMatch(["ambiguous", "unresolved"]), "unresolved");

assert.equal(overlaps({ start: "08:00", end: "09:00" }, { start: "08:59", end: "10:00" }), true);
assert.equal(overlaps({ start: "08:00", end: "09:00" }, { start: "09:00", end: "10:00" }), false);
assert.equal(overlaps({ start: "10:00", end: "11:00" }, { start: "08:00", end: "10:00" }), false);

assert.equal("2026-09-09T08:00" < "2026-09-09T09:00", true);
assert.equal("2026-09-09T09:00" < "2026-09-09T08:00", false);

console.log(`Escala adapter contract: ${fixtures.length} fixtures + temporal/matching assertions OK`);
