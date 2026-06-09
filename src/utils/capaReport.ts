import type { CAPACase, PersonaID } from "@/types";
import { formatCAPAType, formatDate, formatDateTime } from "@/utils/formatters";
import personas from "@/mock-data/personas.json";
import logoUrl from "@/assets/logo-real.png";

/**
 * CAPA → PDF pipeline.
 *
 * Step 1 (buildCapaReport): serialise the D1–D7 answer set of a CAPACase into
 *   a structured JSON report.
 * Step 2 (renderReportHtml): render that JSON into a self-contained, inline-
 *   styled A4 controlled-document (GMP CAPA form aesthetic — bordered tables,
 *   document-control header, signature block, company logo top-left).
 * Step 3 (downloadCapaPdf): rasterise the HTML at 2x and emit an A4 PDF via
 *   html2pdf.js (html2canvas + jsPDF, already a project dependency).
 */

type PersonaRecord = { id: string; displayName: string; role: string };
const PERSONA_BY_ID = new Map<string, PersonaRecord>(
  (personas as PersonaRecord[]).map((p) => [p.id, p]),
);

function personaName(id?: PersonaID | string): string {
  if (!id) return "—";
  return PERSONA_BY_ID.get(id)?.displayName ?? id;
}

export interface CapaReport {
  meta: {
    id: string;
    title: string;
    type: string;
    status: string;
    severity: string;
    department: string;
    initiator: string;
    assignedTo: string;
    createdAt: string;
    updatedAt: string;
    qualityScore: number;
    auditReady: boolean;
    generatedAt: string;
  };
  problem: { question: string; answer: string }[];
  containment: string;
  rca: { method: string; whys: { q: string; a: string }[]; rootCauses: string[] };
  correctiveActions: {
    description: string;
    pic: string;
    due: string;
    linkedRootCause: string;
    verificationMethod: string;
    status: string;
  }[];
  preventiveActions: {
    description: string;
    pic: string;
    target: string;
    status: string;
  }[];
  verification: {
    method: string;
    result: string;
    evidence: string;
    verifiedBy: string;
    verifiedAt: string;
  };
  approvals: { role: string; name: string; decision: string; date: string; notes: string }[];
}

export interface CapaReportRenderOptions {
  includeD6D7?: boolean;
}

export interface CapaPdfDownloadOptions extends CapaReportRenderOptions {
  filename?: string;
}

const RCA_METHOD_LABEL: Record<string, string> = {
  "5whys": "5 Whys",
  fishbone: "Fishbone (Ishikawa)",
  decision_tree: "Decision Tree",
};

const VERIFICATION_METHOD_LABEL: Record<string, string> = {
  re_sampling: "Re-sampling",
  process_review: "Process Review",
  batch_trend: "Batch Trend Analysis",
  em_re_test: "EM Re-test",
  process_requalification: "Process Re-qualification",
  compliance_reaudit: "Compliance Re-audit",
  effectiveness_check: "Effectiveness Check",
  recurrence_trend: "Recurrence Trend",
  customer_verification: "Customer Verification",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  revision_requested: "Revision Requested",
  rejected: "Rejected",
  investigation: "Investigation",
  approval: "Approval",
  closed: "Closed",
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  verified: "Verified",
};

function label(map: Record<string, string>, key?: string): string {
  if (!key) return "—";
  return map[key] ?? key;
}

function dash(value?: string | null): string {
  const v = (value ?? "").trim();
  return v.length ? v : "—";
}

/** Step 1 — flatten the whole case into a structured JSON report. */
export function buildCapaReport(capa: CAPACase): CapaReport {
  const problem = capa.gateAnswers
    .filter((g) => g.questionId !== "containment")
    .map((g) => ({ question: g.question, answer: dash(g.answer) }));

  const containment = capa.gateAnswers.find((g) => g.questionId === "containment");

  const whys =
    capa.rca.fiveWhys?.map((node, i) => ({
      q: `Why ${i + 1}: ${node.question}`,
      a: dash(node.userAnswer || node.novaSuggestion),
    })) ?? [];

  return {
    meta: {
      id: capa.id,
      title: capa.title,
      type: formatCAPAType(capa.type),
      status: label(STATUS_LABEL, capa.status),
      severity: capa.impact?.severity ?? "Ungraded",
      department: capa.department,
      initiator: personaName(capa.createdBy),
      assignedTo: personaName(capa.assignedTo),
      createdAt: formatDateTime(capa.createdAt),
      updatedAt: formatDateTime(capa.updatedAt),
      qualityScore: capa.score?.total ?? 0,
      auditReady: capa.score?.isAuditReady ?? false,
      generatedAt: formatDateTime(new Date().toISOString()),
    },
    problem,
    containment: dash(containment?.answer),
    rca: {
      method: label(RCA_METHOD_LABEL, capa.rca.method),
      whys,
      rootCauses: capa.rca.confirmedRootCauses.map((rc) => dash(rc)),
    },
    correctiveActions: capa.correctiveActions.map((ca) => ({
      description: dash(ca.description),
      pic: dash(ca.pic),
      due: ca.dueDate ? formatDate(ca.dueDate) : "—",
      linkedRootCause: dash(ca.linkedRootCause),
      verificationMethod: dash(ca.verificationMethod),
      status: label(STATUS_LABEL, ca.status),
    })),
    preventiveActions: capa.preventiveActions.map((pa) => ({
      description: dash(pa.description),
      pic: dash(pa.pic),
      target: pa.targetDate ? formatDate(pa.targetDate) : "—",
      status: label(STATUS_LABEL, pa.status),
    })),
    verification: {
      method: label(VERIFICATION_METHOD_LABEL, capa.verification.method),
      result: dash(capa.verification.result),
      evidence: capa.verification.evidenceFileNames.length
        ? capa.verification.evidenceFileNames.join(", ")
        : "—",
      verifiedBy: personaName(capa.verification.verifiedBy),
      verifiedAt: capa.verification.verifiedAt
        ? formatDateTime(capa.verification.verifiedAt)
        : "—",
    },
    approvals: capa.approvals.map((a) => ({
      role: a.role,
      name: a.approverName,
      decision: a.decision.toUpperCase(),
      date: a.signedAt ? formatDateTime(a.signedAt) : "—",
      notes: dash(a.notes),
    })),
  };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---- shared inline-style fragments (form/controlled-document aesthetic) ----
const INK = "#1e293b"; // slate-800
const SUB = "#475569"; // slate-600
const BORDER = "#94a3b8"; // slate-400
const HEAD_BG = "#1e293b"; // section bar
const LABEL_BG = "#f1f5f9"; // slate-100

const td = `border:1px solid ${BORDER};padding:6px 9px;font-size:10.5px;line-height:1.5;vertical-align:top;`;
const tdLabel = `${td}background:${LABEL_BG};color:${SUB};font-weight:600;width:30%;`;
const tdVal = `${td}color:${INK};white-space:pre-wrap;`;
const th = `border:1px solid ${BORDER};padding:6px 9px;font-size:9.5px;line-height:1.3;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:#ffffff;background:${HEAD_BG};text-align:left;vertical-align:middle;`;

function sectionBar(code: string, title: string): string {
  return `
    <div style="page-break-inside:avoid;background:${HEAD_BG};color:#fff;padding:7px 11px;margin-top:18px;display:flex;align-items:center;gap:10px;border:1px solid ${HEAD_BG};">
      <span style="font-size:11px;font-weight:800;letter-spacing:.06em;background:rgba(255,255,255,.16);padding:2px 7px;border-radius:3px;">${esc(code)}</span>
      <span style="font-size:12px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;">${esc(title)}</span>
    </div>`;
}

/** Label/value rows in a bordered table. */
function kvTable(rows: { label: string; value: string }[]): string {
  const body = rows
    .map(
      (r) =>
        `<tr><td style="${tdLabel}">${esc(r.label)}</td><td style="${tdVal}">${esc(r.value)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;border:1px solid ${BORDER};">${body}</table>`;
}

/** Step 2 — render the JSON report to an inline-styled A4 controlled document. */
export function renderReportHtml(
  report: CapaReport,
  logoSrc: string,
  options: CapaReportRenderOptions = {},
): string {
  const m = report.meta;
  const includeD6D7 = options.includeD6D7 ?? true;

  // ---- Document-control header ----
  const docControl = (
    [
      ["Document No.", m.id],
      ["CAPA Type", m.type],
      ["Classification", m.severity],
      ["Status", m.status],
      ["Quality Score", `${m.qualityScore}/100${m.auditReady ? " · Audit-ready" : ""}`],
      ["Issued", m.generatedAt],
    ] as [string, string][]
  )
    .map(
      ([k, v]) =>
        `<tr><td style="border:1px solid ${BORDER};padding:4px 8px;font-size:9px;color:${SUB};font-weight:600;background:${LABEL_BG};white-space:nowrap;">${esc(
          k,
        )}</td><td style="border:1px solid ${BORDER};padding:4px 8px;font-size:9.5px;color:${INK};font-weight:600;">${esc(
          v,
        )}</td></tr>`,
    )
    .join("");

  const header = `
    <div style="display:flex;border:1px solid ${BORDER};border-bottom:none;">
      <div style="flex:1.2;padding:14px 16px;border-right:1px solid ${BORDER};display:flex;align-items:center;gap:12px;">
        <img src="${logoSrc}" alt="Lead.AI" style="height:34px;width:auto;object-fit:contain;" />
        <div style="font-size:9px;color:${SUB};line-height:1.4;">
          <div style="font-weight:700;color:${INK};font-size:11px;">Lead.AI · AI Coach Nova</div>
          Quality Management System
        </div>
      </div>
      <div style="flex:1.6;display:flex;align-items:center;justify-content:center;padding:10px 14px;border-right:1px solid ${BORDER};text-align:center;">
        <div>
          <div style="font-size:15px;font-weight:800;letter-spacing:.02em;color:${INK};">CORRECTIVE &amp; PREVENTIVE ACTION REPORT</div>
          <div style="font-size:9.5px;color:${SUB};margin-top:2px;letter-spacing:.08em;text-transform:uppercase;">8D Investigation Record</div>
        </div>
      </div>
      <table style="flex:1.1;border-collapse:collapse;font-size:9px;"><tbody>${docControl}</tbody></table>
    </div>`;

  // ---- Case summary block ----
  const summary = `
    <table style="width:100%;border-collapse:collapse;border:1px solid ${BORDER};">
      <tr>
        <td style="${tdLabel}width:18%;">CAPA Title</td>
        <td style="${tdVal}font-weight:700;font-size:11.5px;" colspan="3">${esc(m.title)}</td>
      </tr>
      <tr>
        <td style="${tdLabel}width:18%;">Department</td><td style="${tdVal}width:32%;">${esc(m.department)}</td>
        <td style="${tdLabel}width:18%;">Initiated by</td><td style="${tdVal}width:32%;">${esc(m.initiator)}</td>
      </tr>
      <tr>
        <td style="${tdLabel}">Assigned to</td><td style="${tdVal}">${esc(m.assignedTo)}</td>
        <td style="${tdLabel}">Date opened</td><td style="${tdVal}">${esc(m.createdAt)}</td>
      </tr>
      <tr>
        <td style="${tdLabel}">Last updated</td><td style="${tdVal}">${esc(m.updatedAt)}</td>
        <td style="${tdLabel}">Severity</td><td style="${tdVal}">${esc(m.severity)}</td>
      </tr>
    </table>`;

  // ---- D1 Problem ----
  const d1 =
    sectionBar("D1", "Problem Definition") +
    kvTable(report.problem.map((p) => ({ label: p.question, value: p.answer })));

  // ---- D2 Containment ----
  const d2 =
    sectionBar("D2", "Containment / Interim Action") +
    `<table style="width:100%;border-collapse:collapse;border:1px solid ${BORDER};"><tr><td style="${tdVal}">${esc(
      report.containment,
    )}</td></tr></table>`;

  // ---- D3 RCA ----
  const whysRows = report.rca.whys
    .map(
      (w) =>
        `<tr><td style="${tdLabel}width:42%;">${esc(w.q)}</td><td style="${tdVal}">${esc(w.a)}</td></tr>`,
    )
    .join("");
  const rcRows = report.rca.rootCauses.length
    ? report.rca.rootCauses
        .map(
          (rc, i) =>
            `<tr><td style="${tdLabel}width:42%;">Confirmed root cause ${i + 1}</td><td style="${tdVal}">${esc(
              rc,
            )}</td></tr>`,
        )
        .join("")
    : `<tr><td style="${tdLabel}width:42%;">Confirmed root cause</td><td style="${tdVal}">—</td></tr>`;
  const d3 =
    sectionBar("D3", "Root Cause Analysis") +
    `<table style="width:100%;border-collapse:collapse;border:1px solid ${BORDER};">
      <tr><td style="${tdLabel}width:42%;">Methodology</td><td style="${tdVal}">${esc(report.rca.method)}</td></tr>
      ${whysRows}${rcRows}
    </table>`;

  // ---- D4 Corrective actions (column table) ----
  const caHead = `<tr>
    <th style="${th}width:4%;">#</th>
    <th style="${th}width:30%;">Corrective Action</th>
    <th style="${th}width:14%;">PIC</th>
    <th style="${th}width:11%;">Due</th>
    <th style="${th}width:23%;">Linked Root Cause</th>
    <th style="${th}width:18%;">Verification</th>
  </tr>`;
  const caRows = report.correctiveActions.length
    ? report.correctiveActions
        .map(
          (ca, i) => `<tr>
            <td style="${td}text-align:center;">${i + 1}</td>
            <td style="${tdVal}">${esc(ca.description)}<div style="margin-top:3px;font-size:9px;color:${SUB};">Status: ${esc(
              ca.status,
            )}</div></td>
            <td style="${tdVal}">${esc(ca.pic)}</td>
            <td style="${tdVal}">${esc(ca.due)}</td>
            <td style="${tdVal}">${esc(ca.linkedRootCause)}</td>
            <td style="${tdVal}">${esc(ca.verificationMethod)}</td>
          </tr>`,
        )
        .join("")
    : `<tr><td style="${td}text-align:center;color:${SUB};" colspan="6">No corrective actions recorded.</td></tr>`;
  const d4 =
    sectionBar("D4", "Corrective Actions") +
    `<table style="width:100%;border-collapse:collapse;border:1px solid ${BORDER};table-layout:fixed;word-break:break-word;">${caHead}${caRows}</table>`;

  // ---- D5 Preventive actions (column table) ----
  const paHead = `<tr>
    <th style="${th}width:4%;">#</th>
    <th style="${th}width:52%;">Preventive Action</th>
    <th style="${th}width:18%;">PIC</th>
    <th style="${th}width:13%;">Target</th>
    <th style="${th}width:13%;">Status</th>
  </tr>`;
  const paRows = report.preventiveActions.length
    ? report.preventiveActions
        .map(
          (pa, i) => `<tr>
            <td style="${td}text-align:center;">${i + 1}</td>
            <td style="${tdVal}">${esc(pa.description)}</td>
            <td style="${tdVal}">${esc(pa.pic)}</td>
            <td style="${tdVal}">${esc(pa.target)}</td>
            <td style="${tdVal}">${esc(pa.status)}</td>
          </tr>`,
        )
        .join("")
    : `<tr><td style="${td}text-align:center;color:${SUB};" colspan="5">No preventive actions recorded.</td></tr>`;
  const d5 =
    sectionBar("D5", "Preventive Actions") +
    `<table style="width:100%;border-collapse:collapse;border:1px solid ${BORDER};table-layout:fixed;word-break:break-word;">${paHead}${paRows}</table>`;

  // ---- D6 Verification ----
  const v = report.verification;
  const d6 =
    sectionBar("D6", "Verification of Effectiveness") +
    kvTable([
      { label: "Verification method", value: v.method },
      { label: "Result", value: v.result },
      { label: "Objective evidence", value: v.evidence },
      { label: "Verified by", value: v.verifiedBy },
      { label: "Verified at", value: v.verifiedAt },
    ]);

  // ---- D7 Sign-off (signature table) ----
  const sigHead = `<tr>
    <th style="${th}width:24%;">Role</th>
    <th style="${th}width:22%;">Name</th>
    <th style="${th}width:14%;">Decision</th>
    <th style="${th}width:22%;">Date &amp; Time</th>
    <th style="${th}width:18%;">Signature</th>
  </tr>`;
  const sigRows = report.approvals.length
    ? report.approvals
        .map((a) => {
          const color =
            a.decision === "APPROVED" ? "#15803d" : a.decision === "REJECTED" ? "#b91c1c" : SUB;
          const notes = a.notes !== "—" ? `<div style="margin-top:3px;font-size:9px;color:${SUB};">Notes: ${esc(a.notes)}</div>` : "";
          return `<tr>
            <td style="${tdVal}">${esc(a.role)}</td>
            <td style="${tdVal}font-weight:600;">${esc(a.name)}${notes}</td>
            <td style="${tdVal}font-weight:700;color:${color};">${esc(a.decision)}</td>
            <td style="${tdVal}">${esc(a.date)}</td>
            <td style="${tdVal}font-style:italic;color:${SUB};">${a.decision === "APPROVED" ? "e-signed" : ""}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td style="${td}text-align:center;color:${SUB};" colspan="5">Awaiting approvals — sign-off pending.</td></tr>`;
  const d7 =
    sectionBar("D7", "Sign-off & Approvals") +
    `<table style="width:100%;border-collapse:collapse;border:1px solid ${BORDER};table-layout:fixed;word-break:break-word;">${sigHead}${sigRows}</table>`;

  return `
    <div style="width:794px;box-sizing:border-box;padding:30px 34px 40px;background:#ffffff;font-family:'Inter','Helvetica Neue',Arial,sans-serif;color:${INK};">
      ${header}
      ${summary}
      <div class="report-section">${d1}</div>
      <div class="report-section">${d2}</div>
      <div class="report-section">${d3}</div>
      <div class="report-section">${d4}</div>
      <div class="report-section">${d5}</div>
      ${includeD6D7 ? `<div class="report-section">${d6}</div>` : ""}
      ${includeD6D7 ? `<div class="report-section">${d7}</div>` : ""}
      <div style="margin-top:26px;padding-top:9px;border-top:1px solid ${BORDER};display:flex;justify-content:space-between;font-size:8.5px;color:${SUB};">
        <span>Generated by Lead.AI · AI Coach Nova — Quality Management System</span>
        <span>${esc(m.id)} · CONFIDENTIAL · Controlled Document</span>
      </div>
    </div>`;
}

/** Convert a bundled asset URL to a data URL so html2canvas never taints. */
async function toDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return url; // fall back to the raw URL
  }
}

/** Step 3 — full pipeline: build JSON → HTML → A4 PDF download. */
export async function downloadCapaPdf(
  capa: CAPACase,
  options: CapaPdfDownloadOptions = {},
): Promise<void> {
  const { default: html2pdf } = await import("html2pdf.js");

  const report = buildCapaReport(capa);
  const logoSrc = await toDataUrl(logoUrl);
  const html = renderReportHtml(report, logoSrc, options);

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = "794px";
  host.innerHTML = html;
  document.body.appendChild(host);

  // `pagebreak` is supported by html2pdf.js at runtime but absent from its
  // bundled .d.ts, so widen the option object before passing it through.
  //
  // The page is sized to EXACTLY the template width (794px = A4 @ 96dpi) via a
  // custom px format + the `px_scaling` hotfix, with margin:0. This gives a 1:1
  // canvas→page mapping so the right edge is never clipped. (Earlier `windowWidth`
  // caused html2canvas to capture only ~734px, slicing 60px off the right; and
  // mm/a4 left scaling to html2pdf, which also mis-fit.) The template's own
  // 34px padding provides the white page margin.
  const pdfOptions = {
    margin: 0,
    filename: options.filename ?? `${capa.id}-CAPA-Report.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
    jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait", hotfixes: ["px_scaling"] },
    pagebreak: { mode: ["css", "legacy"], avoid: ".report-section" },
  } as unknown as Parameters<ReturnType<typeof html2pdf>["set"]>[0];

  try {
    await html2pdf()
      .set(pdfOptions)
      .from(host.firstElementChild as HTMLElement)
      .save();
  } finally {
    document.body.removeChild(host);
  }
}
