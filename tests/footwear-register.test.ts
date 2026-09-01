import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

type Requirement = {
  id: string;
  source: string;
  locator: string;
  requirement: string;
  owner: string;
  dependsOn: string[];
  acceptance: string;
  negative: string;
  evidence: string;
  status: "candidate-required" | "inherited-blocker";
  supersession?: string;
};

const requiredRowFields = [
  "id",
  "source",
  "locator",
  "requirement",
  "owner",
  "dependsOn",
  "acceptance",
  "negative",
  "evidence",
  "status",
] as const;
const allowedRowFields = new Set([...requiredRowFields, "supersession"]);
const rootIds = new Set([
  "EVW-FP-AUTH-001",
  "EVW-FP-AUTH-006",
  "EVW-FP-EVID-001",
]);
const preservedV11Anchors = Object.freeze({
  baseline: "efdf627b85e62de28c956ed659bfdd5ec4dc1d646e1c043d23efbedf9dee8ea9",
  redTeamDelta: "61973c8ccd9291248a1eb61903ce5260d71319476930127d9a17963abc6015a0",
  careAddendumV10: "ef73e7a6e2512950c21c938aa049acb4d5225fc91402f7c54f23e5e563244c39",
  currentRegister: "7bf94d867b567687c0e763f2570e4c8facb64e0bba4b6d39253af0a3bd896658",
  summary: "5a325da42f1974e56d010e557ed84c34538058db18a01cbf9c72275f0e452e33",
  preimplementationRedTeam: "0d8b0a2719283e9fd391300c850c16468538fbe84c01dbe09b96cd34888ed3c4",
});
const preservedV12Anchors = Object.freeze({
  implementationDelta: "e435dabb958d9441e6742e4d361cb4ea3acdf99e1c3f06f64e6906b3f15aa5d3",
  careAddendumV11: "ae3ba6ff6bcd0c4a7f58217ead9150c6956fd42a049dfbfc12d571ac95e1ad52",
  currentRegister: "043e233b6596225623585a1ffaf04f1b977a655474478fcfd8cb1c86cebd6491",
  summary: "62779b48deff8fb13accfd0739b02e0885c78af1d08a9918736af77afabf0661",
  postimplementationRedTeam: "6ce925d000c00e427ab782b7aba204f46e79fce928d79177b47b69ffa3449a16",
  evidenceLedgerPrefixBytes: 54021,
  evidenceLedgerPrefix: "af191053a5228421c89f52e2458bb5600b620237ea2aeb4745a7452c868312c4",
});
const registeredV13Authority = Object.freeze({
  decision: "6ee1dfab2806e97a69ddd49bb4e81a9f48540eff49aa7cfc38df0568bcb8ad5f",
  integrationDelta: "c4a9f53fc0e8eb222853b0112a865db7e8de2275005364cb8bb5c4f546ad38e5",
});

function sha256(bytes: string | Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

function artifact(relative: string) {
  return readFileSync(new URL(`../docs/footwear/${relative}`, import.meta.url));
}

const currentBytes = artifact("requirements-v1.3-current.jsonl");
const register = currentBytes
  .toString("utf8")
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line) as Requirement);

const summary = JSON.parse(
  artifact("requirements-v1.3-summary.json").toString("utf8"),
) as {
  version: string;
  generatedAt: string;
  claimBoundary: string;
  composition: Array<{
    path: string;
    rowCount: number;
    sha256: string;
    disposition: string;
  }>;
  authorityPins: Array<{ source: string; path?: string; pages?: number; sha256: string }>;
  rowCount: number;
  uniqueIdCount: number;
  verifiedCount: number;
  productionUnlocked: boolean;
  dependencyGraphAcyclic: boolean;
  dependencyRoots: string[];
  statusCounts: Record<Requirement["status"], number>;
  integrationAuthority: {
    decision: string;
    evenwardMainMergeAuthorized: boolean;
    standalonePublicRepositoryAuthorized: boolean;
    commercialUseAuthorized: boolean;
    productionReleaseAuthorized: boolean;
  };
  currentRegisterSha256: string;
};

test("every requirement row has an exact, typed, nonempty schema", () => {
  for (const row of register) {
    assert.deepEqual(
      Object.keys(row).filter((field) => !allowedRowFields.has(field)),
      [],
      row.id,
    );
    for (const field of requiredRowFields) assert.ok(field in row, `${row.id}: ${field}`);
    for (const field of requiredRowFields.filter((field) => field !== "dependsOn")) {
      assert.equal(typeof row[field], "string", `${row.id}: ${field}`);
      assert.ok((row[field] as string).trim().length > 0, `${row.id}: ${field}`);
    }
    assert.match(row.id, /^EVW-FP-[A-Z0-9]+-[0-9]{3}$/);
    assert.ok(Array.isArray(row.dependsOn));
    assert.equal(new Set(row.dependsOn).size, row.dependsOn.length, row.id);
    assert.ok(row.dependsOn.every((dependency) => typeof dependency === "string" && dependency.length > 0));
    assert.equal(row.dependsOn.includes(row.id), false, row.id);
    assert.ok(row.status === "candidate-required" || row.status === "inherited-blocker");
  }
});

test("footwear register has a closed, rooted, acyclic dependency graph", () => {
  const ids = new Set(register.map(({ id }) => id));
  assert.equal(ids.size, register.length);
  const byId = new Map(register.map((requirement) => [requirement.id, requirement]));

  for (const requirement of register) {
    for (const dependency of requirement.dependsOn) {
      assert.ok(ids.has(dependency), `${requirement.id} depends on missing ${dependency}`);
    }
  }

  const visited = new Set<string>();
  const active = new Set<string>();
  const reachesRoot = new Map<string, boolean>();
  const visit = (id: string): boolean => {
    assert.equal(active.has(id), false, `dependency cycle reaches ${id}`);
    if (reachesRoot.has(id)) return reachesRoot.get(id) ?? false;
    active.add(id);
    const requirement = byId.get(id);
    const rooted = rootIds.has(id) || (requirement?.dependsOn.some(visit) ?? false);
    active.delete(id);
    visited.add(id);
    reachesRoot.set(id, rooted);
    return rooted;
  };
  for (const id of ids) assert.equal(visit(id), true, `${id} has no authority root`);
  assert.equal(visited.size, register.length);
  assert.deepEqual(
    register.filter(({ dependsOn }) => dependsOn.length === 0).map(({ id }) => id).sort(),
    [...rootIds].sort(),
  );
  assert.deepEqual([...summary.dependencyRoots].sort(), [...rootIds].sort());
  assert.equal(summary.dependencyGraphAcyclic, true);
});

test("summary hashes and counts are independently derived from artifact bytes", () => {
  assert.equal(summary.version, "1.3");
  assert.equal(summary.generatedAt, "2026-09-01");
  assert.match(summary.claimBoundary, /zero Verified requirements/);
  assert.equal(summary.currentRegisterSha256, sha256(currentBytes));

  let composedRows = 0;
  for (const source of summary.composition) {
    const bytes = artifact(source.path);
    const rows = bytes.toString("utf8").split(/\r?\n/).filter(Boolean).length;
    assert.equal(source.sha256, sha256(bytes), source.path);
    assert.equal(source.rowCount, rows, source.path);
    composedRows += rows;
  }
  assert.equal(composedRows, register.length);

  for (const pin of summary.authorityPins.filter(({ path }) => Boolean(path))) {
    assert.equal(pin.sha256, sha256(artifact(pin.path!)), pin.path);
  }

  const derivedCounts = {
    "candidate-required": register.filter(({ status }) => status === "candidate-required").length,
    "inherited-blocker": register.filter(({ status }) => status === "inherited-blocker").length,
  };
  assert.deepEqual(summary.statusCounts, derivedCounts);
  assert.equal(summary.rowCount, register.length);
  assert.equal(summary.uniqueIdCount, new Set(register.map(({ id }) => id)).size);
  assert.deepEqual(summary.integrationAuthority, {
    decision: "EVD-AUTHOR-SCS-2026-09-01",
    evenwardMainMergeAuthorized: true,
    standalonePublicRepositoryAuthorized: true,
    commercialUseAuthorized: false,
    productionReleaseAuthorized: false,
  });
});

test("v1.3 preserves the failed v1.1 and reviewed v1.2 byte anchors and appends only its delta", () => {
  const priorSummary = JSON.parse(
    artifact("requirements-v1.1-summary.json").toString("utf8"),
  ) as typeof summary;
  const priorSummaryBytes = artifact("requirements-v1.1-summary.json");
  const priorCurrent = artifact("requirements-v1.1-current.jsonl");
  const v12Summary = artifact("requirements-v1.2-summary.json");
  const v12Current = artifact("requirements-v1.2-current.jsonl");
  const baseline = artifact("requirements-v1.0-pre-redteam.jsonl");
  const redTeamDelta = artifact("requirements-v1.1-redteam-delta.jsonl");
  const implementationDelta = artifact("requirements-v1.2-implementation-redteam-delta.jsonl");
  const integrationDelta = artifact("requirements-v1.3-author-integration-delta.jsonl");
  const careAddendumV10 = artifact("evenward-footwear-care-addendum-v1.0-candidate.md");
  const careAddendumV11 = artifact("evenward-footwear-care-addendum-v1.1-candidate.md");
  const preimplementationRedTeam = artifact("preimplementation-red-team-v1.0.md");
  const postimplementationRedTeam = artifact("postimplementation-red-team-v1.0.md");
  const evidenceLedger = artifact("evidence-ledger-v1.0.md");

  assert.equal(sha256(baseline), preservedV11Anchors.baseline);
  assert.equal(sha256(redTeamDelta), preservedV11Anchors.redTeamDelta);
  assert.equal(sha256(careAddendumV10), preservedV11Anchors.careAddendumV10);
  assert.equal(sha256(priorCurrent), preservedV11Anchors.currentRegister);
  assert.equal(sha256(priorSummaryBytes), preservedV11Anchors.summary);
  assert.equal(
    sha256(preimplementationRedTeam),
    preservedV11Anchors.preimplementationRedTeam,
  );
  assert.equal(priorSummary.currentRegisterSha256, preservedV11Anchors.currentRegister);
  assert.equal(priorSummary.composition[0]?.sha256, preservedV11Anchors.baseline);
  assert.equal(priorSummary.composition[1]?.sha256, preservedV11Anchors.redTeamDelta);
  assert.equal(priorSummary.authorityPins[2]?.sha256, preservedV11Anchors.careAddendumV10);
  assert.equal(summary.composition[0]?.sha256, preservedV11Anchors.baseline);
  assert.equal(summary.composition[1]?.sha256, preservedV11Anchors.redTeamDelta);
  assert.equal(summary.authorityPins[2]?.sha256, preservedV11Anchors.careAddendumV10);
  assert.equal(sha256(implementationDelta), preservedV12Anchors.implementationDelta);
  assert.equal(sha256(careAddendumV11), preservedV12Anchors.careAddendumV11);
  assert.equal(sha256(v12Current), preservedV12Anchors.currentRegister);
  assert.equal(sha256(v12Summary), preservedV12Anchors.summary);
  assert.equal(
    sha256(postimplementationRedTeam),
    preservedV12Anchors.postimplementationRedTeam,
  );
  assert.ok(
    evidenceLedger.byteLength > preservedV12Anchors.evidenceLedgerPrefixBytes,
    "ledger must append after its reviewed v1.2 prefix",
  );
  assert.equal(
    sha256(evidenceLedger.subarray(0, preservedV12Anchors.evidenceLedgerPrefixBytes)),
    preservedV12Anchors.evidenceLedgerPrefix,
  );
  assert.equal(summary.composition[2]?.sha256, preservedV12Anchors.implementationDelta);
  assert.equal(summary.authorityPins[3]?.sha256, preservedV12Anchors.careAddendumV11);
  assert.equal(summary.composition[3]?.sha256, registeredV13Authority.integrationDelta);
  assert.equal(summary.authorityPins[4]?.sha256, registeredV13Authority.decision);

  const canonical = (bytes: Buffer) =>
    bytes
      .toString("utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.stringify(JSON.parse(line)))
      .join("\n") + "\n";
  assert.equal(
    priorCurrent.toString("utf8"),
    canonical(Buffer.concat([baseline, redTeamDelta])),
  );
  assert.equal(
    v12Current.toString("utf8"),
    priorCurrent.toString("utf8") + canonical(implementationDelta),
  );
  assert.equal(
    currentBytes.toString("utf8"),
    v12Current.toString("utf8") + canonical(integrationDelta),
  );
});

test("footwear register stays fail-closed", () => {
  assert.equal(register.length, 145);
  assert.equal(summary.statusCounts["candidate-required"], 103);
  assert.equal(summary.statusCounts["inherited-blocker"], 42);
  assert.equal(summary.verifiedCount, 0);
  assert.equal(summary.productionUnlocked, false);
  assert.ok(register.every(({ status }) => status !== ("verified" as never)));
});
