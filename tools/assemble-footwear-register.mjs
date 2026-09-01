import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const checkOnly = process.argv.includes("--check");
const initialPath = resolve(root, "docs/footwear/requirements-v1.0-pre-redteam.jsonl");
const deltaPath = resolve(root, "docs/footwear/requirements-v1.1-redteam-delta.jsonl");
const implementationDeltaPath = resolve(
  root,
  "docs/footwear/requirements-v1.2-implementation-redteam-delta.jsonl",
);
const integrationDeltaPath = resolve(
  root,
  "docs/footwear/requirements-v1.3-author-integration-delta.jsonl",
);
const currentPath = resolve(root, "docs/footwear/requirements-v1.3-current.jsonl");
const summaryPath = resolve(root, "docs/footwear/requirements-v1.3-summary.json");
const careAddendumPath = resolve(
  root,
  "docs/footwear/evenward-footwear-care-addendum-v1.0-candidate.md",
);
const careCorrectionPath = resolve(
  root,
  "docs/footwear/evenward-footwear-care-addendum-v1.1-candidate.md",
);
const integrationDecisionPath = resolve(
  root,
  "docs/footwear/author-integration-decision-2026-09-01.md",
);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function readRows(path) {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${path}:${index + 1}: ${error.message}`);
      }
    });
}

const initial = readRows(initialPath);
const delta = readRows(deltaPath);
const implementationDelta = readRows(implementationDeltaPath);
const integrationDelta = readRows(integrationDeltaPath);
const rows = [...initial, ...delta, ...implementationDelta, ...integrationDelta];
const requiredFields = [
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
];
const ids = new Set();
const allowedFields = new Set([...requiredFields, "supersession"]);
const textualFields = requiredFields.filter(
  (field) => field !== "dependsOn",
);

for (const row of rows) {
  if (
    Object.keys(row).some((field) => !allowedFields.has(field)) ||
    Reflect.ownKeys(row).some((field) => typeof field !== "string")
  ) {
    throw new Error(`${row.id ?? "unknown"}: unexpected requirement field`);
  }
  for (const field of requiredFields) {
    if (!(field in row)) throw new Error(`${row.id ?? "unknown"}: missing ${field}`);
  }
  for (const field of textualFields) {
    if (typeof row[field] !== "string" || row[field].trim().length === 0) {
      throw new Error(`${row.id ?? "unknown"}: ${field} must be a non-empty string`);
    }
  }
  if (
    "supersession" in row &&
    (typeof row.supersession !== "string" || row.supersession.trim().length === 0)
  ) {
    throw new Error(`${row.id}: supersession must be a non-empty string`);
  }
  if (!/^EVW-FP-[A-Z0-9]+-[0-9]{3}$/.test(row.id)) {
    throw new Error(`${row.id}: unstable ID format`);
  }
  if (ids.has(row.id)) throw new Error(`${row.id}: duplicate ID`);
  ids.add(row.id);
  if (!Array.isArray(row.dependsOn)) throw new Error(`${row.id}: dependsOn must be an array`);
  if (
    row.dependsOn.some(
      (dependency) => typeof dependency !== "string" || dependency.trim().length === 0,
    )
  ) {
    throw new Error(`${row.id}: dependencies must be non-empty strings`);
  }
  if (new Set(row.dependsOn).size !== row.dependsOn.length) {
    throw new Error(`${row.id}: duplicate dependency`);
  }
  if (row.dependsOn.includes(row.id)) throw new Error(`${row.id}: self dependency`);
  if (!new Set(["candidate-required", "inherited-blocker"]).has(row.status)) {
    throw new Error(`${row.id}: invalid status ${row.status}`);
  }
}

for (const row of rows) {
  for (const dependency of row.dependsOn) {
    if (!ids.has(dependency)) throw new Error(`${row.id}: missing dependency ${dependency}`);
  }
}

const rowsById = new Map(rows.map((row) => [row.id, row]));
const visited = new Set();
const active = new Set();

function visitRequirement(id, path = []) {
  if (active.has(id)) {
    const cycleStart = path.indexOf(id);
    const cycle = [...path.slice(cycleStart), id].join(" -> ");
    throw new Error(`cyclic requirement dependency: ${cycle}`);
  }
  if (visited.has(id)) return;
  active.add(id);
  const row = rowsById.get(id);
  for (const dependency of row.dependsOn) {
    visitRequirement(dependency, [...path, id]);
  }
  active.delete(id);
  visited.add(id);
}

for (const id of ids) visitRequirement(id);

const allowedRoots = new Set([
  "EVW-FP-AUTH-001",
  "EVW-FP-AUTH-006",
  "EVW-FP-EVID-001",
]);
const actualRoots = rows.filter((row) => row.dependsOn.length === 0).map((row) => row.id);
if (
  actualRoots.length !== allowedRoots.size ||
  actualRoots.some((id) => !allowedRoots.has(id))
) {
  throw new Error(`unexpected requirement roots: ${actualRoots.join(", ")}`);
}

const currentBytes = `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;

const statusCounts = Object.fromEntries(
  ["candidate-required", "inherited-blocker"].map((status) => [
    status,
    rows.filter((row) => row.status === status).length,
  ]),
);
const summary = {
  version: "1.3",
  generatedAt: "2026-09-01",
  claimBoundary:
    "author-approved source integration and public repository; pre-production reference; zero Verified requirements",
  composition: [
    {
      path: "requirements-v1.0-pre-redteam.jsonl",
      rowCount: initial.length,
      sha256: sha256(readFileSync(initialPath)),
      disposition: "preserved failed pre-red-team baseline",
    },
    {
      path: "requirements-v1.1-redteam-delta.jsonl",
      rowCount: delta.length,
      sha256: sha256(readFileSync(deltaPath)),
      disposition: "additive adversarial corrections",
    },
    {
      path: "requirements-v1.2-implementation-redteam-delta.jsonl",
      rowCount: implementationDelta.length,
      sha256: sha256(readFileSync(implementationDeltaPath)),
      disposition: "additive implementation red-team corrections and blockers",
    },
    {
      path: "requirements-v1.3-author-integration-delta.jsonl",
      rowCount: integrationDelta.length,
      sha256: sha256(readFileSync(integrationDeltaPath)),
      disposition:
        "additive author authority for source integration and a noncommercial public standalone repository",
    },
  ],
  authorityPins: [
    {
      source: "EVM-FOOTWEAR-1.0",
      pages: 20,
      sha256: "55f736db7b0bd2c6c32b97140c7d6400e03e2476a5deba2368168dcbf1905af9",
    },
    {
      source: "EVM-AVATAR-1.0",
      pages: 40,
      sha256: "f68e13d1d9bed87074454100229784b32827196738b25883661e9df63c5de647",
    },
    {
      source: "Evenward footwear care addendum v1.0 candidate",
      path: "evenward-footwear-care-addendum-v1.0-candidate.md",
      sha256: sha256(readFileSync(careAddendumPath)),
    },
    {
      source: "Evenward footwear care addendum v1.1 candidate",
      path: "evenward-footwear-care-addendum-v1.1-candidate.md",
      sha256: sha256(readFileSync(careCorrectionPath)),
    },
    {
      source: "EVD-AUTHOR-SCS-2026-09-01",
      path: "author-integration-decision-2026-09-01.md",
      sha256: sha256(readFileSync(integrationDecisionPath)),
    },
  ],
  mutableCareReferences: [
    {
      url: "https://saphir.com/products/amiral-gloss",
      accessedAt: "2026-09-01",
      authority: "named-product profile only; current label and warnings take precedence",
    },
    {
      url: "https://uk.saphir.com/pages/bulling-high-shine-guide-detail",
      accessedAt: "2026-09-01",
      authority: "supporting sequence reference only",
    },
  ],
  rowCount: rows.length,
  uniqueIdCount: ids.size,
  dependencyGraphAcyclic: true,
  dependencyRoots: actualRoots,
  statusCounts,
  verifiedCount: 0,
  productionUnlocked: false,
  integrationAuthority: {
    decision: "EVD-AUTHOR-SCS-2026-09-01",
    evenwardMainMergeAuthorized: true,
    standalonePublicRepositoryAuthorized: true,
    commercialUseAuthorized: false,
    productionReleaseAuthorized: false,
  },
  currentRegisterSha256: sha256(currentBytes),
};
const summaryBytes = `${JSON.stringify(summary, null, 2)}\n`;
if (checkOnly) {
  const checkedCurrent = readFileSync(currentPath, "utf8");
  const checkedSummary = readFileSync(summaryPath, "utf8");
  if (checkedCurrent !== currentBytes || checkedSummary !== summaryBytes) {
    throw new Error(
      "Generated footwear register artifacts are stale; run npm run footwear:register and review the diff.",
    );
  }
} else {
  writeFileSync(currentPath, currentBytes);
  writeFileSync(summaryPath, summaryBytes);
}
console.log(JSON.stringify(summary, null, 2));
