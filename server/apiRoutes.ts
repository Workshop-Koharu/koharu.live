import { Router, Request, Response } from "express";
import {
  createBlogPost,
  deleteBlogPost,
  createGuestbookMessage,
  createPostComment,
  getBlogPostById,
  getGuestbookMessages,
  getPostComments,
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
  getSiteProfile,
  togglePostLike,
  updateSiteProfile,
  getSitePeople,
  createSitePerson,
  deleteSitePerson,
} from "./db";

export const apiRouter = Router();

// Get acquaintances (People / Friends)
apiRouter.get("/people", async (_req: Request, res: Response) => {
  try {
    const people = await getSitePeople();
    res.json({ people });
  } catch (error) {
    console.error("[API] Error fetching people:", error);
    res.status(500).json({ error: "Failed to fetch people" });
  }
});

// Create new acquaintance
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

// Delete acquaintance
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

// Get profile settings
apiRouter.get("/profile", async (req: Request, res: Response) => {
  try {
    const profile = await getSiteProfile();
    res.json({ profile });
  } catch (error) {
    console.error("[API] Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update profile settings
apiRouter.post("/profile", async (req: Request, res: Response) => {
  try {
    const updated = await updateSiteProfile(req.body);
    res.json({ profile: updated });
  } catch (error) {
    console.error("[API] Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// List posts (Instagram Blog Feed)
apiRouter.get("/posts", async (req: Request, res: Response) => {
  try {
    const posts = await getPublishedBlogPosts();
    res.json({ posts });
  } catch (error) {
    console.error("[API] Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Alias for notice-bar compatibility
apiRouter.get("/blog", async (req: Request, res: Response) => {
  try {
    const posts = await getPublishedBlogPosts();
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});

// Get single post by slug or ID
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
    const { slug, title, caption, coverUrl, category, authorName, authorAvatar } = req.body;
    if (!caption || !coverUrl) {
      return res.status(400).json({ error: "Caption and coverUrl are required" });
    }

    const safeSlug = (slug || "post-" + Date.now().toString(36)).slice(0, 200);
    const safeTitle = (title || caption.slice(0, 40) + "...").slice(0, 250);
    const safeCategory = (category || "일상").slice(0, 60);
    const safeAuthorName = (authorName || "! Koharu").slice(0, 100);
    const safeAuthorAvatar = authorAvatar || "/assets/koharu-profile.png";

    const post = await createBlogPost({
      slug: safeSlug,
      title: safeTitle,
      caption,
      excerpt: caption.slice(0, 150),
      content: caption,
      coverUrl,
      images: [coverUrl],
      category: safeCategory,
      authorName: safeAuthorName,
      authorAvatar: safeAuthorAvatar,
      authorOpenId: "koharu-owner",
      publishedAt: new Date(),
    });

    res.status(201).json({ post });
  } catch (error: any) {
    console.error("[API] Error creating post:", error);
    res.status(500).json({ error: error?.message || "Failed to create post" });
  }
});

// Delete post
apiRouter.delete("/posts/:id", async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post id" });
    }
    const success = await deleteBlogPost(postId);
    res.json({ success, message: "Post deleted successfully" });
  } catch (error) {
    console.error("[API] Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// Toggle post like
apiRouter.post("/posts/:id/like", async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const userIdentifier = req.body.userIdentifier || "visitor-anonymous";

    const result = await togglePostLike(postId, userIdentifier);
    res.json(result);
  } catch (error) {
    console.error("[API] Error toggling like:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

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
    const { authorName, content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const comment = await createPostComment({
      postId,
      authorName: authorName || "익명 친구",
      authorAvatar: null,
      content,
    });

    res.status(201).json({ comment });
  } catch (error) {
    console.error("[API] Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// Get guestbook entries
apiRouter.get("/guestbook", async (req: Request, res: Response) => {
  try {
    const messages = await getGuestbookMessages();
    res.json({ messages });
  } catch (error) {
    console.error("[API] Error fetching guestbook:", error);
    res.status(500).json({ error: "Failed to fetch guestbook" });
  }
});

// Add guestbook entry
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

// Cloner AI Chat endpoint
apiRouter.post("/ai/chat", async (req: Request, res: Response) => {
  try {
    const { message, mode, model } = req.body;
    const query = (message || "").toLowerCase();
    let reply = "";

    if (mode === "code" || query.includes("코드") || query.includes("파이썬") || query.includes("c#") || query.includes("유니티") || query.includes("unity")) {
      if (query.includes("파이썬") || query.includes("python")) {
        reply = `안녕하세요! 요청하신 파이썬 예제 코드입니다 🐍\n\n\`\`\`python\n# 간단한 던전 룸 생성 예제\nimport random\n\ndef generate_rooms(count=5):\n    rooms = []\n    for i in range(count):\n        w = random.randint(4, 10)\n        h = random.randint(4, 8)\n        rooms.append({"id": i, "size": (w, h)})\n    return rooms\n\nprint("생성된 던전 방 목록:", generate_rooms())\n\`\`\`\n\n추가로 필요한 로직이 있다면 말씀해주세요! ✨`;
      } else {
        reply = `Unity C# 스크립트 예제입니다 🎮:\n\n\`\`\`csharp\nusing UnityEngine;\n\npublic class CharacterController2D : MonoBehaviour\n{\n    [SerializeField] private float moveSpeed = 6f;\n    [SerializeField] private float jumpForce = 12f;\n    private Rigidbody2D rb;\n\n    void Awake()\n    {\n        rb = GetComponent<Rigidbody2D>();\n    }\n\n    void Update()\n    {\n        float move = Input.GetAxisRaw("Horizontal");\n        rb.velocity = new Vector2(move * moveSpeed, rb.velocity.y);\n\n        if (Input.GetButtonDown("Jump") && Mathf.Abs(rb.velocity.y) < 0.01f)\n        {\n            rb.AddForce(Vector2.up * jumpForce, ForceMode2D.Impulse);\n        }\n    }\n}\n\`\`\`\n\n플레이어블한 움직임을 구현하는 기본 스크립트입니다! 🌸`;
      }
    } else if (mode === "image" || query.includes("그려") || query.includes("디자인") || query.includes("일러스트")) {
      reply = `달빛 아래 몽환적인 파스텔 톤의 일러스트 컨셉을 생성했습니다 🌸\n\n✦ 컨셉: *Dreamy pastel twilight, magical glowing crescent moon, soft lavender sky*\n\n인스타그램 피드와 메인 페이지 아트 갤러리에서도 다양한 비주얼을 감상해보실 수 있어요!`;
    } else {
      reply = `안녕하세요! 코하루 포트폴리오의 AI 어시스턴트입니다 🌸\n\n"${message}"에 대해 답변해 드릴게요.\n코하루는 유니티와 C# 게임 프로그래밍, 커스텀 엔진 및 웹 개발에 깊은 열정을 쏟고 있는 개발자예요!\n\n궁금한 점이 있다면 언제든 물어보세요. 코드 작성부터 게임 시스템 설계, 포트폴리오 안내까지 친절하게 도와드릴게요 ⁽⁽ (˶> ᎑ <˶) ⁾⁾!`;
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
