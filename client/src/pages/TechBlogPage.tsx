import { useEffect, useState, useMemo, useRef } from "react";
import { useRoute } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Code2,
  Edit2,
  Edit3,
  Eye,
  Heart,
  ImageIcon,
  LogIn,
  LogOut,
  MessageCircle,
  PlusCircle,
  RefreshCw,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";
import { QRButton } from "@/components/QRCodeModal";
import { useAppAuth } from "@/contexts/AuthContext";
import {
  fetchAllPosts,
  createNewPost,
  deletePost,
  fetchComments,
  addComment,
  updateComment,
  deleteComment,
  togglePostReaction,
  Post,
  Comment,
} from "@/lib/remoteDb";

import { compressImageFile } from "@/lib/imageCompressor";

// Clean plain text extractor for post card excerpts (removes raw markdown syntax)
function cleanMarkdownForExcerpt(md: string): string {
  if (!md) return "";
  return md
    .replace(/^#+\s+/gm, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*]\s+/gm, "· ")
    .replace(/\n+/g, " ")
    .trim();
}

// Generate clean, readable slug from post title without ugly random codes
function generateCleanSlug(title: string): string {
  const clean = title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\uAC00-\uD7A3-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
  return clean || `post-${Date.now()}`;
}

// Enhanced Markdown renderer with responsive non-distorted images and clean styling
function renderSimpleMarkdown(markdown: string) {
  if (!markdown) return "";
  const normalized = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const htmlLines: string[] = [];
  let inCodeBlock = false;
  let codeLang = "";
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trimEnd();

    // Code block toggle
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        const codeContent = codeBuffer
          .join("\n")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        htmlLines.push(
          `<div class="my-4 rounded-2xl bg-[#1e1e2e] text-[#cdd6f4] p-4 text-xs sm:text-sm font-mono overflow-x-auto shadow-lg border border-purple-900/30">
            ${codeLang ? `<div class="text-[10px] text-pink-400 font-bold mb-2 uppercase tracking-widest">${codeLang}</div>` : ""}
            <pre class="m-0"><code class="leading-relaxed">${codeContent}</code></pre>
          </div>`
        );
        codeBuffer = [];
        codeLang = "";
      } else {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      htmlLines.push(`<h3 class="text-base sm:text-lg font-bold text-[#38314a] mt-6 mb-2">${line.slice(4)}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      htmlLines.push(`<h2 class="text-lg sm:text-xl font-extrabold text-[#38314a] mt-8 mb-3 pb-1 border-b border-pink-100">${line.slice(3)}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      htmlLines.push(`<h1 class="text-xl sm:text-2xl font-black text-[#38314a] mt-10 mb-4 pb-2 border-b-2 border-pink-200">${line.slice(2)}</h1>`);
      continue;
    }

    // Horizontal Rule
    if (line === "---" || line === "***" || line === "___") {
      htmlLines.push(`<hr class="my-6 border-pink-200" />`);
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      htmlLines.push(
        `<blockquote class="border-l-4 border-pink-400 pl-4 py-1.5 my-3 bg-pink-50/50 rounded-r-xl text-xs sm:text-sm text-[#4a3952] italic">${line.slice(2)}</blockquote>`
      );
      continue;
    }

    // Bullet lists
    if (line.startsWith("- ") || line.startsWith("* ")) {
      htmlLines.push(`<li class="ml-5 list-disc text-xs sm:text-sm text-[#4a3952] my-1">${line.slice(2)}</li>`);
      continue;
    }

    // Numbered lists
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      htmlLines.push(`<li class="ml-5 list-decimal text-xs sm:text-sm text-[#4a3952] my-1"><span class="font-bold text-[#38314a]">${numMatch[1]}.</span> ${numMatch[2]}</li>`);
      continue;
    }

    // Images: Fixed aspect ratio, zero distortion, never cut off at bottom, max height balanced
    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      htmlLines.push(
        `<div class="my-5 rounded-2xl overflow-hidden shadow-sm border border-pink-100 max-w-xl mx-auto bg-gray-50 flex flex-col items-center p-2">
          <img src="${imgMatch[2]}" alt="${imgMatch[1]}" class="max-h-[380px] w-auto max-w-full rounded-xl object-contain shadow-xs" />
          ${imgMatch[1] ? `<div class="text-center text-[11px] text-gray-500 pt-2 font-medium">${imgMatch[1]}</div>` : ""}
        </div>`
      );
      continue;
    }

    // Inline elements: bold, italic, inline code, links
    let formatted = line
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#38314a]">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-pink-100 text-pink-700 font-mono text-xs font-semibold">$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-pink-600 font-semibold underline hover:text-pink-700">$1</a>');

    if (formatted.trim() === "") {
      htmlLines.push(`<div class="h-2"></div>`);
    } else {
      htmlLines.push(`<p class="text-xs sm:text-sm text-[#4a3952] leading-relaxed my-2">${formatted}</p>`);
    }
  }

  return htmlLines.join("\n");
}

// Helper to extract clean tags from a post's category or content
export function getPostTags(post: Post): string[] {
  const parts = (post.category || "")
    .split(/[·,#\s]+/)
    .map((s) => s.trim().replace(/^#/, ""))
    .filter(Boolean);
  return Array.from(new Set(parts));
}

const INITIAL_BLOG_POSTS: Post[] = [
  {
    id: 101,
    slug: "unreal-engine-5-gameplay-architecture",
    title: "언리얼 엔진 5 게임플레이 프레임워크 & C++ 상태 머신 설계",
    caption: "언리얼 엔진 5 환경에서 반응성 높은 게임플레이를 구현하기 위한 C++ 컴포넌트 아키텍처와 상태 머신(FSM) 최적화 일지입니다.",
    excerpt: "언리얼 엔진 5 환경에서 반응성 높은 게임플레이를 구현하기 위한 C++ 컴포넌트 아키텍처와 상태 머신(FSM) 최적화 일지입니다.",
    content: `# 언리얼 엔진 5 게임플레이 프레임워크 & C++ 상태 머신 설계

언리얼 엔진 5(UE5)에서 복잡한 액션 캐릭터를 개발할 때, 유연하고 확장 가능한 아키텍처는 필수적입니다.

## 1. FSM (유한 상태 머신) 기반 컴포넌트 설계
플레이어의 이동, 공격, 대시, 회피 등의 상태를 깔끔하게 분리하기 위해 C++ 인터페이스 기반의 상태 머신을 구축했습니다.

\`\`\`cpp
class ICharacterState {
public:
    virtual void Enter(ACharacter* Character) = 0;
    virtual void Update(ACharacter* Character, float DeltaTime) = 0;
    virtual void Exit(ACharacter* Character) = 0;
};
\`\`\`

## 2. 히트박스와 판정 동기화
- 몽타주 노티파이(AnimNotify)와 연동된 정밀 히트박스 판정
- 콤보 캔슬 타이밍을 프레임 단위로 제어하여 타격감 극대화
- 언리얼 엔진의 Gameplay Ability System(GAS) 연계 설계

앞으로도 게임 클라이언트 개발 과정에서의 아키텍처 경험을 지속적으로 기록하겠습니다.`,
    coverUrl: "",
    category: "언리얼 엔진, C++, 아키텍처",
    authorName: "코하루",
    authorAvatar: "/assets/koharu-profile.png",
    authorOpenId: "1339604814631534667",
    createdAt: "2026-10-28T09:00:00.000Z",
    postType: "blog",
    likesCount: 5,
    dislikesCount: 0,
  },
  {
    id: 102,
    slug: "team-light-bot-architecture-and-security",
    title: "Team Light 보안 봇 서린 & AI 채팅 봇 아린 아키텍처 분석",
    caption: "Team Light의 디스코드 봇 생태계(보안 봇 서린, AI 어시스턴트 아린, 알림 봇 다모아)의 이벤트 기반 서버 아키텍처와 보안 설계.",
    excerpt: "Team Light의 디스코드 봇 생태계(보안 봇 서린, AI 어시스턴트 아린, 알림 봇 다모아)의 이벤트 기반 서버 아키텍처와 보안 설계.",
    content: `# Team Light 보안 봇 서린 & AI 채팅 봇 아린 아키텍처 분석

Team Light 팀에서 운영 중인 디스코드 봇들의 핵심 시스템과 아키텍처를 소개합니다.

## 1. 봇 라인업
- **서린 (Seorin)**: 서버 레이드 방지, 토큰 탈취 방어, 권한 관리 등 고신뢰 보안 봇
- **아린 (Arin)**: 자연어 대화 및 질의응답을 지원하는 대화형 AI 봇
- **다모아 (Damoa)**: 실시간 웹훅 연동 및 커뮤니티 알림 자동화 봇

## 2. 분산 이벤트 파이프라인
대량의 길드 이벤트를 병목 없이 처리하기 위해 샤딩(Sharding) 및 비동기 워커 큐를 도입하여 안정성을 확보했습니다.

\`\`\`typescript
// Event Dispatcher Pattern
interface BotEventPayload<T> {
  guildId: string;
  eventType: string;
  payload: T;
  timestamp: number;
}
\`\`\`

NOCTIL Studio와 Workshop-Koharu의 협업을 통해 더욱 진화된 기술적 솔루션을 만들어가고 있습니다.`,
    coverUrl: "",
    category: "디스코드봇, 백엔드, 아키텍처",
    authorName: "코하루",
    authorAvatar: "/assets/koharu-profile.png",
    authorOpenId: "1339604814631534667",
    createdAt: "2026-10-30T14:30:00.000Z",
    postType: "blog",
    likesCount: 8,
    dislikesCount: 0,
  },
];

export default function TechBlogPage() {
  const { discordUser, loginWithDiscord, logoutDiscord, isAdmin } = useAppAuth();
  const [, blogDetailRoute] = useRoute<{ slug: string }>("/blog/:slug");

  // Local fallback resolution for instant admin reactivity
  const [localDiscordUser] = useState<any>(() => {
    try {
      const s = localStorage.getItem("koharu_discord_user_v2");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const activeDiscordUser = discordUser || localDiscordUser;
  const isEffectiveAdmin = Boolean(
    isAdmin ||
    activeDiscordUser?.isAdmin ||
    String(activeDiscordUser?.id) === "1339604814631534667" ||
    (activeDiscordUser?.email || "").toLowerCase() === "codingexpertleon@gmail.com"
  );

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTag, setActiveTag] = useState("all");
  const [readingPost, setReadingPost] = useState<Post | null>(null);

  // Comments for current reading post
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");

  // Reactions state for current user (loaded from persistent storage)
  const [userReactions, setUserReactions] = useState<Record<number, "like" | "dislike" | null>>(() => {
    try {
      const saved = localStorage.getItem("koharu_blog_reactions_v2");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Editor Modal State (Admin only)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorCategory, setEditorCategory] = useState("개발");
  const [editorTags, setEditorTags] = useState("");
  const [editorCoverUrl, setEditorCoverUrl] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const blogCoverFileRef = useRef<HTMLInputElement>(null);

  const [editorSlug, setEditorSlug] = useState("");

  const handleBlogCoverFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Compress with high fidelity (max 1600px, 90% quality)
      const compressed = await compressImageFile(file, 1600, 0.90);
      if (compressed) {
        setEditorCoverUrl(compressed);
      }
    } catch (err) {
      console.error(err);
    }
    e.target.value = "";
  };

  useEffect(() => {
    loadBlogPosts();
  }, []);

  // Sync route on direct entry or back/forward navigation
  useEffect(() => {
    if (blogDetailRoute?.slug && posts.length > 0) {
      const targetSlug = decodeURIComponent(blogDetailRoute.slug);
      const match = posts.find(
        (p) => p.slug === targetSlug || p.slug === blogDetailRoute.slug || String(p.id) === targetSlug
      );
      if (match) {
        selectPostToRead(match, false);
      }
    }
  }, [blogDetailRoute?.slug, posts]);

  // Handle browser back/forward buttons smoothly
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/blog" || path === "/blog/") {
        setReadingPost(null);
      } else if (path.startsWith("/blog/")) {
        const slug = decodeURIComponent(path.replace(/^\/blog\//, ""));
        const match = posts.find((p) => p.slug === slug || String(p.id) === slug);
        if (match) {
          selectPostToRead(match, false);
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [posts]);

  const loadBlogPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchAllPosts("blog");
      if (data && data.length > 0) {
        setPosts(data);
      } else {
        setPosts(INITIAL_BLOG_POSTS);
      }
    } catch (e) {
      console.error(e);
      setPosts(INITIAL_BLOG_POSTS);
    } finally {
      setLoading(false);
    }
  };

  const selectPostToRead = async (post: Post, updateHistory = true) => {
    setReadingPost(post);
    if (updateHistory) {
      window.history.pushState({}, "", `/blog/${encodeURIComponent(post.slug)}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const list = await fetchComments(post.id);
      setComments(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBackToList = () => {
    setReadingPost(null);
    window.history.pushState({}, "", "/blog");
  };

  // Reactions (Like & Dislike) with instant optimistic UI and persistent cache sync
  const handleReaction = async (post: Post, type: "like" | "dislike") => {
    // Persistent visitor or discord user identifier
    let userIdentifier = activeDiscordUser?.id || activeDiscordUser?.email;
    if (!userIdentifier) {
      userIdentifier = localStorage.getItem("koharu_visitor_id") || "";
      if (!userIdentifier) {
        userIdentifier = "visitor_" + Math.random().toString(36).substring(2, 10);
        localStorage.setItem("koharu_visitor_id", userIdentifier);
      }
    }

    const currentReaction = userReactions[post.id] || null;
    let nextReaction: "like" | "dislike" | null = null;
    let deltaLikes = 0;
    let deltaDislikes = 0;

    if (type === "like") {
      if (currentReaction === "like") {
        nextReaction = null;
        deltaLikes = -1;
      } else if (currentReaction === "dislike") {
        nextReaction = "like";
        deltaLikes = 1;
        deltaDislikes = -1;
      } else {
        nextReaction = "like";
        deltaLikes = 1;
      }
    } else {
      if (currentReaction === "dislike") {
        nextReaction = null;
        deltaDislikes = -1;
      } else if (currentReaction === "like") {
        nextReaction = "dislike";
        deltaDislikes = 1;
        deltaLikes = -1;
      } else {
        nextReaction = "dislike";
        deltaDislikes = 1;
      }
    }

    const optimisticLikes = Math.max(0, (post.likesCount || 0) + deltaLikes);
    const optimisticDislikes = Math.max(0, (post.dislikesCount || 0) + deltaDislikes);

    // 1. Instant optimistic state update
    const updatedReactions = { ...userReactions, [post.id]: nextReaction };
    setUserReactions(updatedReactions);
    try {
      localStorage.setItem("koharu_blog_reactions_v2", JSON.stringify(updatedReactions));
    } catch {}

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likesCount: optimisticLikes, dislikesCount: optimisticDislikes }
          : p
      )
    );

    if (readingPost && readingPost.id === post.id) {
      setReadingPost((prev) =>
        prev
          ? {
              ...prev,
              likesCount: optimisticLikes,
              dislikesCount: optimisticDislikes,
            }
          : null
      );
    }

    if (nextReaction === "like") {
      toast.success("좋아요를 눌렀습니다.");
    } else if (nextReaction === "dislike") {
      toast.info("싫어요를 표시했습니다.");
    } else {
      toast.info("반응을 취소했습니다.");
    }

    // 2. Sync with server in background and reconcile
    try {
      const result = await togglePostReaction(post.id, userIdentifier, type);
      if (result && typeof result.likesCount === "number") {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  likesCount: result.likesCount,
                  dislikesCount: result.dislikesCount ?? optimisticDislikes,
                }
              : p
          )
        );
        if (readingPost && readingPost.id === post.id) {
          setReadingPost((prev) =>
            prev
              ? {
                  ...prev,
                  likesCount: result.likesCount,
                  dislikesCount: result.dislikesCount ?? optimisticDislikes,
                }
              : null
          );
        }
      }
    } catch (err) {
      console.warn("Server reaction sync warning:", err);
    }
  };

  // Comments
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDiscordUser) {
      toast.error("댓글을 작성하려면 먼저 Discord 로그인을 진행해주세요.");
      return;
    }
    if (!readingPost || !commentText.trim()) return;

    try {
      const newComment = await addComment(
        readingPost.id,
        activeDiscordUser.name,
        activeDiscordUser.avatar || "/assets/koharu-profile.png",
        commentText.trim(),
        activeDiscordUser.id
      );

      if (newComment) {
        setComments((prev) => [newComment, ...prev]);
        setCommentText("");
        toast.success("댓글이 등록되었습니다.");
      }
    } catch {
      toast.error("댓글 작성에 실패했습니다.");
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!activeDiscordUser || !editingCommentContent.trim()) return;

    try {
      const updated = await updateComment(commentId, editingCommentContent.trim(), {
        userOpenId: activeDiscordUser.id,
        isAdmin: isEffectiveAdmin,
      });

      if (updated) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, content: updated.content } : c))
        );
        setEditingCommentId(null);
        setEditingCommentContent("");
        toast.success("댓글이 수정되었습니다.");
      } else {
        toast.error("본인이 작성한 댓글만 수정할 수 있습니다.");
      }
    } catch {
      toast.error("댓글 수정에 실패했습니다.");
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!activeDiscordUser) return;
    if (!window.confirm("이 댓글을 삭제하시겠습니까?")) return;

    try {
      const ok = await deleteComment(comment.id, {
        userOpenId: activeDiscordUser.id,
        isAdmin: isEffectiveAdmin,
      });

      if (ok) {
        setComments((prev) => prev.filter((c) => c.id !== comment.id));
        toast.success("댓글이 삭제되었습니다.");
      } else {
        toast.error("본인이 작성한 댓글만 삭제할 수 있습니다.");
      }
    } catch {
      toast.error("댓글 삭제에 실패했습니다.");
    }
  };

  // Editor Actions (Admin only)
  const openEditorForNew = () => {
    if (!isEffectiveAdmin) {
      toast.error("블로그 글 작성은 관리자 전용입니다.");
      return;
    }
    setEditingPostId(null);
    setEditorTitle("");
    setEditorSlug("");
    setEditorCategory("개발");
    setEditorTags("");
    setEditorCoverUrl("");
    setEditorContent("");
    setIsPreviewMode(false);
    setIsEditorOpen(true);
  };

  const openEditorForEdit = (post: Post) => {
    if (!isEffectiveAdmin) {
      toast.error("블로그 글 수정은 관리자만 가능합니다.");
      return;
    }
    const tags = getPostTags(post);
    setEditingPostId(post.id);
    setEditorTitle(post.title);
    setEditorSlug(post.slug);
    setEditorCategory(tags[0] || "개발");
    setEditorTags(tags.slice(1).join(", "));
    setEditorCoverUrl(post.coverUrl);
    setEditorContent(post.content);
    setIsPreviewMode(false);
    setIsEditorOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEffectiveAdmin) {
      toast.error("관리자만 글을 발행할 수 있습니다.");
      return;
    }
    if (!editorTitle.trim() || !editorContent.trim()) {
      toast.error("제목과 본문을 모두 입력해주세요!");
      return;
    }

    const tagTokens = editorTags
      .split(/[,#\s]+/)
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);
    const finalCategory = tagTokens.length > 0
      ? `${editorCategory.trim()} · ${tagTokens.join(" · ")}`
      : editorCategory.trim();

    const cleanSlug = (editorSlug.trim() || generateCleanSlug(editorTitle.trim())).replace(/\s+/g, "-");

    setIsSaving(true);
    try {
      if (editingPostId) {
        // Edit existing post
        const res = await fetch(`/api/posts/${editingPostId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: cleanSlug,
            title: editorTitle.trim(),
            content: editorContent.trim(),
            coverUrl: editorCoverUrl.trim() || "/assets/koharu-profile.png",
            category: finalCategory,
            isAdmin: true,
            userOpenId: activeDiscordUser?.id,
          }),
        });

        if (res.ok) {
          toast.success("블로그 글이 수정되었습니다.");
          setIsEditorOpen(false);
          loadBlogPosts();
        } else {
          toast.error("수정에 실패했습니다.");
        }
      } else {
        // Create new post
        const newPost = await createNewPost({
          slug: cleanSlug,
          title: editorTitle.trim(),
          caption: editorContent.trim(),
          coverUrl: editorCoverUrl.trim() || "/assets/koharu-profile.png",
          category: finalCategory,
          authorName: activeDiscordUser?.name || "! Koharu",
          authorAvatar: activeDiscordUser?.avatar || "/assets/koharu-profile.png",
          postType: "blog",
        });

        if (newPost) {
          toast.success("새로운 블로그 글이 발행되었습니다.");
          setIsEditorOpen(false);
          loadBlogPosts();
        } else {
          toast.error("발행에 실패했습니다.");
        }
      }
    } catch {
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!isEffectiveAdmin) {
      toast.error("글 삭제는 관리자만 가능합니다.");
      return;
    }
    if (!window.confirm("정말로 이 블로그 글을 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;

    try {
      const ok = await deletePost(postId, {
        userOpenId: activeDiscordUser?.id,
        isAdmin: true,
      });

      if (ok) {
        toast.success("게시글이 삭제되었습니다.");
        setReadingPost(null);
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        toast.error("삭제 실패했습니다.");
      }
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  const categories = Array.from(new Set(posts.map((p) => p.category.split(",")[0].trim()))).filter(Boolean);

  const allUniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach((p) => {
      getPostTags(p).forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchCategory =
        activeCategory === "all" ||
        p.category.toLowerCase().includes(activeCategory.toLowerCase());
      const postTags = getPostTags(p);
      const matchTag =
        activeTag === "all" ||
        postTags.some((t) => t.toLowerCase() === activeTag.toLowerCase());
      return matchCategory && matchTag;
    });
  }, [posts, activeCategory, activeTag]);

  return (
    <div className="min-h-screen pb-24">
      <SiteNav active="/blog" />

      <main className="page-container max-w-5xl mx-auto px-4 pt-4" id="main">
        {/* ── Top Blog Header & Auth Status Bar ─────────────────────────── */}
        <section className="glass-card !p-6 sm:!p-8 mb-8 border border-purple-100 shadow-xl rounded-3xl relative overflow-hidden bg-gradient-to-r from-purple-50/70 via-pink-50/50 to-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-extrabold mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                Koharu Tech & Devlog
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#38314a] tracking-tight">
                코하루 개발 블로그
              </h1>
              <p className="text-xs sm:text-sm text-[#7a6e8f] mt-1">
                언리얼 엔진 5, Unity, C++, C#, 셰이더, 게임플레이 아키텍처 및 게임 개발 일지를 기록하는 전용 공간입니다.
              </p>
            </div>

            {/* Auth Area (Discord Admin Auth) */}
            <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto justify-end">
              {activeDiscordUser ? (
                <div className="flex items-center gap-2 bg-white/90 px-3.5 py-1.5 rounded-2xl border border-purple-200 shadow-xs">
                  <img
                    src={activeDiscordUser.avatar || "/assets/koharu-profile.png"}
                    alt={activeDiscordUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-purple-300"
                  />
                  <div className="text-left">
                    <div className="text-xs font-bold text-[#38314a] flex items-center gap-1">
                      {activeDiscordUser.name}
                      {isEffectiveAdmin && (
                        <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.2 rounded-full font-extrabold">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 capitalize">Discord</div>
                  </div>
                  <button
                    onClick={logoutDiscord}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
                    title="로그아웃"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => loginWithDiscord()}
                  className="px-4 py-2.5 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span>Discord 로그인</span>
                </button>
              )}

              {/* Admin New Post Button (Only when Discord Admin) */}
              {isEffectiveAdmin && (
                <button
                  onClick={openEditorForNew}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white text-xs font-extrabold shadow-md shadow-purple-500/30 transition cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" /> 새 글 작성
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Reading Single Post Mode ──────────────────────────────────── */}
        {readingPost ? (
          <article className="glass-card !p-6 sm:!p-10 mb-10 rounded-3xl border border-purple-100 shadow-2xl animate-in fade-in duration-200">
            {/* Back Button */}
            <div className="flex items-center justify-between pb-6 border-b border-pink-100 mb-6">
              <button
                onClick={() => {
                  setReadingPost(null);
                  window.history.pushState({}, "", "/blog");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> 글 목록으로 돌아가기
              </button>

              <div className="flex items-center gap-2">
                <QRButton
                  url={`${window.location.origin}/blog/${readingPost.slug}`}
                  label={readingPost.title}
                />
                {isEffectiveAdmin && (
                  <>
                    <button
                      onClick={() => openEditorForEdit(readingPost)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold hover:bg-purple-100 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> 글 수정
                    </button>
                    <button
                      onClick={() => handleDeletePost(readingPost.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 삭제
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Post Header */}
            <div className="space-y-3 mb-8">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-pink-600">
                <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
                  #{readingPost.category.split(",")[0].trim()}
                </span>
                {getPostTags(readingPost).map((tag) => (
                  <span
                    key={tag}
                    onClick={() => {
                      setActiveTag(tag);
                      setReadingPost(null);
                    }}
                    className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 cursor-pointer hover:bg-purple-200 transition"
                  >
                    #{tag}
                  </span>
                ))}
                <span>·</span>
                <span className="text-[#7a6e8f] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />{" "}
                  {new Date(readingPost.createdAt).toLocaleDateString("ko-KR")}
                </span>
                <span>·</span>
                <span className="text-[#7a6e8f] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 약 {Math.max(1, Math.round(readingPost.content.length / 500))}분 소요
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-[#38314a] leading-tight">
                {readingPost.title}
              </h1>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-2">
                <img
                  src={readingPost.authorAvatar || "/assets/koharu-profile.png"}
                  alt={readingPost.authorName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-pink-300"
                />
                <div>
                  <div className="font-extrabold text-sm text-[#38314a]">{readingPost.authorName}</div>
                  <div className="text-[11px] text-[#7a6e8f]">작성자 · 게임 프로그래머</div>
                </div>
              </div>
            </div>

            {/* Cover image if available */}
            {readingPost.coverUrl && readingPost.coverUrl !== "/assets/koharu-profile.png" && (
              <div className="mb-8 rounded-2xl overflow-hidden shadow-sm border border-pink-100 bg-gray-50/70 flex items-center justify-center max-h-[380px] p-2">
                <img
                  src={readingPost.coverUrl}
                  alt={readingPost.title}
                  className="max-h-[360px] w-auto max-w-full rounded-xl object-contain shadow-xs"
                />
              </div>
            )}

            {/* Markdown Content Body */}
            <div
              className="blog-content-body prose max-w-none mb-12 text-[#38314a]"
              dangerouslySetInnerHTML={{
                __html: renderSimpleMarkdown(readingPost.content || readingPost.caption),
              }}
            />

            {/* Like & Dislike Reaction Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-purple-50/80 via-pink-50/80 to-purple-50/80 border border-purple-100 gap-4 mb-10">
              <div>
                <div className="font-extrabold text-sm text-[#38314a]">이 글이 도움이 되었나요?</div>
                <div className="text-xs text-[#7a6e8f]">좋아요나 싫어요로 코하루에게 피드백을 남겨주세요.</div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleReaction(readingPost, "like")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                    userReactions[readingPost.id] === "like"
                      ? "bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-500/25"
                      : "bg-white text-gray-700 border-pink-200 hover:bg-pink-50"
                  }`}
                >
                  <ThumbsUp
                    className={`w-4 h-4 ${userReactions[readingPost.id] === "like" ? "fill-white" : ""}`}
                  />
                  <span>좋아요 {readingPost.likesCount || 0}</span>
                </button>

                <button
                  onClick={() => handleReaction(readingPost, "dislike")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                    userReactions[readingPost.id] === "dislike"
                      ? "bg-gray-800 text-white border-gray-800 shadow-md"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <ThumbsDown
                    className={`w-4 h-4 ${userReactions[readingPost.id] === "dislike" ? "fill-white" : ""}`}
                  />
                  <span>싫어요 {readingPost.dislikesCount || 0}</span>
                </button>
              </div>
            </div>

            {/* ── Comments Section ────────────────────────────────────────── */}
            <section className="pt-6 border-t border-pink-100">
              <h3 className="text-lg font-extrabold text-[#38314a] mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-purple-600" /> 댓글 ({comments.length})
              </h3>

              {/* Comment Input Box */}
              <form onSubmit={handleAddComment} className="mb-6 space-y-2">
                <textarea
                  rows={3}
                  placeholder={
                    discordUser
                      ? `${discordUser.name}님으로 의견이나 질문을 남겨주세요.`
                      : "댓글을 작성하려면 먼저 상단에서 Discord 로그인을 진행해주세요."
                  }
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!discordUser}
                  className="w-full text-xs p-3 rounded-2xl border border-pink-200 focus:outline-hidden focus:border-purple-500 disabled:bg-gray-50 resize-none shadow-xs"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!discordUser || !commentText.trim()}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-500/20"
                  >
                    <Send className="w-3.5 h-3.5" /> 댓글 등록
                  </button>
                </div>
              </form>

              {/* Comments list */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-xs text-center py-6 text-gray-400">
                    아직 등록된 댓글이 없습니다. 첫 댓글을 작성해보세요.
                  </p>
                ) : (
                  comments.map((c) => {
                    const isAuthor = activeDiscordUser && activeDiscordUser.id && c.authorOpenId === activeDiscordUser.id;
                    const canDelete = isAuthor || isEffectiveAdmin;

                    return (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl bg-white/80 border border-pink-100 shadow-xs flex items-start justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <img
                            src={c.authorAvatar || "/assets/koharu-profile.png"}
                            alt={c.authorName}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-purple-200"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-extrabold text-xs text-[#38314a]">
                                {c.authorName}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                              </span>
                            </div>

                            {editingCommentId === c.id ? (
                              <div className="space-y-2 mt-2">
                                <textarea
                                  rows={2}
                                  value={editingCommentContent}
                                  onChange={(e) => setEditingCommentContent(e.target.value)}
                                  className="w-full text-xs p-2 rounded-xl border border-pink-300 focus:outline-hidden"
                                />
                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    onClick={() => setEditingCommentId(null)}
                                    className="text-xs text-gray-400 px-3 py-1"
                                  >
                                    취소
                                  </button>
                                  <button
                                    onClick={() => handleEditComment(c.id)}
                                    className="text-xs bg-purple-600 text-white font-bold px-3 py-1 rounded-lg"
                                  >
                                    수정 완료
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-[#4a3952] leading-relaxed break-words">
                                {c.content}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Comment Actions (Strict permission check) */}
                        {canDelete && editingCommentId !== c.id && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isAuthor && (
                              <button
                                onClick={() => {
                                  setEditingCommentId(c.id);
                                  setEditingCommentContent(c.content);
                                }}
                                className="p-1.5 text-gray-400 hover:text-purple-600 transition"
                                title="댓글 수정"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteComment(c)}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition"
                              title="댓글 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </article>
        ) : (
          /* ── Post List View ─────────────────────────────────────────── */
          <>
            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 scrollbar-none">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                  activeCategory === "all"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "bg-white/80 text-[#7a6e8f] hover:bg-white border border-pink-100"
                }`}
              >
                전체 카테고리 ({posts.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                    activeCategory === c
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "bg-white/80 text-[#7a6e8f] hover:bg-white border border-pink-100"
                  }`}
                >
                  #{c}
                </button>
              ))}
            </div>

            {/* Tag Filter Chips */}
            {allUniqueTags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-6 scrollbar-none text-xs">
                <span className="text-[#7a6e8f] text-[11px] font-bold shrink-0 mr-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> 태그:
                </span>
                <button
                  onClick={() => setActiveTag("all")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    activeTag === "all"
                      ? "bg-pink-600 text-white shadow-xs"
                      : "bg-white/80 text-[#7a6e8f] hover:bg-pink-50 border border-purple-100"
                  }`}
                >
                  전체 태그
                </button>
                {allUniqueTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTag(t)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      activeTag === t
                        ? "bg-pink-600 text-white shadow-xs"
                        : "bg-white/80 text-[#7a6e8f] hover:bg-pink-50 border border-purple-100"
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            )}

            {/* Posts Grid / Cards */}
            {loading ? (
              <div className="py-24 text-center">
                <div className="w-10 h-10 mx-auto border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3" />
                <p className="text-sm font-bold text-[#7a6e8f]">블로그 포스트를 불러오는 중...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="glass-card text-center py-20 max-w-md mx-auto !p-8">
                <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#38314a] mb-1">등록된 글이 없습니다</h3>
                <p className="text-xs text-[#7a6e8f] mb-6">
                  {isEffectiveAdmin
                    ? "첫 번째 마크다운 테크 아티클을 작성해보세요!"
                    : "아직 작성된 글이 없습니다. 새로운 개발 일지가 올라오길 기대해주세요!"}
                </p>
                {isEffectiveAdmin && (
                  <button
                    onClick={openEditorForNew}
                    className="px-5 py-2.5 rounded-2xl bg-purple-600 text-white text-xs font-bold shadow-md shadow-purple-500/25 cursor-pointer"
                  >
                    글 작성하기
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    onClick={() => selectPostToRead(post)}
                    className="glass-card !p-6 rounded-3xl border border-purple-100 shadow-md hover:shadow-xl hover:border-purple-300 transition duration-300 cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {/* Category & Date */}
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#7a6e8f] mb-2.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-100/70 text-purple-700">
                          #{post.category.split(",")[0].trim()}
                        </span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="text-lg sm:text-xl font-extrabold text-[#38314a] group-hover:text-purple-600 transition-colors line-clamp-2 mb-2">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="text-xs text-[#4a3952] line-clamp-3 leading-relaxed mb-3">
                        {cleanMarkdownForExcerpt(post.excerpt || post.caption || post.content)}
                      </p>

                      {/* Tags */}
                      {getPostTags(post).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {getPostTags(post).map((t) => (
                            <span
                              key={t}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTag(t);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 font-semibold"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer Meta */}
                    <div className="pt-3 border-t border-pink-50 flex items-center justify-between text-xs text-[#7a6e8f]">
                      <div className="flex items-center gap-2">
                        <img
                          src={post.authorAvatar || "/assets/koharu-profile.png"}
                          alt={post.authorName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="font-bold text-[#38314a]">{post.authorName}</span>
                      </div>

                      <div className="flex items-center gap-3 font-semibold">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReaction(post, "like");
                          }}
                          className={`flex items-center gap-1 transition-colors px-2 py-1 rounded-lg cursor-pointer ${
                            userReactions[post.id] === "like"
                              ? "bg-pink-100 text-pink-600 font-bold"
                              : "text-gray-500 hover:text-pink-600 hover:bg-pink-50"
                          }`}
                          title="좋아요"
                        >
                          <ThumbsUp
                            className={`w-3.5 h-3.5 ${
                              userReactions[post.id] === "like" ? "fill-pink-500 text-pink-500" : ""
                            }`}
                          />{" "}
                          {post.likesCount || 0}
                        </button>
                        <span className="text-purple-600 font-bold group-hover:translate-x-0.5 transition-transform">
                          읽기 →
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Admin Markdown Editor Modal ───────────────────────────────── */}
        {isEditorOpen && isEffectiveAdmin && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in"
            onClick={() => setIsEditorOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-purple-200 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-purple-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#38314a]">
                      {editingPostId ? "블로그 아티클 수정" : "새 마크다운 아티클 작성 (관리자 전용)"}
                    </h3>
                    <p className="text-[10px] text-purple-700">코하루 전용 마크다운 에디터</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-xs font-bold text-purple-700 hover:bg-purple-50 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> {isPreviewMode ? "에디터 모드" : "실시간 미리보기"}
                  </button>
                  <button
                    onClick={() => setIsEditorOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Editor Form */}
              <form onSubmit={handleSavePost} className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#38314a] mb-1">제목</label>
                    <input
                      type="text"
                      placeholder="글 제목을 입력하세요"
                      value={editorTitle}
                      onChange={(e) => setEditorTitle(e.target.value)}
                      required
                      className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-purple-200 focus:outline-hidden focus:border-purple-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#38314a] mb-1">카테고리</label>
                    <input
                      type="text"
                      placeholder="예: Unreal, Unity, C#, Shader"
                      value={editorCategory}
                      onChange={(e) => setEditorCategory(e.target.value)}
                      className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-purple-200 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#38314a] mb-1">
                    태그 (쉼표로 구분, 예: 언리얼5, C++, 셰이더, 게임플레이)
                  </label>
                  <input
                    type="text"
                    placeholder="언리얼5, C++, 셰이더, 렌더링, 최적화"
                    value={editorTags}
                    onChange={(e) => setEditorTags(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-purple-200 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#38314a] mb-1">
                    URL 슬러그 (선택사항, 비워둘 시 제목 기반 영문/숫자 슬러그 자동 생성)
                  </label>
                  <input
                    type="text"
                    placeholder="예: unreal5-combat-system"
                    value={editorSlug}
                    onChange={(e) => setEditorSlug(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-purple-200 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#38314a] mb-1">
                    커버 이미지 (파일 관리자에서 선택)
                  </label>
                  <input
                    type="file"
                    ref={blogCoverFileRef}
                    accept="image/*"
                    onChange={handleBlogCoverFileSelect}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => blogCoverFileRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-bold text-purple-700 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> 파일 관리자에서 사진 선택
                    </button>
                    {editorCoverUrl && (
                      <button
                        type="button"
                        onClick={() => setEditorCoverUrl("")}
                        className="text-xs text-red-500 hover:underline cursor-pointer"
                      >
                        사진 초기화
                      </button>
                    )}
                  </div>
                  {editorCoverUrl && (
                    <div className="mt-2.5 h-32 w-auto max-w-xs rounded-xl overflow-hidden border border-purple-200 shadow-xs bg-gray-50 flex items-center justify-center p-1">
                      <img src={editorCoverUrl} alt="Cover Preview" className="max-h-28 w-auto max-w-full object-contain rounded-lg" />
                    </div>
                  )}
                </div>

                {/* Markdown Editor or Preview */}
                <div className="flex-1 min-h-[300px] flex flex-col">
                  <label className="block text-xs font-bold text-[#38314a] mb-1">
                    마크다운 본문 내용 (#, ##, ```코드, &gt;인용구, - 리스트, **볼드**)
                  </label>
                  {isPreviewMode ? (
                    <div className="flex-1 p-5 rounded-2xl bg-white border border-purple-200 overflow-y-auto max-h-[420px] shadow-inner">
                      {editorContent.trim() ? (
                        <div
                          className="blog-content-body prose max-w-none text-[#38314a]"
                          dangerouslySetInnerHTML={{
                            __html: renderSimpleMarkdown(editorContent),
                          }}
                        />
                      ) : (
                        <p className="text-xs text-gray-400">작성된 내용이 없습니다. 먼저 마크다운을 입력해주세요.</p>
                      )}
                    </div>
                  ) : (
                    <textarea
                      rows={14}
                      placeholder="# 제목&#10;&#10;여기에 자유롭게 마크다운으로 글을 작성하세요.&#10;&#10;```csharp&#10;void Start() { Debug.Log('Hello Koharu!'); }&#10;```"
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      required
                      className="w-full flex-1 text-xs sm:text-sm p-3.5 rounded-2xl border border-purple-200 focus:outline-hidden focus:border-purple-500 font-mono leading-relaxed"
                    />
                  )}
                </div>

                {/* Bottom Footer Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-extrabold shadow-md shadow-purple-500/25 hover:opacity-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? "저장 중..." : editingPostId ? "글 수정 완료" : "블로그 글 발행"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

