import { create } from 'zustand';
import { getDatabase } from '@/database/connection';

export interface UsageHistoryEntry {
  id: string;
  promptId: string;
  promptTitle: string;
  values: Record<string, string>;
  timestamp: number;
}

interface HistoryState {
  history: UsageHistoryEntry[];
  loadHistory: (promptId?: string) => void;
  addHistory: (entry: Omit<UsageHistoryEntry, 'id'>) => void;
  clearHistory: (promptId?: string) => void;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function initHistoryTable(db: any) {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS usage_history (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL,
      prompt_title TEXT NOT NULL,
      values_json TEXT DEFAULT '{}',
      timestamp INTEGER NOT NULL
    );
  `);
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: [],

  loadHistory: (promptId?: string) => {
    try {
      const db = getDatabase();
      let query = 'SELECT * FROM usage_history';
      const params: string[] = [];
      if (promptId) {
        query += ' WHERE prompt_id = ?';
        params.push(promptId);
      }
      query += ' ORDER BY timestamp DESC LIMIT 100';
      const rows = db.getAllSync<any>(query, params);
      const history = rows.map((r: any) => ({
        id: r.id,
        promptId: r.prompt_id,
        promptTitle: r.prompt_title,
        values: JSON.parse(r.values_json || '{}'),
        timestamp: r.timestamp,
      }));
      set({ history });
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  },

  addHistory: (entry) => {
    try {
      const db = getDatabase();
      const id = generateId();
      db.runSync(
        'INSERT INTO usage_history (id, prompt_id, prompt_title, values_json, timestamp) VALUES (?, ?, ?, ?, ?)',
        [id, entry.promptId, entry.promptTitle, JSON.stringify(entry.values), entry.timestamp]
      );
      get().loadHistory();
    } catch (e) {
      console.error('Failed to add history:', e);
    }
  },

  clearHistory: (promptId?: string) => {
    try {
      const db = getDatabase();
      if (promptId) {
        db.runSync('DELETE FROM usage_history WHERE prompt_id = ?', [promptId]);
      } else {
        db.runSync('DELETE FROM usage_history');
      }
      get().loadHistory();
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  },
}));
