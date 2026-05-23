import { getDb, saveDatabase } from './db';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { COVERS_DIR } from '../middleware/upload';

export interface Post {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  cover_image: string;
  category: string;
  tags: string;
  status: number; // 0=draft, 1=published
  word_count: number;
  reading_time: number;
  created_at: string;
  updated_at: string;
}

function generateSlug(title: string): string {
  const now = new Date();
  const dateStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  const slug = title
    .toLowerCase()
    .replace(/[\u4e00-\u9fff]+/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
  return slug ? `${dateStr}-${slug}` : `${dateStr}-${uuidv4().substring(0, 8)}`;
}

function calcWordCount(content: string): number {
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}

function calcReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 300));
}

function generateExcerpt(content: string, maxLen: number = 150): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*`>\-\[\]()!]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  if (plain.length <= maxLen) return plain;
  return plain.substring(0, maxLen) + '...';
}

function rowToPost(columns: string[], row: any[]): Post {
  const obj: Record<string, any> = {};
  columns.forEach((col, i) => { obj[col] = row[i]; });
  return obj as Post;
}

export async function getAllPosts(options?: { status?: number; page?: number; limit?: number; tag?: string; category?: string }): Promise<{ posts: Post[]; total: number }> {
  const db = await getDb();
  const status = options?.status ?? 1;
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE status = ?';
  const params: any[] = [status];

  if (options?.tag) {
    whereClause += ' AND tags LIKE ?';
    params.push(`%${options.tag}%`);
  }
  if (options?.category) {
    whereClause += ' AND category = ?';
    params.push(options.category);
  }

  const countResult = db.exec(`SELECT COUNT(*) as cnt FROM posts ${whereClause}`, params);
  const total = countResult.length > 0 ? countResult[0].values[0][0] as number : 0;

  const result = db.exec(
    `SELECT * FROM posts ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const posts: Post[] = result.length > 0
    ? result[0].values.map((row) => rowToPost(result[0].columns, row))
    : [];

  return { posts, total };
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const db = await getDb();
  const result = db.exec('SELECT * FROM posts WHERE slug = ?', [slug]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;
  return rowToPost(result[0].columns, result[0].values[0]);
}

export async function getPostById(id: string): Promise<Post | undefined> {
  const db = await getDb();
  const result = db.exec('SELECT * FROM posts WHERE id = ?', [id]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;
  return rowToPost(result[0].columns, result[0].values[0]);
}

export async function getAdjacentPosts(slug: string): Promise<{ prev: Post | null; next: Post | null }> {
  const db = await getDb();
  const prevResult = db.exec(
    `SELECT * FROM posts WHERE status = 1 AND created_at > (SELECT created_at FROM posts WHERE slug = ?) ORDER BY created_at ASC LIMIT 1`,
    [slug]
  );
  const nextResult = db.exec(
    `SELECT * FROM posts WHERE status = 1 AND created_at < (SELECT created_at FROM posts WHERE slug = ?) ORDER BY created_at DESC LIMIT 1`,
    [slug]
  );
  return {
    prev: prevResult.length > 0 && prevResult[0].values.length > 0 ? rowToPost(prevResult[0].columns, prevResult[0].values[0]) : null,
    next: nextResult.length > 0 && nextResult[0].values.length > 0 ? rowToPost(nextResult[0].columns, nextResult[0].values[0]) : null,
  };
}

export async function createPost(data: {
  title: string;
  content: string;
  slug?: string;
  excerpt?: string;
  cover_image?: string;
  category?: string;
  tags?: string;
  status?: number;
}): Promise<Post> {
  const db = await getDb();
  const id = uuidv4();
  const slug = data.slug || generateSlug(data.title);
  const wordCount = calcWordCount(data.content);
  const readTime = calcReadingTime(wordCount);
  const excerpt = data.excerpt || generateExcerpt(data.content);
  const now = new Date().toISOString();

  // Ensure slug is unique
  let finalSlug = slug;
  let slugCheck = db.exec('SELECT id FROM posts WHERE slug = ?', [finalSlug]);
  let counter = 1;
  while (slugCheck.length > 0 && slugCheck[0].values.length > 0) {
    finalSlug = `${slug}-${counter++}`;
    slugCheck = db.exec('SELECT id FROM posts WHERE slug = ?', [finalSlug]);
  }

  db.run(
    `INSERT INTO posts (id, slug, title, content, excerpt, cover_image, category, tags, status, word_count, reading_time, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, finalSlug, data.title, data.content, excerpt, data.cover_image || '', data.category || '', data.tags || '', data.status ?? 0, wordCount, readTime, now, now]
  );
  saveDatabase();

  return {
    id, slug: finalSlug, title: data.title, content: data.content,
    excerpt, cover_image: data.cover_image || '', category: data.category || '',
    tags: data.tags || '', status: data.status ?? 0,
    word_count: wordCount, reading_time: readTime, created_at: now, updated_at: now,
  };
}

export async function updatePost(id: string, data: {
  title?: string;
  content?: string;
  slug?: string;
  excerpt?: string;
  cover_image?: string;
  category?: string;
  tags?: string;
  status?: number;
}): Promise<Post> {
  const db = await getDb();
  const existing = await getPostById(id);
  if (!existing) throw new Error('Post not found');

  const title = data.title ?? existing.title;
  const content = data.content ?? existing.content;
  const wordCount = calcWordCount(content);
  const readTime = calcReadingTime(wordCount);
  const excerpt = data.excerpt || (data.content ? generateExcerpt(data.content) : existing.excerpt);
  const now = new Date().toISOString();

  db.run(
    `UPDATE posts SET title=?, content=?, slug=?, excerpt=?, cover_image=?, category=?, tags=?, status=?, word_count=?, reading_time=?, updated_at=? WHERE id=?`,
    [
      title, content, data.slug ?? existing.slug, excerpt,
      data.cover_image ?? existing.cover_image,
      data.category ?? existing.category,
      data.tags ?? existing.tags,
      data.status ?? existing.status,
      wordCount, readTime, now, id,
    ]
  );
  saveDatabase();

  return {
    ...existing, title, content, excerpt,
    slug: data.slug ?? existing.slug,
    cover_image: data.cover_image ?? existing.cover_image,
    category: data.category ?? existing.category,
    tags: data.tags ?? existing.tags,
    status: data.status ?? existing.status,
    word_count: wordCount, reading_time: readTime, updated_at: now,
  };
}

export async function deletePost(id: string): Promise<boolean> {
  const db = await getDb();
  const post = await getPostById(id);
  if (!post) throw new Error('Post not found');

  if (post.cover_image) {
    const coverPath = path.join(COVERS_DIR, post.cover_image);
    if (fs.existsSync(coverPath)) {
      fs.unlinkSync(coverPath);
    }
  }

  db.run('DELETE FROM posts WHERE id = ?', [id]);
  saveDatabase();
  return true;
}

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const db = await getDb();
  const result = db.exec(
    `SELECT tags FROM posts WHERE status = 1 AND tags != ''`
  );
  if (result.length === 0) return [];

  const tagMap = new Map<string, number>();
  for (const row of result[0].values) {
    const tags = String(row[0]).split(',').map(t => t.trim()).filter(Boolean);
    for (const tag of tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getArchiveGrouped(): Promise<{ year: number; groups: { month: number; posts: any[] }[] }[]> {
  const db = await getDb();
  const result = db.exec(
    `SELECT slug, title, created_at, reading_time, tags FROM posts WHERE status = 1 ORDER BY created_at DESC`
  );
  if (result.length === 0) return [];

  const yearMap = new Map<number, Map<number, any[]>>();
  for (const row of result[0].values) {
    const date = new Date(String(row[2]));
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    if (!yearMap.has(year)) yearMap.set(year, new Map());
    const monthMap = yearMap.get(year)!;
    if (!monthMap.has(month)) monthMap.set(month, []);

    monthMap.get(month)!.push({
      slug: String(row[0]),
      title: String(row[1]),
      date: String(row[2]),
      reading_time: Number(row[3]) || 1,
      tags: String(row[4] || ''),
    });
  }

  return Array.from(yearMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, monthMap]) => ({
      year,
      groups: Array.from(monthMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([month, posts]) => ({ month, posts })),
    }));
}

export async function getSiteSetting(key: string, defaultValue: string = ''): Promise<string> {
  const db = await getDb();
  const result = db.exec('SELECT value FROM site_settings WHERE key = ?', [key]);
  if (result.length === 0 || result[0].values.length === 0) return defaultValue;
  return String(result[0].values[0][0]);
}

export async function setSiteSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  db.run('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)', [key, value]);
  saveDatabase();
}

export async function getPostCount(status?: number): Promise<number> {
  const db = await getDb();
  const result = db.exec(
    status !== undefined
      ? 'SELECT COUNT(*) FROM posts WHERE status = ?'
      : 'SELECT COUNT(*) FROM posts',
    status !== undefined ? [status] : []
  );
  return result.length > 0 ? Number(result[0].values[0][0]) : 0;
}
