import { Router, Request, Response } from 'express';
import { getProjectByShareToken, getProjectDir } from '../services/project';
import path from 'path';
import fs from 'fs';

const router = Router();

router.get('/:token', async (req: Request, res: Response) => {
  try {
    const project = await getProjectByShareToken(req.params.token);
    if (!project) {
      res.status(404).send('Project not found or sharing is disabled');
      return;
    }

    const projectDir = getProjectDir(project);
    const indexPath = path.join(projectDir, 'index.html');

    if (!fs.existsSync(indexPath)) {
      res.status(404).send('Project files not found');
      return;
    }

    res.sendFile(indexPath);
  } catch (err: any) {
    res.status(500).send('Error serving project');
  }
});

router.get('/:token/*', async (req: Request, res: Response) => {
  try {
    const project = await getProjectByShareToken(req.params.token);
    if (!project) {
      res.status(404).send('Not found');
      return;
    }

    const projectDir = getProjectDir(project);
    const assetPath = req.originalUrl.replace(`/s/${req.params.token}/`, '');
    const fullPath = path.join(projectDir, assetPath);

    if (!fullPath.startsWith(projectDir)) {
      res.status(403).send('Forbidden');
      return;
    }

    if (!fs.existsSync(fullPath)) {
      res.status(404).send('Not found');
      return;
    }

    res.sendFile(fullPath);
  } catch (err: any) {
    res.status(500).send('Error serving asset');
  }
});

export default router;
