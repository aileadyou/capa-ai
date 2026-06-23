export interface NovaRouteContext {
  capaId?: string;
  step: string;
  source: "route" | "global";
  routePath: string;
  stepLabel: string;
  pageTitle: string;
}

const stepByRoute = [
  { pattern: "/8d/problem", step: "d1-problem", label: "D1 Problem statement" },
  { pattern: "/8d/containment", step: "d2-containment", label: "D2 Containment" },
  { pattern: "/8d/rca", step: "d3-rca", label: "D3 Root cause analysis" },
  { pattern: "/8d/ca", step: "d4-ca", label: "D4 Corrective action" },
  { pattern: "/8d/pa", step: "d5-pa", label: "D5 Preventive action" },
  { pattern: "/8d/verification", step: "d6-verification", label: "D6 Verification" },
  { pattern: "/8d/signoff", step: "d7-signoff", label: "D7 Sign-off" },
] as const;

function extractCapaId(pathname: string) {
  const match = pathname.match(/\/capa\/([^/?#]+)/);
  if (!match || match[1] === "new" || match[1] === "list") return undefined;
  return decodeURIComponent(match[1]);
}

export function getNovaRouteContext(pathname: string): NovaRouteContext {
  const capaId = extractCapaId(pathname);

  if (capaId) {
    const stepMatch = stepByRoute.find((entry) => pathname.includes(entry.pattern));
    const step = stepMatch?.step ?? "capa-overview";
    const stepLabel = stepMatch?.label ?? "CAPA overview";
    return {
      capaId,
      step,
      source: "route",
      routePath: pathname,
      stepLabel,
      pageTitle: `${capaId} · ${stepLabel}`,
    };
  }

  if (pathname.startsWith("/capa/new")) {
    return {
      step: "capa-intake",
      source: "route",
      routePath: pathname,
      stepLabel: "CAPA intake",
      pageTitle: "New CAPA intake",
    };
  }

  if (pathname.startsWith("/findings")) {
    return {
      step: "findings",
      source: "route",
      routePath: pathname,
      stepLabel: "Findings",
      pageTitle: "Findings",
    };
  }

  if (pathname === "/diagnostics") {
    return {
      step: "diagnostics-home",
      source: "route",
      routePath: pathname,
      stepLabel: "Diagnostics workspace",
      pageTitle: "Lead AI RnD Lab · Diagnostics",
    };
  }

  if (pathname === "/diagnostics/screening") {
    return {
      step: "diagnostics-ai-screening",
      source: "route",
      routePath: pathname,
      stepLabel: "AI Screening",
      pageTitle: "Lead AI RnD Lab · AI Screening",
    };
  }

  if (pathname === "/diagnostics/runs") {
    return {
      step: "diagnostics-runs",
      source: "route",
      routePath: pathname,
      stepLabel: "Screening runs",
      pageTitle: "Lead AI RnD Lab · Screening Runs",
    };
  }

  if (pathname === "/diagnostics/candidates") {
    return {
      step: "diagnostics-candidates",
      source: "route",
      routePath: pathname,
      stepLabel: "Candidate library",
      pageTitle: "Lead AI RnD Lab · Candidate Library",
    };
  }

  if (pathname.startsWith("/diagnostics/runs/details/")) {
    const runId = pathname.split("/").pop() ?? "";
    return {
      step: "diagnostics-run-detail",
      source: "route",
      routePath: pathname,
      stepLabel: "Run details",
      pageTitle: `Lead AI RnD Lab · ${runId}`,
    };
  }

  if (pathname === "/diagnostics/targets") {
    return {
      step: "diagnostics-targets",
      source: "route",
      routePath: pathname,
      stepLabel: "Target structures",
      pageTitle: "Lead AI RnD Lab · Target Structures",
    };
  }

  return {
    step: "global",
    source: "global",
    routePath: pathname,
    stepLabel: "Global workspace",
    pageTitle: "CAPA AI",
  };
}
