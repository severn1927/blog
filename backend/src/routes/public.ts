import { Router, Request, Response } from 'express';
import { getDb } from '../services/db';

const router = Router();

// Get all public shared projects
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const category = req.query.category as string;

    let whereClause = 'WHERE p.is_shared = 1';
    const params: any[] = [];

    if (category && category !== 'all') {
      whereClause += ' AND p.category = ?';
      params.push(category);
    }

    // Get total count
    const countResult = db.exec(
      `SELECT COUNT(*) as total FROM projects p ${whereClause}`,
      params
    );
    const total = countResult.length > 0 ? Number(countResult[0].values[0][0]) : 0;

    // Get projects
    const result = db.exec(
      `SELECT p.id, p.name, p.share_token, p.category, p.description, p.file_size, p.created_at, u.username as author
       FROM projects p
       LEFT JOIN users u ON p.user_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    if (result.length === 0) {
      res.json({ projects: [], total, page, limit });
      return;
    }

    const columns = result[0].columns;
    const projects = result[0].values.map((row) => {
      const obj: Record<string, any> = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return {
        ...obj,
        file_size_mb: Math.round((Number(obj.file_size || 0) / 1024 / 1024) * 100) / 100,
        created_at: String(obj.created_at),
        preview_url: `/s/${obj.share_token}`,
      };
    });

    // Get all categories
    const catResult = db.exec(
      `SELECT DISTINCT category FROM projects WHERE is_shared = 1 AND category IS NOT NULL AND category != ''`
    );
    const categories: string[] = catResult.length > 0
      ? catResult[0].values.map((row) => String(row[0]))
      : [];

    res.json({ projects, total, page, limit, categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
