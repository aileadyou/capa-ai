# CAPA AI — Wireframe Specification
> **Purpose:** Basis for creating an HTML wireframe of the reworked CAPA AI application.
> Based on: Bio Farma RFI (TOR 03710/TOR/02/2026, 76 pages) + live app analysis.
> Last updated: 2026-05-31

---

## Table of Contents
1. [Konteks Bisnis — Apa Itu CAPA?](#1-konteks-bisnis--apa-itu-capa)
2. [Analisis Aplikasi Saat Ini](#2-analisis-aplikasi-saat-ini)
3. [Masalah UX yang Ditemukan](#3-masalah-ux-yang-ditemukan)
4. [Gap Analysis vs RFI Bio Farma](#4-gap-analysis-vs-rfi-bio-farma)
5. [Rekomendasi Rombakan — Arsitektur Baru](#5-rekomendasi-rombakan--arsitektur-baru)
6. [Wireframe Specifications (Per Screen)](#6-wireframe-specifications-per-screen)

---

## 1. Konteks Bisnis — Apa Itu CAPA?

### Plain Language untuk Non-Industri

Bayangkan kamu kerja di pabrik obat. Setiap hari ada kemungkinan sesuatu tidak berjalan sesuai standar — misalnya mesin HEPA filter di ruangan steril mulai menunjukkan partikel debu yang lebih banyak dari batas yang diizinkan, atau ada laporan dari rumah sakit bahwa ada vaksin yang terlihat ada partikelnya.

Kejadian seperti itu disebut **"Finding"** (temuan). Di industri farmasi teregulasi (GMP), setiap temuan **wajib ditangani secara terstruktur, terdokumentasi, dan bisa diaudit** — karena menyangkut keselamatan produk dan pasien.

CAPA adalah singkatan dari **Corrective Action Preventive Action**. Artinya:
- **Corrective Action (CA)**: "Kita perbaiki sekarang" — tambal HEPA filternya, tarik vaksin yang bermasalah.
- **Preventive Action (PA)**: "Kita pastikan ini tidak terulang" — ubah jadwal penggantian filter, tambah double-check di lini produksi.

### Proses CAPA Bio Farma (AS-IS, sebelum sistem AI)

Bio Farma saat ini punya 3 jenis CAPA:

| Jenis | Sumber Temuan | Sistem Saat Ini |
|-------|--------------|-----------------|
| Deviation | Penyimpangan dari SOP/spesifikasi di lantai produksi | Bizzmine |
| Audit Finding | Temuan dari audit internal/eksternal (BPOM, WHO) | Q100+ |
| Complaint | Keluhan dari customer/rumah sakit | Bizzmine Complaint |

**Masalahnya**: Data ada di 3 sistem yang tidak terhubung. Investigasi akar masalah (Root Cause Analysis/RCA) dilakukan manual — QA analyst membaca laporan, berfikir, lalu menulis di formulir. Tidak ada AI, tidak ada saran otomatis, tidak ada dashboard terintegrasi. Kalau diaudit BPOM, mereka harus kumpulkan bukti dari berbagai sistem secara manual.

### Proses CAPA dengan Sistem Baru (TO-BE — yang Bio Farma inginkan)

```
EQMS / MES / Bizzmine / Q100+
         ↓ (API via Kong Gateway)
   CAPA AI Platform
         ↓
   AI parsing & classification
   AI suggests: RCA, CA, PA, Similar past CAPAs
         ↓
   QA User reviews & approves (human-in-the-loop)
         ↓
   8D Structured Workflow (D1→D7)
         ↓
   Sign-off → Closed → Dashboard Analytics
         ↓
   Audit-ready, traceable, ALCOA+ compliant
```

### Metodologi 8D — Penjelasan Singkat

8D (Eight Disciplines) adalah metode penyelesaian masalah standar industri. Setiap "D" adalah satu tahap:

| Step | Nama | Isi |
|------|------|-----|
| D1 | Problem Statement | Deskripsikan masalah dengan spesifik dan terukur |
| D2 | Containment | Tindakan sementara supaya masalah tidak meluas (misal: karantina batch) |
| D3 | Root Cause Analysis (RCA) | Cari akar masalah sebenarnya (5 Whys, fishbone, dll) |
| D4 | Corrective Action (CA) | Rencana perbaikan permanen |
| D5 | Preventive Action (PA) | Rencana pencegahan supaya tidak terulang |
| D6 | Verification | Buktikan bahwa CA dan PA berhasil |
| D7 | Sign-Off | QA Manager dan stakeholder formal menutup kasus |

---

## 2. Analisis Aplikasi Saat Ini

### Navigasi & Struktur URL

```
/dashboard              → Analytics Dashboard
/findings               → Findings List (15 findings demo)
/capa                   → CAPA List (8 CAPAs demo)
/capa/new               → New CAPA Intake form
/capa/:id               → CAPA Detail (4 tabs: Overview, 8D Workflow, Audit Trail, Actions)
/capa/:id/8d/problem    → D1 Problem Statement
/capa/:id/8d/containment → D2 Containment
/capa/:id/8d/rca        → D3 Root Cause Analysis
/capa/:id/8d/ca         → D4 Corrective Action
/capa/:id/8d/pa         → D5 Preventive Action
/capa/:id/8d/verification → D6 Verification
/capa/:id/8d/signoff    → D7 Sign-Off
```

### User Flow Saat Ini (Screen-by-Screen)

#### FLOW A — Melihat kondisi keseluruhan (QA Manager)
```
[Dashboard /dashboard]
├── KPI Cards: Total Findings (6), Open CAPAs (6), Overdue CAPAs (2), Effectiveness Rate (87%)
├── Finding Trend line chart (12 bulan)
├── Breakdown by Type donut chart (Deviation 5, Audit Finding 5, Complaint 5)
├── Top Root Cause Categories bar chart
├── Department Completion Heatmap (Fill-Finish 78%, Warehouse 64%, dll)
└── CTA button: "Open Findings →" → /findings
```

#### FLOW B — Melihat temuan dan membuka CAPA (QA Analyst)
```
[Findings List /findings]
├── Header: "Findings List" + subtitle + "New CAPA +" button
├── Filter bar: Search, Type, Severity, Status, Department, Dates
├── Table: ID | TYPE | DESCRIPTION | SEVERITY | DEPARTMENT | REPORTED | STATUS | ACTION
│   └── Per row: [View Finding] [Quick View 👁] [Open CAPA →]
├── Status badge examples: "CAPA In Progress", "CAPA Closed"
└── Source badge: "Imported from Bizzmine" / "Imported from Q100+"
    ↓ klik "Open CAPA"
[CAPA Detail /capa/:id]
```

#### FLOW C — Membuat CAPA baru dari scratch (QA Analyst)
```
[CAPA List /capa] atau [Findings /findings]
    ↓ klik "New CAPA +"
[New CAPA Intake /capa/new]
├── Source Import: CAPA Type dropdown + Source ID input + "Fetch from Bizzmine" button
├── CAPA Draft: Suggested title field
├── Nova Coach Tip (kuning): "Fetch source data first..."
├── Gate Questions:
│   ├── "What happened and when was it observed?"
│   ├── [lebih banyak pertanyaan di bawah]
└── Submit to QA button (di atas)
```

#### FLOW D — Mengelola CAPA dan menjalankan 8D (QA Analyst)
```
[CAPA List /capa]
├── Table: CAPA ID + title | TYPE | SEVERITY | STATUS | QUALITY score | PIC | DUE DATE | ACTION
│   └── Per row: [Open →]
    ↓ klik "Open"
[CAPA Detail /capa/:id]
├── Badges: source, type, severity, status, quality score
├── Header: CAPA ID + Title
├── Action buttons: [Export] [Continue Workflow →]
├── Info bar: CAPA ID | TYPE | DEPARTMENT | CURRENT STEP | UPDATED
├── Tabs: [Overview] [8D Workflow] [Audit Trail] [Actions]
│
├── Tab: Overview
│   ├── Source Data (deviation/audit/complaint raw data)
│   ├── QA Disposition (reviewed by, assigned to, severity, rationale text)
│   └── Nova Summary (AI insight + confirmed root cause + RCA method)
│
├── Tab: 8D Workflow (hanya menampilkan step links, bukan konten)
│
├── Tab: Audit Trail (timeline of all actions)
│
└── Tab: Actions (???  — tidak sempat dicapture)
    ↓ klik "Continue Workflow"
[8D Steps /capa/:id/8d/:step]
```

#### FLOW E — Menjalankan 8D Workflow (D1–D7)
```
[D1 Problem Statement]
├── Badges: severity, status, type
├── "Back to CAPA" button
├── 8D Workflow bar: [D1 problem] [D2 containment] [D3 rca] [D4 CA] [D5 PA] [D6 verification] [D7 signoff]
│   (D1 highlighted, sisanya clickable)
├── Card: "Nova Suggested Problem" (AI generated text) + [Use Nova Suggestion] button
├── Card: "Problem Statement Editor" → Textarea
├── 2-column layout: Main content (kiri) | Score Sidebar + Nova Coach Tip (kanan)
└── Bottom buttons: [Coach me on this step] [Continue to D2 →]

[D2–D6: pola serupa]
  ├── 8D nav bar di atas
  ├── AI suggestion card
  ├── Form editor
  ├── Validation checklist (CheckCircle icons)
  ├── Score Sidebar (kanan)
  └── Navigation buttons

[D7 Sign-Off]
├── Sign-off form: PIC, role, notes
├── Approval simulation
└── "Close CAPA" button
```

---

## 3. Masalah UX yang Ditemukan

### 3.1 Tidak Ada Navigasi Sidebar

**Masalah**: Satu-satunya navigasi adalah header bar atas (logo "AI Coach Nova" + user dropdown + notifikasi). Tidak ada sidebar, tidak ada menu permanent. User harus hafal URL atau klik logo untuk balik ke dashboard.

**Dampak**: User baru tidak tahu cara berpindah antar halaman. Mereka cenderung klik tombol "Back" browser, yang bisa menyebabkan kehilangan state.

### 3.2 Hubungan Finding → CAPA Tidak Jelas

**Masalah**: Ada dua halaman terpisah — `/findings` dan `/capa`. User tidak langsung paham bahwa Finding adalah "sumber masalah" sedangkan CAPA adalah "kasus penanganannya". Satu Finding bisa menghasilkan satu CAPA.

**Dampak**: User bingung: "Harus mulai dari mana? Findings dulu atau CAPA dulu?"

### 3.3 Dua Entry Point Membuat CAPA (Redundan dan Membingungkan)

**Masalah**: Tombol "New CAPA +" ada di halaman `/findings` DAN di halaman `/capa`. Keduanya mengarah ke `/capa/new` — form yang sama. Di halaman `/findings`, ada juga tombol "Open CAPA" per baris yang terasa berbeda tapi tujuannya sama.

**Dampak**: User bertanya-tanya: "Apa bedanya 'Open CAPA' di findings vs 'New CAPA' di CAPA list?"

### 3.4 CAPA Detail Tab "8D Workflow" Menyesatkan

**Masalah**: Tab "8D Workflow" di halaman CAPA Detail tidak menampilkan konten 8D secara inline — ia hanya menampilkan link ke halaman `/8d/:step` terpisah. "Continue Workflow" button di header malah melompat ke step yang relevan.

**Dampak**: User klik tab "8D Workflow", lalu tidak tahu harus ngapain karena tidak ada konten di sana. Mereka tidak menyadari bahwa untuk benar-benar mengisi 8D, mereka harus klik "Continue Workflow" button yang ada di atas.

### 3.5 8D Pages Tidak Ada Persistent Context

**Masalah**: Di halaman D1–D7, tidak terlihat jelas "saya sedang mengerjakan CAPA apa?". Hanya ada badges (Major, Investigation, Deviation) tapi tidak ada nama/ID CAPA yang jelas di heading. Tombol "Back to CAPA" posisinya di tengah halaman dan tidak konsisten (di D1 ada, di D6 sudah ada di top-right area).

**Dampak**: User yang buka banyak tab atau berpindah CAPA akan kehilangan orientasi.

### 3.6 Kualitas Score Tidak Explained

**Masalah**: Score "77 · Improve Score" muncul di CAPA List, di CAPA Detail badge, dan di Score Sidebar tiap halaman 8D. Tapi tidak ada tooltip atau penjelasan tentang apa artinya angka ini, bagaimana dihitungnya, atau apa yang perlu dilakukan untuk menaikkannya.

**Dampak**: User berpengalaman mungkin mengabaikan score ini. User baru tidak akan tahu score itu penting untuk compliance.

### 3.7 Nova AI — 4 Pattern, 1 Persona, Tidak Konsisten

**Masalah**: Nova muncul sebagai:
1. **Header logo** — "AI Coach Nova" (navigasi/branding, bukan interaktif)
2. **Suggested content block** — di D1/D3/D4/D5 (saran AI inline, bisa di-accept)
3. **Coach tip sidebar** — di setiap 8D page (tips pasif di kanan)
4. **Chat button** — "Coach me on this step" (opens Nova chat modal)

Tidak ada konsistensi kapan Nova muncul aktif (interaktif) vs pasif (informational).

**Dampak**: User tidak tahu kapan Nova bisa membantu, dan sering melewatkan saran AI yang berguna.

### 3.8 "Reset Demo Data" Button Visible Production-Ready UI

**Masalah**: Ada tombol "Reset Demo Data" di header utama. Ini jelas tombol demo, tapi merusak kesan professional saat dipresentasikan ke Bio Farma.

### 3.9 User Role Tidak Terefleksi di UI

**Masalah**: Ada user "Andi Wijaya · Senior Operator" di header dropdown. Tapi semua halaman menampilkan content yang sama, tidak ada perbedaan tampilan berdasarkan role (QA Analyst vs QA Supervisor vs Manager).

**Dampak**: Tidak mencerminkan kebutuhan Bio Farma untuk Role-Based Access Control (RBAC) yang disebutkan di RFI.

---

## 4. Gap Analysis vs RFI Bio Farma

### Legend
- ✅ Sudah ada / terimplementasi (meskipun mocked)
- 🟡 Sebagian ada / belum lengkap
- ❌ Belum ada

### Tabel Gap Analysis

| REQ ID | Requirement | Status | Catatan |
|--------|-------------|--------|---------|
| REQ001 | Integrasi dengan EQMS (Bizzmine) via API | 🟡 | Data sudah ada (hardcoded), integrasi real belum |
| REQ002 | Integrasi dengan QMS Audit (Q100+) | 🟡 | Idem |
| REQ003 | Integrasi dengan MES | ❌ | Tidak ada |
| REQ004 | Dashboard monitoring CAPA | ✅ | Ada: KPI, trend, heatmap, breakdown by type |
| REQ005 | Role-Based Access Control (RBAC) | ❌ | User switcher ada tapi tidak ada perbedaan akses |
| REQ006 | Audit Trail (ALCOA+) | 🟡 | Ada tab "Audit Trail" di CAPA Detail, tapi tidak full ALCOA+ |
| REQ007 | Notifikasi & alerting otomatis | 🟡 | Ada notif bell (1 item demo), tapi tidak automated |
| REQ008 | CAPA Intake (create new CAPA) | ✅ | Ada form di /capa/new |
| REQ009 | AI-generated Problem Statement (D1) | ✅ | Nova Suggested Problem ada di D1 |
| REQ010 | AI-generated Root Cause Analysis (D3) | ✅ | Nova suggestions ada di D3 |
| REQ011 | AI-generated Corrective Action (D4) | ✅ | Nova suggestions ada di D4 |
| REQ012 | AI-generated Preventive Action (D5) | ✅ | Nova suggestions ada di D5 |
| REQ013 | Similarity analysis (past similar CAPAs) | 🟡 | Disebutkan di Nova summary tapi tidak ada dedicated screen |
| REQ014 | 8D Structured Workflow (D1–D7) | ✅ | Full D1–D7 ada |
| REQ015 | Containment Actions (D2) | ✅ | Ada D2 page |
| REQ016 | Verification of effectiveness (D6) | ✅ | Ada D6 page dengan method + evidence |
| REQ017 | Sign-off workflow (D7) | ✅ | Ada D7 page |
| REQ018 | Quality Score per CAPA | ✅ | Score 0–100 ada di CAPA list dan 8D sidebar |
| REQ019 | Export CAPA record | 🟡 | "Export" button ada tapi fungsinya belum clear |
| REQ020 | Nova AI Coach (guidance per step) | ✅ | Nova coach tips + chat modal ada di setiap 8D step |
| REQ021 | Human-in-the-loop validation | ✅ | User harus accept/reject tiap AI suggestion |
| REQ022 | Integrasi ke Change Control module | ❌ | Tidak ada |
| REQ023 | Regulatory reporting (BPOM format) | ❌ | Tidak ada |
| REQ024 | Findings inbox (triase temuan) | ✅ | Findings List ada |
| REQ025 | SLA tracking per CAPA | 🟡 | Due date ada di CAPA list, tapi tidak ada SLA countdown atau alert |
| REQ026 | Overdue CAPA alerting | 🟡 | "Overdue CAPAs: 2" di dashboard tapi tidak ada notifikasi detail |
| REQ027 | CAPA aging report | ❌ | Tidak ada |
| REQ028 | Mobile-responsive | 🟡 | Layout ada responsive classes, belum diverifikasi mobile |
| REQ029 | Multi-language (ID/EN) | ❌ | English only |
| REQ030 | API Documentation | ❌ | Frontend only, tidak ada backend |

### Ringkasan Coverage
- ✅ Fully covered: **13/30** requirements (43%)
- 🟡 Partially covered: **9/30** requirements (30%)
- ❌ Not covered: **8/30** requirements (27%)

### Catatan Penting
App saat ini adalah **frontend demo/prototype** — semua data hardcoded, tidak ada backend real. Yang perlu divalidasi ke Bio Farma adalah **UI/UX flow dan AI interaction pattern**, bukan infrastruktur. Untuk PoC (Proof of Concept) tujuan ini, coverage 43% full + 30% partial sudah cukup representatif untuk demonstrasi workflow.

---

## 5. Rekomendasi Rombakan — Arsitektur Baru

### 5.1 Prinsip Desain

1. **Single mental model**: User harus bisa menjawab "saya sedang di mana, sedang mengerjakan apa" di setiap halaman.
2. **Progressive disclosure**: Informasi yang kompleks (8D steps, AI scores) ditampilkan bertahap — tidak semuanya sekaligus.
3. **Nova AI terintegrasi, bukan terisolasi**: Nova harus terasa seperti satu asisten yang konsisten, bukan 4 komponen berbeda.
4. **Role-aware layout**: Tampilan berbeda untuk Initiator (QA Analyst) vs Reviewer (QA Supervisor) vs Admin.

### 5.2 Navigasi Baru — Persistent Left Sidebar

```
┌─────────────────────────────────────────────┐
│  🤖 CAPA AI          [User dropdown] [Bell]  │
├──────────┬──────────────────────────────────┤
│ SIDEBAR  │                                  │
│ ─────    │    MAIN CONTENT AREA             │
│ 📊 Dashboard                                │
│ 📋 My Work  (badge: 3)                      │
│ 🔍 Findings                                 │
│ 📁 CAPAs                                    │
│ 📈 Reports                                  │
│ ─────    │                                  │
│ ⚙️ Settings                                 │
│ ❓ Help   │                                  │
└──────────┴──────────────────────────────────┘
```

**My Work** = inbox personal — CAPAs yang di-assign ke user yang login. Ini adalah halaman yang pertama dilihat user, bukan dashboard analytics (yang lebih relevan untuk manager).

### 5.3 User Flow Baru

#### Primary Flow — QA Analyst (Initiator)
```
Login → My Work (inbox)
         ↓
  Lihat list CAPAs yang di-assign ke saya
         ↓
  Klik CAPA → CAPA Hub page
         ↓
  Klik "Start/Continue 8D" → 8D step yang relevan
         ↓
  Isi form → Accept/edit AI suggestion → Save & Next
         ↓
  Selesai D7 → Submit for sign-off
```

#### Secondary Flow — QA Supervisor (Reviewer)
```
Login → My Work (inbox)
         ↓
  "Pending Review" section: CAPAs waiting for my approval
         ↓
  Review D7 sign-off request
         ↓
  Approve / Reject with comment
```

#### Tertiary Flow — QA Manager (Monitor)
```
Login → Dashboard (default untuk Manager role)
         ↓
  Lihat KPI, overdue, department heatmap
         ↓
  Drill down ke specific CAPA atau department
```

### 5.4 CAPA Hub — Desain Ulang CAPA Detail

Ganti tabs (Overview, 8D Workflow, Audit Trail, Actions) dengan **single scrollable page** + **left progress panel**:

```
┌─────────────────────────────────────────────────────┐
│ ← Back to CAPAs                                     │
│ CAPA-2026-0341  Environmental Monitoring Excursion  │
│ [Major] [Deviation] [Investigation] [Score: 77]     │
├─────────────┬───────────────────────────────────────┤
│ 8D Progress │  CONTENT AREA                        │
│ ─────────   │                                      │
│ ✅ D1       │  [depends on selected step]          │
│ ✅ D2       │                                      │
│ ✅ D3 RCA   │  Nova AI panel (contextual)          │
│ 🔵 D4 CA ← │                                      │
│   D5 PA     │  Form / editor                       │
│   D6 Verify │                                      │
│   D7 Signoff│  Validation checklist                │
│ ─────────   │                                      │
│ Score: 77   │  [Save Draft] [Continue →]           │
│ Audit Trail │                                      │
│ Export      │                                      │
└─────────────┴───────────────────────────────────────┘
```

**Key changes:**
- 8D steps selalu visible di sidebar kiri (progress tracker)
- Click any step langsung jump ke step itu (tidak perlu balik ke CAPA detail dulu)
- Score dan audit trail accessible dari sidebar, bukan hidden di tab
- CAPA context (ID, title, severity) selalu visible di header

### 5.5 Nova AI — Unified Experience

Satu pola Nova yang konsisten di seluruh aplikasi:

```
┌─────────────────────────────────────────────┐
│ 🤖 Nova                          [×] [↕]    │
│ ─────────────────────────────────────────   │
│ Konteks: D4 Corrective Action               │
│ CAPA: CAPA-2026-0341                        │
│ ─────────────────────────────────────────   │
│ Saran Nova:                                 │
│ "Replace HEPA filter pada interval 12 bulan │
│  dan verifikasi dengan airflow test..."      │
│                                             │
│ [Gunakan saran ini] [Edit dulu] [Tanya Nova]│
│ ─────────────────────────────────────────   │
│ 💬 Tanya sesuatu...              [Kirim]    │
└─────────────────────────────────────────────┘
```

Nova muncul **inline di dalam konten** (bukan floating popup) dengan 3 fungsi yang jelas:
1. **Suggestion panel** — AI suggestion yang bisa di-accept/edit
2. **Coach tips** — dalam lipatan (collapsed by default, expandable)
3. **Free chat** — tanya langsung ke Nova

---

## 6. Wireframe Specifications (Per Screen)

> Format: `SCREEN-XX — Nama Screen`
> Setiap section berisi: Purpose, Layout, Components, Interactions, Notes

---

### SCREEN-01 — My Work (Inbox / Home)

**Purpose**: Landing page utama setelah login. User langsung lihat pekerjaan yang harus dilakukan hari ini.

**Layout**: Sidebar kiri (persistent) + main content 2 kolom

**Components**:
```
HEADER
├── Logo "CAPA AI" + sidebar toggle
├── User avatar + name + role dropdown
├── Notification bell (badge count)
└── Nova AI quick access button

LEFT SIDEBAR (160px wide)
├── [Avatar + Name + Role]
├── ─── NAVIGATION ───
├── 📊 Dashboard
├── 📋 My Work (active, badge "3")
├── 🔍 Findings
├── 📁 CAPAs
├── 📈 Reports
├── ─── ───────────── ───
├── ⚙️ Settings
└── ❓ Help

MAIN CONTENT
├── SECTION: "Good morning, Andi 👋" + current date
│
├── SECTION: "Needs Your Attention" (CAPAs overdue or due today)
│   └── Alert card: CAPA-2026-0341 · Due in 6 days · D4 CA pending
│
├── SECTION: "My Active CAPAs" (assigned to me, in progress)
│   └── Cards (kanban-lite):
│       ├── [CAPA ID] [Title] [Type badge] [Due] [Current Step badge]
│       └── [Open CAPA →] button per card
│
├── SECTION: "Pending Review" (CAPAs waiting for my sign-off)
│   └── Same card format, different CTA: [Review →]
│
└── SECTION: "Recently Closed" (last 5 completed CAPAs)
```

**Interactions**:
- Click "Open CAPA →" → navigate to SCREEN-05 (CAPA Hub)
- Click "Review →" → navigate to SCREEN-11 (D7 Sign-Off)
- Click notification bell → dropdown of recent activity

---

### SCREEN-02 — Dashboard (Analytics)

**Purpose**: High-level monitoring untuk QA Manager/Supervisor.

**Layout**: Sidebar kiri + main content full-width

**Components**:
```
HEADER (same persistent header)

MAIN CONTENT
├── Page title: "Analytics Dashboard"
├── Subtitle: "Month to date · May 2026"
├── Date range picker (dropdown: This Month / Last 30 Days / Custom)
│
├── ROW 1 — KPI Cards (4 columns)
│   ├── [Total Findings] 6 · Month to date
│   ├── [Open CAPAs] 6 · Across all statuses
│   ├── [Overdue CAPAs] 2 · [!] Needs attention (red accent)
│   └── [Effectiveness Rate] 87% · Verified CAPAs
│
├── ROW 2 — Charts (2 columns, 60/40 split)
│   ├── Finding Trend (line chart, 12 months)
│   └── Breakdown by Type (donut: Deviation, Audit, Complaint)
│
├── ROW 3 — More Charts (2 columns)
│   ├── Top Root Cause Categories (horizontal bar chart)
│   └── Department Completion Heatmap (progress bars per dept)
│
└── ROW 4 — Quick Actions
    ├── [View All Overdue CAPAs →]
    └── [View All Open Findings →]
```

**Interactions**:
- Hover on chart data point → tooltip with detail
- Click KPI card → navigate to filtered CAPA list
- Click department in heatmap → navigate to filtered CAPA list by dept

---

### SCREEN-03 — Findings List

**Purpose**: Daftar semua temuan (deviasi, audit, complaint) yang masuk. Triase sebelum jadi CAPA.

**Layout**: Sidebar kiri + main content

**Components**:
```
MAIN CONTENT
├── Page title: "Findings"
├── Subtitle + [+ New CAPA] button (top right)
│
├── FILTER BAR
│   ├── [🔍 Search placeholder: "Search ID, description, source..."]
│   ├── Type dropdown: All / Deviation / Audit Finding / Complaint
│   ├── Severity: All / Critical / Major / Minor
│   ├── Status: All / No CAPA / CAPA In Progress / CAPA Closed
│   ├── Department: All / [list departments]
│   └── Date: All / This Week / This Month / Custom range
│
├── RESULTS COUNT: "15 Findings"
│
└── TABLE
    Columns: ID | TYPE | DESCRIPTION | SEVERITY | DEPARTMENT | REPORTED | STATUS | ACTION
    
    Per row:
    ├── ID: "DEV-2026-0341" (link) + source badge below ("Imported from Bizzmine")
    ├── TYPE: "Deviation"
    ├── DESCRIPTION: truncated text (max 2 lines)
    ├── SEVERITY: [Major] badge (color coded)
    ├── DEPARTMENT: "Fill-Finish"
    ├── REPORTED: "18 May 2026"
    ├── STATUS: [CAPA In Progress] badge
    └── ACTION (stacked buttons):
        ├── [View Finding] → SCREEN-04
        └── [Open CAPA →] → SCREEN-05 (or /capa/new if no CAPA yet)
```

**Notes**:
- Remove "Quick View" button — redundant with "View Finding"
- Source badge harus lebih subtle (small pill, not prominent box)
- "New CAPA +" button hanya ada di sini (remove from CAPA list)

---

### SCREEN-04 — Finding Detail (Modal/Slide-over)

**Purpose**: Lihat detail temuan sebelum membuat CAPA. Ditampilkan sebagai slide-over (panel dari kanan), bukan full page navigation.

**Layout**: Slide-over panel (400px dari kanan, overlay)

**Components**:
```
SLIDE-OVER PANEL
├── Header: "Finding Detail" + [×] close + [Open Full Page ↗]
├── Badge row: [Deviation] [Major] [CAPA In Progress]
│
├── Finding ID: DEV-2026-0341
├── Reported: 18 May 2026, 09:42
├── Area: Grade A Fill Suite
├── Line / Equipment: Vaccine Filling Line 2 / HEPA-FF-L2-07
├── Affected Batches: VAC-26-0518-A, VAC-26-0518-B
├── Initiator: Andi Wijaya · Senior Operator
├── SOP References: SOP-EM-014, SOP-PM-HEPA-001, SOP-FF-009
├── Initial Observation: [full text]
│
├── ─── AI Analysis ───
│   ├── Nova Classification: "Major deviation — requires 8D CAPA"
│   └── Similar Past Cases: [CAPA-2025-0234] [CAPA-2025-0187] (links)
│
└── Footer: [Create CAPA from this Finding →] [Dismiss]
```

---

### SCREEN-05 — CAPA Hub (Reworked CAPA Detail)

**Purpose**: Central page untuk satu CAPA. Semua informasi dan akses ke 8D dari satu tempat.

**Layout**: Sidebar kiri (nav) + left panel (8D progress, 280px) + main content area

**Components**:
```
BREADCRUMB: CAPAs / CAPA-2026-0341

HEADER BAR
├── CAPA ID: "CAPA-2026-0341" (large, copyable)
├── Title: "Environmental Monitoring Excursion in Grade A Fill Suite"
├── Badge row: [Imported from Bizzmine] [Deviation] [Major] [Investigation]
├── Quality Score pill: [77 · Improve Score] (clickable → score breakdown)
└── Action buttons: [Export PDF] [Share] [Archive]

2-PANEL LAYOUT
│
LEFT PANEL (280px)
├── ─── 8D PROGRESS ───
│   ├── ✅ D1 Problem Statement    (completed, click to view/edit)
│   ├── ✅ D2 Containment          (completed)
│   ├── ✅ D3 Root Cause Analysis  (completed)
│   ├── 🔵 D4 Corrective Action   (IN PROGRESS — current)
│   ├── ○  D5 Preventive Action   (locked/upcoming)
│   ├── ○  D6 Verification        (locked)
│   └── ○  D7 Sign-Off            (locked)
│
├── ─── CAPA INFO ───
│   ├── PIC: Siti Rahmawati
│   ├── Department: Fill-Finish
│   ├── Due Date: 24 May 2026 (6 days remaining — orange)
│   ├── Created: 18 May 2026
│   └── Source: DEV-2026-0341 [link]
│
├── ─── QUALITY SCORE ───
│   └── 77/100 · Donut chart (collapsed, expandable)
│
├── ─── AUDIT TRAIL ───
│   └── [3 recent events] + [View all →]
│
└── [Export CAPA Record]

RIGHT / MAIN CONTENT
├── SECTION: Overview (always visible)
│   ├── Source Data card (collapsible): deviation/audit raw data
│   ├── QA Disposition card: reviewer, assignment, severity rationale
│   └── Nova Summary card: AI insight summary
│
└── SECTION: Current Step (highlighted)
    └── D4 Corrective Action — inline preview + [Continue Working on D4 →]
```

**Interactions**:
- Click any D-step in left panel → load that step's content inline OR navigate to full step page
- Click [Continue Working on D4 →] → navigate to SCREEN-09 (D4 page)
- Click [77 · Improve Score] → modal showing score breakdown per dimension

---

### SCREEN-06 — New CAPA Intake

**Purpose**: Form untuk membuat CAPA baru. Dapat diisi manual atau dengan fetch dari source system.

**Layout**: Sidebar kiri + main content (single column, max 720px centered)

**Components**:
```
BREADCRUMB: CAPAs / New CAPA

PAGE HEADER
├── Title: "New CAPA Intake"
└── Subtitle: "Import from source system or fill manually"

STEP INDICATOR (horizontal)
[1. Source Import] → [2. Gate Questions] → [3. Impact Assessment] → [4. Review & Submit]

SECTION 1: Source Import
├── CAPA Type: [Deviation ▼] [Audit Finding ▼] [Complaint ▼] (radio or segmented control)
├── Source ID: [Input field: "e.g. DEV-2026-0341"]
├── [🔄 Fetch from Bizzmine / Q100+] button
│
├── ON SUCCESS (after fetch):
│   ├── Green banner: "Data fetched successfully from Bizzmine"
│   ├── Preview card: Source data summary
│   └── [Looks correct, continue →]
│
└── Nova Coach Tip (collapsible):
    "Fetch source data first. Nova will classify all three golden
     demo cases as Major severity and explain the audit rationale."

SECTION 2: Gate Questions
├── Q1: "What happened and when was it observed?"
│   └── Textarea (placeholder: "Include date, shift, area, measurable observation")
├── Q2: "What is the potential product/patient impact?"
│   └── Textarea
├── Q3: "What immediate containment action was taken?"
│   └── Textarea
└── [Continue →]

SECTION 3: Impact Assessment (AI-assisted)
├── Nova Classification:
│   ├── Suggested Severity: [Major] (with rationale)
│   └── [Confirm] [Change to Minor] [Change to Critical]
├── Department assignment
├── PIC assignment
├── Due date
└── [Continue →]

SECTION 4: Review & Submit
├── Summary card: all filled info
├── CAPA Title suggestion (editable)
└── [Submit to QA →] (primary CTA)
```

---

### SCREEN-07 — CAPA List

**Purpose**: Lihat dan filter semua CAPA cases. Access point untuk QA Manager monitoring.

**Layout**: Sidebar kiri + main content

**Components**:
```
MAIN CONTENT
├── Page title: "All CAPAs"
├── Tabs: [All (8)] [In Progress (5)] [Overdue (2)] [Closed (1)]
│
├── FILTER BAR (same pattern as Findings)
│   ├── Search
│   ├── Type / Status / Department / Severity / Date / PIC
│   └── [Export list] button
│
└── TABLE
    Columns: CAPA | TYPE | SEVERITY | STATUS | STEP | QUALITY | PIC | DUE | ACTION
    
    Per row:
    ├── CAPA: "CAPA-2026-0341 / Environmental Monitoring..." (link)
    ├── TYPE: Deviation
    ├── SEVERITY: [Major]
    ├── STATUS: [In Progress]
    ├── STEP: [D4 CA] (current 8D step badge)
    ├── QUALITY: [77] score pill
    ├── PIC: "Siti R."
    ├── DUE: "24 May · 6 days" (red if overdue)
    └── ACTION: [Open →]
```

**Notes**:
- Remove "New CAPA +" from this page — new CAPAs should come from Findings
- Add "STEP" column so user can see 8D progress at a glance

---

### SCREEN-08 — D1 Problem Statement

**Purpose**: Mendefinisikan masalah secara spesifik dan terukur (IS/IS NOT framework atau 5W1H).

**Layout**: CAPA Hub layout dengan left panel (8D progress) + main content

**Components**:
```
[CAPA Hub sidebar — same as SCREEN-05 left panel]

MAIN CONTENT
├── BREADCRUMB: CAPA-2026-0341 / D1 Problem Statement
├── Step header: "D1 — Problem Statement"
├── Progress: Step 1 of 7
│
├── NOVA AI PANEL (top, expandable)
│   ├── 🤖 Nova icon + "Nova's Suggestion"
│   ├── Suggested text: "On 8 June 2026 during vaccine filling..."
│   ├── [✓ Use this suggestion] [✏ Edit first] [Skip]
│   └── [Show reasoning ↓] (expandable explanation why Nova wrote this)
│
├── FORM AREA
│   ├── Label: "Problem Statement"
│   ├── Textarea (pre-filled if Nova suggestion used)
│   ├── Character count + min requirement indicator
│   │
│   └── VALIDATION CHECKLIST
│       ├── ✅ Contains specific date/time
│       ├── ✅ Contains measurable observation
│       ├── ✅ Contains affected area/equipment
│       ├── ○  Minimum 50 characters
│       └── ○  Contains batch or lot number (optional but recommended)
│
├── CONTEXTUAL HELP (collapsible right panel OR tooltip)
│   └── "What makes a good problem statement?
│       Use IS/IS NOT: 'What IS the problem, and what is it NOT?'
│       Example: Particle count IS exceeding Grade A limit.
│       It IS NOT exceeding Grade B limit."
│
└── FOOTER ACTIONS
    ├── [← Back to CAPA Hub] (left)
    └── [Save Draft] [Continue to D2 →] (right, primary)
```

---

### SCREEN-09 — D2 Containment Actions

**Purpose**: Dokumentasi tindakan sementara yang sudah/akan diambil untuk mencegah masalah meluas.

**Components** (same shell as D1):
```
├── NOVA AI PANEL: suggested containment actions
│
├── CONTAINMENT ACTIONS LIST
│   ├── [+ Add Action] button
│   └── Per action:
│       ├── Description text input
│       ├── Owner dropdown
│       ├── Date completed date picker
│       ├── Status: [Planned / In Progress / Done]
│       └── [Remove] button
│
└── FOOTER ACTIONS: [← D1] [Continue to D3 →]
```

---

### SCREEN-10 — D3 Root Cause Analysis

**Purpose**: Identifikasi akar masalah sebenarnya menggunakan metode terstruktur.

**Components**:
```
├── NOVA AI PANEL
│   ├── Suggested Root Cause: "HEPA filter replacement interval..."
│   ├── Method used: 5-Whys
│   └── [View full 5-Whys chain ↓] (expandable)
│
├── FORM AREA
│   ├── RCA Method selector: [5-Whys ▼] [Fishbone/Ishikawa] [FMEA] [Manual]
│   │
│   ├── IF 5-Whys selected:
│   │   ├── Why 1: [text input]
│   │   ├── Why 2: [text input]
│   │   ├── Why 3: [text input]
│   │   ├── Why 4: [text input]
│   │   └── Why 5 (Root Cause): [text input — highlighted]
│   │
│   ├── Confirmed Root Cause summary: [Textarea]
│   │
│   └── Similar Past CAPAs (from AI)
│       ├── Label: "Nova found similar past cases:"
│       ├── [CAPA-2025-0234] Same HEPA line · Resolved in 14 days
│       └── [CAPA-2025-0187] Different area · Root cause: different
│
└── FOOTER: [← D2] [Continue to D4 →]
```

---

### SCREEN-11 — D4 Corrective Action

**Purpose**: Rencana aksi perbaikan permanen.

**Components**:
```
├── NOVA AI PANEL: suggested corrective actions
│
├── CORRECTIVE ACTIONS LIST
│   ├── [+ Add Action] button
│   └── Per action:
│       ├── Description
│       ├── Owner dropdown
│       ├── Target completion date
│       ├── Evidence required (checkbox)
│       ├── Status: [Planned / In Progress / Done]
│       └── [Remove]
│
└── FOOTER: [← D3] [Continue to D5 →]
```

---

### SCREEN-12 — D5 Preventive Action

**Purpose**: Rencana pencegahan supaya masalah tidak terulang. Bisa berupa perubahan SOP, training, sistem monitoring baru.

**Components**: Same structure as D4, with additional field:
```
├── PA Target: [This site only] / [All sites] / [Specific line/dept]
└── Training required: [Yes / No] → if Yes: show training record field
```

---

### SCREEN-13 — D6 Verification

**Purpose**: Dokumentasi bukti bahwa CA dan PA berhasil (effectiveness verification).

**Components**:
```
├── VERIFICATION METHOD
│   └── Select: [Re-sampling] [Process review & QA spot check]
│               [Batch trend monitoring] [EM re-test & airflow requalification]
│
├── VERIFICATION RESULT
│   └── Textarea (min 30 chars validation)
│
├── EVIDENCE UPLOAD
│   ├── Filename input (mock)
│   └── [Upload] button → toast confirmation
│
├── VALIDATION CHECKLIST
│   ├── ○/✅ Method selected
│   ├── ○/✅ Result documented (min 30 chars)
│   └── ○/✅ Evidence uploaded
│
└── FOOTER: [← D5] [Continue to D7 →]
```

---

### SCREEN-14 — D7 Sign-Off

**Purpose**: Review final dan penutupan resmi CAPA oleh QA yang berwenang.

**Components**:
```
├── SUMMARY PANEL (read-only, all D1-D6 in collapsible cards)
│   ├── [D1 Problem Statement ↓]
│   ├── [D2 Containment ↓]
│   ├── [D3 Root Cause ↓]
│   ├── [D4 Corrective Actions ↓]
│   ├── [D5 Preventive Actions ↓]
│   └── [D6 Verification ↓]
│
├── QUALITY SCORE FINAL: [XX/100] breakdown
│
├── SIGN-OFF FORM
│   ├── Reviewing QA: [name]
│   ├── Role: [QA Manager / QA Compliance]
│   ├── Date: [auto-filled: today]
│   └── Comments: [Textarea]
│
├── APPROVAL DECISION
│   ├── [✓ Approve & Close CAPA] (green, primary)
│   └── [✗ Return for Revision] (red outline, with required comment)
│
└── COMPLIANCE STATEMENT
    └── "By approving, I confirm this CAPA record is complete, accurate,
        and meets GMP/ALCOA+ requirements."
```

---

### SCREEN-15 — Audit Trail (Full Page)

**Purpose**: Complete traceable history semua aksi pada satu CAPA. Required untuk BPOM audit.

**Layout**: Full page (accessible from CAPA Hub sidebar)

**Components**:
```
├── Page title: "Audit Trail — CAPA-2026-0341"
├── [Export audit log PDF] button
│
└── TIMELINE (newest first)
    Per event:
    ├── Timestamp: "18 May 2026, 10:35"
    ├── Actor: "Andi Wijaya (Senior Operator)"
    ├── Action type badge: [CAPA Created] / [D1 Completed] / [AI Suggestion Used] etc
    ├── Description: detail of what changed
    └── Before/After (for edits): "— → HEPA filter replacement..."
```

---

### SCREEN-16 — Quality Score Breakdown (Modal)

**Purpose**: Explain ke user apa arti score dan bagaimana menaikkannya.

**Layout**: Modal (560px wide)

**Components**:
```
MODAL: "Quality Score — CAPA-2026-0341"
├── Total score: [77/100]
│   └── Progress ring atau bar
│
├── SCORE DIMENSIONS
│   ├── Problem clarity (D1):      18/20  ████████░░
│   ├── Containment completeness:  15/15  ███████████
│   ├── RCA depth (D3):            12/20  ██████░░░░
│   ├── CA/PA specificity:         10/20  █████░░░░░
│   ├── Verification evidence:     12/15  ████████░░
│   └── Timeliness:                10/10  ███████████
│
├── "How to improve to 90+":
│   ├── 💡 Add more detail to Root Cause chain (D3) +5 pts
│   └── 💡 Add a second evidence file to D6 +3 pts
│
└── [Close] [Go to D3 →]
```

---

## Appendix A — Halaman Yang Bisa Dihapus / Digabung

| Halaman Saat Ini | Rekomendasi |
|-----------------|-------------|
| `/dashboard` | Tetap ada, tapi bukan default landing |
| `/findings` | Tetap ada |
| `/capa` | Tetap ada tapi tanpa "New CAPA +" button |
| `/capa/new` | Tetap ada, tapi diperbaiki ke multi-step wizard |
| `/capa/:id` (dengan tabs) | Rombak jadi CAPA Hub (SCREEN-05) |
| `/capa/:id/8d/:step` | Tetap ada tapi dengan left panel context |
| Finding detail (tidak ada) | Tambah sebagai slide-over (SCREEN-04) |
| My Work/Inbox (tidak ada) | Tambah sebagai default home (SCREEN-01) |
| Quality Score modal (tidak ada) | Tambah (SCREEN-16) |
| Audit Trail full page (tersembunyi) | Expose sebagai dedicated page (SCREEN-15) |

---

## Appendix B — Prioritas Implementasi Untuk HTML Wireframe

**Must-have (prioritas 1):**
- SCREEN-01: My Work / Inbox (new)
- SCREEN-05: CAPA Hub with 8D left panel (rework)
- SCREEN-08: D1 Problem Statement with Nova panel (pattern representative untuk D1–D6)
- SCREEN-14: D7 Sign-Off (rework)

**Should-have (prioritas 2):**
- SCREEN-02: Dashboard
- SCREEN-03: Findings List
- SCREEN-06: New CAPA Intake (wizard)
- SCREEN-07: CAPA List

**Nice-to-have (prioritas 3):**
- SCREEN-04: Finding Detail slide-over
- SCREEN-15: Audit Trail
- SCREEN-16: Quality Score modal

---

*End of WIREFRAME_SPEC.md*
