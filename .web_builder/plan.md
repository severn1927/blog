# Web Builder Plan - ProjectShare + Blog 合并

## 项目概况
- **项目名称**：ProjectShare (博客+项目分享)
- **一句话描述**：个人博客 + 项目作品集分享平台，博客首页展示文章列表，"作品"栏目展示公开项目，后台 `/bianji` 管理博客文章和项目
- **项目原型**：separated (前后端分离，已有后端 Express+SQLite)
- **当前阶段**：Phase 3 - 已完成

---

## 需求采集记录 (Phase 0)

### 已确认需求
- 将现有 ProjectShare 系统和个人博客合二为一
- 首页展示博客文章列表（参考 heyuanfei.com 风格）
- 现有项目分享功能变为博客中的一个栏目（"作品"）
- 后台管理 `/bianji` 同时管理博客文章(CRUD)和项目
- 后端入口 `/bianji`（管理后台）
- 前端已有功能全部保留（项目上传、分享、封面图等）

### 参考网站 (heyuanfei.com) 分析
- 导航栏：Logo | Home | About | Link | Archive | Tags | 暗色切换
- 首页：文章卡片列表（标题+日期+阅读时间+摘要+标签），分页
- 文章详情页：标题+日期+分类+字数+阅读时间+正文(渲染Markdown)+标签+上一篇/下一篇
- 归档页：按年份分组，按月列出文章
- 标签页：热门标签+全部标签列表
- About页：个人信息介绍
- Link页：友情链接
- Footer：站点信息+社交链接+ICP

---

## 技术方案 (Phase 1)

| 层级 | 选型 | 理由 |
|------|------|------|
| 前端框架 | React 18 + Vite + TypeScript | 已有，保持一致 |
| UI/样式 | Tailwind CSS | 已有，保持一致 |
| 状态管理 | Zustand | 已有 |
| 路由 | react-router-dom v6 | 已有 |
| 后端 | Express + sql.js (SQLite) | 已有 |
| Markdown渲染 | marked + highlight.js | 博客文章渲染 |
| 鉴权 | JWT + bcrypt | 已有 |

---

## 实现进度 (Phase 3)

### 第1步：后端基础设施
- [x] 数据库：posts表 + site_settings表
- [x] 服务层：post.ts（CRUD + slug生成 + 字数统计）
- [x] 路由层：posts.ts（API接口）
- [x] 修改 server.tsx：注册文章API路由

### 第2步：SSR博客页面
- [x] 修改 seo.ts：博客首页（文章列表+分页+导航Header+Footer）
- [x] 修改 seo.ts：文章详情页（Markdown渲染+代码高亮+标签+上下篇）
- [x] 修改 seo.ts：归档页（按年分组）
- [x] 修改 seo.ts：标签页
- [x] 修改 seo.ts：关于页+友链页
- [x] 修改 seo.ts：作品页（原首页项目展示移至/works）
- [x] 修改 seo.ts：RSS feed
- [x] 修改 seo.ts：更新sitemap和robots.txt

### 第3步：前端后台管理
- [x] 新增 Posts.tsx（文章列表管理页）
- [x] 新增 PostEditor.tsx（Markdown编辑器+实时预览）
- [x] 修改 App.tsx：路由改为 /bianji/*
- [x] 修改 Header.tsx：导航更新
- [x] 修改 AuthGuard.tsx：跳转改为 /bianji/login
- [x] 修改 Login.tsx：登录后跳转改为 /bianji
- [x] 修改 Dashboard.tsx：增加文章统计
- [x] 添加 api.put() 方法
- [x] 更新 types/index.ts：Post/PostPagination/PostStats/TagInfo 类型
- [x] 重新构建前端+启动验证

### 第4步：验证与收尾
- [x] 所有SSR页面（首页/文章/归档/标签/关于/友链/作品）渲染正常
- [x] 后台管理（Dashboard/Posts/PostEditor）功能正常
- [x] 文章CRUD（创建/发布/列表/编辑）验证通过
- [x] API接口（posts/tags/archive/stats/site-settings）验证通过
- [x] SEO（sitemap.xml/robots.txt/rss.xml）验证通过
