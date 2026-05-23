import { getDb, saveDatabase } from './db';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { UPLOADS_DIR } from './db';
import { COVERS_DIR } from '../middleware/upload';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  share_token: string | null;
  is_shared: number;
  file_size: number;
  category?: string;
  description?: string;
  cover_image?: string;
  created_at: string;
  updated_at: string;
}

export async function getProjectsByUserId(userId: string): Promise<Project[]> {
  const db = await getDb();
  const result = db.exec('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as Project;
  });
}

export async function getProjectById(projectId: string): Promise<Project | undefined> {
  const db = await getDb();
  const result = db.exec('SELECT * FROM projects WHERE id = ?', [projectId]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const obj: Record<string, any> = {};
  columns.forEach((col, i) => {
    obj[col] = row[i];
  });
  return obj as Project;
}

export async function getProjectByShareToken(token: string): Promise<Project | undefined> {
  const db = await getDb();
  const result = db.exec('SELECT * FROM projects WHERE share_token = ? AND is_shared = 1', [token]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const obj: Record<string, any> = {};
  columns.forEach((col, i) => {
    obj[col] = row[i];
  });
  return obj as Project;
}

export async function createProject(userId: string, name: string, zipBuffer: Buffer, meta?: { category?: string; description?: string }): Promise<Project> {
  const id = uuidv4();
  const shareToken = uuidv4().replace(/-/g, '').substring(0, 12);
  const projectDir = path.join(UPLOADS_DIR, userId, id);

  // Create project directory
  fs.mkdirSync(projectDir, { recursive: true });

  // Extract zip
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  // Check if index.html exists
  const hasIndex = entries.some(
    (e) => e.entryName === 'index.html' || e.entryName.endsWith('/index.html')
  );

  if (!hasIndex) {
    fs.rmSync(projectDir, { recursive: true, force: true });
    throw new Error('Project must contain index.html');
  }

  // Extract all files
  zip.extractAllTo(projectDir, true);

  // Calculate total file size
  let totalSize = 0;
  function calcDirSize(dirPath: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        calcDirSize(fullPath);
      } else {
        totalSize += fs.statSync(fullPath).size;
      }
    }
  }
  calcDirSize(projectDir);

  const now = new Date().toISOString();
  const category = meta?.category || '';
  const description = meta?.description || '';

  const db = await getDb();
  db.run(
    'INSERT INTO projects (id, user_id, name, share_token, is_shared, file_size, category, description, cover_image, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)',
    [id, userId, name, shareToken, totalSize, category, description, '', now, now]
  );
  saveDatabase();

  return {
    id,
    user_id: userId,
    name,
    share_token: shareToken,
    is_shared: 1,
    file_size: totalSize,
    category,
    description,
    cover_image: '',
    created_at: now,
    updated_at: now,
  };
}

export async function updateCoverImage(projectId: string, userId: string, imageBuffer: Buffer, originalName: string): Promise<{ cover_image: string }> {
  const project = await getProjectById(projectId);
  if (!project || project.user_id !== userId) {
    throw new Error('Project not found');
  }

  // Delete old cover if exists
  if (project.cover_image) {
    const oldCoverPath = path.join(COVERS_DIR, project.cover_image);
    if (fs.existsSync(oldCoverPath)) {
      fs.unlinkSync(oldCoverPath);
    }
  }

  // Generate unique filename
  const ext = path.extname(originalName).toLowerCase() || '.png';
  const filename = `${projectId}-${Date.now()}${ext}`;
  fs.writeFileSync(path.join(COVERS_DIR, filename), imageBuffer);

  const db = await getDb();
  db.run('UPDATE projects SET cover_image = ?, updated_at = ? WHERE id = ? AND user_id = ?', [
    filename,
    new Date().toISOString(),
    projectId,
    userId,
  ]);
  saveDatabase();

  return { cover_image: filename };
}

export async function deleteProject(projectId: string, userId: string): Promise<boolean> {
  const project = await getProjectById(projectId);
  if (!project || project.user_id !== userId) {
    throw new Error('Project not found');
  }

  const projectDir = path.join(UPLOADS_DIR, userId, projectId);
  if (fs.existsSync(projectDir)) {
    fs.rmSync(projectDir, { recursive: true, force: true });
  }

  // Delete cover image if exists
  if (project.cover_image) {
    const coverPath = path.join(COVERS_DIR, project.cover_image);
    if (fs.existsSync(coverPath)) {
      fs.unlinkSync(coverPath);
    }
  }

  const db = await getDb();
  db.run('DELETE FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
  saveDatabase();
  return true;
}

export async function toggleShare(projectId: string, userId: string): Promise<{ is_shared: boolean }> {
  const project = await getProjectById(projectId);
  if (!project || project.user_id !== userId) {
    throw new Error('Project not found');
  }

  const newShared = project.is_shared ? 0 : 1;
  const db = await getDb();
  db.run('UPDATE projects SET is_shared = ?, updated_at = ? WHERE id = ? AND user_id = ?', [
    newShared,
    new Date().toISOString(),
    projectId,
    userId,
  ]);
  saveDatabase();

  return { is_shared: newShared === 1 };
}

export function getProjectDir(project: Project): string {
  return path.join(UPLOADS_DIR, project.user_id, project.id);
}
