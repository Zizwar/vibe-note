import type { SQLiteDatabase } from 'expo-sqlite';
import type { VibeNote, PromptCategory, AIPlatform, ItemKind } from '@/types';

interface PromptRow {
  id: string;
  kind: string;
  title: string;
  content: string;
  description: string | null;
  category: string;
  platform: string;
  tags: string;
  folder_id: string | null;
  variables: string;
  linked_ids: string;
  context_ids: string;
  is_favorite: number;
  is_pinned: number;
  usage_count: number;
  last_used_at: number | null;
  created_at: number;
  updated_at: number;
}

function safeParseArray(json: string | null | undefined): any[] {
  try {
    const parsed = JSON.parse(json || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rowToPrompt(row: PromptRow): VibeNote {
  return {
    id: row.id,
    kind: (row.kind === 'note' || row.kind === 'context' ? row.kind : 'prompt') as ItemKind,
    title: row.title,
    content: row.content,
    description: row.description ?? undefined,
    category: row.category as PromptCategory,
    platform: row.platform as AIPlatform,
    tags: safeParseArray(row.tags),
    folderId: row.folder_id ?? undefined,
    variables: safeParseArray(row.variables),
    linkedIds: safeParseArray(row.linked_ids),
    contextIds: safeParseArray(row.context_ids),
    isFavorite: row.is_favorite === 1,
    isPinned: row.is_pinned === 1,
    usageCount: row.usage_count,
    lastUsedAt: row.last_used_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface PromptFilters {
  kind?: ItemKind | null;
  category?: PromptCategory | null;
  platform?: AIPlatform | null;
  isFavorite?: boolean;
  search?: string;
}

/** Builds an FTS5 MATCH expression: each term quoted + prefix-matched */
function buildFtsQuery(search: string): string {
  return search
    .split(/\s+/)
    .filter(Boolean)
    .map(term => `"${term.replace(/"/g, '""')}"*`)
    .join(' ');
}

function buildScalarFilters(filters?: PromptFilters): { sql: string; params: (string | number)[] } {
  let sql = '';
  const params: (string | number)[] = [];
  if (filters?.kind) {
    sql += ' AND p.kind = ?';
    params.push(filters.kind);
  }
  if (filters?.category) {
    sql += ' AND p.category = ?';
    params.push(filters.category);
  }
  if (filters?.platform) {
    sql += ' AND p.platform = ?';
    params.push(filters.platform);
  }
  if (filters?.isFavorite) {
    sql += ' AND p.is_favorite = 1';
  }
  return { sql, params };
}

export function getAllPrompts(
  db: SQLiteDatabase,
  filters?: PromptFilters
): VibeNote[] {
  const scalar = buildScalarFilters(filters);

  // Full-text search through FTS5 (ranked by relevance), LIKE as fallback
  if (filters?.search) {
    try {
      const ftsQuery = buildFtsQuery(filters.search);
      if (ftsQuery) {
        const rows = db.getAllSync<PromptRow>(
          `SELECT p.* FROM prompts_fts f
           JOIN prompts p ON p.rowid = f.rowid
           WHERE prompts_fts MATCH ?${scalar.sql}
           ORDER BY p.is_pinned DESC, bm25(prompts_fts)`,
          [ftsQuery, ...scalar.params]
        );
        // FTS only matches token prefixes; on zero hits fall through to the
        // LIKE substring search so mid-word matches keep working
        if (rows.length > 0) return rows.map(rowToPrompt);
      }
    } catch {
      // FTS unavailable or query syntax issue → fall through to LIKE
    }

    const term = `%${filters.search}%`;
    const rows = db.getAllSync<PromptRow>(
      `SELECT p.* FROM prompts p
       WHERE (p.title LIKE ? OR p.content LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)${scalar.sql}
       ORDER BY p.is_pinned DESC, p.updated_at DESC`,
      [term, term, term, term, ...scalar.params]
    );
    return rows.map(rowToPrompt);
  }

  const rows = db.getAllSync<PromptRow>(
    `SELECT p.* FROM prompts p WHERE 1=1${scalar.sql}
     ORDER BY p.is_pinned DESC, p.updated_at DESC`,
    scalar.params
  );
  return rows.map(rowToPrompt);
}

export function getPromptById(
  db: SQLiteDatabase,
  id: string
): VibeNote | null {
  const row = db.getFirstSync<PromptRow>(
    'SELECT * FROM prompts WHERE id = ?',
    [id]
  );
  return row ? rowToPrompt(row) : null;
}

export function getPromptsByIds(db: SQLiteDatabase, ids: string[]): VibeNote[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const rows = db.getAllSync<PromptRow>(
    `SELECT * FROM prompts WHERE id IN (${placeholders})`,
    ids
  );
  // Preserve the order of the requested ids
  const byId = new Map(rows.map(r => [r.id, rowToPrompt(r)]));
  return ids.map(id => byId.get(id)).filter((p): p is VibeNote => !!p);
}

export function insertPrompt(
  db: SQLiteDatabase,
  prompt: Omit<VibeNote, 'usageCount' | 'lastUsedAt'>
): void {
  db.runSync(
    `INSERT INTO prompts (id, kind, title, content, description, category, platform, tags, folder_id, variables, linked_ids, context_ids, is_favorite, is_pinned, usage_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      prompt.id,
      prompt.kind,
      prompt.title,
      prompt.content,
      prompt.description ?? null,
      prompt.category,
      prompt.platform,
      JSON.stringify(prompt.tags),
      prompt.folderId ?? null,
      JSON.stringify(prompt.variables),
      JSON.stringify(prompt.linkedIds),
      JSON.stringify(prompt.contextIds),
      prompt.isFavorite ? 1 : 0,
      prompt.isPinned ? 1 : 0,
      prompt.createdAt,
      prompt.updatedAt,
    ]
  );
}

export function updatePrompt(
  db: SQLiteDatabase,
  id: string,
  fields: Partial<VibeNote>
): void {
  const sets: string[] = [];
  const params: (string | number | null)[] = [];

  if (fields.kind !== undefined) { sets.push('kind = ?'); params.push(fields.kind); }
  if (fields.title !== undefined) { sets.push('title = ?'); params.push(fields.title); }
  if (fields.content !== undefined) { sets.push('content = ?'); params.push(fields.content); }
  if (fields.description !== undefined) { sets.push('description = ?'); params.push(fields.description ?? null); }
  if (fields.category !== undefined) { sets.push('category = ?'); params.push(fields.category); }
  if (fields.platform !== undefined) { sets.push('platform = ?'); params.push(fields.platform); }
  if (fields.tags !== undefined) { sets.push('tags = ?'); params.push(JSON.stringify(fields.tags)); }
  if (fields.variables !== undefined) { sets.push('variables = ?'); params.push(JSON.stringify(fields.variables)); }
  if (fields.linkedIds !== undefined) { sets.push('linked_ids = ?'); params.push(JSON.stringify(fields.linkedIds)); }
  if (fields.contextIds !== undefined) { sets.push('context_ids = ?'); params.push(JSON.stringify(fields.contextIds)); }
  if (fields.isFavorite !== undefined) { sets.push('is_favorite = ?'); params.push(fields.isFavorite ? 1 : 0); }
  if (fields.isPinned !== undefined) { sets.push('is_pinned = ?'); params.push(fields.isPinned ? 1 : 0); }
  sets.push('updated_at = ?');
  params.push(Date.now());
  params.push(id);

  db.runSync(`UPDATE prompts SET ${sets.join(', ')} WHERE id = ?`, params);
}

export function deletePrompt(db: SQLiteDatabase, id: string): void {
  db.runSync('DELETE FROM prompts WHERE id = ?', [id]);
  // Remove dangling references from other items' linked/context lists
  const rows = db.getAllSync<{ id: string; linked_ids: string; context_ids: string }>(
    `SELECT id, linked_ids, context_ids FROM prompts
     WHERE linked_ids LIKE ? OR context_ids LIKE ?`,
    [`%${id}%`, `%${id}%`]
  );
  for (const row of rows) {
    const linked = safeParseArray(row.linked_ids).filter((x: string) => x !== id);
    const contexts = safeParseArray(row.context_ids).filter((x: string) => x !== id);
    db.runSync(
      'UPDATE prompts SET linked_ids = ?, context_ids = ? WHERE id = ?',
      [JSON.stringify(linked), JSON.stringify(contexts), row.id]
    );
  }
  // ...and from chat sessions that had this item attached as context
  try {
    const sessions = db.getAllSync<{ id: string; context_ids: string }>(
      'SELECT id, context_ids FROM chat_sessions WHERE context_ids LIKE ?',
      [`%${id}%`]
    );
    for (const session of sessions) {
      const contexts = safeParseArray(session.context_ids).filter((x: string) => x !== id);
      db.runSync(
        'UPDATE chat_sessions SET context_ids = ? WHERE id = ?',
        [JSON.stringify(contexts), session.id]
      );
    }
  } catch {
    // chat tables missing (should not happen post-migration) — non-fatal
  }
}

export function toggleFavorite(db: SQLiteDatabase, id: string): void {
  db.runSync(
    'UPDATE prompts SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?',
    [Date.now(), id]
  );
}

export function togglePin(db: SQLiteDatabase, id: string): void {
  db.runSync(
    'UPDATE prompts SET is_pinned = CASE WHEN is_pinned = 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?',
    [Date.now(), id]
  );
}

export function incrementUsage(db: SQLiteDatabase, id: string): void {
  const now = Date.now();
  db.runSync(
    'UPDATE prompts SET usage_count = usage_count + 1, last_used_at = ?, updated_at = ? WHERE id = ?',
    [now, now, id]
  );
}

export function exportAllPrompts(db: SQLiteDatabase): VibeNote[] {
  const rows = db.getAllSync<PromptRow>('SELECT * FROM prompts ORDER BY created_at ASC');
  return rows.map(rowToPrompt);
}

export function importPrompts(db: SQLiteDatabase, prompts: VibeNote[], mode: 'merge' | 'replace' = 'merge'): number {
  if (mode === 'replace') {
    db.runSync('DELETE FROM prompts');
  }

  let imported = 0;
  const stmt = db.prepareSync(
    `INSERT OR IGNORE INTO prompts (id, kind, title, content, description, category, platform, tags, folder_id, variables, linked_ids, context_ids, is_favorite, is_pinned, usage_count, last_used_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  try {
    for (const p of prompts) {
      const result = stmt.executeSync(
        p.id, p.kind || 'prompt', p.title, p.content, p.description ?? null,
        p.category, p.platform, JSON.stringify(p.tags || []), p.folderId ?? null,
        JSON.stringify(p.variables || []),
        JSON.stringify(p.linkedIds || []), JSON.stringify(p.contextIds || []),
        p.isFavorite ? 1 : 0, p.isPinned ? 1 : 0,
        p.usageCount || 0, p.lastUsedAt ?? null, p.createdAt || Date.now(), p.updatedAt || Date.now()
      );
      if (result.changes > 0) imported++;
    }
  } finally {
    stmt.finalizeSync();
  }

  return imported;
}
