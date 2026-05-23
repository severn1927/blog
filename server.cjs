
const express = require('express');
const path = require('path');

// Dynamically import backend routes
async function start() {
  const app = express();

  // API routes from backend
  const authRoutes = require('./backend/src/routes/auth').default;
  const projectRoutes = require('./backend/src/routes/projects').default;
  const userRoutes = require('./backend/src/routes/user').default;
  const shareRoutes = require('./backend/src/routes/share').default;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/user', userRoutes);
  app.use('/s', shareRoutes);

  // Serve frontend static files
  app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
  });

  const PORT = 3000;
  app.listen(PORT, '127.0.0.1', () => {
    console.log('Server running on http://127.0.0.1:' + PORT);
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
