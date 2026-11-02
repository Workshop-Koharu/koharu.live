import { Router, Request, Response } from "express";
import {
  createBlogPost,
  deleteBlogPost,
  updateBlogPost,
  createGuestbookMessage,
  createPostComment,
  updatePostComment,
  deletePostComment,
  getPostCommentById,
  getBlogPostById,
  getGuestbookMessages,
  getPostComments,
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
  getSiteProfile,
  togglePostLike,
  togglePostReaction,
  updateSiteProfile,
  getSitePeople,
  createSitePerson,
  deleteSitePerson,
  upsertUser,
} from "./db";

export const apiRouter = Router();

// Discord OAuth credentials
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1523139211228741784";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "tUGuQO8qivi42N0HFKFPOOtV_kdRg3HR";

// Helper: Check if user matches admin credentials
export function checkIsAdmin(user: { email?: string | null; username?: string | null; global_name?: string | null; id?: string | null }): boolean {
  if (!user) return false;
  const isEmail = (user.email || "").trim().toLowerCase() === "codingexpertleon@gmail.com";
  const uname = (user.username || "").trim().toLowerCase();
  const gname = (user.global_name || "").trim().toLowerCase();
  const isUsername =
    uname === "sua_is.babo" ||
    gname === "sua_is.babo" ||
    uname === "koharu_81s" ||
    gname === "koharu_81s";
  const isId = String(user.id || "").trim() === "1339604814631534667";

  return isEmail && isUsername && isId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Endpoints (Discord & Google)
// ─────────────────────────────────────────────────────────────────────────────

// Discord Login URL helper
apiRouter.get("/auth/discord/url", (req: Request, res: Response) => {
  const host = req.get("host") || "koharu.live";
  const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const defaultRedirect = `${protocol}://${host}/auth/discord/callback`;
  const redirectUri = (req.query.redirect_uri as string) || defaultRedirect;

  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=identify%20email`;

  res.json({ url, redirectUri });
});

// Discord OAuth Code Exchange
apiRouter.post("/auth/discord/token", async (req: Request, res: Response) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Authorization code is required" });
    }

    const host = req.get("host") || "koharu.live";
    const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const finalRedirect = redirectUri || `${protocol}://${host}/auth/discord/callback`;

    // 1. Exchange code for access token
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: finalRedirect,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[Discord OAuth] Token exchange error:", errText);
      return res.status(400).json({ error: "Failed to exchange Discord authorization code", details: errText });
    }

    const tokenData = (await tokenRes.json()) as { access_token: string; token_type: string };

    // 2. Fetch user information
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      return res.status(400).json({ error: "Failed to fetch Discord user information" });
    }

    const discordUser = (await userRes.json()) as {
      id: string;
      username: string;
      global_name?: string | null;
      email?: string | null;
      avatar?: string | null;
    };

    // 3. Verify Admin Status
    const isAdmin = checkIsAdmin(discordUser);
    const role = isAdmin ? "admin" : "user";
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : "/assets/koharu-profile.png";

    // 4. Upsert User in DB
    try {
      await upsertUser({
        openId: `discord:${discordUser.id}`,
        name: discordUser.global_name || discordUser.username,
        email: discordUser.email || null,
        loginMethod: "discord",
        role,
        lastSignedIn: new Date(),
      });
    } catch (e) {
      console.warn("[Discord Auth] upsertUser error:", e);
    }

    res.json({
      success: true,
      user: {
        id: discordUser.id,
        openId: `discord:${discordUser.id}`,
        username: discordUser.username,
        name: discordUser.global_name || discordUser.username,
        email: discordUser.email,
        avatar: avatarUrl,
        role,
        isAdmin,
        provider: "discord",
      },
    });
  } catch (error: any) {
    console.error("[Discord Auth] Unexpected error:", error);
    res.status(500).json({ error: error?.message || "Internal server error during Discord login" });
  }
});

// Google Login Session Verification / Registration
apiRouter.post("/auth/google", async (req: Request, res: Response) => {
  try {
    const { id, email, name, avatar } = req.body;
    if (!id || !email) {
      return res.status(400).json({ error: "Google User ID and Email are required" });
    }

    const openId = `google:${id}`;
    // Register user into DB if available
    try {
      await upsertUser({
        openId,
        name: name || email.split("@")[0],
        email,
        loginMethod: "google",
        role: "user",
        lastSignedIn: new Date(),
      });
    } catch {}

    res.json({
      success: true,
      user: {
        id,
        openId,
        email,
        name: name || email.split("@")[0],
        avatar: avatar || "/assets/koharu-profile.png",
        role: "user",
        isAdmin: false,
        provider: "google",
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Google auth error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Acquaintances (People / Friends)
// ─────────────────────────────────────────────────────────────────────────────

apiRouter.get("/people", async (_req: Request, res: Response) => {
  try {
    const people = await getSitePeople();
    res.json({ people });
  } catch (error) {
    console.error("[API] Error fetching people:", error);
    res.status(500).json({ error: "Failed to fetch people" });
  }
});

apiRouter.post("/people", async (req: Request, res: Response) => {
  try {
    const { name, handle, role, status, avatar, link } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const person = await createSitePerson({
      name: name.trim(),
      handle: handle?.trim() || null,
      role: role?.trim() || "Friend",
      status: status?.trim() || null,
      avatar: avatar?.trim() || "/assets/koharu-profile.png",
      link: link?.trim() || null,
    });

    res.json({ person });
  } catch (error) {
    console.error("[API] Error creating person:", error);
    res.status(500).json({ error: "Failed to create person" });
  }
});

apiRouter.delete("/people/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid person ID" });
    }

    await deleteSitePerson(id);
    res.json({ success: true, id });
  } catch (error) {
    console.error("[API] Error deleting person:", error);
    res.status(500).json({ error: "Failed to delete person" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Profile Settings
// ─────────────────────────────────────────────────────────────────────────────

apiRouter.get("/profile", async (_req: Request, res: Response) => {
  try {
    const profile = await getSiteProfile();
    res.json({ profile });
  } catch (error) {
    console.error("[API] Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

apiRouter.post("/profile", async (req: Request, res: Response) => {
  try {
    const updated = await updateSiteProfile(req.body);
    res.json({ profile: updated });
  } catch (error) {
    console.error("[API] Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Posts (Moments & Blog)
// ─────────────────────────────────────────────────────────────────────────────

// List posts (supports ?type=moment or ?type=blog or all)
apiRouter.get("/posts", async (req: Request, res: Response) => {
  try {
    const posts = await getPublishedBlogPosts();
    const typeFilter = req.query.type as string | undefined;

    let filtered = posts;
    if (typeFilter) {
      filtered = posts.filter((p: any) => (p.postType || "moment") === typeFilter);
    }

    res.json({ posts: filtered });
  } catch (error) {
    console.error("[API] Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Alias for notice-bar
apiRouter.get("/blog", async (req: Request, res: Response) => {
  try {
    const posts = await getPublishedBlogPosts();
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});

// Single post by slug or ID
apiRouter.get("/posts/:identifier", async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    let post = null;

    if (/^\d+$/.test(identifier)) {
      post = await getBlogPostById(parseInt(identifier, 10));
    } else {
      post = await getPublishedBlogPostBySlug(identifier);
    }

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ post });
  } catch (error) {
    console.error("[API] Error fetching post:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// Create new post
apiRouter.post("/posts", async (req: Request, res: Response) => {
  try {
    const {
      slug,
      title,
      caption,
      content,
      coverUrl,
      images,
      category,
      authorName,
      authorAvatar,
      authorOpenId,
      postType = "moment",
      isAdmin = false,
    } = req.body;

    // RULE: For dedicated blog posts (postType === "blog"), ONLY admin is allowed to create!
    if (postType === "blog" && !isAdmin) {
      return res.status(403).json({ error: "전용 블로그 글 작성은 관리자(코하루)만 가능합니다." });
    }

    // RULE: For moments, user must be logged in (authorOpenId required)
    if (!authorOpenId && !isAdmin) {
      return res.status(401).json({ error: "로그인 후 글을 작성할 수 있습니다." });
    }

    const finalContent = content || caption || "";
    if (!finalContent && !coverUrl) {
      return res.status(400).json({ error: "내용 또는 이미지가 필요합니다." });
    }

    const safeSlug = (slug || `post-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`).slice(0, 200);
    const safeTitle = (title || finalContent.slice(0, 40) + "...").slice(0, 250);
    const safeCategory = (category || (postType === "blog" ? "개발" : "일상")).slice(0, 60);
    const safeCoverUrl = coverUrl || "/assets/koharu-profile.png";

    const post = await createBlogPost({
      slug: safeSlug,
      title: safeTitle,
      caption: finalContent,
      excerpt: finalContent.slice(0, 150),
      content: finalContent,
      coverUrl: safeCoverUrl,
      images: Array.isArray(images) && images.length > 0 ? images : [safeCoverUrl],
      category: safeCategory,
      authorName: authorName || "! Koharu",
      authorAvatar: authorAvatar || "/assets/koharu-profile.png",
      authorOpenId: authorOpenId || (isAdmin ? "koharu-admin" : "unknown"),
      publishedAt: new Date(),
      postType: postType === "blog" ? "blog" : "moment",
      dislikesCount: 0,
    } as any);

    res.status(201).json({ post });
  } catch (error: any) {
    console.error("[API] Error creating post:", error);
    res.status(500).json({ error: error?.message || "Failed to create post" });
  }
});

// Update post
apiRouter.put("/posts/:id", async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) return res.status(400).json({ error: "Invalid post id" });

    const post = await getBlogPostById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const { userOpenId, isAdmin, title, content, caption, coverUrl, category } = req.body;

    // Check permission
    const isOwner = post.authorOpenId === userOpenId;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "자신의 게시글만 수정할 수 있습니다." });
    }

    const updated = await updateBlogPost(postId, {
      title: title || post.title,
      caption: caption || content || post.caption,
      content: content || caption || post.content,
      coverUrl: coverUrl || post.coverUrl,
      category: category || post.category,
    });

    res.json({ post: updated });
  } catch (error: any) {
    console.error("[API] Error updating post:", error);
    res.status(500).json({ error: error?.message || "Failed to update post" });
  }
});

// Delete post (Strict Permission: Owner or Admin only)
apiRouter.delete("/posts/:id", async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const post = await getBlogPostById(postId);
    if (!post) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    }

    const { userOpenId, isAdmin } = req.body || {};

    // STRICT CHECK: Only admin or the author who created the post can delete!
    const isOwner = userOpenId && post.authorOpenId === userOpenId;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "본인이 작성한 게시글만 삭제할 수 있습니다." });
    }

    const success = await deleteBlogPost(postId);
    res.json({ success, message: "게시글이 성공적으로 삭제되었습니다." });
  } catch (error: any) {
    console.error("[API] Error deleting post:", error);
    res.status(500).json({ error: error?.message || "Failed to delete post" });
  }
});

// Toggle post reaction (Like or Dislike)
apiRouter.post("/posts/:id/reaction", async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const { userIdentifier, reaction = "like", isOwner } = req.body;

    if (!userIdentifier) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    if (isOwner) {
      return res.status(400).json({ error: "자신의 게시물에는 반응을 남길 수 없습니다." });
    }

    const post = await getBlogPostById(postId);
    if (post && post.authorOpenId === userIdentifier) {
      return res.status(400).json({ error: "자신의 게시물에는 반응을 남길 수 없습니다." });
    }

    const result = await togglePostReaction(postId, userIdentifier, reaction as "like" | "dislike");
    res.json(result);
  } catch (error) {
    console.error("[API] Error toggling reaction:", error);
    res.status(500).json({ error: "Failed to toggle reaction" });
  }
});

// Backward-compatible like endpoint
apiRouter.post("/posts/:id/like", async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const { userIdentifier, isOwner } = req.body;

    if (isOwner) {
      return res.status(400).json({ error: "자신의 게시물에는 좋아요를 누를 수 없습니다." });
    }

    const post = await getBlogPostById(postId);
    if (post && (post.authorOpenId === userIdentifier || userIdentifier === "koharu-owner")) {
      return res.status(400).json({ error: "자신의 게시물에는 좋아요를 누를 수 없습니다." });
    }

    const result = await togglePostLike(postId, userIdentifier || "visitor-anonymous");
    res.json(result);
  } catch (error) {
    console.error("[API] Error toggling like:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Comments (With Strict Author/Admin Permission)
// ─────────────────────────────────────────────────────────────────────────────

// Get post comments
apiRouter.get("/posts/:id/comments", async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const comments = await getPostComments(postId);
    res.json({ comments });
  } catch (error) {
    console.error("[API] Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Add comment to post
apiRouter.post("/posts/:id/comments", async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const { authorName, authorAvatar, authorOpenId, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "댓글 내용을 입력해주세요." });
    }

    const comment = await createPostComment({
      postId,
      authorName: authorName || "익명 방문자",
      authorAvatar: authorAvatar || null,
      authorOpenId: authorOpenId || null,
      content: content.trim(),
    });

    res.status(201).json({ comment });
  } catch (error) {
    console.error("[API] Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// Edit comment (Author only)
apiRouter.put("/comments/:id", async (req: Request, res: Response) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    const { content, userOpenId, isAdmin } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "수정할 댓글 내용을 입력해주세요." });
    }

    const existing = await getPostCommentById(commentId);
    if (!existing) {
      return res.status(404).json({ error: "댓글을 찾을 수 없습니다." });
    }

    // STRICT CHECK: Only the comment's author can edit!
    const isOwner = userOpenId && existing.authorOpenId === userOpenId;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "본인이 작성한 댓글만 수정할 수 있습니다." });
    }

    const updated = await updatePostComment(commentId, content.trim());
    res.json({ comment: updated });
  } catch (error: any) {
    console.error("[API] Error updating comment:", error);
    res.status(500).json({ error: error?.message || "Failed to update comment" });
  }
});

// Delete comment (Author or Admin only)
apiRouter.delete("/comments/:id", async (req: Request, res: Response) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    const { userOpenId, isAdmin } = req.body || {};

    const existing = await getPostCommentById(commentId);
    if (!existing) {
      return res.status(404).json({ error: "댓글을 찾을 수 없습니다." });
    }

    // STRICT CHECK: Author or Admin can delete!
    const isOwner = userOpenId && existing.authorOpenId === userOpenId;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "본인이 작성한 댓글만 삭제할 수 있습니다." });
    }

    const success = await deletePostComment(commentId);
    res.json({ success, message: "댓글이 삭제되었습니다." });
  } catch (error: any) {
    console.error("[API] Error deleting comment:", error);
    res.status(500).json({ error: error?.message || "Failed to delete comment" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Guestbook
// ─────────────────────────────────────────────────────────────────────────────

apiRouter.get("/guestbook", async (_req: Request, res: Response) => {
  try {
    const messages = await getGuestbookMessages();
    res.json({ messages });
  } catch (error) {
    console.error("[API] Error fetching guestbook:", error);
    res.status(500).json({ error: "Failed to fetch guestbook" });
  }
});

apiRouter.post("/guestbook", async (req: Request, res: Response) => {
  try {
    const { authorName, content, isSecret } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const message = await createGuestbookMessage({
      authorName: authorName || "익명 방문자",
      authorAvatar: null,
      content,
      isSecret: !!isSecret,
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error("[API] Error creating guestbook message:", error);
    res.status(500).json({ error: "Failed to create guestbook message" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AI Chat Endpoint
// ─────────────────────────────────────────────────────────────────────────────

apiRouter.post("/ai/chat", async (req: Request, res: Response) => {
  try {
    const { message, mode, model } = req.body;
    const query = (message || "").toLowerCase();
    let reply = "";

    if (
      mode === "code" ||
      query.includes("코드") ||
      query.includes("파이썬") ||
      query.includes("c#") ||
      query.includes("유니티") ||
      query.includes("unity")
    ) {
      if (query.includes("파이썬") || query.includes("python")) {
        reply = `안녕하세요! 파이썬 예제 코드입니다 🐍\n\n\`\`\`python\nimport random\n\ndef generate_rooms(count=5):\n    rooms = []\n    for i in range(count):\n        w = random.randint(4, 10)\n        h = random.randint(4, 8)\n        rooms.append({"id": i, "size": (w, h)})\n    return rooms\n\nprint("생성된 던전 방 목록:", generate_rooms())\n\`\`\`\n\n필요한 로직이 있다면 편하게 말씀해주세요! ✨`;
      } else {
        reply = `Unity C# 스크립트 예제입니다 🎮:\n\n\`\`\`csharp\nusing UnityEngine;\n\npublic class CharacterController2D : MonoBehaviour\n{\n    [SerializeField] private float moveSpeed = 6f;\n    [SerializeField] private float jumpForce = 12f;\n    private Rigidbody2D rb;\n\n    void Awake()\n    {\n        rb = GetComponent<Rigidbody2D>();\n    }\n\n    void Update()\n    {\n        float move = Input.GetAxisRaw("Horizontal");\n        rb.velocity = new Vector2(move * moveSpeed, rb.velocity.y);\n\n        if (Input.GetButtonDown("Jump") && Mathf.Abs(rb.velocity.y) < 0.01f)\n        {\n            rb.AddForce(Vector2.up * jumpForce, ForceMode2D.Impulse);\n        }\n    }\n}\n\`\`\`\n\n플레이어블한 움직임을 구현하는 기본 스크립트입니다! 🌸`;
      }
    } else if (mode === "image" || query.includes("그려") || query.includes("디자인") || query.includes("일러스트")) {
      reply = `달빛 아래 몽환적인 파스텔 톤의 일러스트 컨셉입니다 🌸\n\n✦ 컨셉: *Dreamy pastel twilight, magical glowing crescent moon, soft lavender sky*\n\n모먼트 피드에서도 다양한 비주얼을 확인해보세요!`;
    } else {
      reply = `안녕하세요! 코하루 포트폴리오의 AI 어시스턴트입니다 🌸\n\n"${message}"에 대해 답변해 드릴게요.\n코하루는 유니티와 C# 게임 프로그래밍, 커스텀 엔진 및 웹 개발에 깊은 열정을 쏟고 있는 개발자예요!\n\n궁금한 점이 있다면 언제든 편하게 물어보세요 ⁽⁽ (˶> ᎑ <˶) ⁾⁾!`;
    }

    res.json({
      reply,
      timestamp: new Date().toISOString(),
      model: model || "v1",
      mode: mode || "auto",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});
