import { getDb } from './index';

export async function createSchedule(date: number, interval: number, siteRotation?: string) {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO schedule(date, interval, siteRotation) VALUES (?, ?, ?)',
    date, interval, siteRotation ?? null
  );
  return Number(res.lastInsertRowId);
}

export async function listSchedules() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM schedule ORDER BY id ASC');
}
