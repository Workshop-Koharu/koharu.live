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

// Local cache keys for robust offline fallback
const STORAGE_KEY_POSTS = "koharu_posts_cache_v2";
const STORAGE_KEY_COMMENTS = "koharu_comments_cache_v2";
const STORAGE_KEY_SHORT_URLS = "koharu_short_urls_cache_v2";

function getCachedPosts(): Post[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POSTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveCachedPosts(posts: Post[]) {
  try {
    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
  } catch {}
}

/**
 * Fetch all published posts via secure API endpoint.
 * Zero database credentials stored in client bundle.
 */
export async function fetchAllPosts(type?: "moment" | "blog"): Promise<Post[]> {
  try {
    const url = type ? `/api/posts?type=${type}` : "/api/posts";
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data.posts)) {
        const cached = getCachedPosts();
        const serverIds = new Set(data.posts.map((p: any) => p.id));
        const merged = [...data.posts, ...cached.filter((p) => !serverIds.has(p.id))];
        saveCachedPosts(merged);
        return type ? merged.filter((p) => (p.postType || "moment") === type) : merged;
      }
    }
  } catch (err) {
    console.warn("[RemoteDB] Fetch posts API error, using local cache:", err);
  }

  const cached = getCachedPosts();
  return type ? cached.filter((p) => (p.postType || "moment") === type) : cached;
}

/**
 * Fetch a single post by slug or ID.
 */
export async function fetchPostBySlugOrId(identifier: string): Promise<Post | null> {
  const clean = decodeURIComponent(identifier).replace(/\.html$/, "").trim();

  try {
    const res = await fetch(`/api/posts/${encodeURIComponent(clean)}`, {
      headers: { Accept: "application/json" },
    });
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (data?.post) return data.post;
    }
  } catch (err) {
    console.warn("[RemoteDB] Fetch single post API error:", err);
  }

  const cached = getCachedPosts().find((p) => p.slug === clean || String(p.id) === clean);
  return cached || null;
}

/**
 * Save new post via API.
 */
export async function createNewPost(post: {
  slug: string;
  title: string;
  caption: string;
  coverUrl: string;
  category: string;
  authorName: string;
  authorAvatar: string;
  authorOpenId?: string;
  postType?: "moment" | "blog";
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
      if (data?.post) {
        const cached = getCachedPosts();
        saveCachedPosts([data.post, ...cached.filter((p) => p.id !== data.post.id)]);
        return data.post;
      }
    }
  } catch (err) {
    console.error("[RemoteDB] Create post error:", err);
  }

  // Fallback local memory item
  const localPost: Post = {
    id: Date.now(),
    slug: post.slug,
    title: post.title,
    caption: post.caption,
    excerpt: post.caption.slice(0, 150),
    content: post.caption,
    coverUrl: post.coverUrl,
    images: post.coverUrl.includes("|||") ? post.coverUrl.split("|||") : [post.coverUrl],
    category: post.category || "일상",
    likesCount: 0,
    authorName: post.authorName,
    authorAvatar: post.authorAvatar,
    authorOpenId: post.authorOpenId,
    postType: post.postType || "moment",
    createdAt: new Date().toISOString(),
  };

  const cached = getCachedPosts();
  saveCachedPosts([localPost, ...cached]);
  return localPost;
}

/**
 * Fetch comments for a post.
 */
export async function fetchComments(postId: number): Promise<Comment[]> {
  try {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      headers: { Accept: "application/json" },
    });
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data.comments)) return data.comments;
    }
  } catch (err) {
    console.warn("[RemoteDB] Fetch comments API error:", err);
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_COMMENTS}_${postId}`);
    if (raw) return JSON.parse(raw);
  } catch {}

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
      if (data?.comment) {
        return data.comment;
      }
    }
  } catch (err) {
    console.error("[RemoteDB] Add comment API error:", err);
  }

  const localComment: Comment = {
    id: Date.now(),
    postId,
    authorName,
    authorAvatar,
    authorOpenId: authorOpenId || null,
    content,
    createdAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_COMMENTS}_${postId}`);
    const comments: Comment[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(`${STORAGE_KEY_COMMENTS}_${postId}`, JSON.stringify([localComment, ...comments]));
  } catch {}

  return localComment;
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
  } catch (err) {
    console.error("[RemoteDB] Update comment API error:", err);
  }

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
  } catch (err) {
    console.error("[RemoteDB] Delete comment API error:", err);
  }

  return false;
}

/**
 * Permanently delete a post from database (Owner or Admin only).
 */
export async function deletePost(
  postId: number,
  options?: { userOpenId?: string; isAdmin?: boolean }
): Promise<boolean> {
  try {
    const res = await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userOpenId: options?.userOpenId, isAdmin: options?.isAdmin }),
    });
    if (res.ok) {
      const cached = getCachedPosts().filter((p) => p.id !== postId);
      saveCachedPosts(cached);
      return true;
    }
  } catch (err) {
    console.error("[RemoteDB] Delete post API error:", err);
  }

  // Remove from local cache
  const cached = getCachedPosts().filter((p) => p.id !== postId);
  saveCachedPosts(cached);
  return true;
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
  } catch (err) {
    console.error("[RemoteDB] Reaction error:", err);
  }

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

export async function fetchAllShortUrls(): Promise<ShortUrlItem[]> {
  try {
    const res = await fetch("/api/short-urls", {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.shortUrls)) {
        saveLocalShortUrls(data.shortUrls);
        return data.shortUrls;
      }
    }
  } catch (err) {
    console.warn("[RemoteDB] Fetch short URLs API error:", err);
  }
  return getLocalShortUrls();
}

export async function fetchShortUrl(code: string): Promise<string | null> {
  const cleanCode = code.trim().toLowerCase();
  const local = getLocalShortUrls().find((i) => i.code.toLowerCase() === cleanCode);
  if (local?.originalUrl) return local.originalUrl;

  try {
    const res = await fetch(`/api/short-urls/${encodeURIComponent(cleanCode)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.originalUrl) return data.originalUrl;
    }
  } catch (err) {
    console.warn("[RemoteDB] Fetch short url error:", err);
  }
  return null;
}

export async function createShortUrl(
  originalUrl: string,
  customCode?: string
): Promise<ShortUrlItem | null> {
  let code = (customCode || "").trim().toLowerCase();
  if (!code) code = Math.random().toString(36).substring(2, 8);
  code = code.replace(/[^a-zA-Z0-9_-]/g, "");

  let formattedUrl = originalUrl.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = "https://" + formattedUrl;
  }

  try {
    const res = await fetch("/api/short-urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalUrl: formattedUrl, customCode: code }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.shortUrl) {
        const existing = getLocalShortUrls().filter((i) => i.code !== code);
        saveLocalShortUrls([data.shortUrl, ...existing]);
        return data.shortUrl;
      }
    }
  } catch (err) {
    console.error("[RemoteDB] Create short url API error:", err);
  }

  const newItem: ShortUrlItem = {
    code,
    originalUrl: formattedUrl,
    clicks: 0,
    createdAt: new Date().toISOString(),
  };

  const existing = getLocalShortUrls().filter((i) => i.code !== code);
  saveLocalShortUrls([newItem, ...existing]);
  return newItem;
}

export async function incrementShortUrlClicks(code: string): Promise<void> {
  const cleanCode = code.trim().toLowerCase();

  // 1. Update localStorage click count immediately
  try {
    const list = getLocalShortUrls();
    const target = list.find((i) => i.code.toLowerCase() === cleanCode);
    if (target) {
      target.clicks = (Number(target.clicks) || 0) + 1;
      saveLocalShortUrls(list);
    }
  } catch {}

  // 2. Dispatch custom event for real-time reactive UI update
  try {
    window.dispatchEvent(new CustomEvent("short_url_clicked", { detail: { code: cleanCode } }));
  } catch {}

  // 3. Post to backend with keepalive
  try {
    await fetch(`/api/short-urls/${encodeURIComponent(cleanCode)}/click`, {
      method: "POST",
      keepalive: true,
    });
  } catch {}
}

export async function deleteShortUrl(code: string): Promise<boolean> {
  const cleanCode = code.trim().toLowerCase();
  try {
    const res = await fetch(`/api/short-urls/${encodeURIComponent(cleanCode)}`, { method: "DELETE" });
    if (res.ok) {
      const filtered = getLocalShortUrls().filter((i) => i.code.toLowerCase() !== cleanCode);
      saveLocalShortUrls(filtered);
      return true;
    }
  } catch {}

  const filtered = getLocalShortUrls().filter((i) => i.code.toLowerCase() !== cleanCode);
  saveLocalShortUrls(filtered);
  return true;
}
