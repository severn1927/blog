import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/auth';
import Header from './components/layout/Header';
import Announcement from './components/layout/Announcement';
import AuthGuard from './components/layout/AuthGuard';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Posts from './pages/Posts';
import PostEditor from './pages/PostEditor';
import HelpPage from './pages/Help';

function AdminLayout() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Announcement />
      <main className="pb-8">
        {!mounted && <div className="text-center py-20 text-gray-400">加载中...</div>}
        {mounted && (
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="posts" element={<Posts />} />
            <Route path="posts/new" element={<PostEditor />} />
            <Route path="posts/:id/edit" element={<PostEditor />} />
            <Route path="help" element={<HelpPage />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/bianji/login" element={<LoginPage />} />
        <Route element={<AuthGuard />}>
          <Route path="/bianji/*" element={<AdminLayout />} />
        </Route>
        <Route path="*" element={<Navigate to="/bianji" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
