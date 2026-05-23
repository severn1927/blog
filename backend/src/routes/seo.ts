import { Router, Request, Response } from 'express';
import { getDb } from '../services/db';
import {
  getAllPosts,
  getPostBySlug,
  getAdjacentPosts,
  getAllTags,
  getArchiveGrouped,
  getSiteSetting,
  getPostCount,
} from '../services/post';
import { marked } from 'marked';
import hljs from 'highlight.js';

const router = Router();

const SITE_URL = process.env.SITE_URL || 'https://blog.css123.com';
const SITE_LOGO = '/logo.png';

// Configure marked with highlight.js
marked.setOptions({
  highlight: function(code: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try { return hljs.highlight(code, { language: lang }).value; } catch {}
    }
    try { return hljs.highlightAuto(code).value; } catch {}
    return code;
  },
  breaks: true,
  gfm: true,
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return String(dateStr);
  }
}

function formatDateFull(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return String(dateStr);
  }
}

function renderMarkdown(content: string): string {
  const html = marked.parse(content) as string;
  return html;
}

// ==================== Shared Layout ====================

function renderHeader(activeNav: string, siteTitle: string): string {
  const navItems = [
    { href: '/', label: '首页', key: 'home' },
    { href: '/works', label: '作品', key: 'works' },
    { href: '/post/', label: '归档', key: 'archive' },
    { href: '/tags/', label: '标签', key: 'tags' },
    { href: '/about', label: '关于', key: 'about' },
    { href: '/links', label: '友链', key: 'links' },
  ];

  const navHtml = navItems.map(item => {
    const isActive = activeNav === item.key;
    const cls = isActive
      ? 'text-blue-600 font-semibold'
      : 'text-gray-600 hover:text-blue-600';
    return `<a href="${item.href}" class="${cls} transition-colors">${item.label}</a>`;
  }).join('');

  return `
  <header class="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50">
    <div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2.5 font-bold text-gray-800 hover:text-blue-600 transition-colors">
        <img src="${SITE_LOGO}" alt="${escapeHtml(siteTitle)}" class="w-7 h-7 rounded-lg" />
        ${escapeHtml(siteTitle)}
      </a>
      <nav class="flex items-center gap-6 text-sm">${navHtml}</nav>
    </div>
  </header>`;
}

function renderFooter(siteTitle: string): string {
  return `
  <footer class="border-t border-gray-200 mt-16 py-8 text-center text-sm text-gray-400">
    <p>&copy; ${new Date().getFullYear()} ${escapeHtml(siteTitle)}. Powered by ProjectShare.</p>
  </footer>`;
}

function renderPageHtml(title: string, description: string, content: string, extraHead: string = '', activeNav: string = 'home', siteTitle: string = '佚名博客'): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - ${escapeHtml(siteTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="icon" type="image/png" href="/logo.png">
  <link rel="canonical" href="${SITE_URL}${extraHead ? '' : '/'}">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"><\/script>
  <style>
    .prose h1{font-size:1.875rem;font-weight:700;margin-top:2rem;margin-bottom:1rem;color:#1f2937}
    .prose h2{font-size:1.5rem;font-weight:600;margin-top:1.75rem;margin-bottom:0.75rem;color:#1f2937}
    .prose h3{font-size:1.25rem;font-weight:600;margin-top:1.5rem;margin-bottom:0.5rem;color:#1f2937}
    .prose p{margin-bottom:1rem;color:#374151;line-height:1.8}
    .prose a{color:#2563eb;text-decoration:none}
    .prose a:hover{text-decoration:underline}
    .prose ul,.prose ol{margin-bottom:1rem;padding-left:1.5rem;color:#374151}
    .prose li{margin-bottom:0.25rem;line-height:1.7}
    .prose ul{list-style-type:disc}
    .prose ol{list-style-type:decimal}
    .prose blockquote{border-left:3px solid #d1d5db;padding-left:1rem;margin:1rem 0;color:#6b7280;font-style:italic}
    .prose pre{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:1rem;margin:1rem 0;overflow-x:auto;font-size:0.875rem}
    .prose code{font-size:0.875rem}
    .prose :not(pre)>code{background:#f3f4f6;padding:2px 6px;border-radius:4px;color:#d97706}
    .prose img{max-width:100%;border-radius:8px;margin:1rem 0}
    .prose table{border-collapse:collapse;margin:1rem 0;width:100%}
    .prose th,.prose td{border:1px solid #e5e7eb;padding:8px 12px;text-align:left}
    .prose th{background:#f9fafb;font-weight:600}
    .prose hr{border:none;border-top:1px solid #e5e7eb;margin:2rem 0}
    .line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .line-clamp-3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  </style>
  ${extraHead}
</head>
<body class="bg-gray-50 min-h-screen flex flex-col">
  ${renderHeader(activeNav, siteTitle)}
  <main class="flex-1">
    <div class="max-w-4xl mx-auto px-4 py-8">
      ${content}
    </div>
  </main>
  ${renderFooter(siteTitle)}
  <script>hljs.highlightAll();<\/script>
</body>
</html>`;
}

// ==================== Blog Home ====================

function renderBlogHome(posts: any[], page: number, totalPages: number, siteTitle: string, siteDescription: string): string {
  const postCards = posts.map(p => {
    const tags = String(p.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    const tagsHtml = tags.slice(0, 3).map(t =>
      `<a href="/tags/${encodeURIComponent(t)}" class="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">${escapeHtml(t)}</a>`
    ).join('');

    return `
    <article class="group py-5 border-b border-gray-100 last:border-0">
      <a href="/post/${escapeHtml(String(p.slug))}" class="block">
        <h2 class="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors mb-2">${escapeHtml(String(p.title))}</h2>
        <p class="text-sm text-gray-500 line-clamp-2 mb-2">${escapeHtml(String(p.excerpt || ''))}</p>
        <div class="flex items-center gap-3 text-xs text-gray-400">
          <span>${formatDate(String(p.created_at))}</span>
          <span>${String(p.word_count || 0)} 字</span>
          <span>${String(p.reading_time || 1)} 分钟</span>
          ${tagsHtml ? `<span class="flex items-center gap-1">${tagsHtml}</span>` : ''}
        </div>
      </a>
    </article>`;
  }).join('');

  // Pagination
  let paginationHtml = '';
  if (totalPages > 1) {
    const pages: number[] = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pages.push(i);
    const pageLinks = pages.map(p =>
      p === page
        ? `<span class="px-3 py-1 rounded-md bg-blue-600 text-white text-sm">${p}</span>`
        : `<a href="/?page=${p}" class="px-3 py-1 rounded-md bg-white border border-gray-200 text-sm text-gray-600 hover:border-blue-400">${p}</a>`
    ).join('');
    paginationHtml = `
    <nav class="flex justify-center gap-2 mt-8">
      ${page > 1 ? `<a href="/?page=${page - 1}" class="px-3 py-1 rounded-md bg-white border border-gray-200 text-sm text-gray-600 hover:border-blue-400">上一页</a>` : ''}
      ${pageLinks}
      ${page < totalPages ? `<a href="/?page=${page + 1}" class="px-3 py-1 rounded-md bg-white border border-gray-200 text-sm text-gray-600 hover:border-blue-400">下一页</a>` : ''}
    </nav>`;
  }

  const content = `
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-800">${escapeHtml(siteTitle)}</h1>
      <p class="text-gray-500 mt-2">${escapeHtml(siteDescription)}</p>
    </div>
    <div class="space-y-0">
      ${posts.length > 0 ? postCards : '<p class="text-center text-gray-400 py-16">暂无文章</p>'}
    </div>
    ${paginationHtml}`;

  const desc = siteDescription || '个人博客';
  return renderPageHtml(siteTitle, desc, content, '', 'home', siteTitle);
}

// ==================== Post Detail ====================

function renderPostDetail(post: any, prev: any, next: any, siteTitle: string): string {
  const bodyHtml = renderMarkdown(String(post.content));
  const tags = String(post.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const tagsHtml = tags.map(t =>
    `<a href="/tags/${encodeURIComponent(t)}" class="inline-block text-sm text-blue-500 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">${escapeHtml(t)}</a>`
  ).join(' ');

  const adjacentHtml = `
  <nav class="flex justify-between mt-12 pt-6 border-t border-gray-200">
    ${prev ? `<a href="/post/${escapeHtml(String(prev.slug))}" class="text-sm text-gray-500 hover:text-blue-600 max-w-[45%]"><span class="text-xs text-gray-400">上一篇</span><p class="truncate mt-1">${escapeHtml(String(prev.title))}</p></a>` : '<div></div>'}
    ${next ? `<a href="/post/${escapeHtml(String(next.slug))}" class="text-sm text-gray-500 hover:text-blue-600 max-w-[45%] text-right"><span class="text-xs text-gray-400">下一篇</span><p class="truncate mt-1">${escapeHtml(String(next.title))}</p></a>` : '<div></div>'}
  </nav>`;

  const content = `
    <article>
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-4">${escapeHtml(String(post.title))}</h1>
        <div class="flex flex-wrap items-center gap-3 text-sm text-gray-400">
          ${post.category ? `<span class="bg-gray-100 px-2 py-0.5 rounded text-gray-600">${escapeHtml(String(post.category))}</span>` : ''}
          <span>${formatDateFull(String(post.created_at))}</span>
          <span>${String(post.word_count || 0)} 字</span>
          <span>${String(post.reading_time || 1)} 分钟阅读</span>
        </div>
      </header>
      <div class="prose max-w-none">${bodyHtml}</div>
      ${tags.length > 0 ? `<div class="mt-8 pt-6 border-t border-gray-200"><div class="flex flex-wrap gap-2">${tagsHtml}</div></div>` : ''}
      ${adjacentHtml}
    </article>`;

  const extraHead = `
  <meta property="og:title" content="${escapeHtml(String(post.title))}">
  <meta property="og:description" content="${escapeHtml(String(post.excerpt || ''))}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${SITE_URL}/post/${escapeHtml(String(post.slug))}">
  ${post.cover_image ? `<meta property="og:image" content="${SITE_URL}/post-covers/${escapeHtml(String(post.cover_image))}">` : ''}
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${escapeHtml(String(post.title))}",
    "datePublished": "${post.created_at}",
    "dateModified": "${post.updated_at}",
    "author": { "@type": "Person", "name": "${escapeHtml(siteTitle)}" },
    "description": "${escapeHtml(String(post.excerpt || ''))}",
    "wordCount": ${post.word_count || 0}
  }
  <\/script>`;

  return renderPageHtml(String(post.title), String(post.excerpt || ''), content, extraHead, 'home', siteTitle);
}

// ==================== Archive Page ====================

function renderArchive(archive: any[], siteTitle: string): string {
  const archiveHtml = archive.map(yearGroup => {
    const monthHtml = yearGroup.groups.map(monthGroup => {
      const postsHtml = monthGroup.posts.map(p => `
        <li class="py-2">
          <a href="/post/${escapeHtml(String(p.slug))}" class="text-gray-700 hover:text-blue-600 transition-colors">${escapeHtml(String(p.title))}</a>
          <span class="text-xs text-gray-400 ml-2">${formatDate(String(p.date))} · ${String(p.reading_time || 1)}分钟</span>
        </li>`).join('');

      return `
      <div class="mb-4">
        <h3 class="text-sm font-semibold text-gray-500 mb-2">${yearGroup.year}年${String(monthGroup.month).padStart(2, '0')}月</h3>
        <ul class="space-y-1">${postsHtml}</ul>
      </div>`;
    }).join('');

    return `
    <div class="mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-4">${yearGroup.year}</h2>
      ${monthHtml}
    </div>`;
  }).join('');

  const content = `
    <h1 class="text-2xl font-bold text-gray-800 mb-8">归档</h1>
    ${archive.length > 0 ? archiveHtml : '<p class="text-center text-gray-400 py-16">暂无文章</p>'}`;

  return renderPageHtml('归档', `${siteTitle} 文章归档`, content, '', 'archive', siteTitle);
}

// ==================== Tags Page ====================

function renderTagsPage(tags: { tag: string; count: number }[], siteTitle: string): string {
  const tagsHtml = tags.map(t => {
    const size = t.count > 5 ? 'text-lg px-4 py-2' : t.count > 2 ? 'text-base px-3 py-1.5' : 'text-sm px-2.5 py-1';
    return `<a href="/tags/${encodeURIComponent(t.tag)}" class="inline-block ${size} text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors">${escapeHtml(t.tag)}<span class="text-xs text-gray-400 ml-1">${t.count}</span></a>`;
  }).join(' ');

  const content = `
    <h1 class="text-2xl font-bold text-gray-800 mb-8">标签</h1>
    <div class="flex flex-wrap gap-3">
      ${tags.length > 0 ? tagsHtml : '<p class="text-gray-400">暂无标签</p>'}
    </div>`;

  return renderPageHtml('标签', `${siteTitle} 全部标签`, content, '', 'tags', siteTitle);
}

// ==================== Tag Posts Page ====================

function renderTagPosts(tag: string, posts: any[], siteTitle: string): string {
  const postListHtml = posts.map(p => `
    <article class="py-4 border-b border-gray-100 last:border-0">
      <a href="/post/${escapeHtml(String(p.slug))}" class="block">
        <h2 class="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors mb-1">${escapeHtml(String(p.title))}</h2>
        <div class="flex items-center gap-3 text-xs text-gray-400">
          <span>${formatDate(String(p.created_at))}</span>
          <span>${String(p.word_count || 0)} 字</span>
          <span>${String(p.reading_time || 1)} 分钟</span>
        </div>
      </a>
    </article>`).join('');

  const content = `
    <h1 class="text-2xl font-bold text-gray-800 mb-2">
      <span class="text-gray-400 font-normal text-lg mr-2">#</span>${escapeHtml(tag)}
    </h1>
    <p class="text-gray-400 text-sm mb-8">${posts.length} 篇文章</p>
    <div>${posts.length > 0 ? postListHtml : '<p class="text-center text-gray-400 py-16">该标签下暂无文章</p>'}</div>`;

  return renderPageHtml(`标签: ${tag}`, `${siteTitle} 标签 ${tag} 下的文章`, content, '', 'tags', siteTitle);
}

// ==================== About Page ====================

function renderAboutPage(aboutContent: string, siteTitle: string): string {
  const bodyHtml = aboutContent ? renderMarkdown(aboutContent) : '<p class="text-gray-400">暂无内容，请在后台设置关于页面内容。</p>';
  const content = `
    <h1 class="text-2xl font-bold text-gray-800 mb-8">关于</h1>
    <div class="prose max-w-none">${bodyHtml}</div>`;

  return renderPageHtml('关于', `关于 ${siteTitle}`, content, '', 'about', siteTitle);
}

// ==================== Links Page ====================

function renderLinksPage(siteTitle: string): string {
  const content = `
    <h1 class="text-2xl font-bold text-gray-800 mb-8">友情链接</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" id="links-grid">
    </div>`;

  return renderPageHtml('友链', `${siteTitle} 友情链接`, content, `
    <script>
      fetch('/api/posts/site-settings').then(r=>r.json()).then(settings => {
        try {
          const links = JSON.parse(settings.nav_links || settings.friend_links || '[]');
          const grid = document.getElementById('links-grid');
          if (links.length === 0) {
            grid.innerHTML = '<p class="text-gray-400 col-span-2 text-center py-8">暂无友链，请在后台设置。</p>';
            return;
          }
          grid.innerHTML = links.map(l => {
            const href = l.url || l.href || '#';
            const name = l.name || l.title || '';
            const desc = l.description || l.desc || '';
            const avatar = l.avatar || l.icon || '';
            return '<a href="' + href + '" target="_blank" rel="noopener" class="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all">' +
              (avatar ? '<img src="' + avatar + '" class="w-10 h-10 rounded-full object-cover" alt="" />' : '<div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">' + (name[0] || '?') + '</div>') +
              '<div><div class="font-medium text-gray-800">' + name + '</div><div class="text-xs text-gray-400">' + desc + '</div></div></a>';
          }).join('');
        } catch(e) {
          document.getElementById('links-grid').innerHTML = '<p class="text-gray-400 col-span-2 text-center py-8">暂无友链</p>';
        }
      });
    <\/script>`, 'links', siteTitle);
}

// ==================== Works Page ====================

function renderWorksPage(projects: any[], categories: string[], siteTitle: string): string {
  const projectCards = projects.map((p: any) => {
    const hasCover = p.cover_image && p.cover_image.trim() !== '';
    const coverHtml = hasCover
      ? `<div class="aspect-[16/10] bg-gray-100 overflow-hidden rounded-t-lg">
            <img src="/covers/${escapeHtml(String(p.cover_image))}" alt="${escapeHtml(String(p.name))}" class="w-full h-full object-cover" loading="lazy" />
          </div>`
      : `<div class="aspect-[16/10] bg-gray-100 flex items-center justify-center overflow-hidden rounded-t-lg">
            <iframe src="/s/${escapeHtml(String(p.share_token))}"
              class="w-[200%] h-[200%] border-0 -translate-x-1/4 -translate-y-1/4 scale-50 pointer-events-none"
              loading="lazy"
              sandbox="allow-same-origin"
              title="${escapeHtml(String(p.name))}"></iframe>
          </div>`;

    return `
      <a href="/s/${escapeHtml(String(p.share_token))}" data-category="${escapeHtml(String(p.category || ''))}" class="group block bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        ${coverHtml}
        <div class="p-4">
          <h3 class="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">${escapeHtml(String(p.name))}</h3>
          ${p.description ? `<p class="text-sm text-gray-500 mt-1 line-clamp-2">${escapeHtml(String(p.description))}</p>` : ''}
          <div class="flex items-center justify-between mt-3 text-xs text-gray-400">
            <span class="flex items-center gap-1">
              <span class="inline-block w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-center leading-5 text-[10px] font-bold">${escapeHtml(String(p.author || '?')[0].toUpperCase())}</span>
              ${escapeHtml(String(p.author || '匿名'))}
            </span>
            <span>${formatDate(String(p.created_at))}</span>
          </div>
        </div>
      </a>`;
  }).join('');

  const categoryTabs = categories.map((cat: string) =>
    `<button onclick="filterCategory('${escapeHtml(cat)}')" class="category-tab px-3 py-1.5 rounded-full text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors whitespace-nowrap">${escapeHtml(cat)}</button>`
  ).join('');

  const content = `
    <h1 class="text-2xl font-bold text-gray-800 mb-6">作品</h1>
    <div class="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
      <button onclick="filterCategory('all')" class="category-tab active px-3 py-1.5 rounded-full text-sm whitespace-nowrap">全部</button>
      ${categoryTabs}
    </div>
    <div id="works-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      ${projectCards}
    </div>
    ${projects.length === 0 ? '<p class="text-center text-gray-400 py-16">暂无公开作品</p>' : ''}
    <script>
      function filterCategory(cat) {
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        document.querySelectorAll('#works-grid > a').forEach(card => {
          if (cat === 'all') {
            card.style.display = '';
          } else {
            card.style.display = card.getAttribute('data-category') === cat ? '' : 'none';
          }
        });
      }
    <\/script>`;

  return renderPageHtml('作品', `${siteTitle} 作品展示`, content, '', 'works', siteTitle);
}

// ==================== Routes ====================

// Blog Home - article list
router.get('/', async (req: Request, res: Response) => {
  try {
    const siteTitle = await getSiteSetting('site_title', '佚名博客');
    const siteDescription = await getSiteSetting('site_description', '记录技术与生活的个人博客');

    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const { posts, total } = await getAllPosts({ status: 1, page, limit });
    const totalPages = Math.ceil(total / limit);

    res.type('html').send(renderBlogHome(posts, page, totalPages, siteTitle, siteDescription));
  } catch (err: any) {
    console.error('Home page error:', err);
    res.status(500).send('Server Error');
  }
});

// Post Detail
router.get('/post/:slug', async (req: Request, res: Response) => {
  if (req.params.slug === '') {
    res.redirect('/post/');
    return;
  }

  try {
    const siteTitle = await getSiteSetting('site_title', '佚名博客');
    const post = await getPostBySlug(req.params.slug);
    if (!post || post.status !== 1) {
      res.status(404).type('html').send(renderPageHtml('404', '文章未找到', '<p class="text-center text-gray-400 py-16">文章不存在或已被删除。</p>', '', 'home', siteTitle));
      return;
    }
    const { prev, next } = await getAdjacentPosts(post.slug);
    res.type('html').send(renderPostDetail(post, prev, next, siteTitle));
  } catch (err: any) {
    console.error('Post detail error:', err);
    res.status(500).send('Server Error');
  }
});

// Archive page
router.get('/post/', async (req: Request, res: Response) => {
  try {
    const siteTitle = await getSiteSetting('site_title', '佚名博客');
    const archive = await getArchiveGrouped();
    res.type('html').send(renderArchive(archive, siteTitle));
  } catch (err: any) {
    console.error('Archive error:', err);
    res.status(500).send('Server Error');
  }
});

// Tags page
router.get('/tags/', async (req: Request, res: Response) => {
  try {
    const siteTitle = await getSiteSetting('site_title', '佚名博客');
    const tags = await getAllTags();
    res.type('html').send(renderTagsPage(tags, siteTitle));
  } catch (err: any) {
    console.error('Tags error:', err);
    res.status(500).send('Server Error');
  }
});

// Tag posts page
router.get('/tags/:tag', async (req: Request, res: Response) => {
  try {
    const siteTitle = await getSiteSetting('site_title', '佚名博客');
    const { posts } = await getAllPosts({ status: 1, tag: req.params.tag, limit: 100 });
    res.type('html').send(renderTagPosts(req.params.tag, posts, siteTitle));
  } catch (err: any) {
    console.error('Tag posts error:', err);
    res.status(500).send('Server Error');
  }
});

// About page
router.get('/about', async (req: Request, res: Response) => {
  try {
    const siteTitle = await getSiteSetting('site_title', '佚名博客');
    const aboutContent = await getSiteSetting('about_content', '');
    res.type('html').send(renderAboutPage(aboutContent, siteTitle));
  } catch (err: any) {
    console.error('About error:', err);
    res.status(500).send('Server Error');
  }
});

// Links page
router.get('/links', async (req: Request, res: Response) => {
  try {
    const siteTitle = await getSiteSetting('site_title', '佚名博客');
    res.type('html').send(renderLinksPage(siteTitle));
  } catch (err: any) {
    console.error('Links error:', err);
    res.status(500).send('Server Error');
  }
});

// Works page (original project showcase)
router.get('/works', async (req: Request, res: Response) => {
  try {
    const siteTitle = await getSiteSetting('site_title', '佚名博客');
    const db = await getDb();
    const limit = 20;

    const result = db.exec(
      `SELECT p.id, p.name, p.share_token, p.category, p.description, p.cover_image, p.created_at, u.username as author
       FROM projects p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.is_shared = 1
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [limit]
    );

    const projects: any[] = result.length > 0
      ? result[0].values.map((row) => {
          const obj: Record<string, any> = {};
          result[0].columns.forEach((col, i) => { obj[col] = row[i]; });
          return obj;
        })
      : [];

    const catResult = db.exec(
      `SELECT DISTINCT category FROM projects WHERE is_shared = 1 AND category IS NOT NULL AND category != ''`
    );
    const categories: string[] = catResult.length > 0
      ? catResult[0].values.map((row) => String(row[0]))
      : [];

    res.type('html').send(renderWorksPage(projects, categories, siteTitle));
  } catch (err: any) {
    console.error('Works page error:', err);
    res.status(500).send('Server Error');
  }
});

// ==================== Sitemap ====================

router.get('/sitemap.xml', async (req: any, res: any) => {
  try {
    const db = await getDb();
    const siteTitle = await getSiteSetting('site_title', '佚名博客');

    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/works', priority: '0.8', changefreq: 'weekly' },
      { loc: '/post/', priority: '0.7', changefreq: 'weekly' },
      { loc: '/tags/', priority: '0.6', changefreq: 'weekly' },
      { loc: '/about', priority: '0.5', changefreq: 'monthly' },
      { loc: '/links', priority: '0.5', changefreq: 'monthly' },
    ];

    let projectUrls = '';
    try {
      const projectResult = db.exec(
        'SELECT share_token, updated_at FROM projects WHERE is_shared = 1 ORDER BY updated_at DESC'
      );
      if (projectResult.length > 0) {
        projectUrls = projectResult[0].values.map((row: any) => {
          const token = String(row[0]);
          const updatedAt = String(row[1] || '');
          return '  <url>\n    <loc>' + SITE_URL + '/s/' + token + '</loc>\n    <lastmod>' + updatedAt + '</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>';
        }).join('\n');
      }
    } catch (e) { /* ignore */ }

    const { posts } = await getAllPosts({ status: 1, limit: 1000 });
    const postUrls = posts.map(p => {
      const updatedAt = String(p.updated_at || '');
      return '  <url>\n    <loc>' + SITE_URL + '/post/' + p.slug + '</loc>\n    <lastmod>' + updatedAt + '</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>';
    }).join('\n');

    const today = new Date().toISOString().split('T')[0];
    const staticUrls = staticPages.map(p =>
      '  <url>\n    <loc>' + SITE_URL + p.loc + '</loc>\n    <lastmod>' + today + '</lastmod>\n    <changefreq>' + p.changefreq + '</changefreq>\n    <priority>' + p.priority + '</priority>\n  </url>'
    ).join('\n');

    const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      staticUrls + '\n' + postUrls + '\n' + projectUrls + '\n</urlset>';

    res.type('xml').send(sitemap);
  } catch (err: any) {
    console.error('Sitemap error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// ==================== robots.txt ====================

router.get('/robots.txt', (req: Request, res: Response) => {
  res.type('text/plain').send(`User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`);
});

// ==================== RSS Feed ====================

router.get('/rss.xml', async (req: any, res: any) => {
  try {
    const siteTitle = await getSiteSetting('site_title', '佚名博客');
    const siteDescription = await getSiteSetting('site_description', '记录技术与生活的个人博客');
    const { posts } = await getAllPosts({ status: 1, limit: 20 });

    const items = posts.map(p => {
      const link = SITE_URL + '/post/' + p.slug;
      const excerpt = escapeHtml(String(p.excerpt || ''));
      return `    <item>
      <title>${escapeHtml(String(p.title))}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${new Date(String(p.created_at)).toUTCString()}</pubDate>
      <description>${excerpt}</description>
    </item>`;
    }).join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(siteTitle)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeHtml(siteDescription)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    res.type('xml').send(rss);
  } catch (err: any) {
    console.error('RSS error:', err);
    res.status(500).send('Error generating RSS');
  }
});

export default router;
