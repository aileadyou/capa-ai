import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Lock,
  MessageSquareX,
  Plus,
  Sparkles,
  XCircle,
} from "lucide-react";
import NotFound from "@/pages/NotFound";
import { usePersonaStore } from "@/store";
import { useCapas, useFinding } from "@/hooks/api";
import { canFillCAPA } from "@/utils/personaAccess";
import type { CAPACase, PreFillContext } from "@/types";
import type { Finding } from "@/types/finding";
import type { CAPAType, EightDStep } from "@/types";
import {
  formatCAPAStatus,
  formatCAPAType,
  formatDateTime,
} from "@/utils/formatters";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TypePill } from "@/components/shared/TypePill";
import { ScorePill } from "@/components/shared/ScorePill";
import { cn } from "@/lib/utils";

// ── Nova classification copy (mirrors FindingsListPage) ───────────────────────

const NOVA_BY_ID: Record<string, string> = {
  "DEV-2026-0341":
    "Critical aseptic environment deviation. HEPA unit failure pattern matches 2 prior CAPAs (91% similarity). Full 8D CAPA with containment, HEPA PM schedule overhaul, and SOP update is recommended.",
  "AUD-2026-0089":
    "Systematic GMP documentation gap in warehouse material transfer process. Second-person verification breakdown detected across 3 lots. Audit-type 8D CAPA with SOP revision and targeted retraining is recommended.",
  "CMP-2026-0112":
    "Product quality complaint with potential particulate contamination. Probable visual inspection gap during batch release. 8D CAPA with retained sample review and full distribution impact assessment is recommended.",
};

const NOVA_BY_TYPE: Record<CAPAType, string> = {
  deviation:
    "Process deviation detected. Pattern analysis indicates potential systemic root cause. Standard 8D CAPA workflow with documented containment actions is recommended.",
  audit:
    "Compliance gap identified during audit activity. Documentation or procedure deficiency is likely. 8D CAPA with systemic root cause analysis and procedure review is recommended.",
  complaint:
    "Customer quality complaint received. Potential product or process impact requires assessment. 8D CAPA with retained sample review is recommended.",
};

function novaText(finding: Finding) {
  return NOVA_BY_ID[finding.id] ?? NOVA_BY_TYPE[finding.type];
}

const STEP_LABELS: Record<EightDStep, string> = {
  problem: "D1 Problem",
  containment: "D2 Containment",
  rca: "D3 Root Cause",
  ca: "D4 Corrective Action",
  pa: "D5 Preventive Action",
  verification: "D6 Verification",
  signoff: "D7 Sign-Off",
};

// ── Badge components: SeverityBadge / StatusBadge / TypePill / ScorePill now
//    live in src/components/shared/* (single tokenized source of truth).

// ── Shared building blocks ────────────────────────────────────────────────────

const EYEBROW_CLASS = "mb-1 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-primary";
const PRIMARY_LINK_CLASS =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--r-sm)] bg-[image:var(--grad-brand)] px-4 py-[9px] font-sans text-[13px] font-semibold tracking-[0.01em] text-primary-foreground no-underline";

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm"
    >
      <div
        className="flex items-center gap-2 border-b border-border-subtle px-[18px] py-[13px]"
      >
        {icon}
        <h2
          className="m-0 font-sans text-[13px] font-semibold tracking-[-0.01em] text-foreground"
        >
          {title}
        </h2>
      </div>
      <div className="p-[18px]">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className={EYEBROW_CLASS}>{label}</p>
      <p
        className="m-0 break-words font-sans text-[13px] leading-6 text-foreground"
      >
        {value}
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card px-4 py-3.5 shadow-sm"
    >
      <p className={EYEBROW_CLASS}>{label}</p>
      <p
        className="m-0 font-sans text-sm font-semibold text-foreground"
      >
        {value}
      </p>
    </div>
  );
}

// ── Imported source data (per source variant) ─────────────────────────────────

function SourceDataGrid({ prefill, finding }: { prefill?: PreFillContext; finding: Finding }) {
  const gridClass = "grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4";

  if (!prefill) {
    return (
      <div className={gridClass}>
        <InfoRow label="Source" value={finding.source} />
        <InfoRow label="Department" value={finding.department} />
        <InfoRow label="Reported" value={formatDateTime(finding.reportedAt)} />
        <div className="col-span-full">
          <InfoRow label="Description" value={finding.shortDescription} />
        </div>
      </div>
    );
  }

  if (prefill.source === "Bizzmine") {
    return (
      <div className={gridClass}>
        <InfoRow label="Deviation ID" value={prefill.deviationId} />
        <InfoRow label="Reported" value={formatDateTime(prefill.reportedAt)} />
        <InfoRow label="Occurred" value={formatDateTime(prefill.occurredAt)} />
        <InfoRow label="Area" value={prefill.location.area} />
        <InfoRow label="Line" value={prefill.location.line} />
        <InfoRow label="Equipment ID" value={prefill.location.equipmentId} />
        <InfoRow label="Initiator" value={`${prefill.initiator.name} · ${prefill.initiator.role}`} />
        <InfoRow label="Affected batches" value={prefill.affectedBatches.join(", ")} />
        <InfoRow label="SOP references" value={prefill.sopReferences.join(", ")} />
        <div className="col-span-full">
          <InfoRow label="Initial observation" value={prefill.initialObservation} />
        </div>
      </div>
    );
  }

  if (prefill.source === "Q100+") {
    return (
      <div className={gridClass}>
        <InfoRow label="Finding ID" value={prefill.findingId} />
        <InfoRow label="Audit ID" value={prefill.auditId} />
        <InfoRow label="Audit type" value={prefill.auditType} />
        <InfoRow label="Audit date" value={formatDateTime(prefill.auditDate)} />
        <InfoRow label="Auditor" value={`${prefill.auditor.name} · ${prefill.auditor.organization}`} />
        <InfoRow label="Auditee" value={`${prefill.auditee.department} · ${prefill.auditee.contactPerson}`} />
        <InfoRow label="Finding category" value={prefill.findingCategory} />
        <InfoRow label="Regulation reference" value={prefill.regulationReference.join(", ")} />
        <InfoRow label="SOP references" value={prefill.sopReferences.join(", ")} />
        <div className="col-span-full">
          <InfoRow label="Finding description" value={prefill.findingDescription} />
        </div>
      </div>
    );
  }

  return (
    <div className={gridClass}>
      <InfoRow label="Complaint ID" value={prefill.complaintId} />
      <InfoRow label="Reported" value={formatDateTime(prefill.reportedAt)} />
      <InfoRow label="Customer" value={`${prefill.customer.name} · ${prefill.customer.type}`} />
      <InfoRow label="Product" value={prefill.product.name} />
      <InfoRow label="Lot number" value={prefill.product.lotNumber} />
      <InfoRow label="Expiry date" value={prefill.product.expiryDate} />
      <InfoRow label="Complaint type" value={prefill.complaintType} />
      <div className="col-span-full">
        <InfoRow label="Complaint description" value={prefill.description} />
      </div>
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────

type TimelineTone = "success" | "danger";
type TimelineItem = {
  label: string;
  description: string;
  active: boolean;
  tone?: TimelineTone;
};

function Timeline({ finding, capa }: { finding: Finding; capa?: CAPACase }) {
  const rejected = capa?.status === "rejected";

  const items: TimelineItem[] = rejected
    ? [
        {
          label: "Finding reported",
          description: `${finding.id} imported from ${finding.source}.`,
          active: true,
        },
        {
          label: "Intake reviewed",
          description: "QA Compliance and the Department Head reviewed the intake.",
          active: true,
        },
        {
          label: "CAPA initiation rejected",
          description:
            "Reviewers agreed no CAPA is required — logged as a correction for trending.",
          active: true,
          tone: "danger",
        },
      ]
    : [
        {
          label: "Finding reported",
          description: `${finding.id} imported from ${finding.source}.`,
          active: true,
        },
        {
          label: "CAPA linked",
          description: capa
            ? `${capa.id} is connected to this finding.`
            : "CAPA has not been created yet.",
          active: Boolean(capa),
        },
        {
          label: "Investigation started",
          description: capa
            ? `Current step is ${STEP_LABELS[capa.currentStep]}.`
            : "Create CAPA with Nova to start the investigation.",
          active: Boolean(capa && capa.status !== "draft"),
        },
        {
          label: "Audit Ready closure",
          description:
            capa?.status === "closed" ? "CAPA was closed as Audit Ready." : "Closure is pending.",
          active: capa?.status === "closed",
        },
      ];

  return (
    <div className="flex flex-col">
      {items.map((item, index) => (
        <div key={item.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            {item.active && item.tone === "danger" ? (
              <XCircle size={16} className="shrink-0 text-destructive" aria-hidden="true" />
            ) : item.active ? (
              <CheckCircle2 size={16} className="shrink-0 text-success" aria-hidden="true" />
            ) : (
              <Circle size={16} className="shrink-0 text-foreground-faint" aria-hidden="true" />
            )}
            {index < items.length - 1 && (
              <div
                className="my-1 min-h-[22px] w-px flex-1 bg-border"
              />
            )}
          </div>
          <div className={cn(index < items.length - 1 && "pb-3.5")}>
            <p
              className={cn(
                "mb-0.5 mt-0 font-sans text-[13px] font-semibold leading-[1.3]",
                item.active && item.tone === "danger"
                  ? "text-destructive"
                  : item.active
                    ? "text-foreground"
                    : "text-foreground-tertiary",
              )}
            >
              {item.label}
            </p>
            <p
              className="m-0 font-sans text-xs leading-[1.45] text-foreground-faint"
            >
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Rejection reason banner ───────────────────────────────────────────────────

function IntakeRejectionBanner({ capa }: { capa: CAPACase }) {
  const reviewers = capa.intakeReviews?.filter((r) => r.decision === "rejected") ?? [];
  if (reviewers.length === 0) {
    // Fallback: show any reviewer who has a note
    const withNotes = capa.intakeReviews?.filter((r) => r.notes) ?? [];
    if (withNotes.length === 0) {
      return (
        <div className="rounded-[var(--r-md)] border-l-[3px] border-l-destructive bg-[var(--danger-soft)] px-5 py-4">
          <div className="mb-1.5 flex items-center gap-2">
            <MessageSquareX size={14} className="shrink-0 text-destructive" />
            <p className="m-0 font-sans text-[13px] font-semibold text-destructive">
              CAPA initiation rejected
            </p>
          </div>
          <p className="m-0 font-sans text-[13px] leading-[1.6] text-foreground-secondary">
            Reviewers decided this finding does not warrant a full CAPA. No further 8D investigation will proceed.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-[var(--r-md)] border-l-[3px] border-l-destructive bg-[var(--danger-soft)] px-5 py-4">
        <div className="mb-2 flex items-center gap-2">
          <MessageSquareX size={14} className="shrink-0 text-destructive" />
          <p className="m-0 font-sans text-[13px] font-semibold text-destructive">
            CAPA initiation rejected
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {withNotes.map((r) => (
            <div key={r.reviewerPersonaId}>
              <p className="mb-0.5 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                {r.reviewerName} · {r.role}
              </p>
              <p className="m-0 font-sans text-[13px] leading-[1.6] text-foreground-secondary">{r.notes}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--r-md)] border-l-[3px] border-l-destructive bg-[var(--danger-soft)] px-5 py-4">
      <div className="mb-2 flex items-center gap-2">
        <MessageSquareX size={14} className="shrink-0 text-destructive" />
        <p className="m-0 font-sans text-[13px] font-semibold text-destructive">
          CAPA initiation rejected
        </p>
      </div>
      <p className="mb-3 mt-0 font-sans text-[13px] leading-[1.6] text-foreground-secondary">
        Reviewers decided this finding does not warrant a full CAPA. No 8D investigation will proceed. Reason{reviewers.length > 1 ? "s" : ""}:
      </p>
      <div className="flex flex-col gap-3">
        {reviewers.map((r) => (
          <div
            key={r.reviewerPersonaId}
            className="rounded-[var(--r-sm)] border border-destructive/20 bg-card px-4 py-3"
          >
            <p className="mb-1 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              {r.reviewerName} · {r.role}
            </p>
            <p className="m-0 font-sans text-[13px] leading-[1.6] text-foreground-secondary">
              {r.notes ?? "No additional notes provided."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function FindingDetailPage() {
  const { id } = useParams();
  const { data: finding } = useFinding(id);
  const capas = useCapas().data ?? [];
  const capa = finding
    ? capas.find(
        (record) => record.id === finding.linkedCapaId || record.findingId === finding.id,
      )
    : undefined;
  const activePersonaId = usePersonaStore((state) => state.activePersonaId);

  if (!finding) {
    return <NotFound message={`Finding ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const createCAPAUrl = `/capa/new?type=${finding.type}&sourceId=${finding.id}`;
  const canCreateCapa = finding.status === "pending_capa" || finding.status === "overdue";
  const isInitiator = canFillCAPA(activePersonaId);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Back link ──────────────────────────────────────────────────────── */}
      <Link
        to="/findings"
        className="inline-flex w-fit items-center gap-1.5 font-sans text-xs text-foreground-tertiary no-underline"
      >
        <ArrowLeft size={13} className="shrink-0" />
        Back to Findings
      </Link>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div className="min-w-0">
          <p className={EYEBROW_CLASS}>Quality event</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className="m-0 font-sans text-[22px] font-bold tracking-[0.01em] text-foreground"
            >
              {finding.id}
            </h1>
            <div className="flex flex-wrap gap-1.5">
              <TypePill type={finding.type} />
              <SeverityBadge severity={finding.severity} />
              <StatusBadge status={finding.status} />
            </div>
          </div>
          <p
            className="mt-2.5 max-w-[640px] font-sans text-sm leading-[1.6] text-foreground-tertiary"
          >
            {finding.shortDescription}
          </p>
        </div>

        {capa && finding.status !== "rejected" ? (
          <Link to={`/capa/${capa.id}`} className={PRIMARY_LINK_CLASS}>
            Open linked CAPA
            <ArrowRight size={14} />
          </Link>
        ) : canCreateCapa ? (
          isInitiator ? (
            <Link to={createCAPAUrl} className={PRIMARY_LINK_CLASS}>
              <Plus size={14} />
              Create CAPA with Nova
            </Link>
          ) : (
            <div
              title="Only the Initiator role can create a CAPA from a finding."
              className="inline-flex cursor-not-allowed items-center gap-1.5 whitespace-nowrap rounded-[var(--r-sm)] border border-[var(--line-2)] bg-elevated px-4 py-[9px] font-sans text-[13px] font-medium text-foreground-faint"
            >
              <Lock size={13} aria-hidden="true" />
              Initiator only — read-only
            </div>
          )
        ) : null}
      </div>

      {/* ── Stat strip ─────────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3"
      >
        <StatCard label="Type" value={formatCAPAType(finding.type)} />
        <StatCard label="Department" value={finding.department} />
        <StatCard label="Reported" value={formatDateTime(finding.reportedAt)} />
        <StatCard label="Linked CAPA" value={finding.status === "rejected" ? "Rejected at intake" : (capa?.id ?? "Not created")} />
      </div>

      {/* ── Rejection banner ───────────────────────────────────────────────── */}
      {finding.status === "rejected" && capa && (
        <IntakeRejectionBanner capa={capa} />
      )}

      {/* ── Two-column body ────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-start gap-5"
      >
        {/* Left: source data + Nova */}
        <div className="flex min-w-0 flex-col gap-5">
          <SectionCard title="Imported source data">
            <SourceDataGrid prefill={capa?.preFill} finding={finding} />
          </SectionCard>

          {/* Nova classification */}
          <div
            className="rounded-[var(--r-lg)] border border-l-[3px] border-[var(--line-2)] border-l-primary bg-card p-[18px] shadow-sm"
          >
            <div className="mb-2.5 flex items-center gap-2">
              <Sparkles size={14} className="shrink-0 text-primary" />
              <p
                className="m-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-primary"
              >
                Nova classification
              </p>
            </div>
            <p
              className="m-0 font-sans text-sm leading-[1.65] text-foreground-secondary"
            >
              {novaText(finding)}
            </p>
          </div>
        </div>

        {/* Right: summary + linked CAPA + timeline */}
        <div className="flex flex-col gap-5">
          {capa && (
            <SectionCard title="Linked CAPA">
              <div className="flex flex-col gap-3">
                <div>
                  <Link
                    to={`/capa/${capa.id}`}
                    className="font-sans text-sm font-bold text-primary no-underline"
                  >
                    {capa.id}
                  </Link>
                  <p
                    className="mt-1 font-sans text-[13px] leading-6 text-foreground-tertiary"
                  >
                    {capa.title}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-block rounded-[var(--r-full)] px-2 py-0.5 font-sans text-[11px] font-semibold tracking-[0.14em]",
                      capa.status === "closed"
                        ? "bg-[var(--success-soft)] text-success"
                        : "bg-[var(--accent-soft)] text-primary",
                    )}
                  >
                    {formatCAPAStatus(capa.status)}
                  </span>
                  <ScorePill score={capa.score.total} compact />
                </div>
                <Link
                  to={`/capa/${capa.id}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-transparent px-3.5 py-2 font-sans text-[13px] font-medium text-foreground-secondary no-underline"
                >
                  View CAPA
                  <ArrowRight size={13} />
                </Link>
              </div>
            </SectionCard>
          )}

          <SectionCard title="Finding summary">
            <div className="flex flex-col gap-3.5">
              <InfoRow label="Source system" value={finding.source} />
              <InfoRow label="Severity" value={finding.severity} />
              <InfoRow label="CAPA type" value={formatCAPAType(finding.type)} />
              <InfoRow label="Department" value={finding.department} />
            </div>
          </SectionCard>

          <SectionCard title="Timeline">
            <Timeline finding={finding} capa={capa} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default FindingDetailPage;
