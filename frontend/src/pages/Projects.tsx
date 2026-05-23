import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Search, Plus, Copy, Eye, EyeOff, Trash2, ExternalLink, Loader2, X, FolderUp, FileCode, Check, AlertCircle, ImageIcon, Camera, Upload } from 'lucide-react';
import type { Project } from '../types';
import JSZip from 'jszip';

function UploadModal({ open, onClose, onUploadSuccess }: { open: boolean; onClose: () => void; onUploadSuccess: () => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<'folder' | 'html'>('folder');
  const [htmlCode, setHtmlCode] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFilesRef = useRef<FileList | null>(null);

  const resetForm = useCallback(() => {
    setName('');
    setCategory('');
    setDescription('');
    setHtmlCode('');
    setError('');
    setSelectedFileName('');
    selectedFilesRef.current = null;
    setMode('folder');
  }, []);

  const setSelectedFileName = (n: string) => {
    const el = document.getElementById('file-name-display');
    if (el) el.textContent = n;
  };

  const handleClose = () => {
    if (!uploading) { resetForm(); onClose(); }
  };

  const packFilesToZip = async (files: FileList): Promise<Blob> => {
    const zip = new JSZip();
    const paths = Array.from(files).map((f) => f.webkitRelativePath || f.name);
    const commonPrefix = paths.reduce((common, p) => {
      const parts = p.split('/');
      const commonParts = common.split('/');
      let i = 0;
      while (i < commonParts.length && i < parts.length && commonParts[i] === parts[i]) i++;
      return commonParts.slice(0, i).join('/') || '';
    });
    for (const file of Array.from(files)) {
      const relativePath = file.webkitRelativePath || file.name;
      const zipPath = relativePath.startsWith(commonPrefix) ? relativePath.substring(commonPrefix.length) : relativePath;
      const cleanPath = zipPath.startsWith('/') ? zipPath.substring(1) : zipPath;
      if (cleanPath) {
        const arrayBuffer = await file.arrayBuffer();
        zip.file(cleanPath, arrayBuffer);
      }
    }
    return zip.generateAsync({ type: 'blob' });
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      selectedFilesRef.current = files;
      setSelectedFileName(`${files.length} 个文件 (${files[0].webkitRelativePath.split('/')[0]})`);
      if (!name) setName(files[0].webkitRelativePath.split('/')[0]);
    }
  };

  const handleUpload = async () => {
    if (!name.trim()) { setError('请输入项目名称'); return; }
    setError('');
    setUploading(true);
    try {
      let zipBlob: Blob;
      if (mode === 'html') {
        if (!htmlCode.trim()) { setError('请粘贴 HTML 代码'); setUploading(false); return; }
        const zip = new JSZip();
        zip.file('index.html', htmlCode);
        zipBlob = await zip.generateAsync({ type: 'blob' });
      } else {
        if (!selectedFilesRef.current || selectedFilesRef.current.length === 0) {
          setError('请选择项目文件夹'); setUploading(false); return;
        }
        zipBlob = await packFilesToZip(selectedFilesRef.current);
      }
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('category', category.trim());
      formData.append('description', description.trim());
      formData.append('file', zipBlob, `${name.trim()}.zip`);
      await api.post('/api/projects', formData);
      resetForm();
      onUploadSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-bold text-gray-800">上传新项目</h2>
          <button onClick={handleClose} disabled={uploading} className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 pb-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">项目名称</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入项目名称" disabled={uploading}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">分类</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="如：工具、小游戏、办公、电商..." disabled={uploading}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="简单描述你的项目..." rows={2} disabled={uploading}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none disabled:bg-gray-50" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMode('folder')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'folder' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100'}`}>
              <FolderUp className="w-4 h-4" /> 文件夹上传
            </button>
            <button onClick={() => setMode('html')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'html' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100'}`}>
              <FileCode className="w-4 h-4" /> 粘贴 HTML
            </button>
          </div>
          {mode === 'folder' ? (
            <div onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFolderSelect} {...({ webkitdirectory: '', directory: '' } as any)} />
              <FolderUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600">拖拽文件夹到此处或点击上传</p>
              <p className="text-xs text-gray-400 mt-1">上传完整项目文件夹（需包含 index.html）</p>
              <p id="file-name-display" className="text-sm text-blue-500 mt-2 font-medium" />
            </div>
          ) : (
            <div>
              <textarea value={htmlCode} onChange={(e) => setHtmlCode(e.target.value)} placeholder="在此粘贴 HTML 代码..." rows={8} disabled={uploading}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-y disabled:bg-gray-50" />
              <p className="text-xs text-gray-400 mt-1">粘贴的代码将保存为 index.html</p>
            </div>
          )}
          <button onClick={handleUpload} disabled={uploading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
            {uploading ? (<><Loader2 className="w-4 h-4 animate-spin" /> 上传中...</>) : (<><Plus className="w-4 h-4" /> 开始上传</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

function CoverUploadModal({
  open,
  onClose,
  project,
  onSuccess,
  required
}: {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onSuccess: () => void;
  required: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (!uploading) {
      setPreview(null);
      setCoverFile(null);
      setError('');
      onClose();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB');
      return;
    }
    setError('');
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!coverFile || !project) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('cover', coverFile);
      await api.post(`/api/projects/${project.id}/cover`, formData);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  if (!open || !project) return null;

  const hasExistingCover = !!project.cover_image;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {required ? '设置项目封面图' : '更换封面图'}
            </h2>
            {required && (
              <p className="text-sm text-amber-600 mt-1">公开项目需要上传封面图才能在首页展示</p>
            )}
          </div>
          <button onClick={handleClose} disabled={uploading} className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 pb-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
            onClick={() => fileInputRef.current?.click()}>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            {preview ? (
              <div className="space-y-3">
                <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-100">
                  <img src={preview} alt="封面预览" className="w-full h-full object-cover" />
                </div>
                <p className="text-sm text-gray-500">点击重新选择</p>
              </div>
            ) : hasExistingCover ? (
              <div className="space-y-3">
                <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-100">
                  <img src={`/covers/${project.cover_image}`} alt="当前封面" className="w-full h-full object-cover" />
                </div>
                <p className="text-sm text-gray-500">点击更换封面图</p>
              </div>
            ) : (
              <div className="space-y-3">
                <ImageIcon className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-sm text-gray-600">点击选择封面图片</p>
                <p className="text-xs text-gray-400">支持 JPG、PNG、GIF、WebP，最大 5MB</p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            {!required && (
              <button onClick={handleClose} disabled={uploading}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                取消
              </button>
            )}
            <button onClick={handleUpload} disabled={uploading || (!preview && !hasExistingCover)}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
              {uploading ? (<><Loader2 className="w-4 h-4 animate-spin" /> 上传中...</>) : (<> <Upload className="w-4 h-4" /> {hasExistingCover && preview ? '更换封面' : '上传封面'}</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Cover upload modal state
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [coverModalProject, setCoverModalProject] = useState<Project | null>(null);
  const [coverModalRequired, setCoverModalRequired] = useState(false);

  useEffect(() => { loadProjects(); }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setFilteredProjects(projects.filter((p) => p.name.toLowerCase().includes(q)));
    } else {
      setFilteredProjects(projects);
    }
  }, [searchQuery, projects]);

  async function loadProjects() {
    try {
      const data = await api.get<Project[]>('/api/projects');
      setProjects(data);
    } catch (err) {
      console.error('加载项目失败:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink(project: Project) {
    const link = `${window.location.origin}/s/${project.share_token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(project.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedId(project.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  async function handleToggleShare(project: Project) {
    // If sharing (not yet shared) and no cover image, prompt upload
    if (!project.is_shared && !project.cover_image) {
      setCoverModalProject(project);
      setCoverModalRequired(true);
      setCoverModalOpen(true);
      return;
    }
    try { await api.post(`/api/projects/${project.id}/toggle-share`); loadProjects(); }
    catch (err: any) { alert(err.message); }
  }

  function handleCoverSuccess() {
    if (coverModalRequired && coverModalProject) {
      // After uploading required cover, toggle share
      api.post(`/api/projects/${coverModalProject.id}/toggle-share`).then(() => {
        loadProjects();
      }).catch((err: any) => {
        alert(err.message);
      });
    }
    loadProjects();
  }

  function handleOpenCoverModal(project: Project, required: boolean) {
    setCoverModalProject(project);
    setCoverModalRequired(required);
    setCoverModalOpen(true);
  }

  async function handleDelete(project: Project) {
    if (!window.confirm(`确认删除「${project.name}」？此操作不可撤销。`)) return;
    setDeletingId(project.id);
    try { await api.delete(`/api/projects/${project.id}`); loadProjects(); }
    catch (err: any) { alert(err.message); }
    finally { setDeletingId(null); }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-800">项目列表</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input type="text" placeholder="搜索项目名称..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <button onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> 上传项目
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-2">加载中...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <FolderUp className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">{searchQuery ? '未找到匹配项目' : '暂无项目'}</h3>
          <p className="text-sm text-gray-400 mb-4">{searchQuery ? '试试其他关键词' : '上传你的第一个项目吧'}</p>
          {!searchQuery && (
            <button onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> 上传项目
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">项目</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">封面</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">分享链接</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">分类</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">大小</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">创建时间</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">状态</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <FolderUp className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="text-sm font-medium text-gray-800">{project.name}</span>
                        </div>
                        {project.description ? <p className="text-xs text-gray-400 mt-0.5 ml-6 truncate max-w-[200px]">{project.description}</p> : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {project.cover_image ? (
                        <div className="relative group">
                          <img src={`/covers/${project.cover_image}`} alt="封面" className="w-20 h-12 object-cover rounded border border-gray-100" />
                          <button
                            onClick={() => handleOpenCoverModal(project, false)}
                            className="absolute inset-0 bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            title="更换封面">
                            <Camera className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-12 rounded border border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                          <ImageIcon className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded max-w-[180px] truncate">/s/{project.share_token}</code>
                        <button onClick={() => handleCopyLink(project)} className="shrink-0 text-xs text-blue-500 hover:text-blue-600 flex items-center gap-0.5">
                          {copiedId === project.id ? (<><Check className="w-3.5 h-3.5" /> 已复制</>) : (<><Copy className="w-3.5 h-3.5" /> 复制</>)}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {project.category ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-600">{project.category}</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{project.file_size_mb} MB</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(project.created_at).toLocaleDateString('zh-CN')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${project.is_shared ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {project.is_shared ? '已公开' : '未公开'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {project.is_shared && (
                          <a href={`/s/${project.share_token}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors" title="预览">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => handleToggleShare(project)} className={`p-1.5 rounded transition-colors ${project.is_shared ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                          title={project.is_shared ? '关闭分享' : '开启分享'}>
                          {project.is_shared ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {!project.is_shared && project.cover_image && (
                          <button onClick={() => handleOpenCoverModal(project, false)} className="p-1.5 text-purple-500 hover:bg-purple-50 rounded transition-colors" title="更换封面图">
                            <Camera className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(project)} disabled={deletingId === project.id}
                          className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50" title="删除">
                          {deletingId === project.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredProjects.map((project) => (
              <div key={project.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderUp className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-gray-800">{project.name}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${project.is_shared ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {project.is_shared ? '已公开' : '未公开'}
                  </span>
                </div>
                {project.cover_image && (
                  <img src={`/covers/${project.cover_image}`} alt="封面" className="w-full aspect-[16/9] object-cover rounded-lg border border-gray-100" />
                )}
                {project.description && <p className="text-xs text-gray-400 pl-6">{project.description}</p>}
                <div className="flex items-center gap-2">
                  <code className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded flex-1 truncate">/s/{project.share_token}</code>
                  <button onClick={() => handleCopyLink(project)} className="text-xs text-blue-500 flex items-center gap-0.5 shrink-0">
                    {copiedId === project.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{project.file_size_mb} MB</span>
                  <span>{new Date(project.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {project.is_shared && (
                    <a href={`/s/${project.share_token}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                      <ExternalLink className="w-3.5 h-3.5" /> 预览
                    </a>
                  )}
                  <button onClick={() => handleToggleShare(project)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg ${project.is_shared ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                    {project.is_shared ? (<><EyeOff className="w-3.5 h-3.5" /> 关闭</>) : (<><Eye className="w-3.5 h-3.5" /> 分享</>)}
                  </button>
                  {project.cover_image && (
                    <button onClick={() => handleOpenCoverModal(project, false)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">
                      <Camera className="w-3.5 h-3.5" /> 封面
                    </button>
                  )}
                  <button onClick={() => handleDelete(project)} disabled={deletingId === project.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-100 disabled:opacity-50 ml-auto">
                    {deletingId === project.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <UploadModal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} onUploadSuccess={loadProjects} />
      <CoverUploadModal
        open={coverModalOpen}
        onClose={() => setCoverModalOpen(false)}
        project={coverModalProject}
        onSuccess={handleCoverSuccess}
        required={coverModalRequired}
      />
    </div>
  );
}
