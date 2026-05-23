import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { api } from '../services/api';
import { FolderUp, ArrowRight, HardDrive, TrendingUp, Upload, Settings, FileText, PenSquare } from 'lucide-react';
import type { Project, UserStats, PostStats } from '../types';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [postStats, setPostStats] = useState<PostStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadProjects();
    loadPostStats();
  }, []);

  async function loadStats() {
    try {
      const data = await api.get<UserStats>('/api/user/stats');
      setStats(data);
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  }

  async function loadPostStats() {
    try {
      const data = await api.get<PostStats>('/api/posts/stats');
      setPostStats(data);
    } catch (err) {
      console.error('加载文章统计失败:', err);
    }
  }

  async function loadProjects() {
    try {
      const data = await api.get<Project[]>('/api/projects');
      setRecentProjects(data.slice(0, 5));
    } catch (err) {
      console.error('加载项目失败:', err);
    } finally {
      setLoading(false);
    }
  }

  const spacePercent = stats ? Math.round((stats.spaceUsed / stats.totalSpace) * 100) : 0;
  const spaceRemaining = stats ? (stats.totalSpace - stats.spaceUsed).toFixed(2) : '0';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-400">
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-2">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          欢迎回来，{user?.username}
        </h1>
        <p className="text-gray-500 mt-1">管理您的项目、文章和分享链接</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">项目总数</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats?.projectCount || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FolderUp className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已发布文章</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{postStats?.published || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">草稿文章</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{postStats?.drafts || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <PenSquare className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已用空间</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats?.spaceUsed || 0} MB</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>空间使用率</span>
              <span>{spacePercent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-blue-500 rounded-full h-1.5 transition-all duration-300"
                style={{ width: `${Math.min(spacePercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-800">最近项目</h2>
            <Link to="/bianji/projects" className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
              管理我的项目 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentProjects.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-400">
                <FolderUp className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                <p>已上传项目 {stats?.projectCount || 0}</p>
              </div>
            ) : (
              recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to="/bianji/projects"
                  className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FolderUp className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-sm font-medium text-gray-700 truncate">{project.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                    <span>{project.file_size_mb} MB</span>
                    <span>{new Date(project.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4">快速操作</h3>
            <div className="space-y-3">
              <Link
                to="/bianji/posts/new"
                className="w-full flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                <PenSquare className="w-4 h-4" />
                写新文章
              </Link>
              <Link
                to="/bianji/projects"
                className="w-full flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                上传新项目
              </Link>
            </div>
          </div>

          {/* Storage */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-3">存储空间</h3>
            <div className="flex items-end justify-between text-sm">
              <div>
                <span className="text-2xl font-bold text-gray-800">{stats?.spaceUsed || 0}</span>
                <span className="text-gray-400 ml-1">已用 (MB)</span>
              </div>
              <span className="text-gray-400">{stats?.totalSpace || 30} 总量 (MB)</span>
            </div>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
              <div
                className={`rounded-full h-2 transition-all duration-300 ${
                  spacePercent > 80 ? 'bg-red-500' : spacePercent > 50 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(spacePercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">可用空间 {spaceRemaining} MB</p>
          </div>

          <Link
            to="/bianji/help"
            className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">帮助中心</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
        </div>
      </div>
    </div>
  );
}
