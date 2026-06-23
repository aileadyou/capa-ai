import { useEffect, useMemo, useRef, useState } from "react";
import {
  Beaker,
  BookmarkPlus,
  Bot,
  CheckCircle2,
  ChevronRight,
  Circle,
  Database,
  Dna,
  FlaskConical,
  Gauge,
  Layers3,
  Loader2,
  Microscope,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Stethoscope,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4 | 5;
type RunState = "idle" | "running" | "complete";
type SourceId = "rcsb" | "alphafold" | "custom" | "partner";
type DiversityMode = "score" | "balanced" | "diverse";

type VirusOption = {
  id: string;
  name: string;
  family: string;
  defaultSource: SourceId;
  defaultStructure: string;
  targetProtein: string;
  regions: string[];
  regionRationale: Record<string, string>;
  note: string;
};

type Candidate = {
  rank: number;
  sequence: string;
  score: number;
  confidence: number;
  bindingRegion: string;
  contactSite: string;
  targetProtein: string;
  sourceId: string;
  properties: { length: number; charge: string; hydrophobicity: string; synthesis: string };
  rationale: string;
  labNote: string;
};

// ─── Static data ─────────────────────────────────────────────────────────────

const virusOptions: VirusOption[] = [
  {
    id: "norovirus-gii4",
    name: "Norovirus GII.4",
    family: "Caliciviridae",
    defaultSource: "rcsb",
    defaultStructure: "4OP7",
    targetProtein: "VP1 capsid P domain",
    regions: ["GII.4 P2 domain", "HBGA pocket", "P-domain dimer interface"],
    regionRationale: {
      "GII.4 P2 domain": "Hypervariable surface-exposed loops on the P2 subdomain mediate cell attachment. High-confidence contact region for competitive inhibition.",
      "HBGA pocket": "Histo-blood group antigen binding pocket is the primary receptor engagement site. Peptides here may competitively block virus attachment.",
      "P-domain dimer interface": "Dimer formation is critical for stable capsid assembly. Disrupting this interface may prevent virion maturation.",
    },
    note: "Common demo target for capsid surface binding exploration.",
  },
  {
    id: "sars-cov-2",
    name: "SARS-CoV-2",
    family: "Coronaviridae",
    defaultSource: "rcsb",
    defaultStructure: "6M0J",
    targetProtein: "Spike receptor-binding domain",
    regions: ["RBD receptor ridge", "ACE2 interface", "N-terminal loop"],
    regionRationale: {
      "RBD receptor ridge": "The receptor ridge directly contacts ACE2 and is a well-validated neutralisation epitope in prior mAb work.",
      "ACE2 interface": "Largest contact surface with the host receptor. Peptides binding here may sterically block entry with high potency.",
      "N-terminal loop": "Glycan-shielded but accessible loop. Suitable for long-range allosteric disruption of RBD opening.",
    },
    note: "Good for demonstrating receptor interface screening.",
  },
  {
    id: "influenza-a",
    name: "Influenza A H1N1",
    family: "Orthomyxoviridae",
    defaultSource: "rcsb",
    defaultStructure: "4WE8",
    targetProtein: "Hemagglutinin HA1 head",
    regions: ["Receptor-binding pocket", "Antigenic site Sa", "Antigenic site Sb"],
    regionRationale: {
      "Receptor-binding pocket": "Conserved sialic acid binding cavity. Peptides here have cross-strain potential and are less subject to antigenic drift.",
      "Antigenic site Sa": "Major humoral epitope targeted by natural immunity. Useful for understanding escape mutation risk in peptide design.",
      "Antigenic site Sb": "Secondary antigenic site with lower mutation pressure. More stable target for long-term peptide development.",
    },
    note: "Useful for peptide candidates around hemagglutinin binding surfaces.",
  },
  {
    id: "dengue-2",
    name: "Dengue virus type 2",
    family: "Flaviviridae",
    defaultSource: "rcsb",
    defaultStructure: "1OAN",
    targetProtein: "Envelope protein domain III",
    regions: ["EDIII lateral ridge", "Fusion loop neighborhood", "Dimer interface"],
    regionRationale: {
      "EDIII lateral ridge": "Surface-accessible ridge on domain III. Strongly immunogenic and used in prior DENV vaccine candidates.",
      "Fusion loop neighborhood": "Proximity to the fusion loop may allow indirect inhibition of membrane fusion without direct contact.",
      "Dimer interface": "E-protein homodimerisation is required for mature virion surface. Disrupting this interface arrests particle assembly.",
    },
    note: "Surface-accessible epitope regions for discovery demos.",
  },
];

const sourceLabels: Record<SourceId, string> = {
  rcsb: "RCSB PDB",
  alphafold: "AlphaFold DB",
  custom: "Custom upload",
  partner: "Partner structure vault",
};

const diversityLabels: Record<DiversityMode, string> = {
  score: "Highest score only",
  balanced: "Balanced score + diversity",
  diverse: "Diverse shortlist",
};

const peptideCores = [
  "WQNSD", "YVSLN", "KPFAD", "RGDLS", "VTNQP",
  "LQDPW", "HNRTV", "SFWLK", "DPTAV", "QYHGN",
  "TRLSW", "NPKTY", "GAFNV", "WEKDS", "TYRPL",
  "KVSQD", "SPNWH", "LHTGQ", "FYDRA", "QNNLS",
  "WSPKT", "DLYVN", "RQHST", "PWTGN", "NFSRL",
  "KLDWY", "YQTPS", "VHGDN", "SQWRT", "TNPYL",
];

const wizardSteps = [
  { id: 1 as WizardStep, label: "Virus target", icon: Target },
  { id: 2 as WizardStep, label: "Binding region", icon: Microscope },
  { id: 3 as WizardStep, label: "Peptide rules", icon: Beaker },
  { id: 4 as WizardStep, label: "AI pipeline", icon: Bot },
  { id: 5 as WizardStep, label: "Results", icon: FlaskConical },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreTone(score: number) {
  if (score >= 90) return "border-success bg-success/10 text-success";
  if (score >= 82) return "border-primary bg-[var(--accent-soft)] text-primary";
  return "border-warning bg-warning/10 text-warning";
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function fitSequence(prefix: string, core: string, suffix: string, minLength: number, maxLength: number) {
  const filler = "AGSTNQ";
  const safeMax = Math.max(maxLength, prefix.length + suffix.length + 3);
  let nextCore = core;
  while (`${prefix}${nextCore}${suffix}`.length < minLength) {
    nextCore += filler[nextCore.length % filler.length];
  }
  const availableCoreLength = Math.max(3, safeMax - prefix.length - suffix.length);
  if (nextCore.length > availableCoreLength) nextCore = nextCore.slice(0, availableCoreLength);
  return `${prefix}${nextCore}${suffix}`;
}

function buildCandidates(opts: {
  virus: VirusOption; sourceId: SourceId; structureId: string; targetProtein: string;
  bindingRegion: string; prefix: string; suffix: string; minLength: number; maxLength: number;
  topN: number; diversityMode: DiversityMode;
}): Candidate[] {
  const { virus, sourceId, structureId, targetProtein, bindingRegion, prefix, suffix, minLength, maxLength, topN, diversityMode } = opts;
  const regionPool = bindingRegion === "scan-all" ? virus.regions : [bindingRegion, ...virus.regions];
  const diversityPenalty = diversityMode === "score" ? 1.45 : diversityMode === "diverse" ? 2.35 : 1.85;
  const count = clampNumber(topN, 5, 50);

  return Array.from({ length: count }, (_, index) => {
    const core = peptideCores[index % peptideCores.length];
    const sequence = fitSequence(prefix, core, suffix, minLength, maxLength);
    const score = Math.max(58, Math.round(96 - index * diversityPenalty - (index % 4) * 0.8));
    const confidence = Math.max(62, Math.round(91 - (index % 6) * 3.4 - index * 0.35));
    const region = regionPool[index % regionPool.length];
    const residueStart = 290 + index * 7;
    const chargeValue = (sequence.match(/[KRH]/g)?.length ?? 0) - (sequence.match(/[DE]/g)?.length ?? 0);
    const hydroCount = sequence.match(/[AILMFWVY]/g)?.length ?? 0;
    const hydroRatio = hydroCount / Math.max(sequence.length, 1);

    return {
      rank: index + 1,
      sequence,
      score,
      confidence,
      bindingRegion: region,
      contactSite: `Chain A residues ${residueStart}–${residueStart + 11}`,
      targetProtein,
      sourceId: `${sourceLabels[sourceId]}:${structureId || virus.defaultStructure}`,
      properties: {
        length: sequence.length,
        charge: chargeValue > 0 ? `+${chargeValue}` : `${chargeValue}`,
        hydrophobicity: hydroRatio > 0.42 ? "Medium-high" : hydroRatio > 0.28 ? "Balanced" : "Low",
        synthesis: sequence.length <= 16 ? "Easy" : "Moderate",
      },
      rationale: index < 3
        ? "Strong geometric fit near the selected surface pocket with favorable sequence constraints for lab trial."
        : "Useful candidate for maintaining shortlist diversity while preserving acceptable predicted contact quality.",
      labNote: index < 5
        ? "Prioritize for first-pass binding assay and compare against negative peptide control."
        : "Keep as backup candidate if the first shortlist needs broader sequence diversity.",
    };
  });
}

// ─── Virus combobox ───────────────────────────────────────────────────────────

function VirusCombobox({
  options,
  value,
  onChange,
}: {
  options: VirusOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((v) => v.id === value) ?? options[0];
  const filtered = options.filter(
    (v) =>
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      v.family.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id="virus-combo-trigger"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-[var(--r-sm)] border bg-[var(--field-bg)] px-3 text-left text-sm transition-[border-color,background,box-shadow] [transition-duration:var(--dur-fast)]",
          open
            ? "border-primary bg-[var(--field-bg-hover)] shadow-[0_0_0_3px_var(--accent-soft)]"
            : "border-[var(--line-2)] hover:bg-[var(--field-bg-hover)]",
        )}
      >
        <span className="flex-1 truncate font-medium text-foreground">{selected.name}</span>
        <span className="shrink-0 rounded-full border border-[var(--line-2)] px-2 py-0.5 font-sans text-[10px] text-foreground-tertiary">
          {selected.family}
        </span>
        <ChevronRight
          size={14}
          className={cn(
            "shrink-0 text-foreground-faint transition-transform [transition-duration:var(--dur-fast)]",
            open && "rotate-90",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-[var(--r-md)] border border-[var(--line-2)] bg-card shadow-lg">
          {/* Search input */}
          <div className="border-b border-[var(--line-2)] p-2">
            <div className="flex items-center gap-2 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-2.5">
              <Search size={13} className="shrink-0 text-foreground-faint" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search virus or family…"
                className="h-8 flex-1 bg-transparent font-sans text-sm text-foreground outline-none placeholder:text-foreground-faint"
              />
            </div>
          </div>
          {/* Options list */}
          <div className="max-h-[220px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center font-sans text-sm text-foreground-tertiary">
                No matches found.
              </p>
            ) : (
              filtered.map((virus) => (
                <button
                  key={virus.id}
                  type="button"
                  onClick={() => {
                    onChange(virus.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[var(--r-sm)] px-3 py-2.5 text-left transition-colors [transition-duration:var(--dur-fast)] hover:bg-elevated",
                    virus.id === value && "bg-[var(--accent-soft)]",
                  )}
                >
                  <span className="flex-1">
                    <span className="block font-sans text-sm font-semibold text-foreground">
                      {virus.name}
                    </span>
                    <span className="font-sans text-xs text-foreground-tertiary">{virus.family}</span>
                  </span>
                  {virus.id === value && (
                    <CheckCircle2 size={14} className="shrink-0 text-primary" aria-hidden="true" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small shared components ──────────────────────────────────────────────────

const formFieldClass =
  "box-border h-10 w-full rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-3 font-sans text-sm text-foreground outline-none transition-[border-color,box-shadow,background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] placeholder:text-foreground-faint focus:border-primary focus:bg-[var(--field-bg-hover)] focus:shadow-[0_0_0_3px_var(--accent-soft)]";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block font-sans text-xs font-semibold text-foreground-secondary">
      {children}
    </label>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated px-3 py-2">
      <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground-faint">{label}</span>
      <span className="mt-0.5 truncate font-sans text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = "Next",
  nextIcon,
  nextDisabled = false,
  backLabel = "Back",
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextIcon?: React.ReactNode;
  nextDisabled?: boolean;
  backLabel?: string;
}) {
  return (
    <div className={cn("mt-6 flex", onBack ? "justify-between" : "justify-end")}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-card px-5 font-sans text-sm font-semibold text-foreground-secondary shadow-sm transition-[background,border-color] [transition-duration:var(--dur-fast)] hover:bg-elevated hover:text-foreground"
        >
          ← {backLabel}
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[var(--r-sm)] bg-[image:var(--grad-brand)] px-5 font-sans text-sm font-semibold text-primary-foreground shadow-sm transition-[filter] [transition-duration:var(--dur-fast)] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {nextIcon}
          {nextLabel}
        </button>
      )}
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: WizardStep }) {
  return (
    <div className="flex items-center gap-0">
      {wizardSteps.map((step, index) => {
        const done = step.id < current;
        const active = step.id === current;
        const isLast = index === wizardSteps.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-[var(--r-full)] border-2 font-sans text-xs font-bold transition-[background,border-color,color] [transition-duration:var(--dur-fast)]",
                  done
                    ? "border-success bg-success/10 text-success"
                    : active
                      ? "border-primary bg-[var(--accent-soft)] text-primary"
                      : "border-[var(--line-2)] bg-elevated text-foreground-faint",
                )}
              >
                {done ? <CheckCircle2 size={14} strokeWidth={2.2} /> : step.id}
              </div>
              <span
                className={cn(
                  "hidden whitespace-nowrap font-sans text-[10px] font-semibold sm:block",
                  active ? "text-primary" : done ? "text-success" : "text-foreground-faint",
                )}
              >
                {step.label}
              </span>
            </div>

            {!isLast && (
              <div
                className={cn(
                  "mx-1.5 mb-5 hidden h-px w-10 sm:mx-2 sm:block lg:w-14",
                  done ? "bg-success/40" : "bg-[var(--line-2)]",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DiagnosticsScreeningPage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Form state
  const [virusId, setVirusId] = useState(virusOptions[0].id);
  const activeVirus = virusOptions.find((v) => v.id === virusId) ?? virusOptions[0];
  const [sourceId, setSourceId] = useState<SourceId>(activeVirus.defaultSource);
  const [structureId, setStructureId] = useState(activeVirus.defaultStructure);
  const [targetProtein, setTargetProtein] = useState(activeVirus.targetProtein);
  const [bindingRegion, setBindingRegion] = useState(activeVirus.regions[0]);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [prefix, setPrefix] = useState("GGG");
  const [suffix, setSuffix] = useState("CY");
  const [minLength, setMinLength] = useState(9);
  const [maxLength, setMaxLength] = useState(16);
  const [topN, setTopN] = useState(10);
  const [diversityMode, setDiversityMode] = useState<DiversityMode>("balanced");

  // Run state
  const [runState, setRunState] = useState<RunState>("idle");
  const [progress, setProgress] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<string | undefined>();
  const [shortlist, setShortlist] = useState<Set<string>>(() => new Set());

  const selectedCandidate = candidates.find((c) => c.sequence === selectedSequence) ?? candidates[0];

  const estimatedLibrary = useMemo(() => {
    const span = Math.max(1, maxLength - minLength + 1);
    return span * 920 + prefix.length * 180 + suffix.length * 140;
  }, [maxLength, minLength, prefix.length, suffix.length]);

  const aiSteps = useMemo(() => [
    { title: "Target acquisition", detail: `Import ${structureId || activeVirus.defaultStructure} from ${sourceLabels[sourceId]}.` },
    { title: "Binding region mapping", detail: bindingRegion === "scan-all" ? `Scan all annotated regions on ${targetProtein}.` : `Focus model attention on ${bindingRegion}.` },
    { title: "Peptide library generation", detail: `Apply ${prefix || "no"} prefix, ${suffix || "no"} suffix, and ${minLength}–${maxLength} aa length window.` },
    { title: "AI compatibility scoring", detail: "Rank sequence-target pairs by predicted contact quality and feasibility." },
    { title: "Shortlist packaging", detail: `Return top ${topN} candidates using ${diversityLabels[diversityMode].toLowerCase()}.` },
  ], [activeVirus.defaultStructure, bindingRegion, diversityMode, maxLength, minLength, prefix, sourceId, structureId, suffix, targetProtein, topN]);

  const completedStepCount = runState === "complete" ? aiSteps.length : runState === "running" ? Math.floor(progress / 20) : 0;

  useEffect(() => {
    if (runState !== "running") return undefined;
    const interval = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(current + 13, 100);
        if (next >= 100) {
          window.clearInterval(interval);
          setRunState("complete");
          toast.success("AI screening complete", { description: `Top ${candidates.length} peptide candidates are ready.` });
          setTimeout(() => setCurrentStep(5), 700);
        }
        return next;
      });
    }, 420);
    return () => window.clearInterval(interval);
  }, [candidates.length, runState]);

  const handleVirusChange = (nextId: string) => {
    const next = virusOptions.find((v) => v.id === nextId) ?? virusOptions[0];
    setVirusId(next.id);
    setSourceId(next.defaultSource);
    setStructureId(next.defaultStructure);
    setTargetProtein(next.targetProtein);
    setBindingRegion(next.regions[0]);
    setShowAiSuggestion(false);
  };

  const handleRun = () => {
    const nextCandidates = buildCandidates({
      virus: activeVirus, sourceId, structureId, targetProtein, bindingRegion,
      prefix: prefix.trim().toUpperCase(), suffix: suffix.trim().toUpperCase(),
      minLength, maxLength, topN, diversityMode,
    });
    setCandidates(nextCandidates);
    setSelectedSequence(nextCandidates[0]?.sequence);
    setProgress(7);
    setRunState("running");
    setCurrentStep(4);
    toast("AI screening started", { description: `${activeVirus.name} peptide shortlist is being prepared.` });
  };

  const handleReset = () => {
    setCurrentStep(1);
    setRunState("idle");
    setProgress(0);
    setCandidates([]);
    setSelectedSequence(undefined);
  };

  const toggleShortlist = (sequence: string) => {
    setShortlist((prev) => {
      const next = new Set(prev);
      next.has(sequence) ? next.delete(sequence) : next.add(sequence);
      return next;
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto flex w-full flex-col gap-6">

      {/* Page header */}
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-[var(--r-full)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-1 font-sans text-xs font-semibold text-primary">
          <Stethoscope size={14} strokeWidth={1.9} aria-hidden="true" />
          Lead AI RnD Lab · Diagnostics
        </div>
        <h1 className="m-0 font-sans text-3xl font-bold text-foreground">AI Screening</h1>
        <p className="mb-0 mt-2 font-sans text-base leading-7 text-foreground-secondary">
          Configure a viral target, constrain the peptide design space, and let the AI prepare a lab-ready shortlist.
        </p>
      </header>

      {/* Step indicator */}
      <div className="overflow-x-auto">
        <StepIndicator current={currentStep} />
      </div>

      {/* ── Step 1: Virus target ────────────────────────────────────────────── */}
      {currentStep === 1 && (
        <div>
          <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Step 1 of 5</p>
                <h2 className="mb-0 mt-1 font-sans text-2xl font-bold text-foreground">Choose your virus target</h2>
                <p className="mb-0 mt-1 font-sans text-sm text-foreground-tertiary">Select the virus and the structural source for screening.</p>
              </div>
              <Target size={22} className="mt-1 shrink-0 text-primary" aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-5">
              {/* Virus combobox */}
              <div>
                <FieldLabel htmlFor="virus-combo-trigger">Virus target</FieldLabel>
                <VirusCombobox
                  options={virusOptions}
                  value={virusId}
                  onChange={handleVirusChange}
                />
                {/* Selected virus info */}
                <div className="mt-2 rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated px-4 py-3">
                  <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-sans text-xs font-semibold text-foreground-secondary">
                      {activeVirus.family}
                    </span>
                    <span className="text-foreground-faint">·</span>
                    <span className="font-sans text-xs text-foreground-tertiary">
                      {activeVirus.targetProtein}
                    </span>
                  </div>
                  <p className="m-0 font-sans text-xs leading-5 text-foreground-tertiary">
                    {activeVirus.note}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="source-select">Structure source</FieldLabel>
                  <Select value={sourceId} onValueChange={(v) => setSourceId(v as SourceId)}>
                    <SelectTrigger id="source-select" className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(sourceLabels).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel htmlFor="structure-id">PDB / structure ID</FieldLabel>
                  <input
                    id="structure-id"
                    value={structureId}
                    onChange={(e) => setStructureId(e.target.value.toUpperCase())}
                    className={formFieldClass}
                    placeholder="4OP7"
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="target-protein">Protein target</FieldLabel>
                <input
                  id="target-protein"
                  value={targetProtein}
                  onChange={(e) => setTargetProtein(e.target.value)}
                  className={formFieldClass}
                  placeholder="VP1 capsid P domain"
                />
              </div>
            </div>
          </div>

          <NavButtons
            onNext={() => setCurrentStep(2)}
            nextLabel="Next: Binding region"
          />
        </div>
      )}

      {/* ── Step 2: Binding region ──────────────────────────────────────────── */}
      {currentStep === 2 && (
        <div>
          <div className="mb-3 grid gap-2 sm:grid-cols-3">
            <SummaryChip label="Virus" value={activeVirus.name} />
            <SummaryChip label="Structure" value={structureId || activeVirus.defaultStructure} />
            <SummaryChip label="Protein" value={targetProtein} />
          </div>

          <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Step 2 of 5</p>
                <h2 className="mb-0 mt-1 font-sans text-2xl font-bold text-foreground">Select a binding region</h2>
                <p className="mb-0 mt-1 font-sans text-sm text-foreground-tertiary">Choose which part of the virus the peptides should target.</p>
              </div>
              <Microscope size={22} className="mt-1 shrink-0 text-primary" aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <FieldLabel htmlFor="binding-region">Region</FieldLabel>
                <Select value={bindingRegion} onValueChange={(v) => { setBindingRegion(v); setShowAiSuggestion(false); }}>
                  <SelectTrigger id="binding-region" className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scan-all">Scan all annotated regions</SelectItem>
                    {activeVirus.regions.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button
                type="button"
                onClick={() => setShowAiSuggestion((v) => !v)}
                className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--r-sm)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 font-sans text-sm font-semibold text-primary transition-[background] [transition-duration:var(--dur-fast)] hover:bg-primary/20"
              >
                <Sparkles size={14} aria-hidden="true" />
                {showAiSuggestion ? "Hide" : "Show"} AI region suggestions
              </button>

              {showAiSuggestion && (
                <div className="flex flex-col gap-2">
                  {activeVirus.regions.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => setBindingRegion(region)}
                      className={cn(
                        "w-full cursor-pointer rounded-[var(--r-md)] border p-4 text-left transition-[border-color,background] [transition-duration:var(--dur-fast)]",
                        bindingRegion === region
                          ? "border-[var(--accent-line)] bg-[var(--accent-soft)]"
                          : "border-[var(--line-2)] bg-elevated hover:border-[var(--line-3)]",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="m-0 font-sans text-sm font-bold text-foreground">{region}</p>
                        {bindingRegion === region && (
                          <CheckCircle2 size={15} className="shrink-0 text-primary" aria-hidden="true" />
                        )}
                      </div>
                      <p className="mb-0 mt-2 font-sans text-xs leading-5 text-foreground-tertiary">
                        {activeVirus.regionRationale[region]}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <NavButtons
            onBack={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
            nextLabel="Next: Peptide rules"
          />
        </div>
      )}

      {/* ── Step 3: Peptide constraints ─────────────────────────────────────── */}
      {currentStep === 3 && (
        <div>
          <div className="mb-3 grid gap-2 sm:grid-cols-4">
            <SummaryChip label="Virus" value={activeVirus.name} />
            <SummaryChip label="Structure" value={structureId || activeVirus.defaultStructure} />
            <SummaryChip label="Protein" value={targetProtein} />
            <SummaryChip label="Region" value={bindingRegion === "scan-all" ? "All regions" : bindingRegion} />
          </div>

          <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Step 3 of 5</p>
                <h2 className="mb-0 mt-1 font-sans text-2xl font-bold text-foreground">Constrain the peptide design space</h2>
                <p className="mb-0 mt-1 font-sans text-sm text-foreground-tertiary">Set sequence constraints and output preferences before running.</p>
              </div>
              <Beaker size={22} className="mt-1 shrink-0 text-primary" aria-hidden="true" />
            </div>

            <div className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="prefix">Starts with</FieldLabel>
                  <input
                    id="prefix"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    className={formFieldClass}
                    placeholder="GGG"
                  />
                  <p className="mt-1.5 font-sans text-[11px] text-foreground-tertiary">Prefix every generated peptide with this motif.</p>
                </div>
                <div>
                  <FieldLabel htmlFor="suffix">Ends with</FieldLabel>
                  <input
                    id="suffix"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value.toUpperCase())}
                    className={formFieldClass}
                    placeholder="CY"
                  />
                  <p className="mt-1.5 font-sans text-[11px] text-foreground-tertiary">Append this motif to the C-terminus of every candidate.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="min-length">Min length (aa)</FieldLabel>
                  <input
                    id="min-length"
                    type="number"
                    min={4}
                    max={30}
                    value={minLength}
                    onChange={(e) => {
                      const next = clampNumber(Number(e.target.value), 4, 30);
                      setMinLength(next);
                      setMaxLength((c) => Math.max(c, next));
                    }}
                    className={formFieldClass}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="max-length">Max length (aa)</FieldLabel>
                  <input
                    id="max-length"
                    type="number"
                    min={4}
                    max={30}
                    value={maxLength}
                    onChange={(e) => {
                      const next = clampNumber(Number(e.target.value), 4, 30);
                      setMaxLength(next);
                      setMinLength((c) => Math.min(c, next));
                    }}
                    className={formFieldClass}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="top-n">Return top</FieldLabel>
                  <Select value={`${topN}`} onValueChange={(v) => setTopN(Number(v))}>
                    <SelectTrigger id="top-n" className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[5, 10, 25, 50].map((v) => (
                        <SelectItem key={v} value={`${v}`}>Top {v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel htmlFor="diversity-mode">Ranking mode</FieldLabel>
                  <Select value={diversityMode} onValueChange={(v) => setDiversityMode(v as DiversityMode)}>
                    <SelectTrigger id="diversity-mode" className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(diversityLabels).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview of library size */}
              <div className="grid gap-3 rounded-[var(--r-md)] border border-[var(--line-1)] bg-elevated p-4 sm:grid-cols-3">
                {[
                  { label: "Estimated library", value: estimatedLibrary.toLocaleString("en-US") },
                  { label: "Constraints", value: `${prefix || "—"} … ${suffix || "—"}` },
                  { label: "Length window", value: `${minLength}–${maxLength} aa` },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="m-0 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground-faint">{item.label}</p>
                    <p className="mb-0 mt-1 font-sans text-sm font-bold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <NavButtons
            onBack={() => setCurrentStep(2)}
            onNext={handleRun}
            nextLabel="Run AI Screening"
            nextIcon={<Play size={14} aria-hidden="true" />}
          />
        </div>
      )}

      {/* ── Step 4: AI Pipeline ──────────────────────────────────────────────── */}
      {currentStep === 4 && (
        <div>
          <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Step 4 of 5</p>
                <h2 className="mb-0 mt-1 font-sans text-2xl font-bold text-foreground">AI screening pipeline</h2>
                <p className="mb-0 mt-1 font-sans text-sm text-foreground-tertiary">
                  Screening {activeVirus.name} · {bindingRegion === "scan-all" ? "all regions" : bindingRegion}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-[var(--r-full)] border px-2.5 py-1 font-sans text-xs font-semibold",
                  runState === "complete"
                    ? "border-success bg-success/10 text-success"
                    : "border-[var(--accent-line)] bg-[var(--accent-soft)] text-primary",
                )}
              >
                {runState === "running"
                  ? <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  : <CheckCircle2 size={13} aria-hidden="true" />}
                {runState === "running" ? "Running…" : "Complete"}
              </span>
            </div>

            <Progress value={progress} className="mb-6 h-2.5 bg-field" />

            <div className="grid gap-3 sm:grid-cols-5">
              {aiSteps.map((step, index) => {
                const done = index < completedStepCount || runState === "complete";
                const active = runState === "running" && index === completedStepCount;

                return (
                  <div
                    key={step.title}
                    className={cn(
                      "min-h-[130px] rounded-[var(--r-md)] border p-3 transition-[border-color,background] [transition-duration:var(--dur-fast)]",
                      done ? "border-success bg-success/10" : active ? "border-[var(--accent-line)] bg-[var(--accent-soft)]" : "border-[var(--line-2)] bg-elevated",
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-[var(--r-full)] bg-card text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      {done
                        ? <CheckCircle2 size={15} className="text-success" aria-hidden="true" />
                        : active
                          ? <Loader2 size={15} className="animate-spin text-primary" aria-hidden="true" />
                          : <ChevronRight size={15} className="text-foreground-faint" aria-hidden="true" />}
                    </div>
                    <p className="m-0 font-sans text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="mb-0 mt-2 font-sans text-xs leading-5 text-foreground-tertiary">{step.detail}</p>
                  </div>
                );
              })}
            </div>

            {runState === "complete" && (
              <div className="mt-5 flex items-center gap-3 rounded-[var(--r-md)] border border-success bg-success/10 p-4">
                <CheckCircle2 size={18} className="shrink-0 text-success" aria-hidden="true" />
                <div className="flex-1">
                  <p className="m-0 font-sans text-sm font-semibold text-foreground">Screening complete</p>
                  <p className="mb-0 mt-0.5 font-sans text-xs text-foreground-tertiary">
                    Top {candidates.length} peptide candidates are ready. Advancing to results…
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={handleReset}
              disabled={runState === "running"}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-card px-5 font-sans text-sm font-semibold text-foreground-secondary shadow-sm transition-[background] [transition-duration:var(--dur-fast)] hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Start over
            </button>
            {runState === "complete" && (
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[var(--r-sm)] bg-[image:var(--grad-brand)] px-5 font-sans text-sm font-semibold text-primary-foreground shadow-sm transition-[filter] [transition-duration:var(--dur-fast)] hover:brightness-105"
              >
                View results →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Step 5: Results ──────────────────────────────────────────────────── */}
      {currentStep === 5 && (
        <div className="flex flex-col gap-5">
          {/* Summary bar */}
          <div className="grid gap-2 sm:grid-cols-4">
            <SummaryChip label="Virus" value={activeVirus.name} />
            <SummaryChip label="Region" value={bindingRegion === "scan-all" ? "All regions" : bindingRegion} />
            <SummaryChip label="Constraints" value={`${prefix || "—"} … ${suffix || "—"} · ${minLength}–${maxLength} aa`} />
            <SummaryChip label="Output" value={`Top ${topN} · ${diversityLabels[diversityMode].split(" ")[0]}`} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            {/* Ranked candidates table */}
            <div className="min-w-0 overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm">
              <div className="flex items-start justify-between gap-3 border-b border-[var(--line-1)] p-5">
                <div>
                  <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Step 5 · Ranked output</p>
                  <h2 className="mb-0 mt-1 font-sans text-xl font-bold text-foreground">Peptides worth testing</h2>
                </div>
                <div className="inline-flex shrink-0 items-center gap-2 rounded-[var(--r-full)] border border-[var(--line-2)] bg-elevated px-3 py-1 font-sans text-xs font-semibold text-foreground-secondary">
                  <BookmarkPlus size={13} aria-hidden="true" />
                  {shortlist.size} shortlisted
                </div>
              </div>

              {candidates.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
                  <Search size={22} className="mb-3 text-foreground-faint" />
                  <p className="m-0 font-sans text-sm text-foreground-secondary">No results yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--line-1)] bg-elevated">
                        {["Rank", "Peptide", "Score", "Binding site", "Action"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-tertiary">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map((candidate) => {
                        const selected = selectedCandidate?.sequence === candidate.sequence;
                        const shortlisted = shortlist.has(candidate.sequence);

                        return (
                          <tr
                            key={`${candidate.rank}-${candidate.sequence}`}
                            className={cn(
                              "border-b border-[var(--line-1)] transition-[background] [transition-duration:var(--dur-fast)] last:border-b-0",
                              selected ? "bg-[var(--accent-soft)]" : "bg-card hover:bg-elevated",
                            )}
                          >
                            <td className="px-4 py-3 align-top font-sans text-sm font-bold text-foreground">#{candidate.rank}</td>
                            <td className="px-4 py-3 align-top">
                              <button
                                type="button"
                                onClick={() => setSelectedSequence(candidate.sequence)}
                                className="block max-w-[200px] cursor-pointer border-0 bg-transparent p-0 text-left font-mono text-sm font-semibold text-foreground transition-[color] [transition-duration:var(--dur-fast)] hover:text-primary"
                              >
                                <span className="break-all">{candidate.sequence}</span>
                              </button>
                              <p className="m-0 mt-1 font-sans text-[11px] text-foreground-tertiary">
                                {candidate.properties.length} aa · charge {candidate.properties.charge}
                              </p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <span className={cn("inline-flex min-w-[52px] justify-center rounded-[var(--r-full)] border px-2.5 py-1 font-sans text-xs font-bold", scoreTone(candidate.score))}>
                                {candidate.score}
                              </span>
                              <p className="m-0 mt-1 font-sans text-[11px] text-foreground-tertiary">{candidate.confidence}% conf.</p>
                            </td>
                            <td className="min-w-[200px] px-4 py-3 align-top">
                              <p className="m-0 font-sans text-sm font-semibold text-foreground">{candidate.bindingRegion}</p>
                              <p className="m-0 mt-1 font-sans text-xs text-foreground-tertiary">{candidate.contactSite}</p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <button
                                type="button"
                                onClick={() => toggleShortlist(candidate.sequence)}
                                className={cn(
                                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--r-sm)] border px-3 font-sans text-xs font-semibold transition-[background,border-color,color] [transition-duration:var(--dur-fast)]",
                                  shortlisted
                                    ? "border-success bg-success/10 text-success"
                                    : "border-[var(--line-2)] bg-transparent text-foreground-secondary hover:border-[var(--accent-line)] hover:bg-[var(--accent-soft)] hover:text-primary",
                                )}
                              >
                                <BookmarkPlus size={13} aria-hidden="true" />
                                {shortlisted ? "Saved" : "Save"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Candidate detail */}
            <aside className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-5 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Candidate detail</p>
                  <h2 className="mb-0 mt-1 font-sans text-xl font-bold text-foreground">Binding readout</h2>
                </div>
                <Microscope size={20} className="text-primary" aria-hidden="true" />
              </div>

              {selectedCandidate ? (
                <div className="flex flex-col gap-4">
                  <div className="rounded-[var(--r-md)] border border-[var(--accent-line)] bg-[var(--accent-soft)] p-4">
                    <p className="m-0 font-mono text-lg font-bold text-foreground break-all">{selectedCandidate.sequence}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={cn("rounded-[var(--r-full)] border px-2.5 py-1 font-sans text-xs font-bold", scoreTone(selectedCandidate.score))}>
                        Score {selectedCandidate.score}
                      </span>
                      <span className="rounded-[var(--r-full)] border border-[var(--line-2)] bg-card px-2.5 py-1 font-sans text-xs font-semibold text-foreground-secondary">
                        {selectedCandidate.confidence}% confidence
                      </span>
                    </div>
                  </div>

                  {[
                    { icon: Target, label: "Where it binds", content: <><p className="m-0 font-sans text-sm font-semibold text-foreground">{selectedCandidate.bindingRegion}</p><p className="mb-0 mt-1 font-sans text-xs leading-5 text-foreground-tertiary">{selectedCandidate.contactSite} on {selectedCandidate.targetProtein}</p></> },
                    { icon: FlaskConical, label: "Lab note", content: <p className="m-0 font-sans text-sm leading-6 text-foreground-secondary">{selectedCandidate.labNote}</p> },
                    { icon: Layers3, label: "AI rationale", content: <p className="m-0 font-sans text-sm leading-6 text-foreground-secondary">{selectedCandidate.rationale}</p> },
                  ].map(({ icon: Icon, label, content }) => (
                    <div key={label} className="rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated p-4">
                      <div className="mb-2 flex items-center gap-2 text-primary">
                        <Icon size={15} aria-hidden="true" />
                        <p className="m-0 font-sans text-xs font-bold uppercase tracking-[0.12em]">{label}</p>
                      </div>
                      {content}
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedCandidate.properties).map(([label, value]) => (
                      <div key={label} className="rounded-[var(--r-sm)] border border-[var(--line-2)] bg-elevated px-3 py-2">
                        <p className="m-0 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground-faint">{label}</p>
                        <p className="mb-0 mt-1 font-sans text-sm font-semibold text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated p-4">
                    <div className="mb-2 flex items-center gap-2 text-primary">
                      <Database size={15} aria-hidden="true" />
                      <p className="m-0 font-sans text-xs font-bold uppercase tracking-[0.12em]">Source</p>
                    </div>
                    <p className="m-0 font-sans text-sm text-foreground-secondary">{selectedCandidate.sourceId}</p>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[var(--r-md)] border border-dashed border-[var(--line-2)] bg-elevated p-6 text-center">
                  <Target size={28} strokeWidth={1.7} className="mb-3 text-foreground-faint" aria-hidden="true" />
                  <p className="m-0 font-sans text-sm font-semibold text-foreground">No candidate selected</p>
                  <p className="mb-0 mt-1 font-sans text-xs leading-5 text-foreground-tertiary">Click a peptide in the table to inspect its binding location.</p>
                </div>
              )}
            </aside>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-card px-5 font-sans text-sm font-semibold text-foreground-secondary shadow-sm transition-[background] [transition-duration:var(--dur-fast)] hover:bg-elevated"
            >
              <RotateCcw size={14} aria-hidden="true" />
              New screening run
            </button>

            <div className="inline-flex items-center gap-2 rounded-[var(--r-full)] border border-[var(--line-2)] bg-elevated px-4 py-2 font-sans text-sm font-semibold text-foreground-secondary">
              <BookmarkPlus size={15} className={shortlist.size > 0 ? "text-success" : "text-foreground-faint"} aria-hidden="true" />
              {shortlist.size} / {candidates.length} shortlisted
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiagnosticsScreeningPage;
