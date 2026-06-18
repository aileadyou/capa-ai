import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, initSchema, clearAllTables, isSeeded } from "./db.js";

// Seed data is imported statically (not read from disk at runtime) so it inlines
// into the serverless bundle. Runtime fs reads break once esbuild relocates the
// function, which would leave a Vercel deploy seeded with nothing.
import personasRaw from "../../src/mock-data/personas.json";
import sourceRecordsRaw from "../../seed-data/capa-clean-seed-v1/source-records.json";
import findingsRaw from "../../seed-data/capa-clean-seed-v1/findings.json";
import capasRaw from "../../seed-data/capa-clean-seed-v1/capa-cases.json";
import correctiveActionsRaw from "../../seed-data/capa-clean-seed-v1/corrective-actions.json";
import preventiveActionsRaw from "../../seed-data/capa-clean-seed-v1/preventive-actions.json";
import auditTrailRaw from "../../seed-data/capa-clean-seed-v1/audit-trail.json";
import notificationsRaw from "../../seed-data/capa-clean-seed-v1/notifications.json";
import containmentRaw from "../../src/mock-data/nova-scripts/containment-suggestions.json";
import caSuggRaw from "../../src/mock-data/nova-scripts/ca-suggestions.json";
import paSuggRaw from "../../src/mock-data/nova-scripts/pa-suggestions.json";
import verificationRaw from "../../src/mock-data/nova-scripts/verification-coaching.json";
import gateDraftsRaw from "../../src/mock-data/nova-scripts/gate-drafts.json";
import fishboneRaw from "../../src/mock-data/nova-scripts/fishbone-audit-documentation.json";
import decisionTreeRaw from "../../src/mock-data/nova-scripts/decision-tree-complaint-particulate.json";
import fiveWhysRaw from "../../src/mock-data/nova-scripts/5whys-hepa.json";

type CAPAType = "deviation" | "audit" | "complaint";

// Old golden CAPA ids → type, so legacy Nova scripts become type-level premade
// suggestions for the fresh 6-case seed.
const TYPE_BY_OLD_CAPA: Record<string, CAPAType> = {
  "CAPA-2026-0341": "deviation",
  "CAPA-2026-0089": "audit",
  "CAPA-2026-0112": "complaint",
};

function expectedCapaId(findingId: string): string {
  return `CAPA-${findingId.replace(/^(DEV|AUD|CMP)-/, "")}`;
}

export function seedAll(opts: { reset?: boolean } = {}): void {
  initSchema();
  if (opts.reset) clearAllTables();
  else if (isSeeded()) return;

  const personas = personasRaw as any[];
  const sourceRecords = sourceRecordsRaw as any[];
  const findings = findingsRaw as any[];
  const capas = capasRaw as any[];
  const correctiveActions = correctiveActionsRaw as any[];
  const preventiveActions = preventiveActionsRaw as any[];
  const auditTrail = auditTrailRaw as any[];
  const notifications = notificationsRaw as any[];

  const insertPersona = db.prepare("INSERT OR REPLACE INTO personas (id, data) VALUES (?, ?)");
  const insertSource = db.prepare(
    "INSERT OR REPLACE INTO source_records (id, finding_id, type, source, data) VALUES (?, ?, ?, ?, ?)",
  );
  const insertFinding = db.prepare(
    "INSERT OR REPLACE INTO findings (id, type, source, status, department, reported_at, data) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  const insertCapa = db.prepare(
    "INSERT OR REPLACE INTO capa_cases (id, finding_id, type, status, current_step, department, assigned_to, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const insertCa = db.prepare(
    "INSERT OR REPLACE INTO corrective_actions (id, capa_id, status, data) VALUES (?, ?, ?, ?)",
  );
  const insertPa = db.prepare(
    "INSERT OR REPLACE INTO preventive_actions (id, capa_id, status, data) VALUES (?, ?, ?, ?)",
  );
  const insertAudit = db.prepare(
    "INSERT OR REPLACE INTO audit_events (id, capa_id, finding_id, timestamp, data) VALUES (?, ?, ?, ?, ?)",
  );
  const insertNotif = db.prepare(
    "INSERT OR REPLACE INTO notifications (id, recipient_persona_id, read, created_at, data) VALUES (?, ?, ?, ?, ?)",
  );
  const insertAi = db.prepare(
    "INSERT OR REPLACE INTO ai_suggestions (id, capa_type, capa_id, phase, section, data) VALUES (?, ?, ?, ?, ?, ?)",
  );

  const tx = db.transaction(() => {
    for (const p of personas) insertPersona.run(p.id, JSON.stringify(p));

    for (const s of sourceRecords) {
      insertSource.run(s.sourceRecordId, s.findingId, s.type, s.source, JSON.stringify(s));
    }

    for (const f of findings) {
      insertFinding.run(f.id, f.type, f.source, f.status, f.department, f.reportedAt, JSON.stringify(f));
    }

    for (const c of capas) {
      // Actions live in their own tables; the read endpoint rejoins them.
      const stored = { ...c, correctiveActions: [], preventiveActions: [] };
      insertCapa.run(
        c.id,
        c.findingId,
        c.type,
        c.status,
        c.currentStep,
        c.department,
        c.assignedTo,
        c.createdAt,
        c.updatedAt,
        JSON.stringify(stored),
      );
    }

    for (const a of correctiveActions) insertCa.run(a.id, a.capaId, a.status, JSON.stringify(a));
    for (const a of preventiveActions) insertPa.run(a.id, a.capaId, a.status, JSON.stringify(a));
    for (const e of auditTrail) {
      insertAudit.run(e.id, e.capaId ?? null, e.findingId ?? null, e.timestamp, JSON.stringify(e));
    }
    for (const n of notifications) {
      insertNotif.run(n.id, n.recipientPersonaId, n.read ? 1 : 0, n.createdAt, JSON.stringify(n));
    }

    seedAiSuggestions(insertAi);
  });

  tx();
}

function seedAiSuggestions(insertAi: import("better-sqlite3").Statement): void {
  const containment = containmentRaw as Record<string, any>;
  const caSugg = caSuggRaw as Record<string, string[]>;
  const paSugg = paSuggRaw as Record<string, string[]>;
  const verification = verificationRaw as Record<string, any>;
  const gateDrafts = gateDraftsRaw as Record<string, any>;
  const fishbone = fishboneRaw as any;
  const decisionTree = decisionTreeRaw as any;
  const fiveWhys = fiveWhysRaw as any;

  const put = (section: string, capaType: string | null, capaId: string | null, phase: string | null, data: unknown) => {
    const id = `ai-${section}-${capaType ?? "x"}-${capaId ?? "type"}`;
    insertAi.run(id, capaType, capaId, phase, section, JSON.stringify(data));
  };

  // Type-level suggestions, derived from the legacy golden scripts.
  for (const [oldId, type] of Object.entries(TYPE_BY_OLD_CAPA)) {
    if (containment[oldId]) put("containment", type, null, "containment", containment[oldId]);
    if (caSugg[oldId]) put("corrective_actions", type, null, "ca", caSugg[oldId]);
    if (paSugg[oldId]) put("preventive_actions", type, null, "pa", paSugg[oldId]);
    if (verification[oldId]) put("verification", type, null, "verification", verification[oldId]);
  }

  // RCA premade fallbacks per method/type (5 Whys is normally live).
  put("rca_5whys", "deviation", null, "rca", fiveWhys);
  put("rca_fishbone", "audit", null, "rca", fishbone);
  put("rca_decision_tree", "complaint", null, "rca", decisionTree);

  // Case-specific audit-plan suggestions for the active D5 demo case. These
  // intentionally override the legacy type-level audit scripts above.
  put("containment", "audit", "CAPA-2026-0127", "containment", [
    {
      id: "containment-cs01-record-hold",
      content:
        "Place the affected CS-01 cleaning verification package under QA document hold, block release checklist closure for the sampled record set, and retrieve the controlled swab map plus QA reviewer sign-off before plan approval.",
    },
  ]);
  put("corrective_actions", "audit", "CAPA-2026-0127", "ca", [
    "Retrieve and reconcile the missing CS-01 swab map attachment and QA reviewer sign-off against the batch release checklist, then document a QA-approved record correction package.",
    "Review the last 20 Compression Suite CS-01 cleaning verification packages for repeated missing attachments or reviewer sign-off gaps before release.",
  ]);
  put("preventive_actions", "audit", "CAPA-2026-0127", "pa", [
    "Revise SOP-CLN-011 and the Q100+ cleaning record routing template to require attachment completeness verification for swab maps and QA reviewer sign-off before release checklist closure.",
    "Add a weekly QA spot-check for five consecutive CS-01 cleaning verification packages and trend attachment completeness until two clean cycles are achieved.",
  ]);
  put("verification", "audit", "CAPA-2026-0127", "verification", {
    Observation:
      "The CAPA plan addresses a cleaning verification evidence-control gap, so effectiveness must prove attachment completeness before checklist closure.",
    Recommendation:
      "Verify 20 consecutive CS-01 cleaning verification packages for 100% swab map attachment presence, QA reviewer sign-off, and release checklist reconciliation before closure.",
    "Audit Rationale":
      "A trended record-completeness check demonstrates that the revised SOP gate and Q100+ routing template prevent recurrence, not only that the sampled record was corrected.",
  });

  // Gate drafts: type-level + per-finding (keyed by the deterministic CAPA id).
  for (const [key, value] of Object.entries(gateDrafts)) {
    if (key === "deviation" || key === "audit" || key === "complaint") {
      put("gate_drafts", key, null, "intake", value);
    } else if (/^(DEV|AUD|CMP)-/.test(key)) {
      const type = key.startsWith("DEV") ? "deviation" : key.startsWith("AUD") ? "audit" : "complaint";
      put("gate_drafts", type, key, "intake", value);
      put("gate_drafts", type, expectedCapaId(key), "intake", value);
    }
  }

  // ── Impact classification — type-level Nova guidance (no source import needed) ──
  // These fill the "Nova assessment" block on Step 3 even when the user did not
  // import a source record. Source-imported classifications take priority on the
  // frontend; these are the fallback shown for any manually-entered CAPA.

  put("impact_classification", "deviation", null, "intake", {
    severity: "Major",
    totalWeight: 72,
    rationale:
      "Environmental monitoring excursions and GMP process-control deviations in classified areas carry a presumptive Major classification at Bio Farma. The event may affect batch-release decisions and requires a full CAPA investigation.",
    factors: [
      {
        factor: "GMP Process Control",
        value: "Controlled-area process failure",
        weight: 28,
        rationale: "Excursion in a classified manufacturing environment affects product quality assurance.",
      },
      {
        factor: "Patient / Product Risk",
        value: "Potential product quality impact",
        weight: 24,
        rationale: "Deviations in fill/finish or sterile areas may affect batch integrity and patient safety.",
      },
      {
        factor: "Regulatory Scope",
        value: "Reportable under BPOM GMP guidelines",
        weight: 20,
        rationale: "Environmental and process deviations are subject to BPOM periodic review.",
      },
    ],
    computedAt: new Date().toISOString(),
  });

  put("impact_classification", "audit", null, "intake", {
    severity: "Major",
    totalWeight: 68,
    rationale:
      "GMP documentation gaps identified during internal or external audits represent systemic compliance weaknesses. A CAPA must address root cause and demonstrate sustained correction before the next audit cycle.",
    factors: [
      {
        factor: "Compliance Scope",
        value: "GMP documentation non-conformance",
        weight: 26,
        rationale: "Documentation failures directly affect data integrity and GMP compliance standing.",
      },
      {
        factor: "Regulatory Risk",
        value: "Audit finding — formal response required",
        weight: 24,
        rationale: "Audit findings require a formal CAPA response within the agreed timeline.",
      },
      {
        factor: "Systemic Indicator",
        value: "Potential process or training gap",
        weight: 18,
        rationale: "Recurring documentation issues suggest a systemic root cause beyond an isolated event.",
      },
    ],
    computedAt: new Date().toISOString(),
  });

  put("impact_classification", "complaint", null, "intake", {
    severity: "Major",
    totalWeight: 74,
    rationale:
      "Customer complaints involving distributed product — particularly parenteral vaccines — carry a presumptive Major rating. The event requires immediate containment, lot investigation, and a formal written response to the complainant.",
    factors: [
      {
        factor: "Patient Safety",
        value: "Distributed product — direct patient exposure",
        weight: 30,
        rationale: "Complaints on released product create direct patient-safety obligations.",
      },
      {
        factor: "Product Integrity",
        value: "Potential labeling or quality defect",
        weight: 24,
        rationale: "Defects reaching the market signal a control failure at packaging or inspection.",
      },
      {
        factor: "Regulatory Obligation",
        value: "BPOM complaint reporting timeline applies",
        weight: 20,
        rationale: "Serious product complaints must be assessed for reportability within 15 days.",
      },
    ],
    computedAt: new Date().toISOString(),
  });

  // Author the missing complaint create-demo gate draft (CMP-2026-0098).
  put("gate_drafts", "complaint", "CAPA-2026-0098", "intake", {
    sourceLabel: "Bizzmine-Complaint · CMP-2026-0098",
    confidence: 86,
    answers: {
      observation:
        "On 30 May 2026, Klinik Medika Pratama Bekasi reported one sealed Hepavax-B Pediatric secondary carton (lot HBV-26-0529-C) received without the Indonesian package insert. The vial label, carton label, tamper seal, and batch number were intact and readable; the carton was retained by the clinic.",
      impact:
        "Potential Major GMP and patient-information impact. A missing package insert on a distributed parenteral vaccine carton is a labeling/packaging-completeness defect affecting safe-use information, though product identity and tamper evidence remain intact and scope is currently one reported carton.",
      containment:
        "Place lot HBV-26-0529-C on complaint review hold, instruct the clinic to retain the affected carton under controlled return, and begin a packaging reconciliation of leaflet issuance vs. cartons packed for the lot before any further distribution decision.",
      scope:
        "Hepavax-B Pediatric Vial Carton, lot HBV-26-0529-C (expiry 31 May 2027), one reported carton from Klinik Medika Pratama Bekasi. Source records: customer photo, complaint intake form, and the lot's leaflet reconciliation in Bizzmine-Complaint (CMP-2026-0098).",
      cause_confirmation:
        "Confirm by reconciling leaflet issuance, usage, and return quantities for the lot, reviewing the line clearance and in-process leaflet checks at insert station, and checking whether the carton sealing step can complete without an insert-presence verification.",
      effectiveness_criteria:
        "Effective when leaflet reconciliation for the lot accounts for the discrepancy, an insert-presence verification control is added and confirmed for the carton line, and no missing-insert complaints recur for the product across the next two packaging campaigns.",
    },
  });
}

// Allow `npm --workspace server run seed` and `tsx src/seed.ts --reset`.
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (invokedDirectly) {
  const reset = process.argv.includes("--reset");
  seedAll({ reset });
  // eslint-disable-next-line no-console
  console.log(`[seed] done${reset ? " (reset)" : ""}. db has ${(db.prepare("SELECT COUNT(*) n FROM findings").get() as any).n} findings.`);
}
