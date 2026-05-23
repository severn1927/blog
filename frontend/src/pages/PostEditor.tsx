import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Save, Send, Image, Upload, X, Eye, Edit3 } from 'lucide-react';
import type { Post } from '../types';
import { marked } from 'marked';
import hljs from 'highlight.js';

export default function PostEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [showPreview, setShowPreview] = useState(false);
  const [showCoverUpload, setShowCoverUpload] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      loadPost();
    }
  }, [id]);

  async function loadPost() {
    try {
      const post = await api.get<Post>(`/api/posts/admin/${id}`);
      setTitle(post.title);
      setSlug(post.slug);
      setContent(post.content);
      setCategory(post.category || '');
      setTags(post.tags || '');
      setCoverImage(post.cover_image || '');
      setStatus(post.status);
    } catch (err: any) {
      alert(err.message || '加载文章失败');
      navigate('/bianji/posts');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(publishStatus: number) {
    if (!title.trim()) {
      alert('请输入文章标题');
      return;
    }
    if (!content.trim()) {
      alert('请输入文章内容');
      return;
    }

    setSaving(true);
    try {
      const body: any = {
        title: title.trim(),
        content: content.trim(),
        slug: slug.trim() || undefined,
        category: category.trim(),
        tags: tags.trim(),
        status: publishStatus,
      };

      if (isEditing) {
        await api.put(`/api/posts/${id}`, body);
      } else {
        await api.post('/api/posts', body);
      }

      navigate('/bianji/posts');
    } catch (err: any) {
      alert(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    setUploadingCover(true);
    try {
      let postId = id;
      if (!postId && !title.trim()) {
        alert('请先输入标题并保存草稿，再上传封面图');
        setUploadingCover(false);
        return;
      }

      if (!postId) {
        const newPost = await api.post<Post>('/api/posts', {
          title: title.trim(),
          content: content.trim() || '',
          status: 0,
        });
        navigate(`/bianji/posts/${newPost.id}/edit`, { replace: true });
        postId = newPost.id;
      }

      const formData = new FormData();
      formData.append('cover', file);
      const resp = await api.post<{ cover_image: string }>(`/api/posts/${postId}/cover`, formData);
      setCoverImage(resp.cover_image);
      setShowCoverUpload(false);
    } catch (err: any) {
      alert(err.message || '上传失败');
    } finally {
      setUploadingCover(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const previewHtml = useMemo(() => {
    try {
      const html = marked.parse(content, {
        breaks: true,
        gfm: true,
      }) as string;
      return html;
    } catch {
      return '<p>预览渲染错误</p>';
    }
  }, [content]);

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
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/bianji/posts" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">
            {isEditing ? '编辑文章' : '新建文章'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
              showPreview
                ? 'border-blue-400 bg-blue-50 text-blue-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {showPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? '编辑' : '预览'}
          </button>
          <button
            onClick={() => handleSave(0)}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            存草稿
          </button>
          <button
            onClick={() => handleSave(1)}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            发布
          </button>
        </div>
      </div>

      {/* Cover Image Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">封面图</label>
        <div className="flex items-center gap-4">
          {coverImage ? (
            <div className="relative w-40 h-24 rounded-lg overflow-hidden bg-gray-100">
              <img src={`/post-covers/${coverImage}`} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => setCoverImage('')}
                className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="w-40 h-24 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
              <Image className="w-6 h-6 text-gray-300" />
            </div>
          )}
          <button
            onClick={() => setShowCoverUpload(!showCoverUpload)}
            className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            {coverImage ? '更换封面' : '上传封面'}
          </button>
        </div>
        {showCoverUpload && (
          <div className="mt-3 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">支持 JPG、PNG、GIF，最大 5MB。建议比例 16:9。</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
            />
            {uploadingCover && <p className="text-xs text-blue-500 mt-2">上传中...</p>}
          </div>
        )}
      </div>

      {/* Title & Meta */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 space-y-4">
        <div>
          <input
            type="text"
            placeholder="输入文章标题..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xl font-semibold text-gray-800 placeholder-gray-300 border-0 focus:outline-none focus:ring-0"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-400 block mb-1">Slug（URL 路径）</label>
            <input
              type="text"
              placeholder="自动生成，也可手动指定"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="w-40">
            <label className="text-xs text-gray-400 block mb-1">分类</label>
            <input
              type="text"
              placeholder="分类"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-400 block mb-1">标签（逗号分隔）</label>
            <input
              type="text"
              placeholder="标签1, 标签2, 标签3"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
        {isEditing && (
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>状态：{status === 1 ? '已发布' : '草稿'}</span>
          </div>
        )}
      </div>

      {/* Editor / Preview */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {showPreview ? (
          <div className="p-6 min-h-[500px]">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{title || '无标题'}</h1>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-gray-400">暂无内容</p>' }}
            />
          </div>
        ) : (
          <textarea
            placeholder="使用 Markdown 语法编写文章内容..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[500px] p-6 text-sm font-mono text-gray-700 border-0 focus:outline-none resize-y bg-gray-50 leading-relaxed"
          />
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-4 mb-8">
        <p className="text-xs text-gray-400">
          {content.length} 字符
          {content.trim() && ` · 约 ${Math.max(1, Math.ceil(content.length / 300))} 分钟阅读`}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave(0)}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            存草稿
          </button>
          <button
            onClick={() => handleSave(1)}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            发布文章
          </button>
        </div>
      </div>
    </div>
  );
}
