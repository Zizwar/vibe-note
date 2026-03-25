import type { SQLiteDatabase } from 'expo-sqlite';

export function initializeDatabase(db: SQLiteDatabase): void {
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

  // Add audio_base64 column if it doesn't exist (migration for existing DBs)
  try {
    db.execSync('ALTER TABLE prompts ADD COLUMN audio_base64 TEXT');
  } catch {
    // Column already exists
  }

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
