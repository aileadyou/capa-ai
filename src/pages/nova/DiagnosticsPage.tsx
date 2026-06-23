import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
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
  properties: {
    length: number;
    charge: string;
    hydrophobicity: string;
    synthesis: string;
  };
  rationale: string;
  labNote: string;
};

const virusOptions: VirusOption[] = [
  {
    id: "norovirus-gii4",
    name: "Norovirus GII.4",
    family: "Caliciviridae",
    defaultSource: "rcsb",
    defaultStructure: "4OP7",
    targetProtein: "VP1 capsid P domain",
    regions: ["GII.4 P2 domain", "HBGA pocket", "P-domain dimer interface"],
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
  "WQNSD",
  "YVSLN",
  "KPFAD",
  "RGDLS",
  "VTNQP",
  "LQDPW",
  "HNRTV",
  "SFWLK",
  "DPTAV",
  "QYHGN",
  "TRLSW",
  "NPKTY",
  "GAFNV",
  "WEKDS",
  "TYRPL",
  "KVSQD",
  "SPNWH",
  "LHTGQ",
  "FYDRA",
  "QNNLS",
  "WSPKT",
  "DLYVN",
  "RQHST",
  "PWTGN",
  "NFSRL",
  "KLDWY",
  "YQTPS",
  "VHGDN",
  "SQWRT",
  "TNPYL",
];

const formFieldClass =
  "box-border h-10 w-full rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-3 font-sans text-sm text-foreground outline-none transition-[border-color,box-shadow,background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] placeholder:text-foreground-faint focus:border-primary focus:bg-[var(--field-bg-hover)] focus:shadow-[0_0_0_3px_var(--accent-soft)]";

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
  if (nextCore.length > availableCoreLength) {
    nextCore = nextCore.slice(0, availableCoreLength);
  }

  return `${prefix}${nextCore}${suffix}`;
}

function buildCandidates({
  virus,
  sourceId,
  structureId,
  targetProtein,
  bindingRegion,
  prefix,
  suffix,
  minLength,
  maxLength,
  topN,
  diversityMode,
}: {
  virus: VirusOption;
  sourceId: SourceId;
  structureId: string;
  targetProtein: string;
  bindingRegion: string;
  prefix: string;
  suffix: string;
  minLength: number;
  maxLength: number;
  topN: number;
  diversityMode: DiversityMode;
}): Candidate[] {
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
      contactSite: `Chain A residues ${residueStart}-${residueStart + 11}`,
      targetProtein,
      sourceId: `${sourceLabels[sourceId]}:${structureId || virus.defaultStructure}`,
      properties: {
        length: sequence.length,
        charge: chargeValue > 0 ? `+${chargeValue}` : `${chargeValue}`,
        hydrophobicity: hydroRatio > 0.42 ? "Medium-high" : hydroRatio > 0.28 ? "Balanced" : "Low",
        synthesis: sequence.length <= 16 ? "Easy" : "Moderate",
      },
      rationale:
        index < 3
          ? "Strong geometric fit near the selected surface pocket with favorable sequence constraints for lab trial."
          : "Useful candidate for maintaining shortlist diversity while preserving acceptable predicted contact quality.",
      labNote:
        index < 5
          ? "Prioritize for first-pass binding assay and compare against negative peptide control."
          : "Keep as backup candidate if the first shortlist needs broader sequence diversity.",
    };
  });
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block font-sans text-xs font-semibold text-foreground-secondary">
      {children}
    </label>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          {label}
        </p>
        <Icon size={18} strokeWidth={1.85} className="text-primary" aria-hidden="true" />
      </div>
      <p className="m-0 truncate font-sans text-xl font-bold text-foreground">{value}</p>
      <p className="mb-0 mt-1 font-sans text-xs text-foreground-tertiary">{caption}</p>
    </div>
  );
}

export function DiagnosticsPage() {
  const [virusId, setVirusId] = useState(virusOptions[0].id);
  const activeVirus = virusOptions.find((virus) => virus.id === virusId) ?? virusOptions[0];
  const [sourceId, setSourceId] = useState<SourceId>(activeVirus.defaultSource);
  const [structureId, setStructureId] = useState(activeVirus.defaultStructure);
  const [targetProtein, setTargetProtein] = useState(activeVirus.targetProtein);
  const [bindingRegion, setBindingRegion] = useState(activeVirus.regions[0]);
  const [prefix, setPrefix] = useState("GGGG");
  const [suffix, setSuffix] = useState("Y");
  const [minLength, setMinLength] = useState(9);
  const [maxLength, setMaxLength] = useState(16);
  const [topN, setTopN] = useState(10);
  const [diversityMode, setDiversityMode] = useState<DiversityMode>("balanced");
  const [runState, setRunState] = useState<RunState>("idle");
  const [progress, setProgress] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<string | undefined>();
  const [shortlist, setShortlist] = useState<Set<string>>(() => new Set());

  const selectedCandidate = candidates.find((candidate) => candidate.sequence === selectedSequence) ?? candidates[0];
  const estimatedLibrary = useMemo(() => {
    const lengthSpan = Math.max(1, maxLength - minLength + 1);
    return lengthSpan * 920 + prefix.length * 180 + suffix.length * 140;
  }, [maxLength, minLength, prefix.length, suffix.length]);

  const aiSteps = useMemo(
    () => [
      {
        title: "Target acquisition",
        detail: `Import ${structureId || activeVirus.defaultStructure} from ${sourceLabels[sourceId]}.`,
      },
      {
        title: "Binding region mapping",
        detail:
          bindingRegion === "scan-all"
            ? `Scan all annotated regions on ${targetProtein}.`
            : `Focus model attention on ${bindingRegion}.`,
      },
      {
        title: "Peptide library generation",
        detail: `Apply ${prefix || "no"} prefix, ${suffix || "no"} suffix, and ${minLength}-${maxLength} aa length window.`,
      },
      {
        title: "AI compatibility scoring",
        detail: "Rank sequence-target pairs by predicted contact quality and feasibility.",
      },
      {
        title: "Shortlist packaging",
        detail: `Return top ${topN} candidates using ${diversityLabels[diversityMode].toLowerCase()}.`,
      },
    ],
    [
      activeVirus.defaultStructure,
      bindingRegion,
      diversityMode,
      maxLength,
      minLength,
      prefix,
      sourceId,
      structureId,
      suffix,
      targetProtein,
      topN,
    ],
  );

  useEffect(() => {
    if (runState !== "running") return undefined;

    const interval = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(current + 13, 100);
        if (next >= 100) {
          window.clearInterval(interval);
          setRunState("complete");
          toast.success("AI screening complete", {
            description: `Top ${candidates.length} peptide candidates are ready for review.`,
          });
        }
        return next;
      });
    }, 420);

    return () => window.clearInterval(interval);
  }, [candidates.length, runState]);

  const handleVirusChange = (nextVirusId: string) => {
    const nextVirus = virusOptions.find((virus) => virus.id === nextVirusId) ?? virusOptions[0];
    setVirusId(nextVirus.id);
    setSourceId(nextVirus.defaultSource);
    setStructureId(nextVirus.defaultStructure);
    setTargetProtein(nextVirus.targetProtein);
    setBindingRegion(nextVirus.regions[0]);
    setRunState("idle");
    setProgress(0);
    setCandidates([]);
    setSelectedSequence(undefined);
  };

  const handleRun = () => {
    const nextCandidates = buildCandidates({
      virus: activeVirus,
      sourceId,
      structureId,
      targetProtein,
      bindingRegion,
      prefix: prefix.trim().toUpperCase(),
      suffix: suffix.trim().toUpperCase(),
      minLength,
      maxLength,
      topN,
      diversityMode,
    });

    setCandidates(nextCandidates);
    setSelectedSequence(nextCandidates[0]?.sequence);
    setProgress(7);
    setRunState("running");
    toast("AI screening started", {
      description: `${activeVirus.name} peptide shortlist is being prepared.`,
    });
  };

  const toggleShortlist = (sequence: string) => {
    setShortlist((current) => {
      const next = new Set(current);
      if (next.has(sequence)) {
        next.delete(sequence);
      } else {
        next.add(sequence);
      }
      return next;
    });
  };

  const completedStepCount =
    runState === "complete" ? aiSteps.length : runState === "running" ? Math.floor(progress / 20) : 0;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-[var(--r-full)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-1 font-sans text-xs font-semibold text-primary">
            <Stethoscope size={14} strokeWidth={1.9} aria-hidden="true" />
            Lead AI RnD Lab
          </div>
          <h1 className="m-0 font-sans text-3xl font-bold text-foreground">
            Diagnostics AI screening
          </h1>
          <p className="mb-0 mt-2 max-w-3xl font-sans text-base leading-7 text-foreground-secondary">
            Configure a viral target, constrain the peptide design space, and let the AI prepare a lab-ready shortlist for review.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRun}
          disabled={runState === "running"}
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[var(--r-sm)] bg-[image:var(--grad-brand)] px-4 font-sans text-sm font-semibold text-primary-foreground shadow-sm transition-[filter] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {runState === "running" ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <Play size={15} aria-hidden="true" />
          )}
          Run AI screening
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Target}
          label="Target"
          value={activeVirus.name}
          caption={`${activeVirus.family} · ${targetProtein}`}
        />
        <MetricCard
          icon={Database}
          label="Structure"
          value={structureId || activeVirus.defaultStructure}
          caption={sourceLabels[sourceId]}
        />
        <MetricCard
          icon={Dna}
          label="Library"
          value={estimatedLibrary.toLocaleString("en-US")}
          caption={`${minLength}-${maxLength} aa with peptide constraints`}
        />
        <MetricCard
          icon={Gauge}
          label="Output"
          value={`Top ${topN}`}
          caption={diversityLabels[diversityMode]}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-5">
          <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Setup
                </p>
                <h2 className="mb-0 mt-1 font-sans text-xl font-bold text-foreground">Screening request</h2>
              </div>
              <Sparkles size={20} className="text-primary" aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <FieldLabel htmlFor="virus-select">Virus target</FieldLabel>
                <Select value={virusId} onValueChange={handleVirusChange}>
                  <SelectTrigger id="virus-select" className="h-10">
                    <SelectValue placeholder="Select virus" />
                  </SelectTrigger>
                  <SelectContent>
                    {virusOptions.map((virus) => (
                      <SelectItem key={virus.id} value={virus.id}>
                        {virus.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mb-0 mt-2 font-sans text-xs leading-5 text-foreground-tertiary">
                  {activeVirus.note}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="source-select">Structure source</FieldLabel>
                  <Select value={sourceId} onValueChange={(value) => setSourceId(value as SourceId)}>
                    <SelectTrigger id="source-select" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(sourceLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel htmlFor="structure-id">PDB / structure ID</FieldLabel>
                  <input
                    id="structure-id"
                    value={structureId}
                    onChange={(event) => setStructureId(event.target.value.toUpperCase())}
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
                  onChange={(event) => setTargetProtein(event.target.value)}
                  className={formFieldClass}
                  placeholder="VP1 capsid P domain"
                />
              </div>

              <div>
                <FieldLabel htmlFor="binding-region">Binding region</FieldLabel>
                <Select value={bindingRegion} onValueChange={setBindingRegion}>
                  <SelectTrigger id="binding-region" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scan-all">Scan all annotated regions</SelectItem>
                    {activeVirus.regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Peptide constraints
                </p>
                <h2 className="mb-0 mt-1 font-sans text-xl font-bold text-foreground">Design preference</h2>
              </div>
              <Beaker size={20} className="text-primary" aria-hidden="true" />
            </div>

            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="prefix">Starts with</FieldLabel>
                  <input
                    id="prefix"
                    value={prefix}
                    onChange={(event) => setPrefix(event.target.value.toUpperCase())}
                    className={formFieldClass}
                    placeholder="GGGG"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="suffix">Ends with</FieldLabel>
                  <input
                    id="suffix"
                    value={suffix}
                    onChange={(event) => setSuffix(event.target.value.toUpperCase())}
                    className={formFieldClass}
                    placeholder="Y"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="min-length">Min length</FieldLabel>
                  <input
                    id="min-length"
                    type="number"
                    min={4}
                    max={30}
                    value={minLength}
                    onChange={(event) => {
                      const next = clampNumber(Number(event.target.value), 4, 30);
                      setMinLength(next);
                      setMaxLength((current) => Math.max(current, next));
                    }}
                    className={formFieldClass}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="max-length">Max length</FieldLabel>
                  <input
                    id="max-length"
                    type="number"
                    min={4}
                    max={30}
                    value={maxLength}
                    onChange={(event) => {
                      const next = clampNumber(Number(event.target.value), 4, 30);
                      setMaxLength(next);
                      setMinLength((current) => Math.min(current, next));
                    }}
                    className={formFieldClass}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="top-n">Return top</FieldLabel>
                  <Select value={`${topN}`} onValueChange={(value) => setTopN(Number(value))}>
                    <SelectTrigger id="top-n" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 25, 50].map((value) => (
                        <SelectItem key={value} value={`${value}`}>
                          Top {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel htmlFor="diversity-mode">Ranking mode</FieldLabel>
                  <Select value={diversityMode} onValueChange={(value) => setDiversityMode(value as DiversityMode)}>
                    <SelectTrigger id="diversity-mode" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(diversityLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRun}
                disabled={runState === "running"}
                className="mt-1 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--r-sm)] bg-primary px-4 font-sans text-sm font-semibold text-primary-on transition-[background,opacity] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {runState === "running" ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Bot size={15} aria-hidden="true" />
                )}
                Generate peptide shortlist
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  AI process
                </p>
                <h2 className="mb-0 mt-1 font-sans text-xl font-bold text-foreground">
                  Screening pipeline
                </h2>
              </div>
              <span
                className={cn(
                  "inline-flex w-fit items-center gap-1.5 rounded-[var(--r-full)] border px-2.5 py-1 font-sans text-xs font-semibold",
                  runState === "complete"
                    ? "border-success bg-success/10 text-success"
                    : runState === "running"
                      ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-primary"
                      : "border-[var(--line-2)] bg-elevated text-foreground-tertiary",
                )}
              >
                {runState === "running" ? (
                  <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                ) : runState === "complete" ? (
                  <CheckCircle2 size={13} aria-hidden="true" />
                ) : (
                  <Circle size={13} aria-hidden="true" />
                )}
                {runState === "running" ? "Running" : runState === "complete" ? "Ready" : "Waiting"}
              </span>
            </div>

            <Progress value={progress} className="h-2 bg-field" />

            <div className="mt-5 grid gap-3 lg:grid-cols-5">
              {aiSteps.map((step, index) => {
                const done = index < completedStepCount || runState === "complete";
                const active = runState === "running" && index === completedStepCount;

                return (
                  <div
                    key={step.title}
                    className={cn(
                      "min-h-[136px] rounded-[var(--r-md)] border p-3 transition-[border-color,background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
                      done
                        ? "border-success bg-success/10"
                        : active
                          ? "border-[var(--accent-line)] bg-[var(--accent-soft)]"
                          : "border-[var(--line-2)] bg-elevated",
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-[var(--r-full)] bg-card text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      {done ? (
                        <CheckCircle2 size={16} className="text-success" aria-hidden="true" />
                      ) : active ? (
                        <Loader2 size={16} className="animate-spin text-primary" aria-hidden="true" />
                      ) : (
                        <ChevronRight size={16} className="text-foreground-faint" aria-hidden="true" />
                      )}
                    </div>
                    <p className="m-0 font-sans text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="mb-0 mt-2 font-sans text-xs leading-5 text-foreground-tertiary">{step.detail}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b border-[var(--line-1)] p-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    Ranked output
                  </p>
                  <h2 className="mb-0 mt-1 font-sans text-xl font-bold text-foreground">
                    Peptides worth testing
                  </h2>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-[var(--r-full)] border border-[var(--line-2)] bg-elevated px-3 py-1 font-sans text-xs font-semibold text-foreground-secondary">
                  <BookmarkPlus size={13} aria-hidden="true" />
                  {shortlist.size} shortlisted
                </div>
              </div>

              {candidates.length === 0 ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated text-primary">
                    <Search size={22} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <p className="m-0 font-sans text-base font-semibold text-foreground">No screening run yet</p>
                  <p className="mb-0 mt-2 max-w-md font-sans text-sm leading-6 text-foreground-tertiary">
                    Set target and peptide constraints, then run AI screening to generate a candidate shortlist.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--line-1)] bg-elevated">
                        <th className="px-4 py-3 text-left font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-tertiary">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-tertiary">
                          Peptide
                        </th>
                        <th className="px-4 py-3 text-left font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-tertiary">
                          Score
                        </th>
                        <th className="px-4 py-3 text-left font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-tertiary">
                          Binding site
                        </th>
                        <th className="px-4 py-3 text-left font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-tertiary">
                          Action
                        </th>
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
                              "border-b border-[var(--line-1)] transition-[background] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] last:border-b-0",
                              selected ? "bg-[var(--accent-soft)]" : "bg-card hover:bg-elevated",
                            )}
                          >
                            <td className="px-4 py-3 align-top font-sans text-sm font-bold text-foreground">
                              #{candidate.rank}
                            </td>
                            <td className="px-4 py-3 align-top">
                              <button
                                type="button"
                                onClick={() => setSelectedSequence(candidate.sequence)}
                                className="block max-w-[220px] cursor-pointer border-0 bg-transparent p-0 text-left font-mono text-sm font-semibold text-foreground transition-[color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:text-primary"
                              >
                                <span className="break-all">{candidate.sequence}</span>
                              </button>
                              <p className="m-0 mt-1 font-sans text-[11px] text-foreground-tertiary">
                                {candidate.properties.length} aa · charge {candidate.properties.charge}
                              </p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <span
                                className={cn(
                                  "inline-flex min-w-[54px] justify-center rounded-[var(--r-full)] border px-2.5 py-1 font-sans text-xs font-bold",
                                  scoreTone(candidate.score),
                                )}
                              >
                                {candidate.score}
                              </span>
                              <p className="m-0 mt-1 font-sans text-[11px] text-foreground-tertiary">
                                {candidate.confidence}% conf.
                              </p>
                            </td>
                            <td className="min-w-[220px] px-4 py-3 align-top">
                              <p className="m-0 font-sans text-sm font-semibold text-foreground">
                                {candidate.bindingRegion}
                              </p>
                              <p className="m-0 mt-1 font-sans text-xs text-foreground-tertiary">
                                {candidate.contactSite}
                              </p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <button
                                type="button"
                                onClick={() => toggleShortlist(candidate.sequence)}
                                className={cn(
                                  "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--r-sm)] border px-3 font-sans text-xs font-semibold transition-[background,border-color,color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
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

            <aside className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-5 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    Candidate detail
                  </p>
                  <h2 className="mb-0 mt-1 font-sans text-xl font-bold text-foreground">
                    Binding readout
                  </h2>
                </div>
                <Microscope size={20} className="text-primary" aria-hidden="true" />
              </div>

              {selectedCandidate ? (
                <div className="flex flex-col gap-4">
                  <div className="rounded-[var(--r-md)] border border-[var(--accent-line)] bg-[var(--accent-soft)] p-4">
                    <p className="m-0 font-mono text-lg font-bold text-foreground break-all">
                      {selectedCandidate.sequence}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={cn(
                          "rounded-[var(--r-full)] border px-2.5 py-1 font-sans text-xs font-bold",
                          scoreTone(selectedCandidate.score),
                        )}
                      >
                        Score {selectedCandidate.score}
                      </span>
                      <span className="rounded-[var(--r-full)] border border-[var(--line-2)] bg-card px-2.5 py-1 font-sans text-xs font-semibold text-foreground-secondary">
                        {selectedCandidate.confidence}% confidence
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated p-4">
                      <div className="mb-2 flex items-center gap-2 text-primary">
                        <Target size={15} aria-hidden="true" />
                        <p className="m-0 font-sans text-xs font-bold uppercase tracking-[0.12em]">
                          Where it binds
                        </p>
                      </div>
                      <p className="m-0 font-sans text-sm font-semibold text-foreground">
                        {selectedCandidate.bindingRegion}
                      </p>
                      <p className="mb-0 mt-1 font-sans text-xs leading-5 text-foreground-tertiary">
                        {selectedCandidate.contactSite} on {selectedCandidate.targetProtein}
                      </p>
                    </div>

                    <div className="rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated p-4">
                      <div className="mb-2 flex items-center gap-2 text-primary">
                        <FlaskConical size={15} aria-hidden="true" />
                        <p className="m-0 font-sans text-xs font-bold uppercase tracking-[0.12em]">
                          Lab note
                        </p>
                      </div>
                      <p className="m-0 font-sans text-sm leading-6 text-foreground-secondary">
                        {selectedCandidate.labNote}
                      </p>
                    </div>

                    <div className="rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated p-4">
                      <div className="mb-2 flex items-center gap-2 text-primary">
                        <Layers3 size={15} aria-hidden="true" />
                        <p className="m-0 font-sans text-xs font-bold uppercase tracking-[0.12em]">
                          AI rationale
                        </p>
                      </div>
                      <p className="m-0 font-sans text-sm leading-6 text-foreground-secondary">
                        {selectedCandidate.rationale}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedCandidate.properties).map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-[var(--r-sm)] border border-[var(--line-2)] bg-elevated px-3 py-2"
                      >
                        <p className="m-0 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground-faint">
                          {label}
                        </p>
                        <p className="mb-0 mt-1 font-sans text-sm font-semibold text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[var(--r-md)] border border-[var(--line-2)] bg-elevated p-4">
                    <div className="mb-2 flex items-center gap-2 text-primary">
                      <Database size={15} aria-hidden="true" />
                      <p className="m-0 font-sans text-xs font-bold uppercase tracking-[0.12em]">
                        Source
                      </p>
                    </div>
                    <p className="m-0 font-sans text-sm text-foreground-secondary">
                      {selectedCandidate.sourceId}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[var(--r-md)] border border-dashed border-[var(--line-2)] bg-elevated p-6 text-center">
                  <Target size={28} strokeWidth={1.7} className="mb-3 text-foreground-faint" aria-hidden="true" />
                  <p className="m-0 font-sans text-sm font-semibold text-foreground">No candidate selected</p>
                  <p className="mb-0 mt-1 font-sans text-xs leading-5 text-foreground-tertiary">
                    Run screening and select a peptide to inspect binding location.
                  </p>
                </div>
              )}
            </aside>
          </section>
        </div>
      </section>
    </div>
  );
}

export default DiagnosticsPage;
