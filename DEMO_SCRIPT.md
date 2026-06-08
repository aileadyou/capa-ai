# Demo Script — AI Coach Nova (CAPA-AI)

> Format: bullet ringkas. Tiap langkah = aksi konkret + field yang diisi. Entry point tiap alur: **fresh dari finding** (bikin CAPA baru lewat intake wizard).
>
> **Catatan penting koreografi:** Hanya **Andi (Senior Operator / Initiator)** yang bisa mengisi step 8D. Persona lain read-only di workspace 8D — mereka hanya muncul di titik **intake review** dan **approval gate**. Jadi pola umumnya: Andi isi → ganti persona ke approver di gate → balik ke Andi.

---

## 0. Persiapan sebelum demo
- Pastikan server jalan (`npm run dev`), buka `http://localhost:8080`.
- Kalau mau state bersih: reset demo data dulu (Persona Management → reset, atau `npm run seed --reset`).
- Siapkan mental map 5 persona + tombol "Ask Nova" (panel kanan) untuk nunjukin AI coaching kapan aja.

---

## 1. Halaman Login — kenalkan tiap persona
Tunjuk kartu "OR SIGN IN AS DEMO PERSONA", jelaskan satu per satu:

- **Andi Wijaya — Senior Operator (Fill-Finish)**
  - *Initiator.* Satu-satunya yang bikin CAPA & mengisi seluruh investigasi 8D (D1–D6). Read-only di luar itu.
- **Siti Rahmawati — QA Deviation / Compliance / Complaint (QA)**
  - *QA gatekeeper.* Review finding di intake (gate pertama), klasifikasi/disposisi, dan jadi salah satu approver di sign-off. Bisa reject / minta revisi.
- **Bambang Saputra — Department Head (Fill-Finish / Warehouse / Production)**
  - *Approver departemen.* Co-approve di intake review (wajib accept sebelum 8D kebuka) dan di gate sign-off.
- **Dewi Anggraini — Head of QA (QA Division)**
  - *Otoritas QA tertinggi.* Approval final, yang menutup CAPA jadi "Audit Ready".
- **Dr. Ahmad Pratomo — SME Microbiology (QA Micro)**
  - *Subject Matter Expert.* Co-approval khusus kasus **Major/Critical**; bantu keputusan RCA & verifikasi.

> Talking point: "Sistem ini role-based — tiap orang cuma bisa aksi sesuai wewenangnya, dan semua jejaknya ke-log untuk audit BPOM."

---

## 2. Masuk sebagai Siti (QA) — tur sidebar (overview, tanpa masuk sub-halaman)
Klik persona **Siti Rahmawati**. Alasan mulai dari QA: grup **Management** (Action Plan, Similarity, Audit Trail) ditujukan QA-only, jadi dari Siti semua menu kelihatan.

Telusuri sidebar dari atas, sebut fungsi tiap halaman:

**Grup utama**
- **My Work** — inbox tugas personal, otomatis ke-filter sesuai persona yang login. Lintas 4 tahap lifecycle.
- **Dashboard** — analitik QA/manajemen: tren temuan, recurrence, root cause, heatmap per departemen, breakdown by type. (Disembunyikan untuk Operator & SME.)
- **Findings** — daftar semua temuan + klasifikasi AI Nova (severity, sumber, status). Titik awal bikin CAPA.
- **All CAPAs** — tabel semua CAPA: quality score, severity, status, PIC, due date.

**Grup Management (QA-only)**
- **Action Plan (Consolidated)** — view manajemen lintas-CAPA: gabungin semua corrective + preventive action, kelompokkan by root cause / departemen / risk. AI deteksi pola berulang.
- **Similarity** — pencarian semantik AI ke CAPA historis; cari sinyal mutu berulang & bandingin outcome.
- **Audit Trail** — log event global, read-only & append-only, untuk kepatuhan BPOM & ALCOA+. Bisa export CSV/PDF.

**Sistem**
- **Notifications** — pusat notifikasi (inbox, mark-as-read).
- **Personas (Settings)** — switcher persona demo + reset data.

> ⚠️ **Caveat teknis (buat kamu, jangan disebut ke audiens):** gating "Management QA-only" belum di-coded — saat ini menu itu masih kelihatan di semua persona. Kalau mau klaim ini live, perlu diimplementasi dulu. Untuk demo, cukup login sebagai QA pas nunjukin halaman-halaman ini.

---

## 3. Alur DEVIATION (paling sederhana — 1 siklus approval di D7)

**Koreografi persona:** Andi (intake) → Siti + Bambang (intake review) → Andi (isi D1–D6) → Bambang → Siti → Dewi (D7) → *(Dr. Ahmad bila Major/Critical)* → Closed.

### 3a. Andi bikin CAPA (intake wizard)
- Ganti persona ke **Andi**. Buka **Findings** → pilih finding deviation (mis. `DEV-2026-0144`, status *pending CAPA*) → **Create CAPA**. (Atau **All CAPAs → New CAPA**, pilih kartu sumber **Deviation / Bizzmine**.)
- **Step 1 — Source import:** klik "Import and continue". Nova baca source & draft jawaban. (Mode manual juga tersedia.)
- **Step 2 — Gate questions** (Nova sudah ngedraft, tinggal review/edit; chip "Nova draft" vs "Edited"):
  - *Apa yang terjadi & kapan* (wajib, min 20 char)
  - *Potensi dampak kualitas/GMP* (wajib)
  - *Containment yang sudah ada* (wajib)
  - *Produk/batch/lot/equipment/area terdampak* (opsional)
  - *Bukti untuk konfirmasi root cause* (opsional)
  - *Cara verifikasi efektivitas* (opsional)
- **Step 3 — Impact assessment:** Nova kasih rekomendasi severity (badge "Nova") + rationale & faktor. Pilih **Minor / Major / Critical**, lalu isi **CAPA title**.
- **Step 4 — Review & submit:** cek ringkasan + readiness checklist → **Submit for review**. Status jadi **pending_review**, nunggu Siti + Bambang.

### 3b. Intake review (2 persona)
- Ganti ke **Siti** → buka CAPA → **Accept** intake.
- Ganti ke **Bambang** → buka CAPA → **Accept** intake. → 8D **terbuka**.

### 3c. Andi isi 8D (D1–D6)
- **D1 — Problem Statement** (min 50 char): tanggal/timing, area/lokasi, referensi equipment/sistem, jumlah batch/lot/record, observasi terukur. (Tombol "Let Nova draft a starting point" tersedia.)
- **D2 — Containment:** deskripsi aksi (min 30 char) + **PIC** (dropdown persona) + **due date** (hari ini/ke depan). Nova bisa draft. Checklist "Containment ready for review".
- **D3 — Root Cause Analysis:** pilih metode (**5 Whys** / **Fishbone Ishikawa** / **Decision Tree**). Untuk 5 Whys: jawab Why 1–5, tandai **confirmed root cause**. (Panel sitasi "Similar Past CAPAs" tampil sebagai konteks — *ini mock*.)
- **D4 — Corrective Action:** deskripsi (min 30) + PIC + due date + **linked root cause** + **verification method**. Status action: Open/In Progress/Completed/Overdue/Verified. Nova bisa draft.
- **D5 — Preventive Action:** deskripsi (min 30, harus *forward-looking*) + PIC + **target date**. Nova bisa draft.
- **D6 — Verification:** pilih **verification method** + tulis **verification result** + upload **evidence filename** (mis. `evidence.pdf`).

### 3d. D7 — Sign-Off (siklus approval)
- **D7** nampilin ringkasan (Problem / Containment / RCA / Verification) + **Final Score**, **Required Status**, **Closure State**.
- Approval chain muncul. Tombol approve **hanya aktif** kalau persona aktif = approver berikutnya (kalau bukan, tertulis "Switch to [nama] to sign").
  - Ganti ke **Bambang** → Approve (e-signature modal: timestamp + nama/role + notes).
  - Ganti ke **Siti** → Approve.
  - Ganti ke **Dewi** → Approve.
  - *(Bila severity Major/Critical:)* ganti ke **Dr. Ahmad** → Approve (co-approval SME).
- **Gate skor:** CAPA hanya bisa close kalau **quality score ≥ 80**. → status **Closed / Audit Ready**.

> Demo reject (opsional): di salah satu approver, klik **Reject** → status balik **revision_requested** → tunjukin loop revisi.

---

## 4. Alur AUDIT (paling kompleks — 3 siklus approval)

**Koreografi:** Andi (intake) → Siti + Bambang (intake review) → Andi (D1–D4) → **D5: Bambang → Siti → Dewi** (CAPA Plan) → Andi (D6) → **D6: Bambang → Siti → Dewi** (CAPA Actual) → Andi (D7) → **D7: Siti** (QA Closure) → Closed.

### 4a. Andi intake (audit)
- **Andi** → New CAPA → kartu **Audit / Q100+** (`AUD-2026-0089`) → Import. Step 1–4 sama seperti deviation (Nova draft gate answers, pilih severity, title, submit).
- *Catatan:* belum ada pending audit finding "telanjang" di seed → pakai kartu sumber Audit (golden) untuk intake fresh.

### 4b. Intake review
- **Siti** Accept → **Bambang** Accept → 8D terbuka.

### 4c. Andi isi D1–D4
- D1 Problem (untuk audit, label referensi jadi "System or record reference") → D2 Containment → D3 RCA (audit cocok pakai **Fishbone**) → D4 Corrective Action. (Field sama seperti di §3c.)

### 4d. D5 — Preventive Action + **siklus "CAPA Plan"**
- Andi isi preventive action (deskripsi forward-looking + PIC + target date).
- Approval chain "CAPA Plan" muncul di seam ini (label role: Department Head → QA GMP & DIRA Compliance → QA Division Head):
  - Ganti **Bambang** → Approve → **Siti** → Approve → **Dewi** → Approve.
- Balik ke **Andi** → lanjut D6.

### 4e. D6 — Verification + **siklus "CAPA Actual"**
- Andi isi verification (method + result + evidence file).
- Approval chain "CAPA Actual" (3 approver yang sama):
  - **Bambang** → **Siti** → **Dewi** approve.
- Balik ke **Andi** → lanjut D7.

### 4f. D7 — Sign-Off + **siklus "QA Closure"**
- Approval chain closure **hanya Siti** (QA — GMP & DIRA Compliance):
  - Ganti **Siti** → Approve. → (skor ≥ 80) → **Closed / Audit Ready**.

> Audit = lifecycle dua fase (Plan vs Actual). Talking point: "Approval-nya bertingkat di tiap milestone, bukan cuma di akhir — persis alur audit GMP."

---

## 5. Alur COMPLAINT (2 siklus approval)

**Koreografi:** Andi (intake) → Siti + Bambang (intake review) → Andi (D1–D4) → **D5: Bambang → Siti → Dewi** (Round 1 Analysis) → Andi (D6) → **D7: Bambang → Siti → Dewi** (Round 2 Closure) → Closed.

### 5a. Andi intake (complaint)
- **Andi** → Findings → pilih `CMP-2026-0098` (*pending CAPA*) → Create CAPA. (Atau kartu **Complaint / Bizzmine** `CMP-2026-0112`.)
- Step 1–4 sama (Nova draft, severity, title, submit).

### 5b. Intake review
- **Siti** Accept → **Bambang** Accept → 8D terbuka.

### 5c. Andi isi D1–D4
- D1 Problem → D2 Containment → D3 RCA (complaint sering pakai **Decision Tree**, mis. partikulat) → D4 Corrective Action.

### 5d. D5 — Preventive Action + **siklus "Round 1 — Analysis"**
- Andi isi preventive action.
- Approval chain (label role complaint-scoped: QA Head of Department → QA Complaint Handling → QA Head of Division):
  - **Bambang** → **Siti** → **Dewi** approve.
- Balik ke **Andi** → lanjut D6.

### 5e. D6 — Verification (tanpa approval chain)
- Andi isi verification (method + result + evidence). Lanjut D7. *(Complaint tidak punya siklus approval di D6, beda dengan audit.)*

### 5f. D7 — Sign-Off + **siklus "Round 2 — Closure"**
- Approval chain (3 approver, label complaint-scoped):
  - **Bambang** → **Siti** → **Dewi** approve. → (skor ≥ 80) → **Closed / Audit Ready**.

> Talking point: complaint punya loop respons pelanggan — UI bisa nampilin chip "Customer response sent / replied" sebagai konteks.

---

## Ringkasan urutan persona-switch (contekan cepat)

| Alur | Urutan switch |
|------|----------------|
| **Deviation** | Andi → Siti+Bambang (intake) → Andi (D1–D6) → **Bambang→Siti→Dewi** (D7) → *(+Dr.Ahmad jika Major/Critical)* |
| **Audit** | Andi → Siti+Bambang (intake) → Andi (D1–D4) → **Bambang→Siti→Dewi** (D5) → Andi (D6) → **Bambang→Siti→Dewi** (D6) → Andi (D7) → **Siti** (D7) |
| **Complaint** | Andi → Siti+Bambang (intake) → Andi (D1–D4) → **Bambang→Siti→Dewi** (D5) → Andi (D6) → Andi (D7) → **Bambang→Siti→Dewi** (D7) |

## Tips demo
- **Quality score ≥ 80** wajib untuk close — pastikan gate answers detail (tanggal, nomor batch, observasi terukur) supaya skor naik.
- Tombol approve disable kalau bukan giliran persona aktif → ini fitur, bukan bug. Gunakan untuk jelasin segregation of duties.
- Tunjukin **Ask Nova** (panel kanan) di step manapun untuk pamer AI coaching kontekstual.
- Selipkan **Audit Trail** di akhir tiap alur untuk nunjukin tiap aksi & approval ke-capture (ALCOA+ / BPOM).
