import path from 'path';
import fs from 'fs';

const BACKEND_DATA_DIR = path.resolve(process.cwd(), 'backend', 'src', 'data');
const DB_PATH = path.join(BACKEND_DATA_DIR, 'project-share.db');
const UPLOADS_DIR = path.resolve(process.cwd(), 'backend', 'src', 'uploads');

if (!fs.existsSync(BACKEND_DATA_DIR)) {
  fs.mkdirSync(BACKEND_DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

let db: any;

async function initDb() {
  const SQL = await import('sql.js');
  const SQLModule = await SQL.default();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQLModule.Database(buffer);
  } else {
    db = new SQLModule.Database();
  }

  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    share_token TEXT UNIQUE,
    is_shared INTEGER DEFAULT 0,
    file_size INTEGER DEFAULT 0,
    category TEXT DEFAULT '',
    description TEXT DEFAULT '',
    cover_image TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    excerpt TEXT NOT NULL DEFAULT '',
    cover_image TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '',
    status INTEGER NOT NULL DEFAULT 0,
    word_count INTEGER NOT NULL DEFAULT 0,
    reading_time INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  )`);

  // Migrations for older databases
  try { db.run("ALTER TABLE projects ADD COLUMN category TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE projects ADD COLUMN description TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE projects ADD COLUMN cover_image TEXT DEFAULT ''"); } catch(e) {}

  saveDb();
}

function saveDb() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    } catch (err) {
      console.error('Failed to save database:', err);
    }
  }
}

export async function getDb() {
  if (!db) {
    await initDb();
  }
  return db;
}

export function saveDatabase() {
  saveDb();
}

export { UPLOADS_DIR };
