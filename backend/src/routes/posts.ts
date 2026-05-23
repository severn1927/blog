import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { coverUpload } from '../middleware/upload';
import {
  getAllPosts,
  getPostBySlug,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getAllTags,
  getArchiveGrouped,
  getSiteSetting,
  setSiteSetting,
  getPostCount,
} from '../services/post';

const router = Router();

// ==================== Public API ====================

// GET /api/posts - list published posts (supports pagination, tag filter, category filter)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const tag = req.query.tag as string;
    const category = req.query.category as string;
    const status = req.query.status !== undefined ? parseInt(req.query.status as string) : 1;

    const { posts, total } = await getAllPosts({ status, page, limit, tag, category });
    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/:slug - get single published post by slug
router.get('/slug/:slug', async (req: AuthRequest, res: Response) => {
  try {
    const post = await getPostBySlug(req.params.slug);
    if (!post || post.status !== 1) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(post);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/tags - get all tags with counts
router.get('/tags', async (req: AuthRequest, res: Response) => {
  try {
    const tags = await getAllTags();
    res.json(tags);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/archive - get posts grouped by year/month
router.get('/archive', async (req: AuthRequest, res: Response) => {
  try {
    const archive = await getArchiveGrouped();
    res.json(archive);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/stats - get post statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [published, drafts, total] = await Promise.all([
      getPostCount(1),
      getPostCount(0),
      getPostCount(),
    ]);
    res.json({ published, drafts, total });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/site-settings - get site settings (public)
router.get('/site-settings', async (req: AuthRequest, res: Response) => {
  try {
    const settings: Record<string, string> = {};
    for (const key of ['site_title', 'site_description', 'site_keywords', 'about_content', 'nav_links']) {
      settings[key] = await getSiteSetting(key);
    }
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== Protected API (require auth) ====================

// GET /api/posts/admin/list - list all posts (including drafts) for admin
router.get('/admin/list', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status !== undefined ? parseInt(req.query.status as string) : undefined;

    const { posts, total } = await getAllPosts({
      status,
      page,
      limit,
    });
    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/admin/:id - get single post by ID (including drafts)
router.get('/admin/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(post);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts - create new post
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, slug, excerpt, cover_image, category, tags, status } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }
    const post = await createPost({
      title,
      content,
      slug,
      excerpt,
      cover_image: cover_image || '',
      category: category || '',
      tags: tags || '',
      status: status !== undefined ? status : 0,
    });
    res.status(201).json(post);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/posts/:id - update post
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, slug, excerpt, cover_image, category, tags, status } = req.body;
    const post = await updatePost(req.params.id, {
      title,
      content,
      slug,
      excerpt,
      cover_image,
      category,
      tags,
      status,
    });
    res.json(post);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/posts/:id/cover - upload cover image
router.post('/:id/cover', authMiddleware, coverUpload.single('cover'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image uploaded' });
      return;
    }
    const filename = req.file.originalname;
    await updatePost(req.params.id, { cover_image: filename });
    res.json({ cover_image: filename });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// DELETE /api/posts/:id - delete post
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await deletePost(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// GET/PUT /api/posts/admin/site-settings - manage site settings (admin only)
router.get('/admin/site-settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const settings: Record<string, string> = {};
    for (const key of ['site_title', 'site_description', 'site_keywords', 'about_content', 'nav_links']) {
      settings[key] = await getSiteSetting(key);
    }
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/site-settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const updates: Record<string, string> = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await setSiteSetting(key, String(value));
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
