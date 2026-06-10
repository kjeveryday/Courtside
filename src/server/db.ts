// SQLite runtime store (AD-1, node:sqlite): the server's own verified event log
// plus a kv table (last-seen lands here for the Huddle in S7).
import { DatabaseSync } from 'node:sqlite';

export type DbEvent = {
  ts?: string;
  kind: string;
  provenance: 'verified' | 'claimed';
  text: string;
};

export function openDb(path: string) {
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      kind TEXT NOT NULL,
      provenance TEXT NOT NULL,
      text TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  const insert = db.prepare('INSERT INTO events (ts, kind, provenance, text) VALUES (?, ?, ?, ?)');
  const recent = db.prepare(
    'SELECT ts, kind, provenance, text FROM events ORDER BY id DESC LIMIT ?',
  );
  const kvGet = db.prepare('SELECT value FROM kv WHERE key = ?');
  const kvSet = db.prepare(
    'INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  );

  return {
    insertEvent(e: DbEvent) {
      insert.run(e.ts ?? new Date().toISOString(), e.kind, e.provenance, e.text);
    },
    recentEvents(limit: number) {
      return recent.all(limit) as { ts: string; kind: string; provenance: string; text: string }[];
    },
    getKv(key: string): string | undefined {
      const row = kvGet.get(key) as { value: string } | undefined;
      return row?.value;
    },
    setKv(key: string, value: string) {
      kvSet.run(key, value);
    },
    close() {
      db.close();
    },
  };
}

export type Db = ReturnType<typeof openDb>;
