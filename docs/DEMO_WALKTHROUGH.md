# AI Coach Nova — Demo Walkthrough

> **Audience:** Internal pitch walkthrough for PT Bio Farma RFI.
> **Format:** One presenter, five personas, three golden cases.
> **Estimated time:** 15–20 minutes end-to-end.

---

## Daftar Isi

1. [Penjelasan Tiga Flow](#1-penjelasan-tiga-flow)
   - [Deviation](#11-deviation)
   - [Audit](#12-audit)
   - [Complaint](#13-complaint)
2. [Sebelum Demo Dimulai](#2-sebelum-demo-dimulai)
3. [Case 1 — Deviation `CAPA-2026-0341`](#3-case-1--deviation-capa-2026-0341)
4. [Case 2 — Audit `CAPA-2026-0089`](#4-case-2--audit-capa-2026-0089)
5. [Case 3 — Complaint `CAPA-2026-0112`](#5-case-3--complaint-capa-2026-0112)
6. [Persona Cheat Sheet](#6-persona-cheat-sheet)

---

## 1. Penjelasan Tiga Flow

### 1.1 Deviation

**Sumber:** Bizzmine (`DEV-YYYY-XXXX`)

Deviation adalah insiden internal — proses menyimpang dari spesifikasi, equipment gagal, atau environmental monitoring melampaui batas. Bizzmine men-generate finding-nya, lalu AI Coach Nova mengimpornya dan memandu investigator melalui 8D penuh.

```
[Bizzmine finding]
      │
      ▼
Intake — QA Disposition Gate
  ├─ Rejected / Escalated → recorded, tidak jadi CAPA
  └─ Accepted → CAPA dibuat, 8D terbuka
      │
      ▼
D1  Problem Statement     ← Nova pre-fill dari Bizzmine
D2  Containment           ← Isolasi batch / hold / restrict
D3  Root Cause Analysis   ← Fishbone atau 5-Why
D4  Corrective Action     ← Tindakan korektif
D5  Preventive Action     ← Tindakan pencegahan
D6  Verification          ← Bukti tindakan efektif
D7  Sign-Off              ← Approval cascade (severity-gated)
      │
      ├─ Major/Critical → SME co-signer disisipi otomatis
      │   Bambang (Dept Head) → Siti (QA) → Ahmad (SME) → Dewi (Division Head)
      │
      └─ Minor →
          Bambang (Dept Head) → Siti (QA) → Dewi (Division Head)
      │
      ▼
Closed / Audit Ready
```

**Differentiator utama:**
- Nova membaca Bizzmine dan langsung pre-fill D1 beserta gate answers — investigator tinggal review, bukan ngetik dari nol.
- **Severity-gated SME co-approval:** kalau severity Major atau Critical, sistem otomatis nyisipin Dr. Ahmad (SME) di chain D7 sebelum Division Head. Tidak perlu konfigurasi manual.

---

### 1.2 Audit

**Sumber:** Q100+ (`AUD-YYYY-XXXX`)

Audit finding berasal dari internal audit, regulatory inspection, atau compliance gap yang tercatat di Q100+. Bedanya dari deviation: ada **dua approval phase** yang mengapit proses 8D — CAPA Plan sebelum eksekusi, dan CAPA Actual setelah eksekusi.

```
[Q100+ finding]
      │
      ▼
Intake — Audit Schedule
  └─ Lead Auditor (Dr. Ahmad) review di D1
      │
      ▼
D1  Problem Statement     ← Audit Schedule card (tanggal, scope, tim auditor)
D2  Containment
D3  Root Cause Analysis
D4  Corrective Action
D5  Preventive Action
      │
      ▼
CAPA PLAN APPROVAL        ← Bambang (Dept Head) → Siti (QA) → Dewi (QA Division Head)
      │
   [eksekusi tindakan]
      │
      ▼
D6  Verification
      │
      ▼
CAPA ACTUAL APPROVAL      ← Bambang (Dept Head) → Siti (QA) → Dewi (QA Division Head)
      │
      ▼
D7  QA Final Closure      ← Siti saja (final QA gate, single approver)
      │
      ▼
Closed / Audit Ready
  └─ [Jika external audit] → report-back ke auditing body
```

**Differentiator utama:**
- **Two-phase lifecycle:** approval atas *rencana* (CAPA Plan) terpisah dari approval atas *bukti eksekusi* (CAPA Actual). Sesuai GMP requirement bahwa tindakan harus disetujui *sebelum* dieksekusi.
- **Phase badge** di workspace berubah antara "CAPA Plan" dan "CAPA Actual" sehingga auditor tahu di fase mana saat ini.
- D7 hanya butuh QA (Siti) — Division Head sudah beri endorsement di fase Actual.

---

### 1.3 Complaint

**Sumber:** Bizzmine-Complaint (`CMP-YYYY-XXXX`)

Complaint datang dari customer (rumah sakit, distributor, pasien). Ada **accept/reject gate** di awal — kalau ditolak, complaint dicatat tapi tidak menjadi CAPA. Kalau diterima, prosesnya punya **customer-response loop** di tengah: setelah analisis awal selesai, jawaban dikirim ke customer dan CAPA menunggu balasan (atau 14-hari timeout) sebelum bisa ditutup.

```
[Bizzmine-Complaint finding]
      │
      ▼
Accept / Reject Gate     ← Siti (QA Staff) yang memutuskan
  ├─ Rejected → recorded & closed, tidak jadi CAPA
  └─ Accepted → CAPA dibuat
      │
      ▼
D1  Problem Statement
D2  Containment
D3  Root Cause Analysis
D4  Corrective Action     ← Fokus preventif (D5 juga)
D5  Preventive Action
      │
      ▼
ROUND 1 — ANALYSIS APPROVAL
  Bambang (QA Head of Dept) → Siti (QA Complaint) → Dewi (QA Head of Division)
      │
      ▼
[Kirim response ke customer]
      │
      ▼
Customer-Response Loop
  ├─ Customer membalas          → loop selesai
  └─ 14-hari timeout            → loop selesai otomatis
      │
      ▼
D6  Verification (konsolidasi bukti)
      │
      ▼
ROUND 2 — CLOSURE APPROVAL
  Bambang (QA Head of Dept) → Siti (QA Complaint) → Dewi (QA Head of Division)
      │
      ▼
Closed / Audit Ready
```

**Differentiator utama:**
- **Accept/reject gate:** QA bisa langsung menolak complaint yang tidak valid sebelum resource terpakai.
- **Customer-response loop** divisualisasikan dengan status chips (response sent / replied / loop closed) — auditor bisa lihat timeline komunikasi customer dalam satu layar.
- **Two rounds** dengan jeda customer loop di antaranya — sesuai dengan real-world complaint CAPA process di industri farmasi.

---

## 2. Sebelum Demo Dimulai

```
1. Buka browser, navigasi ke http://localhost:8080 (atau URL dev server)
2. Klik "Reset Demo Data" di halaman Personas (Settings → Personas)
   → Konfirmasi reset
   → Semua tiga kasus kembali ke state awal
3. Log in sebagai Andi Wijaya (Initiator)
```

> **Tip:** Gunakan **avatar di pojok kanan atas** untuk ganti persona — lebih cepat daripada ke halaman Personas setiap kali switch.

---

## 3. Case 1 — Deviation `CAPA-2026-0341`

**Cerita:** "Begini caranya Nova coach investigator dari laporan awal sampai siap audit."

**Starting state setelah reset:** D2 Containment, score 68, belum ada approval.

---

### Langkah-langkah

**👤 Persona: Andi Wijaya (Initiator)**

**[1] Findings page**
- Buka **Findings** di navbar
- Tunjukkan baris `DEV-2026-0341` — Environmental monitoring exceedance di Grade A Fill Suite
- Klik baris → finding detail page
  - *"Ini laporan awal dari Bizzmine. Nova sudah baca dokumennya."*
- Klik **Create CAPA** → Intake wizard terbuka, hanya kartu **Bizzmine / Deviation** yang tampil (kartu Q100+ dan Complaint disembunyikan)

**[2] Intake Wizard — Step 1: Source Import**
- Tunjukkan kartu **Bizzmine** dengan source ID `DEV-2026-0341`
- Klik **Import and continue**
  - *"Nova tarik data dari Bizzmine, draft gate questions, assess severity — semua dalam satu langkah."*
- Tunggu loading selesai → otomatis lompat ke Step 2

**[3] Intake Wizard — Step 2: Gate Questions**
- Tunjukkan banner "Nova drafted your gate answers · X% confidence"
- Scroll ke tiap field — semua sudah terisi oleh Nova dengan chip **Nova draft**
  - *"Investigator tinggal review, bukan tulis dari blank. Kalau ada yang diubah, chip berganti jadi 'Edited'."*
- Ubah satu field secara live → tunjukkan chip berubah jadi **Edited** + tombol **Restore draft** muncul
- Klik **Continue to impact**

**[4] Intake Wizard — Step 3: Impact Assessment**
- Tunjukkan **Nova Assessment** card: severity recommendation, confidence %, tiga faktor (regulatory, patient safety, process)
- Nova merekomendasikan **Major** — sudah ter-select otomatis
  - *"Nova assess severity berdasarkan tiga faktor — ini bisa jadi starting point, tapi QA tetap bisa override."*
- Klik **Review & submit**

**[5] Intake Wizard — Step 4: Review & Submit**
- Tunjukkan readiness checklist (semua hijau)
- Klik **Submit for review**
  - *"CAPA masuk ke Siti dan Bambang untuk disposition."*

> ⚠️ **Note:** Karena `CAPA-2026-0341` sudah ada di demo data, submit akan re-open CAPA yang existing — tidak crash, tapi CAPA langsung muncul di hub.

**[6] CAPA Hub — D1 Problem Statement**
- Navigasi ke `All CAPAs → CAPA-2026-0341`
- Klik tab **D1 Problem Statement**
- Tunjukkan:
  - Field "Problem statement" sudah ter-fill dari Bizzmine
  - **Quality Signals** (3 checks) di bawah
  - Nova tip di sidebar kanan
  - *"Score saat ini 68. Setiap D yang diselesaikan akan naikkan score ini."*

**[7] D2 Containment (current step)**
- Klik tab **D2 Containment**
- Tunjukkan step aktif: form containment, Nova suggestion card
  - *"D2 ini posisi kita sekarang. Nova suggest tindakan containment berdasarkan jenis deviasi."*

**[8] D7 Sign-Off — Preview approval chain**
- Klik tab **D7 Sign-off** (masih terkunci)
- Tunjukkan **sign-off cascade** yang sudah terrender:
  - Bambang Saputra — Department Head — Awaiting
  - Siti Rahmawati — QA Deviation — Pending
  - **Dr. Ahmad Pratomo — SME — Pending** ← tunjuk ini
  - Dewi Anggraini — Division Head — Pending
  - *"Karena severity Major, sistem otomatis nyisipin SME sebagai co-signer sebelum Division Head. Ini tidak perlu dikonfigurasi — logic-nya ada di workflow engine."*

**[9] Approver's view — Dashboard**
- Switch ke **Bambang Saputra (Head of Dept)**
- Buka **Dashboard** → tunjukkan "1 pending" di queue
  - *"Bambang lihat semua CAPA yang butuh persetujuannya di satu tempat."*
- Kembali ke **Andi Wijaya** untuk lanjut ke Case 2

---

## 4. Case 2 — Audit `CAPA-2026-0089`

**Cerita:** "Two-phase lifecycle — approve rencana dulu, eksekusi, baru approve bukti."

**Starting state setelah reset:** D6 Verification, Phase: CAPA Actual. CAPA Plan sudah disetujui (Bambang 22 Mei → Siti 23 Mei → Dewi 23 Mei). Sekarang butuh approval atas tindakan yang sudah dieksekusi.

---

### Langkah-langkah

**👤 Persona: Andi Wijaya (Initiator)**

**[1] Buka CAPA-2026-0089**
- Navigasi ke **All CAPAs → CAPA-2026-0089**
- Tunjukkan header: source `AUD-2026-0089`, status **Approval**

**[2] D1 — Audit context**
- Klik tab **D1 Problem Statement**
- Tunjukkan dua badge di bawah breadcrumb: **Phase: CAPA Actual** + **Internal Audit**
- Scroll ke **Audit Schedule card**:
  - Tanggal audit: 18–20 Mei 2026
  - Auditee: Warehouse / QA Compliance
  - Scope: GMP documentation requirements
  - Tim auditor: 3 anggota, lead Dr. Ahmad Pratomo
  - *"Konteks audit ada di sini — auditor tahu persis audit apa yang men-trigger CAPA ini."*

**[3] D6 — CAPA Plan history**
- Klik tab **D6 Verification** → scroll ke bawah sampai panel approval
- Tunjukkan section **CAPA Plan Approval** (sudah selesai, semua ✓):
  - Bambang — approved 22 Mei
  - Siti — approved 23 Mei
  - Dewi — approved 23 Mei
  - *"Plan sudah disetujui bulan lalu. Tindakan sudah dieksekusi. Sekarang kita butuh approval atas bukti eksekusinya — ini yang disebut CAPA Actual."*

**[4] D6 — CAPA Actual Approval (live demo)**
- Tunjukkan section **CAPA Actual Approval**:
  - Subtitle: "Executed actions → Dept Head → QA → QA Division Head"
  - Bambang — **Awaiting** (tombol aktif)
  - Siti — Pending
  - Dewi — Pending

- **Switch → Bambang Saputra (Head of Dept)**
  - Buka Dashboard → klik CAPA-2026-0089 → D6
  - Klik **Approve with E-Sig** → Bambang approved ✓
  - *"Bambang approve sebagai Department Head."*

- **Switch → Siti Rahmawati (QA Deviation)**
  - Dashboard → CAPA-2026-0089 → D6
  - Klik **Approve with E-Sig** → Siti approved ✓

- **Switch → Dewi Anggraini (Head of QA)**
  - Dashboard → CAPA-2026-0089 → D6
  - Klik **Approve with E-Sig** → Dewi approved ✓
  - *"Chain CAPA Actual selesai. D7 terbuka."*

**[5] D7 — QA Final Closure**
- Klik tab **D7 Sign-off**
- Tunjukkan: hanya satu approver — **Siti Rahmawati (QA)**, final gate
  - *"D7 di audit hanya butuh QA — Division Head sudah beri endorsement di CAPA Actual. Single-step closure."*
- **Switch → Siti Rahmawati**
  - D7 → klik **Approve with E-Sig**
  - CAPA status berubah → **Closed / Audit Ready** 🎉
  - Score naik ke 85 — **Audit ready** badge

- Switch kembali ke **Andi Wijaya**

---

## 5. Case 3 — Complaint `CAPA-2026-0112`

**Cerita:** "Customer response loop — approve analisis dulu, tunggu balasan customer, baru tutup."

**Starting state setelah reset:** D7 Sign-off, Round-2 Closure. Round-1 Analysis sudah disetujui (24–25 Mei). Response ke customer sudah dikirim 25 Mei, customer sudah balas, loop closed 29 Mei. Sekarang tinggal Round-2 Closure.

---

### Langkah-langkah

**👤 Persona: Andi Wijaya (Initiator)**

**[1] Buka CAPA-2026-0112**
- Navigasi ke **All CAPAs → CAPA-2026-0112**
- Tunjukkan header: source `CMP-2026-0112`, department QA Complaint / Production

**[2] D1 — Latar belakang complaint**
- Klik tab **D1 Problem Statement**
- Tunjukkan problem statement: *particulate matter di vial Vaximmun dari Hospital Sentosa*
  - *"Complaint diterima dari customer, QA sudah accept. Sekarang kita di sini untuk investigate dan tutup."*

**[3] D5 — Round-1 approval history**
- Klik tab **D5 Preventive Action**
- Scroll ke bawah → tunjukkan **Round 1 — Analysis Approval** (sudah selesai, semua ✓):
  - Bambang — approved 24 Mei ("Round 1 analysis endorsed")
  - Siti — approved 24 Mei
  - Dewi — approved 25 Mei ("Send customer response, then proceed to closure")
  - *"Round 1 selesai — analisis dan tindakan sudah di-sign. Lalu QA kirim response ke Hospital Sentosa."*

**[4] D7 — Customer loop & Round-2 Closure**
- Klik tab **D7 Sign-off**
- Tunjukkan **Workflow Context** chips (customer loop status):
  - ✅ Customer response sent 25 May 2026
  - ✅ Customer replied
  - ✅ Customer loop closed 29 May 2026
  - *"Loop sudah selesai — customer balas sebelum 14-hari timeout. Sekarang kita bisa tutup CAPA."*

- Tunjukkan **Final Quality Gate**: score 80, Audit Ready, Closure State: Approval Pending

- Tunjukkan **Round 2 — Closure Approval**:
  - Subtitle: "QA Head of Department → QA Complaint → QA Head of Division"
  - Bambang — **Awaiting**
  - Siti — Pending
  - Dewi — Pending
  - *"Tiga orang yang sama dengan Round 1 — tapi label dan konteksnya beda: ini closure, bukan analysis."*

**[5] Live approval cascade**
- **Switch → Bambang Saputra (Head of Dept)**
  - Dashboard → CAPA-2026-0112 → D7
  - Klik **Approve with E-Sig** → Bambang approved ✓

- **Switch → Siti Rahmawati (QA Deviation)**
  - Dashboard → CAPA-2026-0112 → D7
  - Klik **Approve with E-Sig** → Siti approved ✓

- **Switch → Dewi Anggraini (Head of QA)**
  - Dashboard → CAPA-2026-0112 → D7
  - Klik **Approve with E-Sig** → Dewi approved ✓
  - CAPA → **Closed / Audit Ready** 🎉

**[6] Optional: Tunjukkan Personas page**
- Navigasi ke **Settings → Personas**
- Tunjukkan 5 persona cards dengan role badges
  - *"Ini demo environment — di production ini terhubung ke SSO dan RBAC yang sebenarnya. Setiap persona punya view berbeda: initiator lihat 8D workspace yang bisa diedit, approver lihat Dashboard dan queue."*

---

## 6. Persona Cheat Sheet

| Persona | Avatar | Siapa | Muncul di |
|---------|--------|-------|-----------|
| **Andi Wijaya** (Initiator) | AW | Senior Operator, Fill-Finish | My Work, 8D workspace (editable) |
| **Siti Rahmawati** (QA Deviation) | SR | QA Staff, QA Compliance | Dashboard, semua approval chains |
| **Bambang Saputra** (Head of Dept) | BS | Manager, Manufacturing | Dashboard, semua approval chains |
| **Dewi Anggraini** (Head of QA) | DA | Manager, QA Division | Dashboard, semua approval chains |
| **Dr. Ahmad Pratomo** (SME) | AP | Lead Auditor | My Work (SME-only); D7 Deviation kalau Major/Critical |

### Approval chain summary

| Case | Chain | Kapan |
|------|-------|-------|
| Deviation D7 (Major) | Bambang → Siti → **Ahmad** → Dewi | Sign-off |
| Audit CAPA Plan | Bambang → Siti → Dewi | Setelah D5 |
| Audit CAPA Actual | Bambang → Siti → Dewi | Setelah D6 |
| Audit D7 Closure | Siti only | Final QA gate |
| Complaint Round 1 | Bambang → Siti → Dewi | Setelah D5 |
| Complaint Round 2 | Bambang → Siti → Dewi | Setelah customer loop |

### Quick-switch order untuk demo penuh

```
Andi → (Case 1 browse) → Bambang (Dashboard preview) → Andi
→ (Case 2) → Bambang (approve D6) → Siti (approve D6) → Dewi (approve D6)
→ Siti (approve D7) → Andi
→ (Case 3) → Bambang (approve D7) → Siti (approve D7) → Dewi (approve D7 final)
```

---

*Dokumen ini adalah panduan internal demo. Reset Demo Data sebelum setiap sesi untuk memulai dari state yang bersih.*
