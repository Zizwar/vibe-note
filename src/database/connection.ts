import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('vibe.db');
    _db.execSync('PRAGMA journal_mode = WAL');
    _db.execSync('PRAGMA foreign_keys = ON');
  }
  return _db;
}
