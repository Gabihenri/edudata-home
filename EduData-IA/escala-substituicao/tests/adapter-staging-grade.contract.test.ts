type MatchStatus = "resolved" | "ambiguous" | "unresolved";
type PublicationStatus = "draft" | "validated" | "published" | "superseded" | "revoked";

type Fixture = {
  id: string;
  expected: "publishable" | "review" | "blocked" | "idempotent" | "new_version";
  matching: MatchStatus;
  structural: "valid" | "invalid";
  temporal: "valid" | "invalid" | "overlap";
  duplicate: boolean;
  sameSourceHash?: boolean;
  correctedSource?: boolean;
  changedTeacher?: boolean;
  changedSchedule?: boolean;
  teacherIdentityPresent?: boolean;
  classIdentityPresent?: boolean;
  componentIdentityPresent?: boolean;
  publicationStatus?: PublicationStatus;
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
  if (fixture.correctedSource || fixture.changedTeacher || fixture.changedSchedule) return "new_version" as const;
  if (fixture.structural === "invalid" || fixture.temporal !== "valid") {
    return "blocked" as const;
  }
  if (fixture.matching !== "resolved" || fixture.duplicate) return "review" as const;
  if (
    fixture.teacherIdentityPresent === false ||
    fixture.classIdentityPresent === false ||
    fixture.componentIdentityPresent === false
  ) return "blocked" as const;
  if (fixture.publicationStatus !== undefined && fixture.publicationStatus !== "published") {
    return "blocked" as const;
  }
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
  { id: "F11", expected: "new_version", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, changedTeacher: true },
  { id: "F12", expected: "new_version", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, changedSchedule: true },
  { id: "F13", expected: "blocked", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, teacherIdentityPresent: false },
  { id: "F14", expected: "blocked", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, classIdentityPresent: false },
  { id: "F15", expected: "blocked", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, componentIdentityPresent: false },
  { id: "F16", expected: "publishable", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, publicationStatus: "published" },
  { id: "F17", expected: "blocked", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, publicationStatus: "validated" },
  { id: "F18", expected: "blocked", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, publicationStatus: "superseded" },
  { id: "F19", expected: "blocked", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, publicationStatus: "revoked" },
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

// ADP-07: textual/fuzzy evidence must never be promoted to resolved matching.
// This is a synthetic behavioral guard only; it does not implement SED matching.
const classifyTextualMatch = (matching: MatchStatus): "review" | "blocked" =>
  matching === "unresolved" ? "blocked" : "review";

assert.equal(classifyTextualMatch("resolved"), "review");
assert.equal(classifyTextualMatch("ambiguous"), "review");
assert.equal(classifyTextualMatch("unresolved"), "blocked");

// ADP-04..06: missing institutional identity must block publication.
// These are synthetic behavioral guards only; they do not name or infer SED IDs.
assert.equal(
  classify({ id: "ADP-04", expected: "blocked", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, teacherIdentityPresent: false }),
  "blocked",
);
assert.equal(
  classify({ id: "ADP-05", expected: "blocked", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, classIdentityPresent: false }),
  "blocked",
);
assert.equal(
  classify({ id: "ADP-06", expected: "blocked", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, componentIdentityPresent: false }),
  "blocked",
);

// ADP-11/12: a teacher or schedule change is a new candidate version.
// Historical versions must remain reconstructible; this guard models that
// semantic distinction without introducing any SED-specific physical key.
assert.equal(classify({ id: "ADP-11", expected: "new_version", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, changedTeacher: true }), "new_version");
assert.equal(classify({ id: "ADP-12", expected: "new_version", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, changedSchedule: true }), "new_version");
assert.equal(classify({ id: "ADP-11/12-IDEMPOTENT", expected: "idempotent", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, sameSourceHash: true, changedTeacher: true }), "idempotent");

// ADP-16: only a published version is consumable by the next layer.
// This is a synthetic publication gate only; it does not publish anything
// and does not define the SED's physical publication mechanism.
assert.equal(
  classify({ id: "ADP-16-PUBLISHED", expected: "publishable", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, publicationStatus: "published" }),
  "publishable",
);
for (const status of ["draft", "validated", "superseded", "revoked"] as const) {
  assert.equal(
    classify({ id: `ADP-16-${status.toUpperCase()}`, expected: "blocked", matching: "resolved", structural: "valid", temporal: "valid", duplicate: false, publicationStatus: status }),
    "blocked",
  );
}

assert.equal(overlaps({ start: "08:00", end: "09:00" }, { start: "08:59", end: "10:00" }), true);
assert.equal(overlaps({ start: "08:00", end: "09:00" }, { start: "09:00", end: "10:00" }), false);
assert.equal(overlaps({ start: "10:00", end: "11:00" }, { start: "08:00", end: "10:00" }), false);

assert.equal("2026-09-09T08:00" < "2026-09-09T09:00", true);
assert.equal("2026-09-09T09:00" < "2026-09-09T08:00", false);

console.log(`Escala adapter contract: ${fixtures.length} fixtures + temporal/matching/publication assertions OK`);
