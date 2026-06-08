import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = path.resolve(__dirname, "../data");
fs.mkdirSync(DATA_DIR, { recursive: true });

export const DB_PATH = path.join(DATA_DIR, "capa.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

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
