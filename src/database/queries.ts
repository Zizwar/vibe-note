import type { SQLiteDatabase } from 'expo-sqlite';
import type { VibeNote, PromptCategory, AIPlatform } from '@/types';

interface PromptRow {
  id: string;
  title: string;
  content: string;
  description: string | null;
  category: string;
  platform: string;
  tags: string;
  folder_id: string | null;
  variables: string;
  is_favorite: number;
  is_pinned: number;
  usage_count: number;
  last_used_at: number | null;
  created_at: number;
  updated_at: number;
}

function rowToPrompt(row: PromptRow): VibeNote {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    description: row.description ?? undefined,
    category: row.category as PromptCategory,
    platform: row.platform as AIPlatform,
    tags: JSON.parse(row.tags || '[]'),
    folderId: row.folder_id ?? undefined,
    variables: JSON.parse(row.variables || '[]'),
    isFavorite: row.is_favorite === 1,
    isPinned: row.is_pinned === 1,
    usageCount: row.usage_count,
    lastUsedAt: row.last_used_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface PromptFilters {
  category?: PromptCategory | null;
  platform?: AIPlatform | null;
  isFavorite?: boolean;
  search?: string;
}

export function getAllPrompts(
  db: SQLiteDatabase,
  filters?: PromptFilters
): VibeNote[] {
  let query = 'SELECT * FROM prompts WHERE 1=1';
  const params: (string | number)[] = [];

  if (filters?.category) {
    query += ' AND category = ?';
    params.push(filters.category);
  }
  if (filters?.platform) {
    query += ' AND platform = ?';
    params.push(filters.platform);
  }
  if (filters?.isFavorite) {
    query += ' AND is_favorite = 1';
  }
  if (filters?.search) {
    query += ' AND (title LIKE ? OR content LIKE ? OR description LIKE ? OR tags LIKE ?)';
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }

  query += ' ORDER BY is_pinned DESC, updated_at DESC';

  const rows = db.getAllSync<PromptRow>(query, params);
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

export function insertPrompt(
  db: SQLiteDatabase,
  prompt: Omit<VibeNote, 'usageCount' | 'lastUsedAt'>
): void {
  db.runSync(
    `INSERT INTO prompts (id, title, content, description, category, platform, tags, folder_id, variables, is_favorite, is_pinned, usage_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      prompt.id,
      prompt.title,
      prompt.content,
      prompt.description ?? null,
      prompt.category,
      prompt.platform,
      JSON.stringify(prompt.tags),
      prompt.folderId ?? null,
      JSON.stringify(prompt.variables),
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

  if (fields.title !== undefined) { sets.push('title = ?'); params.push(fields.title); }
  if (fields.content !== undefined) { sets.push('content = ?'); params.push(fields.content); }
  if (fields.description !== undefined) { sets.push('description = ?'); params.push(fields.description ?? null); }
  if (fields.category !== undefined) { sets.push('category = ?'); params.push(fields.category); }
  if (fields.platform !== undefined) { sets.push('platform = ?'); params.push(fields.platform); }
  if (fields.tags !== undefined) { sets.push('tags = ?'); params.push(JSON.stringify(fields.tags)); }
  if (fields.variables !== undefined) { sets.push('variables = ?'); params.push(JSON.stringify(fields.variables)); }
  if (fields.isFavorite !== undefined) { sets.push('is_favorite = ?'); params.push(fields.isFavorite ? 1 : 0); }
  if (fields.isPinned !== undefined) { sets.push('is_pinned = ?'); params.push(fields.isPinned ? 1 : 0); }
  sets.push('updated_at = ?');
  params.push(Date.now());
  params.push(id);

  db.runSync(`UPDATE prompts SET ${sets.join(', ')} WHERE id = ?`, params);
}

export function deletePrompt(db: SQLiteDatabase, id: string): void {
  db.runSync('DELETE FROM prompts WHERE id = ?', [id]);
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
    `INSERT OR IGNORE INTO prompts (id, title, content, description, category, platform, tags, folder_id, variables, is_favorite, is_pinned, usage_count, last_used_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  try {
    for (const p of prompts) {
      const result = stmt.executeSync(
        p.id, p.title, p.content, p.description ?? null,
        p.category, p.platform, JSON.stringify(p.tags || []), p.folderId ?? null,
        JSON.stringify(p.variables || []), p.isFavorite ? 1 : 0, p.isPinned ? 1 : 0,
        p.usageCount || 0, p.lastUsedAt ?? null, p.createdAt || Date.now(), p.updatedAt || Date.now()
      );
      if (result.changes > 0) imported++;
    }
  } finally {
    stmt.finalizeSync();
  }

  return imported;
}
