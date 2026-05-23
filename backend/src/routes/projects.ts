import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import upload, { coverUpload, COVERS_DIR } from '../middleware/upload';
import {
  getProjectsByUserId,
  createProject,
  deleteProject,
  toggleShare,
  updateCoverImage,
} from '../services/project';

const router = Router();

// Get all projects
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const projects = await getProjectsByUserId(req.userId!);
    const formatted = projects.map((p) => ({
      ...p,
      file_size_mb: Math.round((p.file_size / 1024 / 1024) * 100) / 100,
      is_shared: p.is_shared === 1,
      category: p.category || '',
      description: p.description || '',
      cover_image: p.cover_image || '',
    }));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upload new project
router.post('/', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Project name is required' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const project = await createProject(req.userId!, name, req.file.buffer, {
      category: req.body.category || '',
      description: req.body.description || '',
    });
    res.status(201).json({
      ...project,
      file_size_mb: Math.round((project.file_size / 1024 / 1024) * 100) / 100,
      is_shared: project.is_shared === 1,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Upload cover image for a project
router.post('/:id/cover', authMiddleware, coverUpload.single('cover'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image uploaded' });
      return;
    }
    const result = await updateCoverImage(req.params.id, req.userId!, req.file.buffer, req.file.originalname);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// Toggle share status
router.post('/:id/toggle-share', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await toggleShare(req.params.id, req.userId!);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// Delete project
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await deleteProject(req.params.id, req.userId!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

export default router;
