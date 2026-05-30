# CAPA AI Management System — Prototype Planning Document
**Version:** 1.1  
**Date:** 30 Mei 2026  
**Engineer:** Muhammad Rayhan Yovi  
**Purpose:** Demo prototype untuk pitching ke PT Bio Farma (Persero)  
**Product Name:** AI Coach Nova  
**Content Language:** English-first UI content, with Indonesian allowed only for internal demo notes or local regulatory context

---

## 1. Prinsip Utama Prototype Ini

Sebelum apapun, ini adalah prinsip yang harus dipegang selama development:

- **Nama produk demo: AI Coach Nova.** Nova diposisikan sebagai AI coach untuk quality investigation, bukan sekadar chatbot.
- **Bahasa konten: English-first.** UI labels, AI suggestions, mock responses, scenario copy, table content, and demo narration should be written primarily in English. Indonesian boleh dipakai hanya untuk catatan internal, konteks lokal, atau istilah regulasi yang memang lebih natural.
- **Demo scenario menggunakan severity Major.** Critical scenario tetap bisa ada sebagai data pendukung, tapi demo utama tidak perlu SME co-approval supaya flow lebih ketat.
- **Semua data adalah mock.** Tidak ada API call nyata. Semua data dari JSON files.
- **Semua AI adalah simulasi.** Ada `setTimeout` 1.5–3 detik, lalu render hardcoded response dari JSON.
- **Semua integrasi adalah simulasi.** Data dari Bizzmine, Q100+, MES — semuanya hardcoded prefill dari JSON.
- **Tujuan satu-satunya: demo berjalan mulus 15–20 menit tanpa ada yang macet.**
- **Tech stack: React + Vite + TypeScript + React Router. Data dari `.json` files. No backend.**

---

## 2. Scope Coverage

### Yang Di-cover Prototype Ini (dari TOR)
| Requirement | Coverage |
|---|---|
| Tiga tipe CAPA: Deviation, Audit, Complaint | ✅ Semua tiga tipe tersedia |
| Dashboard analytics dengan tren | ✅ Full analytics dashboard |
| Findings List | ✅ |
| Corrective Action List | ✅ |
| Preventive Action List | ✅ |
| AI-Generated Suggested CAPA (REQ017) | ✅ Mocked |
| Similarity Analysis (REQ018) | ✅ Mocked |
| Impact Score (REQ020) | ✅ Rule-based di FE |
| Root Cause Analysis module (REQ021) | ✅ Via 8D workflow |
| Topics Grouping (REQ024) | ✅ Mocked clustering |
| Audit Trail Management (REQ008) | ✅ |
| Notification Management (REQ015) | ✅ Mocked |
| Consolidate Action Plan (REQ019) | ✅ |
| User & Role Management — RBAC (REQ012) | ✅ Persona switcher |
| User Feedback on AI suggestions (REQ013, REQ014) | ✅ Accept/Edit/Replace |

### Yang Tidak Di-cover (Out of Scope Demo)
- Real API integration ke Bizzmine, Q100+, MES
- Real ML model / LLM inference
- Real authentication / SSO
- Real e-signature certificate authority
- Mobile responsive (target: 1920×1080)
- Configuration & Data Mapping Management (terlalu teknis untuk demo)
- Backup & restore schema

---

## 3. Personas (Role Switcher)

Lima persona, switchable via dropdown di top bar. Tidak ada auth nyata.

| ID | Display Name | Jabatan | Departemen | Peran di Demo |
|---|---|---|---|---|
| `initiator` | Andi Wijaya | Operator Senior | Fill-Finish | Input temuan, drive workflow 8D |
| `qa_deviation` | Siti Rahmawati | Staf QA Deviasi | QA Deviation | Review, klasifikasi, disposisi |
| `head_of_dept` | Bambang Saputra | Kepala Departemen | Fill-Finish | Approval gate pertama |
| `head_of_qa` | Dewi Anggraini | Kepala Divisi QA | QA Division | Final approval |
| `sme` | Dr. Ahmad Pratomo | Ahli Mikrobiologi | QA/Mikrobilogi | Co-approval pada kasus Critical |

---

## 4. Tiga Tipe CAPA

Masing-masing tipe punya sumber data berbeda tapi masuk ke **pipeline investigasi yang sama** setelah intake. Untuk demo, kita siapkan **1 complete end-to-end case untuk setiap tipe**: Deviation, Audit Finding, dan Complaint.

| Tipe | Sumber Data (Mock) | Perbedaan Intake | Approval Chain |
|---|---|---|---|
| **Deviation** | Bizzmine (prefill JSON) | EM excursion, batch affected, equipment ID | Initiator → Head of Dept → QA Dev → Head of QA |
| **Audit Finding** | Q100+ Audit (prefill JSON) | Auditor, audit scope, finding category (GMP/GDP) | Auditee → Head of Section → QA Compliance |
| **Complaint** | Bizzmine Complaint (prefill JSON) | Customer, product, lot number, complaint type | QA Complaint → QA Head of Dept → QA Head of Division |

Semua tiga tipe setelah intake masuk ke flow: **Investigation → RCA → CA → PA → Verification → Sign-Off**.

**Demo commitment:** ketiga tipe ini tidak hanya muncul di list. Ketiganya harus bisa didemokan end-to-end, minimal sampai sign-off mocked:
1. Deviation case — primary walkthrough.
2. Audit Finding case — second walkthrough.
3. Complaint case — third walkthrough.

---

## 5. Screen Inventory Lengkap

### 5.1 Navigation Structure

**Content language rule:** route names and developer-facing filenames can stay technical, but all user-facing screen copy must be English-first.

```
/                         → Redirect ke /dashboard
/dashboard                → Main analytics dashboard
/findings                 → Findings list (semua tipe)
/findings/:id             → Finding detail (read-only, shows linked CAPA)
/capa                     → CAPA list (semua status)
/capa/new                 → New CAPA intake (pilih tipe)
/capa/:id                 → CAPA detail + workflow (main working screen)
/capa/:id/8d/:step        → 8D step screens (nested dalam detail)
/actions/corrective       → Corrective Action list (REQ010)
/actions/preventive       → Preventive Action list (REQ011)
/actions/consolidated     → Consolidated Action Plan (REQ019)
/similarity               → Similarity Analysis explorer (REQ018)
/topics                   → Topics Grouping / clustering view (REQ024)
/audit-trail              → Audit Trail global log (REQ008)
/notifications            → Notification center (REQ015)
/settings/personas        → (Demo only) Persona management
```

### 5.2 Detail Per Screen

#### `/dashboard` — Analytics Dashboard
**Persona:** Semua (view disesuaikan role)  
**Purpose:** Ringkasan kualitas CAPA perusahaan, tren, dan alert

Konten:
- Summary cards: Total Findings (MTD), Open CAPAs, Overdue, CAPA Effectiveness Rate
- Chart: Tren total temuan 12 bulan (line chart)
- Chart: Breakdown by tipe (Deviation / Audit / Complaint) — donut/stacked bar
- Chart: Top 5 Root Cause categories (bar chart horizontal)
- Chart: CAPA Completion rate per departemen (heatmap-style)
- Chart: Tren keberulangan temuan (recurrence trend) — line chart
- Table: Findings terbaru (5 rows, link ke detail)
- Alert cards: CAPA overdue atau mendekati deadline

---

#### `/findings` — Findings List
**Persona:** Semua  
**Purpose:** REQ009 — List semua temuan dari semua sumber

Konten:
- Filter: Tipe (Deviation/Audit/Complaint), Severity, Status, Departemen, Tanggal
- Search bar
- Table columns: ID, Tipe, Deskripsi singkat, Severity, Departemen, Tanggal, Status CAPA, Action
- Status badges: Pending CAPA, In Progress, CAPA Closed, Overdue
- Per row: tombol "Lihat CAPA" atau "Buat CAPA"

---

#### `/findings/:id` — Finding Detail
**Persona:** Semua  
**Purpose:** Detail temuan + context data dari sistem sumber

Konten:
- Header: Source system badge (Bizzmine / Q100+ / eQMS), Finding ID, Severity
- PreFill data panel (read-only, "Data dari [sistem sumber]" badge)
- Linked CAPA card (jika sudah ada)
- Timeline sederhana (created → assigned → CAPA started → closed)

---

#### `/capa` — CAPA List
**Persona:** Semua  
**Purpose:** Overview semua CAPA dengan status

Konten:
- Filter: Tipe, Status, Departemen, Severity, Tanggal
- Search
- Kanban view (optional toggle) ATAU table view
- Table columns: CAPA ID, Finding ID, Tipe, Judul, Quality Score, Status, PIC, Due Date, Action
- Status: Draft, Disposisi, Investigation, Approval, Closed
- Score badge dengan warna: <60 merah, 60-79 kuning, ≥80 hijau "Siap Audit"

---

#### `/capa/new` — New CAPA Intake
**Persona:** Initiator (Deviation), QA Audit/Compliance (Audit Finding), QA Complaint (Complaint)  
**Purpose:** Entry point untuk membuat CAPA baru

Konten:
- Step 1: Pilih tipe CAPA (tiga card besar: Deviation, Audit Finding, Complaint)
- Step 2: "Ambil data dari sistem" (mocked fetch dengan loading 2 detik → prefill)
- Prefill context panel dengan badge "Ditransfer dari [Bizzmine/Q100+]"
- Form title (editable, auto-suggest dari Nova)
- Initial severity classification (rule-based, Nova memberi rationale)
- Gate questions (6 pertanyaan, sesuai PRD)
- Quality score sidebar (live update saat user isi form)
- Tombol "Submit ke QA" (dengan blocker jika score terlalu rendah)

---

#### `/capa/:id` — CAPA Detail + Workflow Hub
**Persona:** Sesuai role  
**Purpose:** Main working screen. Semua step 8D accessible dari sini.

Konten:
- Header: CAPA ID, Judul, Severity badge, Status, Quality Score pill
- Tab navigation: Overview | 8D Workflow | Audit Trail | Actions
- **Tab Overview:**
  - PreFill context panel
  - Disposisi (jika sudah ada) — dari QA
  - Nova AI Summary (mocked analysis)
  - KG Citations panel (3 historical similar cases)
  - Timeline status
- **Tab 8D Workflow:**
  - `<EightDStepper />` horizontal, 7 steps
  - Step content sesuai step aktif
  - Score sidebar sticky di kanan
  - Blocker banner jika step belum bisa diadvance
- **Tab Audit Trail:**
  - Chronological event log untuk CAPA ini
  - Filter by event type
- **Tab Actions:**
  - Corrective Action list untuk CAPA ini
  - Preventive Action list untuk CAPA ini
  - Add CA / PA buttons

---

#### `/capa/:id/8d/problem` — D1 Problem Statement
**Persona:** Initiator  
- Multi-line text editor
- Nova inline tips ("+3 jika tambahkan tanggal/shift", "+3 jika sebut equipment ID")
- Blocker: <50 chars ATAU tidak ada tanggal/equipment/measurement
- Score update: problemSpecificity

---

#### `/capa/:id/8d/containment` — D2 Containment Action
**Persona:** Initiator  
- Action description, PIC (dropdown persona), due date picker
- Nova suggestion card dengan preset containment actions (mocked)
- Blocker: action <30 chars, PIC kosong, due date di masa lalu
- Score update: containment

---

#### `/capa/:id/8d/rca` — D3 Root Cause Analysis
**Persona:** Initiator  
- Method picker modal: 5-Whys / Fishbone / Decision Tree
- **5-Whys:** Interactive tree 5 level, Nova suggest tiap level (Accept/Edit/Replace), KG citation per node
- **Fishbone:** 6 kategori (Man/Machine/Material/Method/Measurement/Environment), Nova suggest per kategori
- **Decision Tree:** Node-edge editor sederhana, branching
- Confirmed root causes selector di akhir
- Blocker: <4 levels (5-Whys), <3 kategori (Fishbone), tidak ada confirmed root cause
- Score update: rootCauseDepth

---

#### `/capa/:id/8d/ca` — D4 Corrective Action
**Persona:** Initiator  
- List multiple CA. Per CA: description, PIC, due date, linked root cause, verification method
- Nova suggest multiple CA options (mocked, pre-scripted)
- Accept/Edit/Replace per suggestion
- Blocker: minimal 1 CA harus linked ke root cause, description <30 chars blocked
- Score update: effectiveness

---

#### `/capa/:id/8d/pa` — D5 Preventive Action
**Persona:** Initiator  
- List multiple PA. Per PA: description, target date, PIC
- Nova suggest forward-looking PA options
- Blocker: minimal 1 PA, target date harus future
- Score update: effectiveness

---

#### `/capa/:id/8d/verification` — D6 Verification
**Persona:** Initiator  
- Verification method dropdown (re-sampling / process review / batch trend / EM re-test)
- Result text area
- Evidence upload (mocked — toast "File uploaded")
- Nova: "Coach me on verification methodology" → opens chat panel
- Blocker: method + result + evidence semua harus terisi
- Score update: effectiveness + containment

---

#### `/capa/:id/8d/signoff` — D7 Sign-Off
**Persona:** Multi-role  
- Score gate: ≥80 → "Siap Audit" badge hijau, <80 → blocker merah
- E-sign cascade sesuai severity:
  - Major: Head of Dept → QA Dev review → Head of QA
  - Critical: + SME co-approval
- Per approver: E-Signature modal (nama persona + timestamp, mocked)
- Email notification toast (mocked, "Notifikasi dikirim ke [nama approver]")
- Approval decision: Setujui / Tolak dengan notes

---

#### `/actions/corrective` — Corrective Action List
**Persona:** QA, Management  
**Purpose:** REQ010 — List semua CA dari semua CAPA

Konten:
- Filter: Status, PIC, Departemen, Due Date
- Table: CA ID, Deskripsi, CAPA ID, PIC, Due Date, Status, Effectiveness
- Status: Open, In Progress, Completed, Overdue, Verified
- Action: Update status, Mark completed

---

#### `/actions/preventive` — Preventive Action List
**Persona:** QA, Management  
**Purpose:** REQ011 — List semua PA

Konten (serupa dengan CA List tapi untuk PA):
- Filter, Search, Table
- Link ke CAPA asal
- Recurrence check: badge "Sudah berulang" jika PA ini gagal mencegah

---

#### `/actions/consolidated` — Consolidated Action Plan
**Persona:** Management, Head of QA  
**Purpose:** REQ019 — Gabungkan semua CA+PA dari berbagai sumber ke satu view

Konten:
- Group by: Root Cause cluster / Departemen / Risk Priority
- AI clustering button (mocked — loading → grouping suggestions)
- Per group: list actions, progress bar, PIC
- Export to Excel (mocked toast)

---

#### `/similarity` — Similarity Analysis Explorer
**Persona:** QA, Investigator  
**Purpose:** REQ018 — Explore kemiripan antar temuan/CAPA

Konten:
- Search/input field: "Masukkan deskripsi temuan untuk dicari kemiripannya"
- AI Search button (mocked loading 2.5s → results)
- Results: cards dengan similarity score %, root cause, tahun, outcome (Effective/Recurred)
- Filter: Min similarity %, Outcome, Tipe, Tahun
- Click result → modal detail historical CAPA

---

#### `/topics` — Topics Grouping
**Persona:** QA Management, Head of QA  
**Purpose:** REQ024 — Clustering temuan berdasarkan pola

Konten:
- "Analisis Topik" button (mocked AI clustering, loading 3s)
- Cluster cards: nama topik, jumlah temuan, trend (naik/turun), severity distribution
- Contoh clusters: "HEPA Filter Maintenance", "Gowning SOP Compliance", "Documentation", "Cold Chain"
- Per cluster: list temuan terkait
- Risk level badge per cluster

---

#### `/audit-trail` — Global Audit Trail
**Persona:** Semua (read-only)  
**Purpose:** REQ008 — Global event log

Konten:
- Filter: Event type (System/AI Decision/Integration/Data Label), CAPA ID, Tanggal, Actor
- Table: Timestamp, Actor (nama + role), Action (Bahasa), CAPA/Finding ID, Before/After (jika field change)
- Export: CSV/PDF (mocked)
- Domain filters sesuai REQ008: System Audit Trail, AI Decision & Feedback, Integration Audit, Clear Labeling

---

#### `/notifications` — Notification Center
**Persona:** Semua  
**Purpose:** REQ015 — Mocked notification management

Konten:
- List notifikasi: icon tipe, judul, deskripsi, waktu, read/unread
- Filter: All / Unread / CAPA Updates / Approvals / Overdue
- Tipe notifikasi: CAPA butuh approval, due date approaching (3 hari), CAPA ditolak, CAPA closed
- Mark all as read
- Settings panel: toggle notification per channel (mocked in-app/email/dashboard)

---

### 5.3 Slide-Over Panels (Bukan Halaman Tersendiri)

| Panel | Trigger | Konten |
|---|---|---|
| Nova Chat | Tombol "Tanya Nova" di setiap 8D step | AI chatbox, context-aware, mocked responses per step |
| KG Citation Detail | Klik citation card | Detail historical CAPA: deviasi ID, root cause, CA yang diambil, outcome, similarity score |
| Export Menu | Tombol "Ekspor" di CAPA detail | PDF / Word / Excel / JSON / Share Link / Send to Bizzmine (semua mocked kecuali PDF) |
| CAPA Quick View | Hover/click dari Findings List | Preview CAPA status tanpa pindah halaman |

---

## 6. TypeScript Data Models

```typescript
// ==================== ENUMS & PRIMITIVES ====================

type ISO8601 = string // "2026-06-08T09:42:18+07:00"

type CAPAType = 'deviation' | 'audit' | 'complaint'

type Severity = 'Minor' | 'Major' | 'Critical'

type PersonaID = 'initiator' | 'qa_deviation' | 'head_of_dept' | 'head_of_qa' | 'sme'

type EightDStep = 'problem' | 'containment' | 'rca' | 'ca' | 'pa' | 'verification' | 'signoff'

type CAPAStatus = 'draft' | 'disposisi' | 'investigation' | 'approval' | 'closed'

type ActionStatus = 'open' | 'in_progress' | 'completed' | 'overdue' | 'verified'

type RCAMethod = '5whys' | 'fishbone' | 'decision_tree'

type NovaSuggestionStatus = 'pending' | 'accepted' | 'edited' | 'replaced'

type AuditDomain = 'system' | 'ai_decision' | 'integration' | 'clear_labeling'

// ==================== PERSONAS ====================

interface Persona {
  id: PersonaID
  displayName: string
  role: string
  department: string
  nik: string
  avatarInitials: string
}

// ==================== PREFILL CONTEXTS ====================

// Deviation (dari Bizzmine)
interface DeviationPreFill {
  source: 'Bizzmine'
  deviationId: string           // "DEV-2026-0341"
  reportedAt: ISO8601
  occurredAt: ISO8601
  location: {
    department: string
    area: string                // "Grade A Fill Suite"
    line: string
    equipmentId: string
  }
  initiator: { name: string; role: string; nik: string }
  initialObservation: string
  affectedBatches: string[]
  attachments: { name: string; type: string; url: string }[]
  sopReferences: string[]
  initialSeverity?: Severity    // dari Bizzmine rule jika ada
}

// Audit Finding (dari Q100+)
interface AuditPreFill {
  source: 'Q100+'
  findingId: string             // "AUD-2026-0089"
  auditId: string
  auditType: 'internal' | 'external'
  reportedAt: ISO8601
  auditDate: ISO8601
  auditor: { name: string; organization: string }
  auditee: { department: string; contactPerson: string }
  findingCategory: string       // "GMP Compliance", "Documentation", "Training"
  findingDescription: string
  regulationReference: string[] // ["GMP Chapter 4", "BPOM 2023"]
  severity: Severity
  sopReferences: string[]
}

// Complaint (dari Bizzmine Complaint module)
interface ComplaintPreFill {
  source: 'Bizzmine-Complaint'
  complaintId: string           // "CMP-2026-0112"
  reportedAt: ISO8601
  customer: { name: string; type: 'distributor' | 'hospital' | 'regulator' | 'end_user' }
  product: { name: string; lotNumber: string; expiryDate: string }
  complaintType: string         // "Particulate Matter", "Label Error", "Cold Chain"
  description: string
  initialSeverity: Severity
  attachments: { name: string; type: string; url: string }[]
}

type PreFillContext = DeviationPreFill | AuditPreFill | ComplaintPreFill

// ==================== QUALITY SCORING ====================

interface QualityScore {
  problemSpecificity: number    // 0-25
  rootCauseDepth: number        // 0-25
  effectiveness: number         // 0-25
  containment: number           // 0-25
  total: number                 // 0-100
  isAuditReady: boolean         // total >= 80
}

interface ScoreLiftTip {
  field: string
  suggestion: string            // "Tambahkan tanggal/shift — +3 ke skor"
  scoreGain: number
  subScore: keyof Omit<QualityScore, 'total' | 'isAuditReady'>
}

// ==================== IMPACT CLASSIFICATION ====================

interface ImpactFactor {
  factor: string
  value: string
  weight: number
  rationale: string
}

interface ImpactClassification {
  severity: Severity
  totalWeight: number
  factors: ImpactFactor[]
  rationale: string             // Nova's English-first explanation
  computedAt: ISO8601
}

// ==================== GATE QUESTIONS ====================

type GateQuestionID = 
  | 'observation'
  | 'scope'
  | 'impact'
  | 'containment'
  | 'cause_confirmation'
  | 'effectiveness_criteria'

interface GateAnswer {
  questionId: GateQuestionID
  question: string              // English-first user-facing question
  answer: string
  novaScoreContribution: number
  needsImprovement: boolean
  improvementHint?: string
}

// ==================== RCA ====================

interface FiveWhysNode {
  id: string
  level: number                 // 1-5
  question: string
  novaSuggestion: string
  novaCitations: KGCitation[]
  userAnswer: string
  status: NovaSuggestionStatus
}

interface FishboneCategory {
  category: 'Man' | 'Machine' | 'Material' | 'Method' | 'Measurement' | 'Environment'
  novaEntries: string[]
  userEntries: string[]
  status: NovaSuggestionStatus
}

interface DecisionNode {
  id: string
  question: string
  yesNodeId?: string
  noNodeId?: string
  isLeaf: boolean
  conclusion?: string
}

interface RCAData {
  method: RCAMethod
  fiveWhys?: FiveWhysNode[]
  fishbone?: FishboneCategory[]
  decisionTree?: { nodes: DecisionNode[]; rootNodeId: string }
  confirmedRootCauses: string[] // list of confirmed root cause strings
}

// ==================== NOVA SUGGESTION ====================

interface NovaSuggestion {
  id: string
  context: string               // "D3-5whys-level-2"
  content: string               // English-first suggestion text
  citations: KGCitation[]
  status: NovaSuggestionStatus
  userEditedContent?: string    // jika user edit
}

// ==================== KG CITATIONS ====================

interface KGCitation {
  deviationId: string
  capaId: string
  similarityScore: number       // 0-100
  rootCause: string
  correctiveAction: string
  year: number
  outcome: 'Effective' | 'Recurred' | 'Ongoing'
  sourceType: CAPAType
}

// ==================== ACTIONS ====================

interface CorrectiveAction {
  id: string
  capaId: string
  description: string
  pic: string
  dueDate: ISO8601
  linkedRootCause: string
  verificationMethod: string
  status: ActionStatus
  completedAt?: ISO8601
  novaGenerated: boolean
  novaSuggestionStatus?: NovaSuggestionStatus
}

interface PreventiveAction {
  id: string
  capaId: string
  description: string
  targetDate: ISO8601
  pic: string
  status: ActionStatus
  completedAt?: ISO8601
  novaGenerated: boolean
  novaSuggestionStatus?: NovaSuggestionStatus
}

// ==================== VERIFICATION ====================

interface VerificationData {
  method: 're-sampling' | 'process_review' | 'batch_trend' | 'em_retest' | 'document_review'
  result: string
  evidenceFileName: string      // mocked filename
  completedAt?: ISO8601
  verifiedBy?: PersonaID
}

// ==================== SIGN-OFF ====================

interface ApprovalEvent {
  id: string
  capaId: string
  step: EightDStep | 'final'
  approver: PersonaID
  approverName: string
  decision: 'approved' | 'rejected' | 'pending'
  timestamp?: ISO8601
  eSignatureRef: string         // mocked: "ESIG-[timestamp]-[personaId]"
  notes?: string
}

// ==================== DISPOSISI ====================

interface Disposisi {
  confirmedBy: PersonaID
  confirmedByName: string
  classification: Severity
  assignedSME?: PersonaID
  directive: string             // English-first QA instruction
  disposedAt: ISO8601
}

// ==================== AUDIT TRAIL ====================

interface AuditEvent {
  id: string
  timestamp: ISO8601
  domain: AuditDomain
  actor: { persona: PersonaID; name: string; nik: string }
  capaId?: string
  findingId?: string
  action: string                // Human-readable English-first audit log action
  field?: string
  before?: unknown
  after?: unknown
  aiModelVersion?: string       // jika domain === 'ai_decision'
  confidenceScore?: number      // jika domain === 'ai_decision'
}

// ==================== NOTIFICATION ====================

interface Notification {
  id: string
  recipientPersona: PersonaID
  type: 'capa_assigned' | 'approval_needed' | 'due_date_approaching' | 'capa_rejected' | 'capa_closed' | 'overdue'
  title: string
  message: string
  capaId?: string
  read: boolean
  createdAt: ISO8601
}

// ==================== MAIN CAPA CASE ====================

interface CAPACase {
  id: string                    // "CAPA-2026-0341"
  type: CAPAType
  title: string
  preFill: PreFillContext
  gateAnswers: GateAnswer[]
  score: QualityScore
  impact: ImpactClassification
  disposisi?: Disposisi
  eightD: {
    problem: {
      statement: string
      novaFeedback?: ScoreLiftTip[]
    }
    containment: {
      action: string
      pic: string
      dueDate: ISO8601
      novaSuggestion?: NovaSuggestion
    }
    rca: RCAData
    ca: CorrectiveAction[]
    pa: PreventiveAction[]
    verification: VerificationData | null
    signoff: ApprovalEvent[]
  }
  audit: AuditEvent[]
  status: CAPAStatus
  currentStep: EightDStep
  createdAt: ISO8601
  updatedAt: ISO8601
  createdBy: PersonaID
  assignedTo: PersonaID
  department: string
}

// ==================== FINDING ====================

interface Finding {
  id: string                    // "DEV-2026-0341", "AUD-2026-0089", "CMP-2026-0112"
  type: CAPAType
  source: 'Bizzmine' | 'Q100+' | 'Bizzmine-Complaint'
  description: string
  severity: Severity
  department: string
  reportedAt: ISO8601
  status: 'pending_capa' | 'capa_in_progress' | 'capa_closed' | 'overdue'
  linkedCAPAId?: string
  preFill: PreFillContext
}

// ==================== SIMILARITY RESULT ====================

interface SimilarityResult {
  queryText: string
  computedAt: ISO8601
  results: KGCitation[]
}

// ==================== TOPIC CLUSTER ====================

interface TopicCluster {
  id: string
  name: string                  // "HEPA Filter Maintenance", "Gowning SOP Compliance"
  findingCount: number
  capaCount: number
  severityDistribution: { Minor: number; Major: number; Critical: number }
  trend: 'increasing' | 'stable' | 'decreasing'
  riskLevel: 'High' | 'Medium' | 'Low'
  relatedFindingIds: string[]
  topRootCauses: string[]
}

// ==================== DASHBOARD ANALYTICS ====================

interface DashboardStats {
  period: string                // "Jun 2026"
  totalFindings: { count: number; changeFromLastMonth: number }
  openCAPAs: { count: number; changeFromLastMonth: number }
  overdueCAPAs: { count: number }
  effectivenessRate: { percentage: number; changeFromLastMonth: number }
}

interface TrendDataPoint {
  month: string                 // "Jan 2026"
  deviation: number
  audit: number
  complaint: number
  total: number
}

interface DepartmentHeatmapEntry {
  department: string
  completionRate: number        // 0-100
  openCount: number
  overdueCount: number
}

interface RootCauseTrendEntry {
  rootCause: string
  count: number
  percentage: number
}
```

---

## 7. Mock JSON Files Plan

Semua file ada di folder `src/mock-data/`. Ini adalah "database" prototype.

### File Structure

```
src/mock-data/
├── personas.json               # 5 personas
├── findings.json               # 15 findings (5 deviation, 5 audit, 5 complaint)
├── capa-cases.json             # 8 CAPA cases di berbagai status
├── corrective-actions.json     # ~20 CA entries
├── preventive-actions.json     # ~15 PA entries
├── audit-trail.json            # ~50 audit events
├── notifications.json          # ~20 notifications per persona
├── kg-citations.json           # ~10 historical citations
├── topic-clusters.json         # ~6 topic clusters
├── dashboard-stats.json        # Stats cards + tren 12 bulan
│
├── prefills/
│   ├── bizzmine-deviation.json # Hero scenario: DEV-2026-0341
│   ├── bizzmine-deviation-backup-1.json  # Autoclave scenario
│   ├── bizzmine-deviation-backup-2.json  # Cold chain scenario
│   ├── q100-audit.json         # Audit finding: AUD-2026-0089
│   └── bizzmine-complaint.json # Complaint: CMP-2026-0112
│
└── nova-scripts/
    ├── 5whys-hepa.json         # Pre-scripted Nova answers untuk hero scenario
    ├── fishbone-hepa.json      # Pre-scripted fishbone entries
    ├── ca-suggestions.json     # Pre-scripted CA suggestions
    ├── pa-suggestions.json     # Pre-scripted PA suggestions
    └── chat-responses.json     # Pre-scripted Nova chat responses per step
```

### Three End-to-End Demo Scenarios

Kita tidak hanya demo satu hero scenario. Prototype harus punya **3 scripted end-to-end cases**, masing-masing mewakili 1 CAPA type. Semua case memakai **Major** severity agar approval flow tetap lengkap tapi tidak terlalu panjang karena tidak perlu SME co-approval.

#### Case 1 — Deviation

Scenario: **Environmental Monitoring Excursion in Grade B Fill Suite** — elevated particle count detected during vaccine filling operation.

- Finding: `DEV-2026-0341`
- CAPA: `CAPA-2026-0341`
- Source: Bizzmine
- Initiator: Andi Wijaya, Senior Operator, Fill-Finish
- Root Cause: SOP PM-HEPA-001 is outdated; HEPA filter replacement interval remains 18 months while historical trend recommends 12 months.
- Impact: **Major** (Grade B + Vaccine + short exposure window = controlled but significant GMP risk)
- Approval chain: Bambang Saputra → Siti Rahmawati → Dewi Anggraini

#### Case 2 — Audit Finding

Scenario: **GMP Documentation Gap in Cleaning Logbook** — internal audit finds incomplete second-person verification on cleaning records.

- Finding: `AUD-2026-0089`
- CAPA: `CAPA-2026-0089`
- Source: Q100+ Audit
- Initiator/Auditee: Fill-Finish representative
- Root Cause: Cleaning logbook review SOP does not define ownership for second-person verification during shift handover.
- Impact: **Major** (documentation integrity gap with potential GMP observation)
- Approval chain: Auditee → Head of Section → QA Compliance → Head of QA

#### Case 3 — Complaint

Scenario: **Customer Complaint: Particulate Matter Observation** — hospital customer reports visible particulate in one returned vial.

- Finding: `CMP-2026-0112`
- CAPA: `CAPA-2026-0112`
- Source: Bizzmine Complaint
- Initiator: QA Complaint
- Root Cause: Visual inspection rejection trend was not escalated after repeated borderline observations in the same lot family.
- Impact: **Major** (customer-facing product quality issue, limited to retained/returned sample review)
- Approval chain: QA Complaint → QA Head of Dept → QA Head of Division

### CAPA Cases di Berbagai Status (untuk Dashboard & List demo)

| ID | Tipe | Status | Notes |
|---|---|---|---|
| CAPA-2026-0341 | Deviation | investigation | End-to-end demo case 1, currently in D3 RCA |
| CAPA-2026-0089 | Audit | investigation | End-to-end demo case 2, starts from Q100+ audit finding |
| CAPA-2026-0112 | Complaint | investigation | End-to-end demo case 3, starts from Bizzmine Complaint |
| CAPA-2026-0312 | Deviation | closed | Completed, effectiveness = Effective |
| CAPA-2026-0298 | Audit | approval | Waiting for Head of QA sign-off |
| CAPA-2026-0275 | Complaint | disposisi | Recently classified by QA |
| CAPA-2026-0251 | Deviation | closed | Recurred — for similarity demo |
| CAPA-2026-0188 | Deviation | overdue | Past due date |

---

## 8. AI Interaction Pattern (Semua Mocked)

Tidak ada API call nyata. Semua AI response adalah hardcoded dari JSON.

### Pattern Standard

```typescript
// Setiap "AI call" menggunakan fungsi ini:
async function mockAICall<T>(responseKey: string, delayMs = 2000): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, delayMs))
  return novaScripts[responseKey] as T
}
```

### Mocked AI Interactions per Screen

| Screen | Trigger | Delay | Response Source |
|---|---|---|---|
| CAPA Intake | "Fetch from Bizzmine" button | 1.5s | `prefills/bizzmine-deviation.json` |
| CAPA Intake | Initial score computation | 0.5s | Rule-based JS (no mock needed) |
| CAPA Intake | Nova impact classification | 1s | Rule-based JS + rationale dari JSON |
| CAPA Intake | Nova score-up tips | debounced 200ms | Rule-based JS |
| D1 Problem | Nova inline tips | debounced 200ms | Rule-based JS |
| D2 Containment | Nova containment suggestion | 1.5s | `nova-scripts/ca-suggestions.json` |
| D3 RCA 5-Whys | Nova suggest per level | 2s | `nova-scripts/5whys-hepa.json` |
| D3 RCA Fishbone | Nova suggest per category | 1.5s | `nova-scripts/fishbone-hepa.json` |
| D4 CA | Nova CA suggestions (3 options) | 2s | `nova-scripts/ca-suggestions.json` |
| D5 PA | Nova PA suggestions | 2s | `nova-scripts/pa-suggestions.json` |
| D6 Verification | Nova verification coaching (chat) | 1s per message | `nova-scripts/chat-responses.json` |
| Nova Chat (global) | Any "Tanya Nova" | 1.5–3s | `nova-scripts/chat-responses.json` keyed by step |
| Similarity Explorer | Search button | 2.5s | `kg-citations.json` filtered |
| Topics Grouping | "Analisis Topik" button | 3s | `topic-clusters.json` |
| Consolidated Plan | "AI Clustering" button | 2.5s | Pre-grouped dari `capa-cases.json` |

### Nova Chat Pattern (per-step scripted)

Nova chat di tiap step punya **3 pre-scripted Q&A pairs**. Kalau user ketik sesuatu yang berbeda, Nova reply dengan generic fallback response dari JSON. Response format: English-first, maximum 3 short paragraphs. Use Indonesian only for local regulatory wording or demo notes.

---

## 9. Scoring Engine (Rule-Based, Pure JS)

Semua di-compute di frontend, **tidak ada backend**.

```typescript
// Di src/utils/scoring.ts

function computeProblemSpecificity(statement: string): number {
  let score = 0
  if (/\d{1,2}[\/-]\d{1,2}/.test(statement) || /shift/i.test(statement)) score += 3  // ada tanggal/shift
  if (/FILL-|EQUIP-|LINE-|[A-Z]{2,}-\d{3,}/.test(statement)) score += 3              // ada equipment ID
  if (/\d+(\.\d+)?\s*(ppm|cfu|°C|%|unit)/i.test(statement)) score += 3              // ada measurement
  if (/VAX-|BATCH-|LOT-|[A-Z]{3}-\d{4}/.test(statement)) score += 2                 // ada batch ID
  if (/suhu|kelembaban|tekanan|grade\s[A-D]/i.test(statement)) score += 2            // ada kondisi lingkungan
  return Math.min(score, 25)
}

// ... similar untuk containment, rootCauseDepth, effectiveness
```

---

## 10. Impact Classification Rules

```typescript
function computeImpact(prefill: PreFillContext): ImpactClassification {
  let weight = 0
  const factors: ImpactFactor[] = []

  // Grade area
  if (prefill.location?.area?.includes('Grade A')) { weight += 3; factors.push({...}) }
  else if (prefill.location?.area?.includes('Grade B')) { weight += 2; ... }
  
  // Batch released?
  // Exposure duration
  // Product type (vaccine/sterile = +2)
  // Recurring (KG match = +2)

  const severity: Severity = weight >= 6 ? 'Critical' : weight >= 3 ? 'Major' : 'Minor'
  
  return { severity, totalWeight: weight, factors, rationale: impactRationale[severity], computedAt: now() }
}
```

**Primary deviation scenario result: Grade B (+2) + Vaccine (+2) + short exposure window (+1) = 5 → Major. This is intentionally locked as Major so the demo keeps a complete approval chain without SME co-approval.**

---

## 11. Folder Structure

```
capa-ai-demo/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx              # React Router setup
│   │
│   ├── mock-data/              # Semua JSON "database"
│   │   ├── personas.json
│   │   ├── findings.json
│   │   ├── capa-cases.json
│   │   ├── ...
│   │   ├── prefills/
│   │   └── nova-scripts/
│   │
│   ├── types/                  # TypeScript interfaces
│   │   ├── capa.ts
│   │   ├── persona.ts
│   │   ├── finding.ts
│   │   ├── audit.ts
│   │   └── index.ts            # Re-exports
│   │
│   ├── services/               # Mock service layer (swap-ready untuk production)
│   │   ├── capaService.ts      # getCapaById, updateCapa, etc.
│   │   ├── findingService.ts
│   │   ├── novaService.ts      # Semua mock AI calls
│   │   ├── auditTrailService.ts
│   │   └── notificationService.ts
│   │
│   ├── store/                  # Zustand stores
│   │   ├── usePersonaStore.ts  # Active persona
│   │   ├── useCapaStore.ts     # Current CAPA state
│   │   └── useUIStore.ts       # Panel open/close states
│   │
│   ├── utils/
│   │   ├── scoring.ts          # Score computation functions
│   │   ├── impact.ts           # Impact classification
│   │   ├── mockAI.ts           # setTimeout-based mock AI runner
│   │   └── formatters.ts       # Date, number, Bahasa formatters
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopBar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── PageWrapper.tsx
│   │   │
│   │   ├── shared/             # Reusable across screens
│   │   │   ├── PersonaSwitcher.tsx
│   │   │   ├── SeverityBadge.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── ScorePill.tsx
│   │   │   ├── SourceBadge.tsx      # "Dari Bizzmine" badge
│   │   │   ├── AILoadingSpinner.tsx # "Nova sedang menganalisis..."
│   │   │   ├── BlockerBanner.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   ├── nova/               # AI Coach components
│   │   │   ├── NovaCoachTip.tsx
│   │   │   ├── NovaSuggestionCard.tsx   # Accept/Edit/Replace
│   │   │   ├── NovaChatPanel.tsx        # Slide-over chat
│   │   │   └── NovaThinkingDots.tsx     # Animated "thinking" dots
│   │   │
│   │   ├── score/
│   │   │   ├── ScoreSidebar.tsx
│   │   │   ├── ScoreBar.tsx
│   │   │   └── ScoreBreakdown.tsx
│   │   │
│   │   ├── rca/
│   │   │   ├── RCAMethodPicker.tsx
│   │   │   ├── FiveWhysTree.tsx
│   │   │   ├── FishboneDiagram.tsx
│   │   │   └── DecisionTree.tsx
│   │   │
│   │   ├── kg/
│   │   │   ├── KGCitationCard.tsx
│   │   │   └── KGCitationDetailPanel.tsx
│   │   │
│   │   ├── actions/
│   │   │   ├── CorrectiveActionForm.tsx
│   │   │   ├── PreventiveActionForm.tsx
│   │   │   └── ActionListItem.tsx
│   │   │
│   │   ├── signoff/
│   │   │   ├── SignOffCascade.tsx
│   │   │   └── ESignatureModal.tsx
│   │   │
│   │   ├── audit/
│   │   │   └── AuditTrailPanel.tsx
│   │   │
│   │   └── charts/
│   │       ├── TrendLineChart.tsx
│   │       ├── TypeDonutChart.tsx
│   │       ├── RootCauseBarChart.tsx
│   │       └── DeptHeatmap.tsx
│   │
│   └── pages/
│       ├── Dashboard.tsx
│       ├── FindingsList.tsx
│       ├── FindingDetail.tsx
│       ├── CAPAList.tsx
│       ├── CAPANew.tsx
│       ├── CAPADetail.tsx
│       ├── eightd/
│       │   ├── D1Problem.tsx
│       │   ├── D2Containment.tsx
│       │   ├── D3RCA.tsx
│       │   ├── D4CorrectiveAction.tsx
│       │   ├── D5PreventiveAction.tsx
│       │   ├── D6Verification.tsx
│       │   └── D7SignOff.tsx
│       ├── CorrectiveActionList.tsx
│       ├── PreventiveActionList.tsx
│       ├── ConsolidatedPlan.tsx
│       ├── SimilarityExplorer.tsx
│       ├── TopicsGrouping.tsx
│       ├── AuditTrail.tsx
│       └── Notifications.tsx
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 12. Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.24.0",
    "zustand": "^4.5.0",
    "recharts": "^2.12.0",
    "react-hook-form": "^7.52.0",
    "zod": "^3.23.0",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-dropdown-menu": "latest",
    "@radix-ui/react-tabs": "latest",
    "@radix-ui/react-tooltip": "latest",
    "@radix-ui/react-select": "latest",
    "reactflow": "^11.11.0",
    "html2pdf.js": "^0.10.2",
    "date-fns": "^3.6.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "lucide-react": "^0.383.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

**Routing decision:** Use `react-router-dom`. URL-based navigation is locked because it makes the demo easier to rehearse, link, refresh, and debug.

**Note:** Tidak pakai ShadCN (butuh CLI setup yang ribet di Vite). Pakai Radix UI primitives langsung + custom styling dengan Tailwind. Lebih kontrol, lebih ringan.

---

## 13. Design System

### Palette

```css
:root {
  /* Brand */
  --color-primary: #0B5394;          /* Bio Farma-adjacent blue */
  --color-primary-hover: #094276;
  --color-primary-light: #E8F0F9;

  /* Nova AI accent */
  --color-nova: #7C3AED;
  --color-nova-light: #F3EEFF;

  /* Severity */
  --color-minor: #10B981;
  --color-minor-bg: #ECFDF5;
  --color-major: #F59E0B;
  --color-major-bg: #FFFBEB;
  --color-critical: #EF4444;
  --color-critical-bg: #FEF2F2;

  /* Status */
  --color-audit-ready: #059669;
  --color-audit-ready-bg: #D1FAE5;

  /* Neutrals */
  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-surface-raised: #F1F5F9;
  --color-border: #E2E8F0;
  --color-text: #1F2937;
  --color-text-muted: #6B7280;
  --color-text-subtle: #9CA3AF;
}
```

### Typography

```css
/* Body: DM Sans — clean, medical-friendly, tidak generic */
/* Mono: JetBrains Mono — untuk IDs, batch numbers, kode */
/* Display (optional): Space Grotesk buat heading besar di dashboard */

@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Layout

- 12-column grid
- Sidebar: 240px fixed
- Top bar: 56px fixed
- Score sidebar (di CAPA detail): 280px fixed right
- Main content: fluid, max-width 1440px
- Target: 1920×1080 (demo laptop)

### Key Animations

```css
/* Score count-up: 600ms ease-out */
/* Nova thinking: 3 dots pulsing */
/* Blocker shake: 300ms saat klik "Next" dengan blocker aktif */
/* Confetti: saat score pertama kali ≥ 80 */
/* AI loading: shimmer skeleton, bukan spinner biasa */
/* Page transition: fade 150ms */
```

---

## 14. Build Order (Priority Tiers)

### Tier 0 — Foundation (harus ada dulu sebelum apapun)
1. Project scaffold (Vite + React + TS + Tailwind + Router)
2. Design tokens (CSS variables)
3. Layout shell (TopBar, Sidebar, PersonaSwitcher)
4. Semua TypeScript types
5. Semua mock JSON files (data dulu, baru UI)
6. Service layer skeleton

### Tier 1 — Core Demo Flow (harus ada untuk demo)
1. Dashboard (charts + stats cards)
2. Findings List
3. CAPA List
4. CAPA Intake (New CAPA) — supports Deviation, Audit Finding, and Complaint intake
5. CAPA Detail + Tab Overview + KG Citations
6. End-to-end Deviation flow: D1 → D7 Sign-Off
7. End-to-end Audit Finding flow: D1 → D7 Sign-Off
8. End-to-end Complaint flow: D1 → D7 Sign-Off
9. 8D: D1 Problem Statement
10. 8D: D2 Containment
11. 8D: D3 RCA (5-Whys first, Fishbone second, Decision Tree optional)
12. 8D: D4 Corrective Action
13. 8D: D5 Preventive Action
14. 8D: D6 Verification
15. 8D: D7 Sign-Off + E-Signature

### Tier 2 — Completeness (untuk kesan "platform lengkap")
1. CA List (global)
2. PA List (global)
3. Similarity Explorer
4. Audit Trail (global)
5. Notification center
6. Nova Chat Panel (slide-over)
7. Finding Detail

### Tier 3 — Polish (kalau ada waktu)
1. Topics Grouping
2. Consolidated Action Plan
3. PDF Export
4. Fishbone + Decision Tree di RCA
5. Dashboard filter interaktif
6. Additional edge-case scenarios beyond the three primary cases

---

## 15. Locked Decisions Before Development

Keputusan berikut sudah dianggap final untuk prototype ini:

1. **Demo scenario severity: Major.** Critical tetap bisa muncul sebagai data pendukung, tetapi 3 scripted demo cases memakai Major agar approval flow tetap lengkap tanpa SME co-approval.

2. **Product / AI coach name: AI Coach Nova.** Nama Nova dipakai konsisten untuk AI assistant, suggestion cards, chat panel, scoring tips, and AI analysis copy.

3. **Content language: English-first.** All user-facing UI copy, mock scenario text, AI suggestions, audit logs, notifications, and demo narration should be written primarily in English. Indonesian can remain in planning notes or local regulatory context only.

4. **Demo type coverage: 3 cases, all end-to-end.** Deviation, Audit Finding, and Complaint each get one complete scripted case. Ketiganya harus bisa didemo dari intake → investigation → RCA → CA/PA → verification → sign-off.

5. **Routing: React Router.** Use `react-router-dom` for route-based navigation. Avoid purely state-based fake navigation because refresh, deep links, and browser back behavior matter for demo reliability.

---

## 16. Locked Demo Direction

This prototype is designed as a **deterministic, scripted demo** for a 15–20 minute pitching session.

The goal is not to build a production-ready CAPA system.
The goal is to demonstrate how **AI Coach Nova** can guide users through CAPA creation, investigation, RCA, corrective/preventive actions, verification, and sign-off across three CAPA source types:

1. Deviation
2. Audit Finding
3. Complaint

### Locked Product Name

The product name is:

**AI Coach Nova**

The AI assistant inside the product must consistently be referred to as:

**Nova**

Do not rename it to another AI assistant name.

### Locked Content Language

The prototype must use **English-first UI content**.

This means:

* Navigation labels: English
* Buttons: English
* Form labels: English
* Table columns: English
* Toast messages: English
* Empty states: English
* Blocker messages: English
* Nova responses: English
* Audit trail event text: English
* Notification content: English

Indonesian names, departments, company context, and user personas may remain Indonesian.

Examples:

| Wrong                       | Correct                |
| --------------------------- | ---------------------- |
| Tanya Nova                  | Ask Nova               |
| Ditransfer dari Bizzmine    | Imported from Bizzmine |
| Nova sedang menganalisis... | Nova is analyzing...   |
| Setujui                     | Approve                |
| Tolak                       | Reject                 |
| Disposisi                   | Disposition            |
| Siap Audit                  | Audit Ready            |

### Locked Routing Decision

Use **React Router**.

The prototype must support URL-based navigation because:

* demo flow becomes easier to control,
* browser back/forward works naturally,
* specific screens can be opened directly,
* AI agents can work with a clearer page structure.

Do not replace React Router with purely state-based navigation.

### Locked Demo Severity

All three end-to-end demo cases should use **Major** severity.

Reason:

* Major severity is serious enough for a high-stakes quality demo.
* It avoids adding SME co-approval complexity required for Critical cases.
* It keeps the demo tight and easier to finish within 15–20 minutes.
* It still allows meaningful approval cascade and audit-readiness scoring.

Critical cases may exist in mock data for dashboard/listing realism, but they are not the primary demo flow.

### Locked End-to-End Demo Scope

The prototype must demo **all three CAPA types end-to-end**:

1. Deviation end-to-end
2. Audit Finding end-to-end
3. Complaint end-to-end

Each case must be clickable from intake to final sign-off.

Each case must include:

* source system prefill,
* Nova initial analysis,
* impact/severity classification,
* gate questions,
* problem statement,
* containment action,
* root cause analysis,
* corrective action,
* preventive action,
* verification,
* sign-off,
* final audit-ready state,
* audit trail updates.

The three cases do not need to have equal depth.
The Deviation case should be the most polished.
Audit Finding and Complaint can be slightly more streamlined, but they must still be complete end-to-end flows.

---

## 17. Golden Demo Flow

This section defines the exact demo path.
Build the prototype around this flow first before polishing secondary screens.

### Demo Opening: Dashboard

Start at:

```txt
/dashboard
```

Expected user experience:

1. User sees the AI Coach Nova dashboard.
2. Summary cards show:

   * Total Findings
   * Open CAPAs
   * Overdue CAPAs
   * CAPA Effectiveness Rate
3. Charts show:

   * finding trends,
   * finding breakdown by type,
   * top root cause categories,
   * department completion rate,
   * recurrence trend.
4. Latest Findings table shows the three demo cases:

   * `DEV-2026-0341`
   * `AUD-2026-0089`
   * `CMP-2026-0112`
5. User can click each finding and start the CAPA flow.

The dashboard should immediately communicate:

> “Nova helps QA teams turn quality findings into structured, audit-ready CAPA workflows.”

---

## 18. Golden Demo Case 1 — Deviation

### Case Summary

| Field               | Value                                                    |
| ------------------- | -------------------------------------------------------- |
| CAPA Type           | Deviation                                                |
| Source System       | Bizzmine                                                 |
| Finding ID          | DEV-2026-0341                                            |
| CAPA ID             | CAPA-2026-0341                                           |
| Scenario            | Environmental monitoring excursion in Grade A Fill Suite |
| Severity            | Major                                                    |
| Department          | Fill-Finish                                              |
| Primary Persona     | Andi Wijaya                                              |
| QA Reviewer         | Siti Rahmawati                                           |
| Department Approver | Bambang Saputra                                          |
| Final Approver      | Dewi Anggraini                                           |
| RCA Method          | 5-Whys                                                   |
| Final Outcome       | CAPA Closed / Audit Ready                                |

### Demo Story

During a vaccine filling operation, environmental monitoring detects particle count above the expected threshold in the filling suite. The finding is imported from Bizzmine into AI Coach Nova.

Nova helps the initiator classify the severity, improve the problem statement, identify the root cause, generate corrective and preventive actions, define verification, and guide the CAPA through sign-off.

### Suggested Root Cause

The preventive maintenance interval for the HEPA filter was outdated. The existing SOP still used an 18-month replacement interval, while updated internal quality guidance requires a 12-month interval for the area.

### Suggested Corrective Action

Replace the affected HEPA filter, perform requalification of the filling suite, and review recent batch exposure records.

### Suggested Preventive Action

Update the preventive maintenance SOP, revise the HEPA filter replacement interval, and add automated reminders for upcoming filter replacement deadlines.

### Click-by-Click Flow

#### Step 1 — Open Finding

Route:

```txt
/findings/DEV-2026-0341
```

Expected behavior:

* Show source badge: `Imported from Bizzmine`
* Show finding detail:

  * occurred date,
  * area,
  * equipment ID,
  * affected batch,
  * initial observation,
  * source attachments.
* Show button:

```txt
Create CAPA with Nova
```

Clicking this button opens:

```txt
/capa/new?type=deviation&sourceId=DEV-2026-0341
```

#### Step 2 — Intake

Route:

```txt
/capa/new
```

Expected behavior:

1. User selects `Deviation`.
2. User clicks `Fetch from Bizzmine`.
3. Loading state appears:

```txt
Nova is importing source data from Bizzmine...
```

4. Mock prefill data appears.
5. Nova generates:

   * suggested CAPA title,
   * initial severity,
   * impact rationale,
   * gate question hints,
   * initial quality score.

Expected Nova message:

```txt
Nova detected a Major deviation because the event occurred in a controlled filling area, involved a vaccine batch, and required immediate containment. The case is suitable for a structured 8D CAPA workflow.
```

User clicks:

```txt
Submit to QA
```

Expected destination:

```txt
/capa/CAPA-2026-0341
```

#### Step 3 — CAPA Overview

Route:

```txt
/capa/CAPA-2026-0341
```

Expected behavior:

* Header shows:

  * CAPA ID,
  * Deviation badge,
  * Major severity,
  * status,
  * quality score.
* Overview tab shows:

  * imported source data,
  * Nova summary,
  * historical similar cases,
  * status timeline,
  * audit trail preview.

User clicks:

```txt
Start 8D Workflow
```

#### Step 4 — D1 Problem Statement

Route:

```txt
/capa/CAPA-2026-0341/8d/problem
```

Expected behavior:

* Problem statement editor appears.
* Nova provides inline improvement tips.
* Score sidebar updates as the user improves the statement.
* Blocker appears if statement is too vague.

Example blocker:

```txt
The problem statement is not specific enough. Add date, area, equipment ID, affected batch, and measurable observation.
```

Expected completed problem statement:

```txt
On 8 June 2026 during vaccine filling operation in Grade A Fill Suite Line FILL-02, environmental monitoring detected particle count excursion for batch VAX-2406-A17. The excursion lasted approximately 8 minutes and was associated with HEPA unit HEPA-FILL-02.
```

User clicks:

```txt
Continue to Containment
```

#### Step 5 — D2 Containment

Route:

```txt
/capa/CAPA-2026-0341/8d/containment
```

Expected behavior:

* User defines immediate containment.
* Nova suggests containment actions.
* User can Accept/Edit/Replace Nova suggestion.

Expected Nova suggestion:

```txt
Immediately pause filling operation, quarantine affected batch VAX-2406-A17, perform additional environmental monitoring, and notify QA Deviation for assessment before batch disposition.
```

User accepts or edits the suggestion.

User clicks:

```txt
Continue to Root Cause Analysis
```

#### Step 6 — D3 Root Cause Analysis

Route:

```txt
/capa/CAPA-2026-0341/8d/rca
```

Expected behavior:

* RCA method picker appears.
* User selects `5-Whys`.
* Nova suggests each why level.
* Similar historical CAPA citations appear beside Nova suggestions.
* User confirms final root cause.

Expected 5-Whys structure:

```txt
Problem:
Particle count excursion occurred during vaccine filling.

Why 1:
Because airflow performance in the filling suite was below expected control level.

Why 2:
Because the HEPA filter showed reduced filtration efficiency.

Why 3:
Because the filter had exceeded the recommended replacement interval for high-control areas.

Why 4:
Because the preventive maintenance schedule still followed an outdated 18-month interval.

Why 5:
Because SOP PM-HEPA-001 had not been updated after the revised internal quality guidance was issued.

Confirmed Root Cause:
Preventive maintenance SOP PM-HEPA-001 used an outdated HEPA filter replacement interval for Grade A filling operations.
```

User clicks:

```txt
Continue to Corrective Action
```

#### Step 7 — D4 Corrective Action

Route:

```txt
/capa/CAPA-2026-0341/8d/ca
```

Expected behavior:

* Nova suggests multiple corrective actions.
* Each corrective action must link to confirmed root cause.
* User accepts at least one CA.

Expected CA:

```txt
Replace HEPA-FILL-02 filter, perform airflow requalification for the filling suite, and complete QA review of affected batch VAX-2406-A17 before release decision.
```

User clicks:

```txt
Continue to Preventive Action
```

#### Step 8 — D5 Preventive Action

Route:

```txt
/capa/CAPA-2026-0341/8d/pa
```

Expected behavior:

* Nova suggests preventive actions.
* User accepts or edits PA.
* Score improves.

Expected PA:

```txt
Revise SOP PM-HEPA-001 to require 12-month HEPA filter replacement for Grade A filling areas and add automated maintenance reminders 60 days before due date.
```

User clicks:

```txt
Continue to Verification
```

#### Step 9 — D6 Verification

Route:

```txt
/capa/CAPA-2026-0341/8d/verification
```

Expected behavior:

* User selects verification method.
* User enters result.
* Mock evidence upload works.
* Nova can coach verification method.

Expected verification method:

```txt
Environmental monitoring re-test and airflow requalification review
```

Expected verification result:

```txt
Post-replacement monitoring showed particle counts within alert and action limits for three consecutive checks. Airflow requalification passed acceptance criteria.
```

User uploads mock evidence:

```txt
HEPA-FILL-02-Requalification.pdf
```

User clicks:

```txt
Continue to Sign-Off
```

#### Step 10 — D7 Sign-Off

Route:

```txt
/capa/CAPA-2026-0341/8d/signoff
```

Expected behavior:

* Score is ≥ 80.
* Show badge:

```txt
Audit Ready
```

Approval chain:

1. Bambang Saputra — Department Head
2. Siti Rahmawati — QA Deviation
3. Dewi Anggraini — Head of QA

Each approver can click:

```txt
Approve with E-Signature
```

Expected result:

* CAPA status becomes `Closed`
* Audit trail records all approvals
* Notification toast appears:

```txt
CAPA-2026-0341 has been approved and marked as Audit Ready.
```

---

## 19. Golden Demo Case 2 — Audit Finding

### Case Summary

| Field               | Value                                       |
| ------------------- | ------------------------------------------- |
| CAPA Type           | Audit Finding                               |
| Source System       | Q100+                                       |
| Finding ID          | AUD-2026-0089                               |
| CAPA ID             | CAPA-2026-0089                              |
| Scenario            | GMP documentation gap during internal audit |
| Severity            | Major                                       |
| Department          | Warehouse / QA Compliance                   |
| Primary Persona     | Siti Rahmawati                              |
| Department Approver | Bambang Saputra                             |
| Final Approver      | Dewi Anggraini                              |
| RCA Method          | Fishbone                                    |
| Final Outcome       | CAPA Closed / Audit Ready                   |

### Demo Story

An internal GMP audit found that several material transfer records were completed late and lacked second-person verification. The finding is imported from Q100+ into AI Coach Nova.

Nova helps classify the audit finding, structure the CAPA, identify systemic documentation weaknesses, and create corrective/preventive actions to prevent recurrence.

### Suggested Root Cause

The documentation workflow did not clearly define real-time recording responsibility, and supervisors were not consistently verifying material transfer records before end-of-shift closure.

### Suggested Corrective Action

Review and correct affected records, perform QA assessment for data integrity risk, and retrain involved warehouse operators and supervisors.

### Suggested Preventive Action

Revise the material transfer documentation SOP, add end-of-shift verification checklist, and implement weekly QA spot checks for three months.

### Click-by-Click Flow

#### Step 1 — Open Finding

Route:

```txt
/findings/AUD-2026-0089
```

Expected behavior:

* Show source badge: `Imported from Q100+`
* Show finding details:

  * audit ID,
  * audit date,
  * auditor,
  * auditee department,
  * finding category,
  * regulation reference,
  * finding description.
* Show button:

```txt
Create CAPA with Nova
```

#### Step 2 — Intake

Route:

```txt
/capa/new?type=audit&sourceId=AUD-2026-0089
```

Expected behavior:

1. User selects `Audit Finding`.
2. User clicks `Fetch from Q100+`.
3. Loading state appears:

```txt
Nova is importing audit finding data from Q100+...
```

4. Mock prefill data appears.
5. Nova classifies the case as Major.

Expected Nova message:

```txt
Nova classified this audit finding as Major because it involves GMP documentation control and potential data integrity risk across repeated material transfer records.
```

User clicks:

```txt
Submit to QA Compliance
```

Expected destination:

```txt
/capa/CAPA-2026-0089
```

#### Step 3 — CAPA Overview

Route:

```txt
/capa/CAPA-2026-0089
```

Expected behavior:

* Header shows Audit Finding type.
* Overview shows:

  * audit context,
  * regulation references,
  * Nova summary,
  * similar historical documentation findings,
  * timeline.

User clicks:

```txt
Start 8D Workflow
```

#### Step 4 — D1 Problem Statement

Expected completed problem statement:

```txt
During internal GMP audit AUD-2026-0089 on 10 June 2026, three warehouse material transfer records were found completed after the actual transfer time and missing second-person verification. The issue affected Warehouse Zone WH-02 and involved material movement records for lots MAT-2406-11, MAT-2406-12, and MAT-2406-13.
```

Nova should reward specificity for:

* audit ID,
* date,
* department,
* record count,
* affected lots,
* GMP/data integrity relevance.

#### Step 5 — D2 Containment

Expected containment:

```txt
Immediately place the affected material transfer records under QA review, verify physical material reconciliation against inventory logs, and temporarily require supervisor review for all WH-02 transfer records until CAPA completion.
```

#### Step 6 — D3 RCA

RCA method:

```txt
Fishbone
```

Fishbone categories:

```txt
Man:
Operators were not consistently trained on real-time GMP documentation expectations.

Method:
The SOP did not clearly define when second-person verification must be completed.

Measurement:
No routine KPI monitored late documentation completion.

Environment:
Warehouse shift handover created pressure to complete records after movement.

Material:
Multiple lots were transferred during peak receiving window.

Machine/System:
The record template did not flag missing verifier fields before closure.
```

Confirmed root cause:

```txt
The material transfer documentation process lacked a clear real-time verification control and did not prevent late or incomplete record closure.
```

#### Step 7 — D4 Corrective Action

Expected CA:

```txt
Perform QA review of affected records, document reconciliation outcome, correct records according to GMP documentation procedure, and retrain involved operators and supervisors on real-time documentation requirements.
```

#### Step 8 — D5 Preventive Action

Expected PA:

```txt
Revise the material transfer SOP to require same-time second-person verification, add an end-of-shift documentation checklist, and run weekly QA spot checks for three months.
```

#### Step 9 — D6 Verification

Verification method:

```txt
Document review and QA spot check trend
```

Verification result:

```txt
QA spot checks over four consecutive weeks found no late material transfer records and all sampled records contained completed second-person verification.
```

Mock evidence:

```txt
WH-02-Documentation-Spot-Check-Summary.pdf
```

#### Step 10 — D7 Sign-Off

Approval chain:

1. Bambang Saputra — Department Head
2. Siti Rahmawati — QA Compliance Reviewer
3. Dewi Anggraini — Head of QA

Expected final state:

```txt
CAPA-2026-0089 Closed / Audit Ready
```

---

## 20. Golden Demo Case 3 — Complaint

### Case Summary

| Field               | Value                                               |
| ------------------- | --------------------------------------------------- |
| CAPA Type           | Complaint                                           |
| Source System       | Bizzmine Complaint                                  |
| Finding ID          | CMP-2026-0112                                       |
| CAPA ID             | CAPA-2026-0112                                      |
| Scenario            | Customer complaint about visible particulate matter |
| Severity            | Major                                               |
| Department          | QA Complaint / Production                           |
| Primary Persona     | Siti Rahmawati                                      |
| Department Approver | Bambang Saputra                                     |
| Final Approver      | Dewi Anggraini                                      |
| RCA Method          | Decision Tree                                       |
| Final Outcome       | CAPA Closed / Audit Ready                           |

### Demo Story

A hospital customer reports visible particulate matter in one vial from a vaccine lot. The complaint is imported from the Bizzmine Complaint module. Nova helps the QA Complaint team investigate the issue, evaluate possible production and handling causes, create CAPA, and close the case with verification.

### Suggested Root Cause

The inspection reconciliation process did not sufficiently flag a short reject reconciliation variance during final visual inspection review.

### Suggested Corrective Action

Perform complaint sample assessment, review retained samples, review visual inspection records, and assess whether additional batch action is needed.

### Suggested Preventive Action

Strengthen visual inspection reconciliation review, update acceptance escalation criteria, and retrain visual inspection reviewers.

### Click-by-Click Flow

#### Step 1 — Open Finding

Route:

```txt
/findings/CMP-2026-0112
```

Expected behavior:

* Show source badge: `Imported from Bizzmine Complaint`
* Show complaint details:

  * customer,
  * product,
  * lot number,
  * expiry date,
  * complaint type,
  * complaint description,
  * attachments.
* Show button:

```txt
Create CAPA with Nova
```

#### Step 2 — Intake

Route:

```txt
/capa/new?type=complaint&sourceId=CMP-2026-0112
```

Expected behavior:

1. User selects `Complaint`.
2. User clicks `Fetch from Bizzmine Complaint`.
3. Loading state appears:

```txt
Nova is importing complaint data from Bizzmine Complaint...
```

4. Mock prefill data appears.
5. Nova classifies severity as Major.

Expected Nova message:

```txt
Nova classified this complaint as Major because it involves visible particulate matter in a distributed vaccine product and requires batch record review, retained sample assessment, and complaint investigation.
```

User clicks:

```txt
Submit to QA Complaint
```

Expected destination:

```txt
/capa/CAPA-2026-0112
```

#### Step 3 — CAPA Overview

Route:

```txt
/capa/CAPA-2026-0112
```

Expected behavior:

* Header shows Complaint type.
* Overview shows:

  * customer complaint context,
  * product and lot information,
  * Nova summary,
  * historical similar complaint cases,
  * timeline.

User clicks:

```txt
Start 8D Workflow
```

#### Step 4 — D1 Problem Statement

Expected completed problem statement:

```txt
On 12 June 2026, Hospital Sentosa reported visible particulate matter in one vial of Vaximmun 10-dose presentation, lot VX-2405-22, expiry May 2027. The complaint was received through Bizzmine Complaint module CMP-2026-0112 and requires investigation of visual inspection records, retained samples, and batch release documentation.
```

#### Step 5 — D2 Containment

Expected containment:

```txt
Open QA complaint investigation, quarantine retained samples from lot VX-2405-22, review distribution status, and perform immediate retained sample visual inspection before determining whether additional market action is required.
```

#### Step 6 — D3 RCA

RCA method:

```txt
Decision Tree
```

Expected decision tree:

```txt
Question 1:
Was particulate matter confirmed in the complaint sample?
Yes → continue investigation.
No → classify as unconfirmed complaint but continue retained sample review.

Question 2:
Were retained samples from the same lot affected?
No → continue batch record and inspection record review.
Yes → escalate to potential batch quality issue.

Question 3:
Was there any abnormality in final visual inspection records?
Yes → investigate visual inspection reconciliation.
No → evaluate distribution/handling factors.

Question 4:
Was reject reconciliation variance properly escalated?
No → confirmed process control weakness.
Yes → evaluate external handling or isolated defect.
```

Confirmed root cause:

```txt
Final visual inspection reconciliation did not sufficiently escalate a short reject reconciliation variance during batch release review.
```

#### Step 7 — D4 Corrective Action

Expected CA:

```txt
Review complaint sample evidence, inspect retained samples from lot VX-2405-22, perform batch record review, assess final visual inspection reconciliation, and document QA batch impact assessment.
```

#### Step 8 — D5 Preventive Action

Expected PA:

```txt
Update visual inspection reconciliation procedure to define escalation thresholds for reject variance, add QA reviewer checklist item, and retrain visual inspection reviewers and batch release QA personnel.
```

#### Step 9 — D6 Verification

Verification method:

```txt
Process review and batch trend monitoring
```

Verification result:

```txt
Three subsequent batch release reviews showed completed visual inspection reconciliation checklist, no unexplained reject variance, and no repeated particulate complaint trend.
```

Mock evidence:

```txt
Visual-Inspection-Reconciliation-Verification.pdf
```

#### Step 10 — D7 Sign-Off

Approval chain:

1. Siti Rahmawati — QA Complaint Reviewer
2. Bambang Saputra — Department Head
3. Dewi Anggraini — Head of QA

Expected final state:

```txt
CAPA-2026-0112 Closed / Audit Ready
```

---

## 21. Screen Acceptance Criteria

This section defines the minimum working behavior for each important screen.

### `/dashboard`

Must have:

* summary cards,
* charts,
* latest findings table,
* visible entry points to the three golden demo cases,
* clickable links to finding detail or CAPA detail,
* no broken loading state,
* no empty page on first load.

Acceptance criteria:

```txt
Given the user opens /dashboard
When the page loads
Then the user can see company-level CAPA analytics
And the three golden demo cases are visible or reachable
And each case can be opened from the dashboard or findings list.
```

---

### `/findings`

Must have:

* table of findings,
* filters for type, severity, status, department,
* search input,
* status badges,
* action buttons.

Acceptance criteria:

```txt
Given the user opens /findings
When the user filters by Deviation, Audit, or Complaint
Then the table updates correctly
And the user can open each golden demo finding.
```

---

### `/findings/:id`

Must have:

* source system badge,
* finding metadata,
* source prefill panel,
* linked CAPA card if CAPA already exists,
* create CAPA button if no CAPA exists.

Acceptance criteria:

```txt
Given the user opens a finding detail page
When the finding has no linked CAPA
Then the user can click Create CAPA with Nova.

Given the finding already has a linked CAPA
Then the user can open the CAPA detail page.
```

---

### `/capa/new`

Must have:

* CAPA type selector,
* source system fetch button,
* loading state,
* prefilled source data,
* editable CAPA title,
* Nova initial classification,
* gate questions,
* quality score sidebar,
* submit button.

Acceptance criteria:

```txt
Given the user selects a CAPA type
When the user clicks Fetch from Source System
Then mock data is loaded from the correct source
And Nova displays initial analysis
And the user can submit the CAPA into the workflow.
```

For each type:

| Type          | Source Button                 |
| ------------- | ----------------------------- |
| Deviation     | Fetch from Bizzmine           |
| Audit Finding | Fetch from Q100+              |
| Complaint     | Fetch from Bizzmine Complaint |

---

### `/capa/:id`

Must have:

* CAPA header,
* severity badge,
* status badge,
* quality score,
* tabs:

  * Overview,
  * 8D Workflow,
  * Audit Trail,
  * Actions.
* visible next-step CTA.

Acceptance criteria:

```txt
Given the user opens a CAPA detail page
When the CAPA data exists
Then the user can understand the CAPA context
And continue the 8D workflow from the current step.
```

---

### `/capa/:id/8d/problem`

Must have:

* problem statement editor,
* Nova improvement tips,
* score update,
* blocker if statement is weak,
* continue button.

Acceptance criteria:

```txt
Given the problem statement is too short
When the user clicks Continue
Then the page shows a blocker message.

Given the problem statement includes date, area, equipment, batch/lot, and measurable detail
When the user clicks Continue
Then the user can proceed to Containment.
```

---

### `/capa/:id/8d/containment`

Must have:

* action description input,
* PIC selector,
* due date picker,
* Nova suggestion card,
* Accept/Edit/Replace actions,
* blocker validation.

Acceptance criteria:

```txt
Given the user has not selected PIC or due date
When the user clicks Continue
Then the page shows a blocker.

Given the user accepts or writes a valid containment action
Then the user can proceed to RCA.
```

---

### `/capa/:id/8d/rca`

Must have:

* RCA method selector,
* method-specific UI:

  * 5-Whys,
  * Fishbone,
  * Decision Tree.
* Nova suggestions,
* citation cards,
* confirmed root cause selector.

Acceptance criteria:

```txt
Given the user selects an RCA method
When Nova suggestions are loaded
Then the user can accept, edit, or replace suggestions.

Given no root cause is confirmed
When the user clicks Continue
Then the page blocks progression.

Given at least one root cause is confirmed
Then the user can proceed to Corrective Action.
```

---

### `/capa/:id/8d/ca`

Must have:

* corrective action list,
* add/edit/remove action,
* Nova suggestions,
* linked root cause field,
* PIC,
* due date,
* verification method.

Acceptance criteria:

```txt
Given no corrective action is linked to a root cause
When the user clicks Continue
Then the page blocks progression.

Given at least one valid corrective action exists
Then the user can proceed to Preventive Action.
```

---

### `/capa/:id/8d/pa`

Must have:

* preventive action list,
* Nova suggestions,
* target date,
* PIC,
* future-date validation.

Acceptance criteria:

```txt
Given no preventive action exists
When the user clicks Continue
Then the page blocks progression.

Given at least one valid preventive action exists
Then the user can proceed to Verification.
```

---

### `/capa/:id/8d/verification`

Must have:

* verification method selector,
* result text area,
* mock evidence upload,
* Nova verification coaching,
* validation.

Acceptance criteria:

```txt
Given method, result, or evidence is missing
When the user clicks Continue
Then the page blocks progression.

Given all verification fields are complete
Then the user can proceed to Sign-Off.
```

---

### `/capa/:id/8d/signoff`

Must have:

* final quality score,
* Audit Ready badge if score >= 80,
* approval chain,
* e-signature modal,
* approval notes,
* final status update.

Acceptance criteria:

```txt
Given the score is below 80
When the user tries to complete sign-off
Then the page blocks final approval.

Given the score is 80 or above
When all required approvers approve
Then CAPA status becomes Closed
And the CAPA is marked Audit Ready
And audit trail events are created.
```

---

### `/actions/corrective`

Must have:

* global corrective action table,
* status filters,
* PIC filters,
* CAPA links,
* status update action.

Acceptance criteria:

```txt
Given the user opens Corrective Action List
Then all corrective actions from all CAPA cases are visible
And each item links back to its CAPA.
```

---

### `/actions/preventive`

Must have:

* global preventive action table,
* status filters,
* PIC filters,
* recurrence indicator,
* CAPA links.

Acceptance criteria:

```txt
Given the user opens Preventive Action List
Then all preventive actions from all CAPA cases are visible
And each item links back to its CAPA.
```

---

### `/similarity`

Must have:

* search input,
* AI search button,
* mocked loading state,
* similarity result cards,
* historical CAPA modal.

Acceptance criteria:

```txt
Given the user enters a finding description
When the user clicks AI Search
Then Nova returns similar historical CAPA cases with similarity score, root cause, action, and outcome.
```

---

### `/topics`

Must have:

* analyze topics button,
* mocked loading state,
* topic cluster cards,
* trend indicator,
* severity distribution,
* related findings list.

Acceptance criteria:

```txt
Given the user clicks Analyze Topics
Then Nova returns grouped finding clusters
And each cluster shows risk level, trend, count, and related findings.
```

---

### `/audit-trail`

Must have:

* audit event table,
* filters,
* event domain badges,
* before/after field if available,
* export button with mocked toast.

Acceptance criteria:

```txt
Given the user opens Audit Trail
Then system, AI decision, integration, and data labeling events are visible
And the user can filter by CAPA ID, event type, actor, and date.
```

---

### `/notifications`

Must have:

* notification list,
* unread/read state,
* filters,
* mark all as read,
* mocked settings toggles.

Acceptance criteria:

```txt
Given the user opens Notifications
Then relevant CAPA updates, approvals, overdue alerts, and closure notifications are visible.
```

---

## 22. State Management Rules

The prototype must behave like a real app during the demo, even though all data is mock data.

### Data Source

Initial data must come from JSON files in:

```txt
src/mock-data/
```

### Runtime State

Runtime changes should be handled client-side using Zustand.

Examples of runtime changes:

* CAPA status changes,
* current 8D step changes,
* accepted Nova suggestions,
* edited suggestions,
* added corrective actions,
* added preventive actions,
* completed verification,
* approval decisions,
* read/unread notifications,
* audit trail additions.

### Persistence

Use `localStorage` to persist demo state across refresh.

Reason:

* demo should not reset unexpectedly,
* browser refresh should not destroy progress,
* sign-off state should remain visible after reload.

### Reset Demo Data

Add a clear reset mechanism.

Preferred location:

* TopBar dropdown, or
* Settings / Persona Management page.

Button label:

```txt
Reset Demo Data
```

Behavior:

```txt
When clicked, clear localStorage demo state and reload mock JSON initial state.
```

Show confirmation modal before reset:

```txt
This will reset all demo progress and restore the original mock data. Continue?
```

### State Mutation Expectations

The following actions must mutate visible UI state:

| User Action               | Expected State Change                             |
| ------------------------- | ------------------------------------------------- |
| Submit CAPA intake        | CAPA appears in CAPA list                         |
| Accept Nova suggestion    | Suggestion status changes to accepted             |
| Edit Nova suggestion      | Suggestion status changes to edited               |
| Replace Nova suggestion   | Suggestion status changes to replaced             |
| Complete 8D step          | CAPA currentStep advances                         |
| Add CA                    | CA appears in CAPA Actions tab and global CA list |
| Add PA                    | PA appears in CAPA Actions tab and global PA list |
| Complete verification     | Verification data appears in CAPA detail          |
| Approve sign-off          | Approval event becomes approved                   |
| All approvers approve     | CAPA status becomes closed                        |
| Mark notification as read | Notification read state updates                   |
| Any major action          | New audit trail event is added                    |

---

## 23. Audit Trail Rules

Audit trail must make the demo feel enterprise-ready.

Every meaningful user action should create an audit event.

### Required Audit Event Types

| Event                                  | Domain      |
| -------------------------------------- | ----------- |
| Source data imported from Bizzmine     | integration |
| Source data imported from Q100+        | integration |
| Nova generated severity classification | ai_decision |
| Nova suggestion accepted               | ai_decision |
| Nova suggestion edited                 | ai_decision |
| Problem statement updated              | system      |
| Containment action added               | system      |
| Root cause confirmed                   | system      |
| Corrective action added                | system      |
| Preventive action added                | system      |
| Verification completed                 | system      |
| E-signature submitted                  | system      |
| CAPA approved                          | system      |
| CAPA closed                            | system      |

### Audit Trail Copy Style

Audit trail text must be in English.

Examples:

```txt
Andi Wijaya imported deviation data from Bizzmine for DEV-2026-0341.
Nova generated Major severity classification with 86% confidence.
Andi Wijaya accepted Nova suggestion for D2 Containment Action.
Siti Rahmawati approved CAPA-2026-0341 with electronic signature.
CAPA-2026-0341 was marked as Audit Ready and Closed.
```

### AI Decision Audit

For Nova-related events, include:

* AI model name: `Nova Mock Engine`
* model version: `nova-demo-v1`
* confidence score,
* suggestion status,
* timestamp.

---

## 24. Notification Rules

Notifications are mocked but must behave consistently.

### Required Notification Scenarios

| Trigger                            | Recipient             | Notification                     |
| ---------------------------------- | --------------------- | -------------------------------- |
| CAPA submitted                     | QA reviewer           | New CAPA requires review         |
| CAPA ready for department approval | Department Head       | CAPA requires your approval      |
| Department approved                | QA reviewer           | CAPA approved by Department Head |
| QA review approved                 | Head of QA            | CAPA requires final approval     |
| CAPA rejected                      | Initiator             | CAPA was rejected with notes     |
| Due date near                      | PIC                   | Action due date approaching      |
| CAPA closed                        | All involved personas | CAPA has been closed             |

### Notification Copy Style

Use English.

Example:

```txt
CAPA-2026-0341 requires your approval.
```

```txt
Corrective Action CA-2026-0341-01 is due in 3 days.
```

---

## 25. Nova Interaction Rules

Nova is a simulated AI coach.
Nova must feel helpful, structured, and audit-aware.

### Nova Personality

Nova should sound:

* professional,
* concise,
* quality-minded,
* audit-aware,
* coaching-oriented,
* not overly casual.

Nova should not sound:

* magical,
* too verbose,
* too salesy,
* uncertain without reason,
* like a generic chatbot.

### Nova Response Format

Most Nova responses should follow this pattern:

```txt
Observation:
[What Nova noticed]

Recommendation:
[What the user should do]

Audit Rationale:
[Why this matters for audit readiness]
```

### Nova Suggestion Actions

Every major Nova suggestion card must support:

* Accept
* Edit
* Replace

When the user clicks:

| Action  | Behavior                                 |
| ------- | ---------------------------------------- |
| Accept  | Use Nova suggestion as-is                |
| Edit    | Allow user to modify suggestion          |
| Replace | Load an alternative hardcoded suggestion |

### Nova Loading States

Use deterministic mocked delay.

Examples:

```txt
Nova is analyzing source data...
Nova is comparing similar CAPA cases...
Nova is generating corrective action options...
Nova is checking audit readiness...
```

Delay range:

```txt
1.5s to 3s
```

Do not use real AI API calls.

### Nova Fallback Response

If user enters unscripted chat text, use generic fallback:

```txt
Nova can help refine this step by checking whether the content is specific, evidence-based, linked to root cause, and strong enough for audit review.
```

---

## 26. Quality Scoring Rules

Quality score is rule-based and computed in the frontend.

Total score:

```txt
0–100
```

Score categories:

| Category             | Max Score |
| -------------------- | --------: |
| Problem Specificity  |        25 |
| Root Cause Depth     |        25 |
| Action Effectiveness |        25 |
| Containment Strength |        25 |

### Audit Ready Rule

```txt
score >= 80 = Audit Ready
score < 80 = Not Audit Ready
```

### Score UI

Must show:

* total score,
* score breakdown,
* improvement tips,
* audit-ready badge,
* blocker if score is too low for sign-off.

### Score Behavior

Score should visibly improve when the user:

* adds specific date,
* adds equipment ID,
* adds batch/lot number,
* adds measurement,
* confirms root cause,
* links CA to root cause,
* adds PA,
* completes verification evidence.

### Score Copy

Use English.

Examples:

```txt
Add affected batch number to improve problem specificity.
```

```txt
Link corrective action to confirmed root cause before continuing.
```

```txt
This CAPA is Audit Ready.
```

---

## 27. Implementation Guardrails for AI Agents

These rules are mandatory.

### Do Not Build

Do not build:

* backend server,
* database,
* real authentication,
* real SSO,
* real e-signature certificate authority,
* real AI/LLM calls,
* real Bizzmine integration,
* real Q100+ integration,
* real MES integration,
* real file upload storage,
* real email sending,
* real notification service,
* complex permission engine,
* mobile-first responsive redesign,
* unnecessary admin settings.

### Do Not Over-Engineer

Avoid:

* excessive abstraction,
* generic enterprise framework,
* overly complex state machines,
* unnecessary context providers,
* too many custom hooks before UI works,
* building every edge case,
* implementing hidden features not needed for demo.

### Prioritize

Prioritize:

1. deterministic demo flow,
2. working navigation,
3. polished screens,
4. complete three end-to-end cases,
5. realistic mock data,
6. smooth Nova interactions,
7. visible audit trail,
8. stable state persistence,
9. no broken buttons,
10. no empty pages.

### Dependency Rules

Use the dependencies already listed in the planning document.

Do not add new dependencies unless clearly necessary.

If adding a dependency, document why it is needed.

### Styling Rules

Use:

* Tailwind CSS,
* CSS variables from design tokens,
* Radix primitives where needed,
* Lucide icons,
* Recharts for charts.

Do not use ShadCN CLI.

Do not introduce a separate design system library.

### Data Rules

All initial data must come from JSON files.

Do not hardcode large data directly inside components.

Allowed:

* small UI constants,
* route config,
* label mappings,
* status color mappings.

Not allowed:

* full CAPA cases hardcoded inside page components,
* full Nova scripts hardcoded inside components,
* full dashboard data hardcoded inside components.

### Error Prevention

Every route must have:

* loading state if needed,
* not-found state if ID does not exist,
* safe fallback for missing optional data,
* no runtime crash when mock field is missing.

### Demo Stability

No button should appear clickable if it does nothing, unless it intentionally shows a mocked toast.

For mocked actions, show toast such as:

```txt
Export will be available in the production version.
```

or:

```txt
Mock email notification sent.
```

---

## 28. Build Priority After This Update

The implementation should follow this order.

### Phase 1 — Demo Foundation

Build first:

1. Vite + React + TypeScript + Tailwind setup
2. React Router routes
3. Layout shell
4. Sidebar
5. Top bar
6. Persona switcher
7. mock data files
8. TypeScript types
9. Zustand stores
10. localStorage persistence
11. reset demo data

Do not start complex UI before this foundation works.

### Phase 2 — Three Golden Case Data

Prepare complete mock data for:

1. Deviation case — `DEV-2026-0341`
2. Audit Finding case — `AUD-2026-0089`
3. Complaint case — `CMP-2026-0112`

Each case must have:

* finding,
* prefill,
* CAPA case,
* Nova scripts,
* RCA data,
* CA suggestions,
* PA suggestions,
* verification data,
* sign-off chain,
* audit trail seed,
* notifications.

### Phase 3 — Core Navigation Screens

Build:

1. Dashboard
2. Findings List
3. Finding Detail
4. CAPA List
5. CAPA New
6. CAPA Detail

At this point, the user should already be able to navigate from dashboard to finding to CAPA.

### Phase 4 — 8D Workflow

Build:

1. D1 Problem
2. D2 Containment
3. D3 RCA
4. D4 Corrective Action
5. D5 Preventive Action
6. D6 Verification
7. D7 Sign-Off

This is the heart of the demo.

### Phase 5 — Enterprise Completeness

Build:

1. Corrective Action List
2. Preventive Action List
3. Similarity Explorer
4. Audit Trail
5. Notifications
6. Topics Grouping
7. Consolidated Action Plan

### Phase 6 — Polish

Add:

1. animations,
2. score count-up,
3. Nova thinking dots,
4. shimmer loading,
5. better empty states,
6. confetti when first reaching Audit Ready,
7. export mocked toast,
8. final visual QA pass.

---

## 29. Definition of Done

The prototype is considered demo-ready only when all of the following are true:

### Navigation

* All sidebar links work.
* All primary routes render.
* Browser back/forward works.
* Invalid IDs show a clean not-found state.

### Demo Cases

* Deviation case works end-to-end.
* Audit Finding case works end-to-end.
* Complaint case works end-to-end.
* Each case can reach Audit Ready and Closed state.

### Nova

* Nova appears in intake.
* Nova appears in RCA.
* Nova suggestions support Accept/Edit/Replace.
* Nova chat panel opens.
* Nova mocked loading states work.
* Nova responses are English-first.

### CAPA Workflow

* User can complete D1 to D7.
* Blockers prevent invalid progression.
* Score updates based on user input.
* Sign-off requires score >= 80.
* Approval cascade works.
* Final status becomes Closed.

### State

* Refresh does not destroy demo progress.
* Reset Demo Data works.
* Audit trail updates after key actions.
* Notifications update when relevant.

### Visual Quality

* UI looks polished enough for stakeholder demo.
* No obvious layout break on 1920×1080.
* No raw JSON visible.
* No placeholder lorem ipsum visible.
* No broken icons.
* No console errors during golden flow.

### Mock Integrity

* No real API calls.
* No backend requirement.
* No real AI integration.
* No real auth.
* No real upload service.

### Final Demo Test

Before considering the prototype complete, run this manual test:

```txt
1. Open /dashboard.
2. Complete Deviation case from finding to sign-off.
3. Refresh page and confirm state persists.
4. Reset demo data.
5. Complete Audit Finding case from finding to sign-off.
6. Complete Complaint case from finding to sign-off.
7. Open Audit Trail and confirm events exist.
8. Open Notifications and confirm relevant updates exist.
9. Open Corrective Action List and Preventive Action List.
10. Confirm no route crashes and no major button is dead.
```

If all steps pass, the prototype is demo-ready.

*End of Planning Document v1.1*
