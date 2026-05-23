export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  share_token: string | null;
  is_shared: boolean;
  file_size: number;
  file_size_mb: number;
  category?: string;
  description?: string;
  cover_image?: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  projectCount: number;
  spaceUsed: number;
  totalSpace: number;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  cover_image: string;
  category: string;
  tags: string;
  status: number; // 0=draft, 1=published
  word_count: number;
  reading_time: number;
  created_at: string;
  updated_at: string;
}

export interface PostPagination {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PostStats {
  published: number;
  drafts: number;
  total: number;
}

export interface TagInfo {
  tag: string;
  count: number;
}
