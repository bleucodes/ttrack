import { getDb } from './index';

export async function logInjection(scheduleId: number, date: number, site?: string, dose?: number, metric?: string, notes?: string) {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO injection(scheduleId, date, site, dose, metric, notes) VALUES (?, ?, ?, ?, ?, ?)',
    scheduleId, date, site ?? null, dose ?? null, metric ?? null, notes ?? null
  );
  return Number(res.lastInsertRowId);
}

export async function listInjections(scheduleId: number) {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM injection WHERE scheduleId = ? ORDER BY date DESC', scheduleId);
}
