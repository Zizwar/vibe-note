import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Versioned migrations driven by PRAGMA user_version.
 * Each entry migrates the database from version index → index + 1.
 * Migrations must be idempotent where possible: v1 installs predate
 * versioning (their user_version is 0), so migrateToV1 re-runs safely
 * on top of an existing v1 database.
 */

function migrateToV1(db: SQLiteDatabase): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      platform TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      folder_id TEXT,
      variables TEXT DEFAULT '[]',
      is_favorite INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      usage_count INTEGER DEFAULT 0,
      last_used_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      audio_base64 TEXT
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS usage_history (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL,
      prompt_title TEXT NOT NULL,
      values_json TEXT DEFAULT '{}',
      timestamp INTEGER NOT NULL
    );
  `);

  // FTS5 for full-text search
  try {
    db.execSync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
        title, content, description, tags,
        content=prompts,
        content_rowid=rowid
      );
    `);

    // Triggers to keep FTS in sync
    db.execSync(`
      CREATE TRIGGER IF NOT EXISTS prompts_ai AFTER INSERT ON prompts BEGIN
        INSERT INTO prompts_fts(rowid, title, content, description, tags)
        VALUES (new.rowid, new.title, new.content, new.description, new.tags);
      END;
    `);

    db.execSync(`
      CREATE TRIGGER IF NOT EXISTS prompts_ad AFTER DELETE ON prompts BEGIN
        INSERT INTO prompts_fts(prompts_fts, rowid, title, content, description, tags)
        VALUES ('delete', old.rowid, old.title, old.content, old.description, old.tags);
      END;
    `);

    db.execSync(`
      CREATE TRIGGER IF NOT EXISTS prompts_au AFTER UPDATE ON prompts BEGIN
        INSERT INTO prompts_fts(prompts_fts, rowid, title, content, description, tags)
        VALUES ('delete', old.rowid, old.title, old.content, old.description, old.tags);
        INSERT INTO prompts_fts(rowid, title, content, description, tags)
        VALUES (new.rowid, new.title, new.content, new.description, new.tags);
      END;
    `);
  } catch {
    // FTS5 might not be available - search will fall back to LIKE
    console.warn('FTS5 not available, using LIKE search fallback');
  }
}

function addColumn(db: SQLiteDatabase, table: string, definition: string): void {
  try {
    db.execSync(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  } catch (e: any) {
    // Only "column already exists" (partial migration re-run) is benign.
    // Anything else (disk full, busy, corruption) must abort the migration
    // so user_version is not stamped over a half-applied schema.
    const message = String(e?.message ?? e);
    if (!/duplicate column/i.test(message)) throw e;
  }
}

function migrateToV2(db: SQLiteDatabase): void {
  // Library items now have a kind (prompt | note | context),
  // linked prompts (composition chains) and attached contexts.
  addColumn(db, 'prompts', "kind TEXT NOT NULL DEFAULT 'prompt'");
  addColumn(db, 'prompts', "linked_ids TEXT DEFAULT '[]'");
  addColumn(db, 'prompts', "context_ids TEXT DEFAULT '[]'");

  // Persistent chat: sessions + messages
  db.execSync(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      provider_id TEXT,
      model TEXT,
      context_ids TEXT DEFAULT '[]',
      is_pinned INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      prompt_id TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );
  `);

  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session
    ON chat_messages(session_id, created_at);
  `);
}

const MIGRATIONS: Array<(db: SQLiteDatabase) => void> = [
  migrateToV1,
  migrateToV2,
];

export function initializeDatabase(db: SQLiteDatabase): void {
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let v = current; v < MIGRATIONS.length; v++) {
    MIGRATIONS[v](db);
    db.execSync(`PRAGMA user_version = ${v + 1}`);
  }
}
