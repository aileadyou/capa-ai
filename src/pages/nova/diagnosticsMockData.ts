export type RunStatus = "draft" | "running" | "completed" | "shortlisted";

export type ScreeningRun = {
  id: string;
  virusName: string;
  virusFamily: string;
  structureId: string;
  source: string;
  targetProtein: string;
  bindingRegion: string;
  prefix: string;
  suffix: string;
  minLength: number;
  maxLength: number;
  topN: number;
  diversityMode: string;
  status: RunStatus;
  candidateCount: number;
  topScore: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CandidateEntry = {
  id: string;
  runId: string;
  sequence: string;
  rank: number;
  score: number;
  confidence: number;
  virus: string;
  bindingRegion: string;
  contactSite: string;
  labReadiness: "ready" | "review" | "hold";
  shortlisted: boolean;
};

export type TargetStructure = {
  id: string;
  pdbId: string;
  virusName: string;
  virusFamily: string;
  source: string;
  targetProtein: string;
  bindingRegions: string[];
  aiSuggestionAvailable: boolean;
  addedAt: string;
};

export const mockRuns: ScreeningRun[] = [
  {
    id: "RUN-001",
    virusName: "Norovirus GII.4",
    virusFamily: "Caliciviridae",
    structureId: "4OP7",
    source: "RCSB PDB",
    targetProtein: "VP1 capsid P domain",
    bindingRegion: "HBGA pocket",
    prefix: "GGG",
    suffix: "CY",
    minLength: 9,
    maxLength: 16,
    topN: 10,
    diversityMode: "balanced",
    status: "shortlisted",
    candidateCount: 10,
    topScore: 96,
    createdAt: "2026-06-10T08:00:00Z",
    updatedAt: "2026-06-10T08:22:00Z",
  },
  {
    id: "RUN-002",
    virusName: "SARS-CoV-2",
    virusFamily: "Coronaviridae",
    structureId: "6M0J",
    source: "RCSB PDB",
    targetProtein: "Spike receptor-binding domain",
    bindingRegion: "ACE2 interface",
    prefix: "GGGG",
    suffix: "Y",
    minLength: 10,
    maxLength: 18,
    topN: 25,
    diversityMode: "diverse",
    status: "completed",
    candidateCount: 25,
    topScore: 93,
    createdAt: "2026-06-12T10:00:00Z",
    updatedAt: "2026-06-12T10:45:00Z",
  },
  {
    id: "RUN-003",
    virusName: "Influenza A H1N1",
    virusFamily: "Orthomyxoviridae",
    structureId: "4WE8",
    source: "RCSB PDB",
    targetProtein: "Hemagglutinin HA1 head",
    bindingRegion: "Receptor-binding pocket",
    prefix: "GG",
    suffix: "W",
    minLength: 8,
    maxLength: 14,
    topN: 10,
    diversityMode: "score",
    status: "running",
    candidateCount: 0,
    topScore: null,
    createdAt: "2026-06-15T14:30:00Z",
    updatedAt: "2026-06-15T14:31:00Z",
  },
  {
    id: "RUN-004",
    virusName: "Dengue virus type 2",
    virusFamily: "Flaviviridae",
    structureId: "1OAN",
    source: "RCSB PDB",
    targetProtein: "Envelope protein domain III",
    bindingRegion: "EDIII lateral ridge",
    prefix: "GGGG",
    suffix: "CY",
    minLength: 10,
    maxLength: 20,
    topN: 50,
    diversityMode: "balanced",
    status: "draft",
    candidateCount: 0,
    topScore: null,
    createdAt: "2026-06-16T09:00:00Z",
    updatedAt: "2026-06-16T09:00:00Z",
  },
];

export const mockCandidates: CandidateEntry[] = [
  {
    id: "CAND-001",
    runId: "RUN-001",
    sequence: "GGGWQNSDCY",
    rank: 1,
    score: 96,
    confidence: 91,
    virus: "Norovirus GII.4",
    bindingRegion: "HBGA pocket",
    contactSite: "Chain A residues 290–301",
    labReadiness: "ready",
    shortlisted: true,
  },
  {
    id: "CAND-002",
    runId: "RUN-001",
    sequence: "GGGYVSLNCY",
    rank: 2,
    score: 94,
    confidence: 88,
    virus: "Norovirus GII.4",
    bindingRegion: "GII.4 P2 domain",
    contactSite: "Chain A residues 297–308",
    labReadiness: "ready",
    shortlisted: true,
  },
  {
    id: "CAND-003",
    runId: "RUN-001",
    sequence: "GGGKPFADCY",
    rank: 3,
    score: 91,
    confidence: 85,
    virus: "Norovirus GII.4",
    bindingRegion: "HBGA pocket",
    contactSite: "Chain A residues 304–315",
    labReadiness: "review",
    shortlisted: false,
  },
  {
    id: "CAND-004",
    runId: "RUN-001",
    sequence: "GGGRGDLSCY",
    rank: 4,
    score: 88,
    confidence: 82,
    virus: "Norovirus GII.4",
    bindingRegion: "P-domain dimer interface",
    contactSite: "Chain A residues 311–322",
    labReadiness: "review",
    shortlisted: false,
  },
  {
    id: "CAND-005",
    runId: "RUN-002",
    sequence: "GGGGVTNQPY",
    rank: 1,
    score: 93,
    confidence: 89,
    virus: "SARS-CoV-2",
    bindingRegion: "ACE2 interface",
    contactSite: "Chain A residues 318–329",
    labReadiness: "ready",
    shortlisted: true,
  },
  {
    id: "CAND-006",
    runId: "RUN-002",
    sequence: "GGGGLQDPWY",
    rank: 2,
    score: 90,
    confidence: 86,
    virus: "SARS-CoV-2",
    bindingRegion: "RBD receptor ridge",
    contactSite: "Chain A residues 325–336",
    labReadiness: "ready",
    shortlisted: true,
  },
  {
    id: "CAND-007",
    runId: "RUN-002",
    sequence: "GGGGHNRTVY",
    rank: 3,
    score: 87,
    confidence: 83,
    virus: "SARS-CoV-2",
    bindingRegion: "N-terminal loop",
    contactSite: "Chain A residues 332–343",
    labReadiness: "review",
    shortlisted: false,
  },
  {
    id: "CAND-008",
    runId: "RUN-002",
    sequence: "GGGGSFWLKY",
    rank: 4,
    score: 84,
    confidence: 79,
    virus: "SARS-CoV-2",
    bindingRegion: "ACE2 interface",
    contactSite: "Chain A residues 339–350",
    labReadiness: "review",
    shortlisted: false,
  },
  {
    id: "CAND-009",
    runId: "RUN-002",
    sequence: "GGGGDPTAVY",
    rank: 5,
    score: 81,
    confidence: 76,
    virus: "SARS-CoV-2",
    bindingRegion: "RBD receptor ridge",
    contactSite: "Chain A residues 346–357",
    labReadiness: "hold",
    shortlisted: false,
  },
];

export const mockTargets: TargetStructure[] = [
  {
    id: "TGT-001",
    pdbId: "4OP7",
    virusName: "Norovirus GII.4",
    virusFamily: "Caliciviridae",
    source: "RCSB PDB",
    targetProtein: "VP1 capsid P domain",
    bindingRegions: ["GII.4 P2 domain", "HBGA pocket", "P-domain dimer interface"],
    aiSuggestionAvailable: true,
    addedAt: "2026-05-20T00:00:00Z",
  },
  {
    id: "TGT-002",
    pdbId: "6M0J",
    virusName: "SARS-CoV-2",
    virusFamily: "Coronaviridae",
    source: "RCSB PDB",
    targetProtein: "Spike receptor-binding domain",
    bindingRegions: ["RBD receptor ridge", "ACE2 interface", "N-terminal loop"],
    aiSuggestionAvailable: true,
    addedAt: "2026-05-22T00:00:00Z",
  },
  {
    id: "TGT-003",
    pdbId: "4WE8",
    virusName: "Influenza A H1N1",
    virusFamily: "Orthomyxoviridae",
    source: "RCSB PDB",
    targetProtein: "Hemagglutinin HA1 head",
    bindingRegions: ["Receptor-binding pocket", "Antigenic site Sa", "Antigenic site Sb"],
    aiSuggestionAvailable: false,
    addedAt: "2026-06-01T00:00:00Z",
  },
  {
    id: "TGT-004",
    pdbId: "1OAN",
    virusName: "Dengue virus type 2",
    virusFamily: "Flaviviridae",
    source: "RCSB PDB",
    targetProtein: "Envelope protein domain III",
    bindingRegions: ["EDIII lateral ridge", "Fusion loop neighborhood", "Dimer interface"],
    aiSuggestionAvailable: true,
    addedAt: "2026-06-05T00:00:00Z",
  },
];
