import bcrypt from 'bcrypt';
import { getDb, saveDatabase } from './db';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 10;

export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface RegisterInput {
  username: string;
  password: string;
}

export async function register(input: RegisterInput): Promise<{ user: Omit<User, 'password'>; token: string }> {
  const db = await getDb();

  const existing = db.exec('SELECT id FROM users WHERE username = ?', [input.username]);
  if (existing.length > 0) {
    throw new Error('Username already exists');
  }

  const id = uuidv4();
  const hashedPassword = bcrypt.hashSync(input.password, SALT_ROUNDS);

  db.run('INSERT INTO users (id, username, password) VALUES (?, ?, ?)', [id, input.username, hashedPassword]);
  saveDatabase();

  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ userId: id }, process.env.JWT_SECRET || 'project-share-secret-key', {
    expiresIn: '7d',
  });

  return {
    user: { id, username: input.username, created_at: new Date().toISOString() },
    token,
  };
}

export async function login(input: RegisterInput): Promise<{ user: Omit<User, 'password'>; token: string }> {
  const db = await getDb();

  const result = db.exec('SELECT * FROM users WHERE username = ?', [input.username]);
  if (result.length === 0 || result[0].values.length === 0) {
    throw new Error('Invalid username or password');
  }

  const row = result[0].values[0];
  const userId = row[0];
  const hashedPassword = String(row[2]);

  const valid = bcrypt.compareSync(input.password, hashedPassword);
  if (!valid) {
    throw new Error('Invalid username or password');
  }

  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'project-share-secret-key', {
    expiresIn: '7d',
  });

  return {
    user: { id: userId, username: input.username, created_at: String(row[3]) },
    token,
  };
}

export async function getUserById(userId: string): Promise<User | undefined> {
  const db = await getDb();
  const result = db.exec('SELECT id, username, created_at FROM users WHERE id = ?', [userId]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;
  const row = result[0].values[0];
  return { id: String(row[0]), username: String(row[1]), created_at: String(row[2]) };
}

export async function getUserStats(userId: string) {
  const db = await getDb();

  const projectCountResult = db.exec('SELECT COUNT(*) as count FROM projects WHERE user_id = ?', [userId]);
  const projectCount = projectCountResult.length > 0 ? Number(projectCountResult[0].values[0][0]) : 0;

  const spaceUsedResult = db.exec('SELECT COALESCE(SUM(file_size), 0) as total FROM projects WHERE user_id = ?', [userId]);
  const spaceUsedBytes = spaceUsedResult.length > 0 ? Number(spaceUsedResult[0].values[0][0]) : 0;

  return {
    projectCount,
    spaceUsed: Math.round(spaceUsedBytes / (1024 * 1024) * 100) / 100,
    totalSpace: 30,
  };
}
