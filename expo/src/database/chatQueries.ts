import type { SQLiteDatabase } from 'expo-sqlite';
import type { ChatSession, ChatMessage, ChatRole } from '@/types';

interface SessionRow {
  id: string;
  title: string;
  provider_id: string | null;
  model: string | null;
  context_ids: string;
  is_pinned: number;
  created_at: number;
  updated_at: number;
}

interface MessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  prompt_id: string | null;
  created_at: number;
}

function safeParseArray(json: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(json || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rowToSession(row: SessionRow): ChatSession {
  return {
    id: row.id,
    title: row.title,
    providerId: row.provider_id ?? undefined,
    model: row.model ?? undefined,
    contextIds: safeParseArray(row.context_ids),
    isPinned: row.is_pinned === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: (row.role === 'assistant' || row.role === 'system' ? row.role : 'user') as ChatRole,
    content: row.content,
    promptId: row.prompt_id ?? undefined,
    createdAt: row.created_at,
  };
}

export function getSessions(db: SQLiteDatabase): ChatSession[] {
  const rows = db.getAllSync<SessionRow>(
    'SELECT * FROM chat_sessions ORDER BY is_pinned DESC, updated_at DESC'
  );
  return rows.map(rowToSession);
}

export function getSessionById(db: SQLiteDatabase, id: string): ChatSession | null {
  const row = db.getFirstSync<SessionRow>(
    'SELECT * FROM chat_sessions WHERE id = ?',
    [id]
  );
  return row ? rowToSession(row) : null;
}

export function insertSession(db: SQLiteDatabase, session: ChatSession): void {
  db.runSync(
    `INSERT INTO chat_sessions (id, title, provider_id, model, context_ids, is_pinned, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.title,
      session.providerId ?? null,
      session.model ?? null,
      JSON.stringify(session.contextIds),
      session.isPinned ? 1 : 0,
      session.createdAt,
      session.updatedAt,
    ]
  );
}

export function updateSession(
  db: SQLiteDatabase,
  id: string,
  fields: Partial<Pick<ChatSession, 'title' | 'contextIds' | 'isPinned' | 'providerId' | 'model'>>
): void {
  const sets: string[] = [];
  const params: (string | number | null)[] = [];

  if (fields.title !== undefined) { sets.push('title = ?'); params.push(fields.title); }
  if (fields.contextIds !== undefined) { sets.push('context_ids = ?'); params.push(JSON.stringify(fields.contextIds)); }
  if (fields.isPinned !== undefined) { sets.push('is_pinned = ?'); params.push(fields.isPinned ? 1 : 0); }
  if (fields.providerId !== undefined) { sets.push('provider_id = ?'); params.push(fields.providerId ?? null); }
  if (fields.model !== undefined) { sets.push('model = ?'); params.push(fields.model ?? null); }
  sets.push('updated_at = ?');
  params.push(Date.now());
  params.push(id);

  db.runSync(`UPDATE chat_sessions SET ${sets.join(', ')} WHERE id = ?`, params);
}

export function touchSession(db: SQLiteDatabase, id: string): void {
  db.runSync('UPDATE chat_sessions SET updated_at = ? WHERE id = ?', [Date.now(), id]);
}

export function deleteSession(db: SQLiteDatabase, id: string): void {
  // Foreign keys are ON, but delete explicitly for older installs
  db.runSync('DELETE FROM chat_messages WHERE session_id = ?', [id]);
  db.runSync('DELETE FROM chat_sessions WHERE id = ?', [id]);
}

export function getMessages(db: SQLiteDatabase, sessionId: string): ChatMessage[] {
  const rows = db.getAllSync<MessageRow>(
    'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC, id ASC',
    [sessionId]
  );
  return rows.map(rowToMessage);
}

export function insertMessage(db: SQLiteDatabase, message: ChatMessage): void {
  db.runSync(
    `INSERT INTO chat_messages (id, session_id, role, content, prompt_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      message.id,
      message.sessionId,
      message.role,
      message.content,
      message.promptId ?? null,
      message.createdAt,
    ]
  );
}

export function deleteMessage(db: SQLiteDatabase, id: string): void {
  db.runSync('DELETE FROM chat_messages WHERE id = ?', [id]);
}

export function countSessionMessages(db: SQLiteDatabase, sessionId: string): number {
  const row = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM chat_messages WHERE session_id = ?',
    [sessionId]
  );
  return row?.count ?? 0;
}
