import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { PenSquare, Trash2, Eye, EyeOff, Plus, FileText, Search } from 'lucide-react';
import type { Post, PostPagination } from '../types';

export default function Posts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<PostPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    loadPosts();
  }, [page, statusFilter]);

  async function loadPosts() {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (statusFilter === 'published') params.status = '1';
      if (statusFilter === 'draft') params.status = '0';

      const result = await api.get<PostPagination>('/api/posts/admin/list', params);
      setData(result);
    } catch (err) {
      console.error('加载文章失败:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(post: Post) {
    try {
      await api.put(`/api/posts/${post.id}`, {
        status: post.status === 1 ? 0 : 1,
      });
      loadPosts();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  }

  async function deletePost(post: Post) {
    if (!confirm(`确定删除文章「${post.title}」吗？此操作不可撤销。`)) return;
    try {
      await api.delete(`/api/posts/${post.id}`);
      loadPosts();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    // Search is client-side for now since API doesn't support full-text search
    // Reset to page 1
    setSearchParams({ page: '1' });
  }

  function handlePageChange(newPage: number) {
    setSearchParams({ page: String(newPage) });
    window.scrollTo(0, 0);
  }

  const filteredPosts = data?.posts.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.tags.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  }) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">文章管理</h1>
          <p className="text-gray-500 mt-1 text-sm">
            共 {data?.pagination.total || 0} 篇文章，已发布 {data?.posts.filter(p => p.status === 1).length} 篇
          </p>
        </div>
        <Link
          to="/bianji/posts/new"
          className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建文章
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索文章标题、标签..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </form>
          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'published', label: '已发布' },
              { key: 'draft', label: '草稿' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === f.key
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Post List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-2">加载中...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-lg">暂无文章</p>
            <p className="text-sm mt-1">点击"新建文章"开始创作</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Cover thumbnail */}
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {post.cover_image ? (
                      <img
                        src={`/post-covers/${post.cover_image}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-300" />
                    )}
                  </div>

                  {/* Post info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/bianji/posts/${post.id}/edit`}
                        className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors truncate"
                      >
                        {post.title}
                      </Link>
                      <span
                        className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          post.status === 1
                            ? 'bg-green-50 text-green-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {post.status === 1 ? '已发布' : '草稿'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
                      <span>{post.word_count} 字</span>
                      <span>{post.reading_time} 分钟</span>
                      {post.category && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{post.category}</span>}
                      {post.tags && (
                        <span className="truncate">{post.tags.split(',').slice(0, 3).join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-4 shrink-0">
                  <button
                    onClick={() => window.open(`/post/${post.slug}`, '_blank')}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                    title="预览"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleStatus(post)}
                    className={`p-1.5 rounded-md transition-colors ${
                      post.status === 1
                        ? 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                        : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                    }`}
                    title={post.status === 1 ? '取消发布' : '发布'}
                  >
                    {post.status === 1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <Link
                    to={`/bianji/posts/${post.id}/edit`}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                    title="编辑"
                  >
                    <PenSquare className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => deletePost(post)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              第 {data.pagination.page} / {data.pagination.totalPages} 页
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                上一页
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= data.pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
