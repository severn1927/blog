import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './backend/src/routes/auth.ts';
import projectRoutes from './backend/src/routes/projects.ts';
import userRoutes from './backend/src/routes/user.ts';
import shareRoutes from './backend/src/routes/share.ts';
import publicRoutes from './backend/src/routes/public.ts';
import seoRoutes from './backend/src/routes/seo.ts';
import postRoutes from './backend/src/routes/posts.ts';

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// SEO & Public pages (SSR)
app.use(seoRoutes);

// Public API
app.use('/api/public', publicRoutes);

// Blog Posts API (public + protected)
app.use('/api/posts', postRoutes);

// Auth API
app.use('/api/auth', authRoutes);

// Protected API
app.use('/api/projects', projectRoutes);
app.use('/api/user', userRoutes);

// Share routes (project preview)
app.use('/s', shareRoutes);

// Serve logo
app.use('/logo.png', express.static(path.join(__dirname, 'public', 'logo.png')));

// Serve cover images (projects)
app.use('/covers', express.static(path.join(__dirname, 'backend', 'src', 'covers')));

// Serve post cover images
app.use('/post-covers', express.static(path.join(__dirname, 'backend', 'src', 'covers')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// SPA fallback for /bianji/*
app.get('/bianji', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.get('/bianji/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

const PORT = 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log('Server running on http://127.0.0.1:' + PORT);
});
