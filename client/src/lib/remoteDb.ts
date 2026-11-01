import { neon } from "@neondatabase/serverless";

export interface Post {
  id: number;
  slug: string;
  title: string;
  caption: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  images?: string[] | null;
  category: string;
  likesCount: number;
  dislikesCount?: number;
  postType?: "moment" | "blog";
  authorName: string;
  authorAvatar: string;
  authorOpenId?: string;
  createdAt: string;
}

export interface Comment {
  id: number;
  postId: number;
  authorName: string;
  authorAvatar?: string | null;
  authorOpenId?: string | null;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ProfileData {
  username: string;
  name: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  birthdate: string;
  githubUrl: string;
  instagramUrl: string;
  email: string;
  websiteUrl: string;
}

const DATABASE_URL =
  "postgresql://neondb_owner:npg_NJhT4IV8bDrx@ep-rough-voice-b4xapbff-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

// Lazy-initialized neon client
let _sql: ReturnType<typeof neon> | null = null;
function getSql() {
  if (!_sql) {
    _sql = neon(DATABASE_URL);
  }
  return _sql;
}

/**
 * Fetch all published posts.
 * Tries local /api/posts first; if API is missing or returns HTML (e.g. Netlify static), falls back to Neon DB.
 */
export async function fetchAllPosts(type?: "moment" | "blog"): Promise<Post[]> {
  try {
    const url = type ? `/api/posts?type=${type}` : "/api/posts";
    const res = await fetch(url);
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data.posts)) {
        return data.posts;
      }
    }
  } catch {
    // Fallback to direct DB
  }

  try {
    const sql = getSql();
    const rows = await sql.query(
      `SELECT id, slug, title, caption, excerpt, content, cover_url as "coverUrl", images, category, likes_count as "likesCount", author_name as "authorName", author_avatar as "authorAvatar", author_open_id as "authorOpenId", created_at as "createdAt" FROM blog_posts ORDER BY created_at DESC`
    );
    if (Array.isArray(rows)) {
      return rows.map((r: any) => ({
        id: Number(r.id),
        slug: String(r.slug),
        title: String(r.title),
        caption: String(r.caption || ""),
        excerpt: String(r.excerpt || ""),
        content: String(r.content || ""),
        coverUrl: String(r.coverUrl || ""),
        images: Array.isArray(r.images) ? r.images : [String(r.coverUrl || "")],
        category: String(r.category || "일상"),
        likesCount: Number(r.likesCount || 0),
        dislikesCount: Number(r.dislikesCount || 0),
        postType: (r.postType || "moment") as "moment" | "blog",
        authorName: String(r.authorName || "! Koharu"),
        authorAvatar: String(r.authorAvatar || "/assets/koharu-profile.png"),
        authorOpenId: r.authorOpenId ? String(r.authorOpenId) : undefined,
        createdAt: new Date(r.createdAt).toISOString(),
      }));
    }
  } catch (err) {
    console.warn("[RemoteDB] Direct DB query fallback error:", err);
  }

  return [];
}

/**
 * Fetch a single post by slug or ID.
 */
export async function fetchPostBySlugOrId(identifier: string): Promise<Post | null> {
  const clean = decodeURIComponent(identifier).replace(/\.html$/, "").trim();

  try {
    const res = await fetch(`/api/posts/${encodeURIComponent(clean)}`);
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (data?.post) return data.post;
    }
  } catch {}

  try {
    const sql = getSql();
    const rows = await sql.query(
      `SELECT id, slug, title, caption, excerpt, content, cover_url as "coverUrl", images, category, likes_count as "likesCount", author_name as "authorName", author_avatar as "authorAvatar", created_at as "createdAt" FROM blog_posts WHERE slug = $1 OR id::text = $1 LIMIT 1`,
      [clean]
    );
    if (Array.isArray(rows) && rows.length > 0) {
      const r: any = rows[0];
      return {
        id: Number(r.id),
        slug: String(r.slug),
        title: String(r.title),
        caption: String(r.caption || ""),
        excerpt: String(r.excerpt || ""),
        content: String(r.content || ""),
        coverUrl: String(r.coverUrl || ""),
        images: Array.isArray(r.images) ? r.images : [String(r.coverUrl || "")],
        category: String(r.category || "일상"),
        likesCount: Number(r.likesCount || 0),
        authorName: String(r.authorName || "! Koharu"),
        authorAvatar: String(r.authorAvatar || "/assets/koharu-profile.png"),
        createdAt: new Date(r.createdAt).toISOString(),
      };
    }
  } catch (err) {
    console.warn("[RemoteDB] Fetch post error:", err);
  }

  return null;
}

/**
 * Save new post (API first, direct Neon DB fallback).
 */
export async function createNewPost(post: {
  slug: string;
  title: string;
  caption: string;
  coverUrl: string;
  category: string;
  authorName: string;
  authorAvatar: string;
}): Promise<Post | null> {
  try {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (data?.post) return data.post;
    }
  } catch {}

  // Direct Neon insert
  try {
    const sql = getSql();
    const rows = await sql.query(
      `INSERT INTO blog_posts (slug, title, caption, excerpt, content, cover_url, images, category, likes_count, author_name, author_avatar, published_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, 0, $9, $10, NOW(), NOW(), NOW())
       RETURNING id, slug, title, caption, excerpt, content, cover_url as "coverUrl", images, category, likes_count as "likesCount", author_name as "authorName", author_avatar as "authorAvatar", created_at as "createdAt"`,
      [
        post.slug,
        post.title,
        post.caption,
        post.caption.slice(0, 150),
        post.caption,
        post.coverUrl,
        JSON.stringify([post.coverUrl]),
        post.category,
        post.authorName,
        post.authorAvatar,
      ]
    );
    if (Array.isArray(rows) && rows.length > 0) {
      const r: any = rows[0];
      return {
        id: Number(r.id),
        slug: String(r.slug),
        title: String(r.title),
        caption: String(r.caption || ""),
        excerpt: String(r.excerpt || ""),
        content: String(r.content || ""),
        coverUrl: String(r.coverUrl || ""),
        images: [String(r.coverUrl || "")],
        category: String(r.category || "일상"),
        likesCount: 0,
        authorName: String(r.authorName || "! Koharu"),
        authorAvatar: String(r.authorAvatar || "/assets/koharu-profile.png"),
        createdAt: new Date(r.createdAt).toISOString(),
      };
    }
  } catch (err) {
    console.error("[RemoteDB] Direct insert post error:", err);
  }

  return null;
}

/**
 * Fetch comments for a post.
 */
export async function fetchComments(postId: number): Promise<Comment[]> {
  try {
    const res = await fetch(`/api/posts/${postId}/comments`);
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data.comments)) return data.comments;
    }
  } catch {}

  try {
    const sql = getSql();
    const rows = await sql.query(
      `SELECT id, post_id as "postId", author_name as "authorName", author_avatar as "authorAvatar", content, created_at as "createdAt" FROM post_comments WHERE post_id = $1 ORDER BY created_at DESC`,
      [postId]
    );
    if (Array.isArray(rows)) {
      return rows.map((r: any) => ({
        id: Number(r.id),
        postId: Number(r.postId),
        authorName: String(r.authorName),
        authorAvatar: r.authorAvatar ? String(r.authorAvatar) : null,
        content: String(r.content),
        createdAt: new Date(r.createdAt).toISOString(),
      }));
    }
  } catch (err) {
    console.warn("[RemoteDB] Fetch comments error:", err);
  }

  return [];
}

/**
 * Add a comment to a post.
 */
export async function addComment(
  postId: number,
  authorName: string,
  authorAvatar: string,
  content: string,
  authorOpenId?: string | null
): Promise<Comment | null> {
  try {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorName, authorAvatar, content, authorOpenId }),
    });
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (data?.comment) return data.comment;
    }
  } catch {}

  try {
    const sql = getSql();
    const rows = await sql.query(
      `INSERT INTO post_comments (post_id, author_name, author_avatar, author_open_id, content, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, post_id as "postId", author_name as "authorName", author_avatar as "authorAvatar", author_open_id as "authorOpenId", content, created_at as "createdAt"`,
      [postId, authorName, authorAvatar || null, authorOpenId || null, content]
    );
    if (Array.isArray(rows) && rows.length > 0) {
      const r: any = rows[0];
      return {
        id: Number(r.id),
        postId: Number(r.postId),
        authorName: String(r.authorName),
        authorAvatar: r.authorAvatar ? String(r.authorAvatar) : null,
        authorOpenId: r.authorOpenId ? String(r.authorOpenId) : null,
        content: String(r.content),
        createdAt: new Date(r.createdAt).toISOString(),
      };
    }
  } catch (err) {
    console.error("[RemoteDB] Direct insert comment error:", err);
  }

  return null;
}

/**
 * Update an existing comment (Author or Admin only).
 */
export async function updateComment(
  commentId: number,
  content: string,
  options?: { userOpenId?: string; isAdmin?: boolean }
): Promise<Comment | null> {
  try {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, userOpenId: options?.userOpenId, isAdmin: options?.isAdmin }),
    });
    if (res.ok) {
      const data = await res.json();
      return data?.comment || null;
    }
  } catch {}

  return null;
}

/**
 * Delete a comment (Author or Admin only).
 */
export async function deleteComment(
  commentId: number,
  options?: { userOpenId?: string; isAdmin?: boolean }
): Promise<boolean> {
  try {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userOpenId: options?.userOpenId, isAdmin: options?.isAdmin }),
    });
    if (res.ok) return true;
  } catch {}

  return false;
}

/**
 * Permanently delete a post from database (Owner or Admin only).
 */
export async function deletePost(
  postId: number,
  options?: { userOpenId?: string; isAdmin?: boolean }
): Promise<boolean> {
  let success = false;
  try {
    const res = await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userOpenId: options?.userOpenId, isAdmin: options?.isAdmin }),
    });
    if (res.ok) {
      success = true;
      return true;
    }
  } catch {}

  // If user is admin or verified author, fallback direct delete
  if (options?.isAdmin) {
    try {
      const sql = getSql();
      await sql.query(`DELETE FROM post_comments WHERE post_id = $1`, [postId]);
      await sql.query(`DELETE FROM blog_posts WHERE id = $1`, [postId]);
      success = true;
    } catch (err) {
      console.error("[RemoteDB] Direct delete post error:", err);
    }
  }

  return success;
}

/**
 * Toggle post reaction (Like or Dislike).
 */
export async function togglePostReaction(
  postId: number,
  userIdentifier: string,
  reaction: "like" | "dislike" = "like"
): Promise<{ liked: boolean; disliked?: boolean; likesCount: number; dislikesCount?: number }> {
  try {
    const res = await fetch(`/api/posts/${postId}/reaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIdentifier, reaction }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return { liked: false, disliked: false, likesCount: 0, dislikesCount: 0 };
}

// ─── Short URL Database Functions ─────────────────────────────────────────────
export interface ShortUrlItem {
  id?: number;
  code: string;
  originalUrl: string;
  clicks: number;
  createdAt: string;
}

const STORAGE_KEY_SHORT_URLS = "koharu_short_urls_cache";

function getLocalShortUrls(): ShortUrlItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHORT_URLS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveLocalShortUrls(items: ShortUrlItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY_SHORT_URLS, JSON.stringify(items));
  } catch {}
}

let tableEnsured = false;
async function ensureShortUrlsTable() {
  if (tableEnsured) return;
  try {
    const sql = getSql();
    await sql.query(`
      CREATE TABLE IF NOT EXISTS short_urls (
        id SERIAL PRIMARY KEY,
        code VARCHAR(32) UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        clicks INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    tableEnsured = true;
  } catch (err) {
    console.warn("[RemoteDB] Table short_urls ensure warning:", err);
  }
}

export async function fetchAllShortUrls(): Promise<ShortUrlItem[]> {
  await ensureShortUrlsTable();
  try {
    const sql = getSql();
    const rows: any = await sql.query(
      `SELECT id, code, original_url as "originalUrl", clicks, created_at as "createdAt" FROM short_urls ORDER BY created_at DESC LIMIT 100`
    );
    if (Array.isArray(rows) && rows.length > 0) {
      const items = rows.map((r: any) => ({
        id: Number(r.id),
        code: String(r.code),
        originalUrl: String(r.originalUrl),
        clicks: Number(r.clicks || 0),
        createdAt: new Date(r.createdAt).toISOString(),
      }));
      saveLocalShortUrls(items);
      return items;
    }
  } catch (err) {
    console.warn("[RemoteDB] Fetch short urls error:", err);
  }
  return getLocalShortUrls();
}

export async function fetchShortUrl(code: string): Promise<string | null> {
  const cleanCode = code.trim().toLowerCase();
  // Check local cache first for speed
  const local = getLocalShortUrls().find((i) => i.code.toLowerCase() === cleanCode);
  if (local?.originalUrl) return local.originalUrl;

  await ensureShortUrlsTable();
  try {
    const sql = getSql();
    const rows: any = await sql.query(
      `SELECT original_url as "originalUrl" FROM short_urls WHERE LOWER(code) = $1 LIMIT 1`,
      [cleanCode]
    );
    if (Array.isArray(rows) && rows.length > 0) {
      return String(rows[0].originalUrl);
    }
  } catch (err) {
    console.warn("[RemoteDB] Fetch short url by code error:", err);
  }
  return null;
}

export async function createShortUrl(
  originalUrl: string,
  customCode?: string
): Promise<ShortUrlItem | null> {
  await ensureShortUrlsTable();

  // Generate 6-char random alphanumeric code if not specified
  let code = (customCode || "").trim().toLowerCase();
  if (!code) {
    code = Math.random().toString(36).substring(2, 8);
  }
  // Sanitize code (only alphanumeric, hyphens, underscores)
  code = code.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!code) code = Math.random().toString(36).substring(2, 8);

  let formattedUrl = originalUrl.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = "https://" + formattedUrl;
  }

  const newItem: ShortUrlItem = {
    code,
    originalUrl: formattedUrl,
    clicks: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    const sql = getSql();
    const rows: any = await sql.query(
      `INSERT INTO short_urls (code, original_url, clicks, created_at)
       VALUES ($1, $2, 0, NOW())
       ON CONFLICT (code) DO UPDATE SET original_url = $2
       RETURNING id, code, original_url as "originalUrl", clicks, created_at as "createdAt"`,
      [code, formattedUrl]
    );
    if (Array.isArray(rows) && rows.length > 0) {
      const saved: ShortUrlItem = {
        id: Number(rows[0].id),
        code: String(rows[0].code),
        originalUrl: String(rows[0].originalUrl),
        clicks: Number(rows[0].clicks || 0),
        createdAt: new Date(rows[0].createdAt).toISOString(),
      };
      const existing = getLocalShortUrls().filter((i) => i.code !== code);
      saveLocalShortUrls([saved, ...existing]);
      return saved;
    }
  } catch (err) {
    console.error("[RemoteDB] Create short url error:", err);
  }

  // Local fallback
  const existing = getLocalShortUrls().filter((i) => i.code !== code);
  saveLocalShortUrls([newItem, ...existing]);
  return newItem;
}

export async function incrementShortUrlClicks(code: string): Promise<void> {
  const cleanCode = code.trim().toLowerCase();
  try {
    const sql = getSql();
    await sql.query(
      `UPDATE short_urls SET clicks = clicks + 1 WHERE LOWER(code) = $1`,
      [cleanCode]
    );
  } catch {}
}

export async function deleteShortUrl(code: string): Promise<boolean> {
  const cleanCode = code.trim().toLowerCase();
  try {
    const sql = getSql();
    await sql.query(`DELETE FROM short_urls WHERE LOWER(code) = $1`, [cleanCode]);
  } catch {}
  const filtered = getLocalShortUrls().filter((i) => i.code.toLowerCase() !== cleanCode);
  saveLocalShortUrls(filtered);
  return true;
}

