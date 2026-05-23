# ProjectShare

Project sharing management platform - upload static website projects, manage sharing links, and let others access your projects via unique URLs.

## Quick Start

### Requirements
- Node.js >= 18
- npm >= 9

### Install & Run

```bash
# Install all dependencies (root + frontend + backend)
cd project-share
npm install

# Start both frontend and backend (development)
node --import tsx server.tsx
```

## Directory Structure

```
project-share/
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/     # Shared components (Header, AuthGuard, etc.)
│   │   ├── pages/          # Pages (Login, Dashboard, Projects, Help)
│   │   ├── services/       # API client
│   │   ├── stores/         # Zustand state management
│   │   ├── types/          # TypeScript types
│   │   └── lib/            # Utilities
│   └── ...
├── backend/                # Express API server
│   ├── src/
│   │   ├── routes/         # API routes (auth, projects, user, share)
│   │   ├── middleware/      # Auth middleware, upload middleware
│   │   └── services/       # Business logic (db, user, project)
│   ├── data/               # SQLite database (auto-created)
│   └── uploads/            # Uploaded project files (auto-created)
└── package.json            # Root workspace config
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| State | Zustand |
| File Packing | JSZip |
| Backend | Express + TypeScript |
| Database | sql.js (SQLite, pure JS, no native deps) |
| Auth | JWT + bcrypt |
| File Upload | multer + adm-zip |

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### User (requires auth)
- `GET /api/user/stats` - Get user statistics (project count, space usage)

### Projects (requires auth)
- `GET /api/projects` - List all projects
- `POST /api/projects` - Upload new project (multipart/form-data with `name` and `file`)
- `POST /api/projects/:id/toggle-share` - Toggle sharing on/off
- `DELETE /api/projects/:id` - Delete project

### Share
- `GET /s/:token` - Access shared project (serves index.html)
- `GET /s/:token/*` - Serve static assets for shared project

## Features

- User registration and login with JWT authentication
- Upload project folders (auto-packed to ZIP via JSZip in browser)
- Paste single HTML code as a project
- Project listing with search
- Share link generation and copy
- Enable/disable sharing per project
- Delete projects with confirmation
- Space usage tracking
- Responsive design (mobile + desktop)
