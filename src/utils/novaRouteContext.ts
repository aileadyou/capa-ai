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
  if (!match || match[1] === "new") return undefined;
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

  return {
    step: "global",
    source: "global",
    routePath: pathname,
    stepLabel: "Global workspace",
    pageTitle: "CAPA AI",
  };
}
