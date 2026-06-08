import { db } from "./db.js";

// ─────────────────────────────────────────────────────────────────────────────
// Repository layer. Every domain record is stored as a full `data` JSON blob
// (1:1 with the frontend `@/types` shapes) plus a few extracted scalar columns
// used for filtering. Reads parse the blob; writes re-extract the scalars.
// ─────────────────────────────────────────────────────────────────────────────

function parseRow<T>(row: { data: string } | undefined): T | undefined {
  return row ? (JSON.parse(row.data) as T) : undefined;
}
function parseRows<T>(rows: Array<{ data: string }>): T[] {
  return rows.map((r) => JSON.parse(r.data) as T);
}

// Monotonic id helper — unique within the process, ordered, human-readable.
let idSeq = 0;
export function genId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${Date.now()}-${idSeq}`;
}

// ── Personas ─────────────────────────────────────────────────────────────────
export function getPersonas(): any[] {
  return parseRows(db.prepare("SELECT data FROM personas").all() as any[]);
}

// ── Source records ───────────────────────────────────────────────────────────
export function getSourceRecords(): any[] {
  return parseRows(db.prepare("SELECT data FROM source_records").all() as any[]);
}
export function getSourceRecordByFinding(findingId: string): any | undefined {
  return parseRow(
    db.prepare("SELECT data FROM source_records WHERE finding_id = ?").get(findingId) as any,
  );
}

// ── Findings ─────────────────────────────────────────────────────────────────
export function getFindings(): any[] {
  return parseRows(db.prepare("SELECT data FROM findings ORDER BY reported_at DESC").all() as any[]);
}
export function getFinding(id: string): any | undefined {
  return parseRow(db.prepare("SELECT data FROM findings WHERE id = ?").get(id) as any);
}
const upsertFindingStmt = db.prepare(
  "INSERT OR REPLACE INTO findings (id, type, source, status, department, reported_at, data) VALUES (?, ?, ?, ?, ?, ?, ?)",
);
export function upsertFinding(f: any): any {
  upsertFindingStmt.run(f.id, f.type, f.source, f.status, f.department, f.reportedAt, JSON.stringify(f));
  return f;
}

// ── Corrective / Preventive actions ──────────────────────────────────────────
export function getCorrectiveActions(capaId?: string): any[] {
  const rows = capaId
    ? (db.prepare("SELECT data FROM corrective_actions WHERE capa_id = ?").all(capaId) as any[])
    : (db.prepare("SELECT data FROM corrective_actions").all() as any[]);
  return parseRows(rows);
}
export function getPreventiveActions(capaId?: string): any[] {
  const rows = capaId
    ? (db.prepare("SELECT data FROM preventive_actions WHERE capa_id = ?").all(capaId) as any[])
    : (db.prepare("SELECT data FROM preventive_actions").all() as any[]);
  return parseRows(rows);
}
const upsertCaStmt = db.prepare(
  "INSERT OR REPLACE INTO corrective_actions (id, capa_id, status, data) VALUES (?, ?, ?, ?)",
);
const upsertPaStmt = db.prepare(
  "INSERT OR REPLACE INTO preventive_actions (id, capa_id, status, data) VALUES (?, ?, ?, ?)",
);
export function upsertCorrectiveAction(a: any): any {
  upsertCaStmt.run(a.id, a.capaId, a.status, JSON.stringify(a));
  return a;
}
export function upsertPreventiveAction(a: any): any {
  upsertPaStmt.run(a.id, a.capaId, a.status, JSON.stringify(a));
  return a;
}
export function getCorrectiveAction(id: string): any | undefined {
  return parseRow(db.prepare("SELECT data FROM corrective_actions WHERE id = ?").get(id) as any);
}
export function getPreventiveAction(id: string): any | undefined {
  return parseRow(db.prepare("SELECT data FROM preventive_actions WHERE id = ?").get(id) as any);
}
export function deleteCorrectiveAction(id: string): void {
  db.prepare("DELETE FROM corrective_actions WHERE id = ?").run(id);
}
export function deletePreventiveAction(id: string): void {
  db.prepare("DELETE FROM preventive_actions WHERE id = ?").run(id);
}

// ── CAPA cases ───────────────────────────────────────────────────────────────
const upsertCapaStmt = db.prepare(
  "INSERT OR REPLACE INTO capa_cases (id, finding_id, type, status, current_step, department, assigned_to, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
);

/** Re-join actions stored in their own tables onto the CAPA blob. */
function attachActions(capa: any): any {
  return {
    ...capa,
    correctiveActions: getCorrectiveActions(capa.id),
    preventiveActions: getPreventiveActions(capa.id),
  };
}

export function upsertCapa(capa: any): any {
  // Actions live in their own tables; never persist them inside the CAPA blob.
  const stored = { ...capa, correctiveActions: [], preventiveActions: [] };
  upsertCapaStmt.run(
    capa.id,
    capa.findingId,
    capa.type,
    capa.status,
    capa.currentStep,
    capa.department,
    capa.assignedTo,
    capa.createdAt,
    capa.updatedAt,
    JSON.stringify(stored),
  );
  return attachActions(capa);
}

export function getCapas(): any[] {
  const rows = db.prepare("SELECT data FROM capa_cases ORDER BY created_at DESC").all() as any[];
  return parseRows<any>(rows).map(attachActions);
}
export function getCapa(id: string): any | undefined {
  const capa = parseRow(db.prepare("SELECT data FROM capa_cases WHERE id = ?").get(id) as any);
  return capa ? attachActions(capa) : undefined;
}
export function getCapaByFinding(findingId: string): any | undefined {
  const capa = parseRow(
    db.prepare("SELECT data FROM capa_cases WHERE finding_id = ?").get(findingId) as any,
  );
  return capa ? attachActions(capa) : undefined;
}

// ── Audit trail ──────────────────────────────────────────────────────────────
const insertAuditStmt = db.prepare(
  "INSERT INTO audit_events (id, capa_id, finding_id, timestamp, data) VALUES (?, ?, ?, ?, ?)",
);
export function addAuditEvent(event: any): any {
  const stamped = {
    ...event,
    id: event.id ?? genId("AUDIT"),
    timestamp: event.timestamp ?? new Date().toISOString(),
  };
  insertAuditStmt.run(stamped.id, stamped.capaId ?? null, stamped.findingId ?? null, stamped.timestamp, JSON.stringify(stamped));
  return stamped;
}
export function getAuditEvents(filter: { capaId?: string; findingId?: string } = {}): any[] {
  if (filter.capaId) {
    return parseRows(
      db.prepare("SELECT data FROM audit_events WHERE capa_id = ? ORDER BY timestamp DESC").all(filter.capaId) as any[],
    );
  }
  if (filter.findingId) {
    return parseRows(
      db.prepare("SELECT data FROM audit_events WHERE finding_id = ? ORDER BY timestamp DESC").all(filter.findingId) as any[],
    );
  }
  return parseRows(db.prepare("SELECT data FROM audit_events ORDER BY timestamp DESC").all() as any[]);
}

// ── Notifications ────────────────────────────────────────────────────────────
const insertNotifStmt = db.prepare(
  "INSERT INTO notifications (id, recipient_persona_id, read, created_at, data) VALUES (?, ?, ?, ?, ?)",
);
export function addNotification(n: any): any {
  const stamped = {
    ...n,
    id: n.id ?? genId("NOTIF"),
    createdAt: n.createdAt ?? new Date().toISOString(),
    read: n.read ?? false,
  };
  insertNotifStmt.run(stamped.id, stamped.recipientPersonaId, stamped.read ? 1 : 0, stamped.createdAt, JSON.stringify(stamped));
  return stamped;
}
export function getNotifications(personaId?: string): any[] {
  const rows = personaId
    ? (db.prepare("SELECT data FROM notifications WHERE recipient_persona_id = ? ORDER BY created_at DESC").all(personaId) as any[])
    : (db.prepare("SELECT data FROM notifications ORDER BY created_at DESC").all() as any[]);
  return parseRows(rows);
}
export function markNotificationRead(id: string): void {
  const row = db.prepare("SELECT data FROM notifications WHERE id = ?").get(id) as any;
  if (!row) return;
  const data = { ...JSON.parse(row.data), read: true };
  db.prepare("UPDATE notifications SET read = 1, data = ? WHERE id = ?").run(JSON.stringify(data), id);
}
export function markAllNotificationsRead(personaId: string): void {
  const rows = db.prepare("SELECT id, data FROM notifications WHERE recipient_persona_id = ?").all(personaId) as any[];
  const tx = db.transaction(() => {
    for (const row of rows) {
      const data = { ...JSON.parse(row.data), read: true };
      db.prepare("UPDATE notifications SET read = 1, data = ? WHERE id = ?").run(JSON.stringify(data), row.id);
    }
  });
  tx();
}

// ── AI suggestions (the premade "menu") ──────────────────────────────────────
// Lookup precedence: exact CAPA id → CAPA type → section-only.
export function getAiSuggestion(section: string, opts: { capaType?: string; capaId?: string } = {}): any | undefined {
  if (opts.capaId) {
    const byCase = db
      .prepare("SELECT data FROM ai_suggestions WHERE section = ? AND capa_id = ?")
      .get(section, opts.capaId) as any;
    if (byCase) return JSON.parse(byCase.data);
  }
  if (opts.capaType) {
    const byType = db
      .prepare("SELECT data FROM ai_suggestions WHERE section = ? AND capa_type = ? AND capa_id IS NULL")
      .get(section, opts.capaType) as any;
    if (byType) return JSON.parse(byType.data);
  }
  const bySection = db
    .prepare("SELECT data FROM ai_suggestions WHERE section = ? LIMIT 1")
    .get(section) as any;
  return bySection ? JSON.parse(bySection.data) : undefined;
}

// ── Five Whys sessions ───────────────────────────────────────────────────────
const upsertFiveWhysStmt = db.prepare(
  "INSERT OR REPLACE INTO five_whys_sessions (id, capa_id, status, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?, ?)",
);
export function upsertFiveWhysSession(s: any): any {
  upsertFiveWhysStmt.run(s.id, s.capaId, s.status, s.createdAt, s.updatedAt, JSON.stringify(s));
  return s;
}
export function getFiveWhysSession(id: string): any | undefined {
  return parseRow(db.prepare("SELECT data FROM five_whys_sessions WHERE id = ?").get(id) as any);
}
export function getLatestFiveWhysByCapa(capaId: string): any | undefined {
  return parseRow(
    db.prepare("SELECT data FROM five_whys_sessions WHERE capa_id = ? ORDER BY updated_at DESC LIMIT 1").get(capaId) as any,
  );
}

// ── Chat transcripts ─────────────────────────────────────────────────────────
const insertChatStmt = db.prepare(
  "INSERT INTO chat_messages (thread, capa_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
);
export function addChatMessage(thread: string, capaId: string | null, role: string, content: string): any {
  const createdAt = new Date().toISOString();
  const info = insertChatStmt.run(thread, capaId, role, content, createdAt);
  return { id: Number(info.lastInsertRowid), thread, capaId, role, content, createdAt };
}
export function getChatMessages(thread: string): any[] {
  return db
    .prepare("SELECT id, thread, capa_id as capaId, role, content, created_at as createdAt FROM chat_messages WHERE thread = ? ORDER BY id ASC")
    .all(thread) as any[];
}
