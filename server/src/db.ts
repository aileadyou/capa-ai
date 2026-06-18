import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serverless hosts (Vercel) have a read-only filesystem and ephemeral, per-request
// instances, so a file-backed SQLite can't persist there. We run the DB purely in
// memory in that case — seeded fresh on every cold start. `VERCEL` is set
// automatically on deploy; set `CAPA_DB=:memory:` to exercise the same path locally.
const IN_MEMORY = process.env.CAPA_DB === ":memory:" || Boolean(process.env.VERCEL);

export const DB_PATH = IN_MEMORY ? ":memory:" : path.join(path.resolve(__dirname, "../data"), "capa.db");

if (!IN_MEMORY) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

export const db = new Database(DB_PATH);
if (!IN_MEMORY) db.pragma("journal_mode = WAL"); // WAL needs a real file; skip for :memory:
db.pragma("foreign_keys = ON");

// Create the schema immediately on connect. repo.ts prepares statements at module
// load, before seedAll() runs — with a fresh in-memory DB the tables wouldn't exist
// yet. CREATE TABLE IF NOT EXISTS is idempotent, so this is safe for the file DB too.
initSchema();

/**
 * JSON-column design: every domain record is stored as a `data` JSON blob that
 * matches the frontend TypeScript shape verbatim, plus a few extracted scalar
 * columns used only for filtering/sorting. This keeps the API responses 1:1
 * with the existing `@/types` definitions while still being a real database.
 */
export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS personas (
      id   TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS source_records (
      id         TEXT PRIMARY KEY,
      finding_id TEXT,
      type       TEXT,
      source     TEXT,
      data       TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS findings (
      id           TEXT PRIMARY KEY,
      type         TEXT,
      source       TEXT,
      status       TEXT,
      department   TEXT,
      reported_at  TEXT,
      data         TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS capa_cases (
      id           TEXT PRIMARY KEY,
      finding_id   TEXT,
      type         TEXT,
      status       TEXT,
      current_step TEXT,
      department   TEXT,
      assigned_to  TEXT,
      created_at   TEXT,
      updated_at   TEXT,
      data         TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS corrective_actions (
      id      TEXT PRIMARY KEY,
      capa_id TEXT,
      status  TEXT,
      data    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS preventive_actions (
      id      TEXT PRIMARY KEY,
      capa_id TEXT,
      status  TEXT,
      data    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id         TEXT PRIMARY KEY,
      capa_id    TEXT,
      finding_id TEXT,
      timestamp  TEXT,
      data       TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id                    TEXT PRIMARY KEY,
      recipient_persona_id  TEXT,
      read                  INTEGER DEFAULT 0,
      created_at            TEXT,
      data                  TEXT NOT NULL
    );

    -- Premade AI suggestions, keyed by CAPA type / case / 8D phase / section
    -- (the "menu"). Never stored inside the CAPA record itself.
    CREATE TABLE IF NOT EXISTS ai_suggestions (
      id        TEXT PRIMARY KEY,
      capa_type TEXT,
      capa_id   TEXT,
      phase     TEXT,
      section   TEXT NOT NULL,
      data      TEXT NOT NULL
    );

    -- Live, OpenRouter-backed interactive 5 Whys sessions.
    CREATE TABLE IF NOT EXISTS five_whys_sessions (
      id         TEXT PRIMARY KEY,
      capa_id    TEXT,
      status     TEXT,
      created_at TEXT,
      updated_at TEXT,
      data       TEXT NOT NULL
    );

    -- Live, OpenRouter-backed chat transcripts.
    CREATE TABLE IF NOT EXISTS chat_messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      thread     TEXT,
      capa_id    TEXT,
      role       TEXT,
      content    TEXT,
      created_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_capa_finding ON capa_cases(finding_id);
    CREATE INDEX IF NOT EXISTS idx_ca_capa ON corrective_actions(capa_id);
    CREATE INDEX IF NOT EXISTS idx_pa_capa ON preventive_actions(capa_id);
    CREATE INDEX IF NOT EXISTS idx_ae_capa ON audit_events(capa_id);
    CREATE INDEX IF NOT EXISTS idx_ae_finding ON audit_events(finding_id);
    CREATE INDEX IF NOT EXISTS idx_ntf_recipient ON notifications(recipient_persona_id);
    CREATE INDEX IF NOT EXISTS idx_ai_lookup ON ai_suggestions(section, capa_type, capa_id);
    CREATE INDEX IF NOT EXISTS idx_fw_capa ON five_whys_sessions(capa_id);
    CREATE INDEX IF NOT EXISTS idx_chat_thread ON chat_messages(thread);
  `);
}

/** Wipe every table (used by the demo "Reset demo data" action before reseeding). */
export function clearAllTables(): void {
  const tables = [
    "personas",
    "source_records",
    "findings",
    "capa_cases",
    "corrective_actions",
    "preventive_actions",
    "audit_events",
    "notifications",
    "ai_suggestions",
    "five_whys_sessions",
    "chat_messages",
  ];
  const tx = db.transaction(() => {
    for (const t of tables) db.exec(`DELETE FROM ${t};`);
  });
  tx();
}

export function isSeeded(): boolean {
  const row = db.prepare("SELECT COUNT(*) AS n FROM findings").get() as { n: number };
  return row.n > 0;
}
