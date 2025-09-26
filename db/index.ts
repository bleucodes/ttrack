import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('ttrack.db');
  await _db.execAsync('PRAGMA foreign_keys = ON;');

  await _db.execAsync(`
    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date INTEGER NOT NULL,
      interval INTEGER NOT NULL,
      siteRotation TEXT
    );

    CREATE TABLE IF NOT EXISTS injection (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheduleId INTEGER NOT NULL,
      date INTEGER NOT NULL,
      site TEXT,
      dose REAL,
      metric TEXT,
      notes TEXT,
      FOREIGN KEY (scheduleId) REFERENCES schedule(id) ON DELETE CASCADE
    );
  `);

  return _db;
}
