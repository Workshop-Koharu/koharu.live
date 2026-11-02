import { useEffect, useState } from "react";
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

// Simple lightweight Markdown renderer without heavy dependencies
function renderSimpleMarkdown(markdown: string) {
  if (!markdown) return "";
  const lines = markdown.split("\n");
  const htmlLines: string[] = [];
  let inCodeBlock = false;
  let codeLang = "";
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        // Close code block
        inCodeBlock = false;
        const codeContent = codeBuffer
          .join("\n")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        htmlLines.push(
          `<div class="my-4 rounded-2xl bg-[#1e1e2e] text-[#cdd6f4] p-4 text-xs sm:text-sm font-mono overflow-x-auto shadow-lg border border-purple-900/30">
            ${codeLang ? `<div class="text-[10px] text-pink-400 font-bold mb-2 uppercase tracking-widest">${codeLang}</div>` : ""}
            <pre><code>${codeContent}</code></pre>
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
      codeBuffer.push(line);
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      htmlLines.push(`<h3 class="text-lg font-bold text-[#38314a] mt-6 mb-2">${line.slice(4)}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      htmlLines.push(`<h2 class="text-xl font-extrabold text-[#38314a] mt-8 mb-3 pb-1 border-b border-pink-100">${line.slice(3)}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      htmlLines.push(`<h1 class="text-2xl font-black text-[#38314a] mt-10 mb-4 pb-2 border-b-2 border-pink-200">${line.slice(2)}</h1>`);
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

    // Images
    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      htmlLines.push(
        `<div class="my-5 rounded-2xl overflow-hidden shadow-md border border-pink-100 max-w-2xl mx-auto">
          <img src="${imgMatch[2]}" alt="${imgMatch[1]}" class="w-full object-cover" />
          ${imgMatch[1] ? `<div class="text-center text-[11px] text-gray-500 py-1.5 bg-gray-50">${imgMatch[1]}</div>` : ""}
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

export default function TechBlogPage() {
  const { user, loginWithDiscord, logout, isAdmin } = useAppAuth();
  const [, blogDetailRoute] = useRoute<{ slug: string }>("/blog/:slug");

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [readingPost, setReadingPost] = useState<Post | null>(null);

  // Comments for current reading post
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");

  // Reactions state for current user
  const [userReactions, setUserReactions] = useState<Record<number, "like" | "dislike" | null>>({});

  // Editor Modal State (Admin only)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorCategory, setEditorCategory] = useState("개발");
  const [editorCoverUrl, setEditorCoverUrl] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBlogPosts();
  }, []);

  // Sync route
  useEffect(() => {
    if (blogDetailRoute?.slug && posts.length > 0) {
      const match = posts.find(
        (p) => p.slug === blogDetailRoute.slug || String(p.id) === blogDetailRoute.slug
      );
      if (match) {
        selectPostToRead(match);
      }
    }
  }, [blogDetailRoute?.slug, posts]);

  const loadBlogPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchAllPosts("blog");
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectPostToRead = async (post: Post) => {
    setReadingPost(post);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const list = await fetchComments(post.id);
      setComments(list);
    } catch (e) {
      console.error(e);
    }
  };

  // Reactions (Like & Dislike)
  const handleReaction = async (post: Post, type: "like" | "dislike") => {
    if (!user) {
      toast.error("반응을 남기려면 로그인이 필요합니다. 디스코드 또는 구글로 로그인해주세요! 🔒");
      return;
    }

    const userIdentifier = user.openId || user.email || "guest";
    try {
      const result = await togglePostReaction(post.id, userIdentifier, type);
      setUserReactions((prev) => ({
        ...prev,
        [post.id]: result.liked ? "like" : result.disliked ? "dislike" : null,
      }));

      // Update post counts
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, likesCount: result.likesCount, dislikesCount: result.dislikesCount }
            : p
        )
      );

      if (readingPost && readingPost.id === post.id) {
        setReadingPost((prev) =>
          prev
            ? {
                ...prev,
                likesCount: result.likesCount,
                dislikesCount: result.dislikesCount,
              }
            : null
        );
      }

      toast.success(type === "like" ? "좋아요를 눌렀습니다! 👍" : "싫어요를 표시했습니다. 👎");
    } catch {
      toast.error("반응 처리에 실패했습니다.");
    }
  };

  // Comments
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("댓글을 작성하려면 먼저 로그인해주세요! 🔒");
      return;
    }
    if (!readingPost || !commentText.trim()) return;

    try {
      const newComment = await addComment(
        readingPost.id,
        user.name,
        user.avatar || "/assets/koharu-profile.png",
        commentText.trim(),
        user.openId
      );

      if (newComment) {
        setComments((prev) => [newComment, ...prev]);
        setCommentText("");
        toast.success("댓글이 등록되었습니다! 💬");
      }
    } catch {
      toast.error("댓글 작성에 실패했습니다.");
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!user || !editingCommentContent.trim()) return;

    try {
      const updated = await updateComment(commentId, editingCommentContent.trim(), {
        userOpenId: user.openId,
        isAdmin,
      });

      if (updated) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, content: updated.content } : c))
        );
        setEditingCommentId(null);
        setEditingCommentContent("");
        toast.success("댓글이 수정되었습니다. ✏️");
      } else {
        toast.error("본인이 작성한 댓글만 수정할 수 있습니다.");
      }
    } catch {
      toast.error("댓글 수정에 실패했습니다.");
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!user) return;
    if (!window.confirm("이 댓글을 삭제하시겠습니까?")) return;

    try {
      const ok = await deleteComment(comment.id, {
        userOpenId: user.openId,
        isAdmin,
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
    if (!isAdmin) {
      toast.error("블로그 글 작성은 관리자(코하루)만 가능합니다. 🚫");
      return;
    }
    setEditingPostId(null);
    setEditorTitle("");
    setEditorCategory("개발");
    setEditorCoverUrl("");
    setEditorContent("");
    setIsPreviewMode(false);
    setIsEditorOpen(true);
  };

  const openEditorForEdit = (post: Post) => {
    if (!isAdmin) {
      toast.error("블로그 글 수정은 관리자만 가능합니다.");
      return;
    }
    setEditingPostId(post.id);
    setEditorTitle(post.title);
    setEditorCategory(post.category);
    setEditorCoverUrl(post.coverUrl);
    setEditorContent(post.content);
    setIsPreviewMode(false);
    setIsEditorOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("관리자만 글을 발행할 수 있습니다.");
      return;
    }
    if (!editorTitle.trim() || !editorContent.trim()) {
      toast.error("제목과 본문을 모두 입력해주세요!");
      return;
    }

    setIsSaving(true);
    try {
      if (editingPostId) {
        // Edit existing post
        const res = await fetch(`/api/posts/${editingPostId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editorTitle.trim(),
            content: editorContent.trim(),
            coverUrl: editorCoverUrl.trim() || "/assets/koharu-profile.png",
            category: editorCategory,
            isAdmin: true,
            userOpenId: user?.openId,
          }),
        });

        if (res.ok) {
          toast.success("블로그 글이 수정되었습니다! 🌸");
          setIsEditorOpen(false);
          loadBlogPosts();
        } else {
          toast.error("수정에 실패했습니다.");
        }
      } else {
        // Create new post
        const newPost = await createNewPost({
          slug: `blog-${Date.now()}`,
          title: editorTitle.trim(),
          caption: editorContent.trim(),
          coverUrl: editorCoverUrl.trim() || "/assets/koharu-profile.png",
          category: editorCategory,
          authorName: user?.name || "! Koharu",
          authorAvatar: user?.avatar || "/assets/koharu-profile.png",
        });

        if (newPost) {
          toast.success("새로운 블로그 글이 발행되었습니다! 🚀");
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
    if (!isAdmin) {
      toast.error("글 삭제는 관리자만 가능합니다.");
      return;
    }
    if (!window.confirm("정말로 이 블로그 글을 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;

    try {
      const ok = await deletePost(postId, {
        userOpenId: user?.openId,
        isAdmin: true,
      });

      if (ok) {
        toast.success("게시글이 삭제되었습니다. 🗑️");
        setReadingPost(null);
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        toast.error("삭제 실패했습니다.");
      }
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  const categories = Array.from(new Set(posts.map((p) => p.category))).filter(Boolean);
  const filteredPosts =
    activeCategory === "all"
      ? posts
      : posts.filter((p) => p.category === activeCategory);

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
                코하루 개발 블로그 🌸
              </h1>
              <p className="text-xs sm:text-sm text-[#7a6e8f] mt-1">
                Unity 엔진, C#, 셰이더, 경량 스크립트 엔진과 인디 게임 개발 일지를 기록하는 전용 공간입니다.
              </p>
            </div>

            {/* Auth Area */}
            <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto justify-end">
              {user ? (
                <div className="flex items-center gap-2 bg-white/90 px-3.5 py-1.5 rounded-2xl border border-purple-200 shadow-xs">
                  <img
                    src={user.avatar || "/assets/koharu-profile.png"}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-purple-300"
                  />
                  <div className="text-left">
                    <div className="text-xs font-bold text-[#38314a] flex items-center gap-1">
                      {user.name}
                      {user.isAdmin && (
                        <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.2 rounded-full font-extrabold">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 capitalize">{user.provider}</div>
                  </div>
                  <button
                    onClick={logout}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
                    title="로그아웃"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={loginWithDiscord}
                  className="px-4 py-2 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition cursor-pointer flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Discord 로그인
                </button>
              )}

              {/* Admin New Post Button */}
              {isAdmin && (
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
                {isAdmin && (
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
              <div className="flex items-center gap-2 text-xs font-bold text-pink-600">
                <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
                  #{readingPost.category}
                </span>
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
              <div className="mb-8 rounded-2xl overflow-hidden shadow-lg border border-pink-100 max-h-[450px]">
                <img
                  src={readingPost.coverUrl}
                  alt={readingPost.title}
                  className="w-full h-full object-cover"
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
                <div className="text-xs text-[#7a6e8f]">좋아요나 싫어요로 코하루에게 피드백을 남겨주세요! 🌸</div>
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
                  <ThumbsUp className="w-4 h-4" />
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
                  <ThumbsDown className="w-4 h-4" />
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
                    user
                      ? `${user.name}님으로 자유롭게 의견이나 질문을 남겨주세요 🌸`
                      : "댓글을 작성하려면 먼저 상단에서 로그인해주세요..."
                  }
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!user}
                  className="w-full text-xs p-3 rounded-2xl border border-pink-200 focus:outline-hidden focus:border-purple-500 disabled:bg-gray-50 resize-none shadow-xs"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!user || !commentText.trim()}
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
                    아직 등록된 댓글이 없습니다. 첫 댓글의 주인공이 되어보세요! ✨
                  </p>
                ) : (
                  comments.map((c) => {
                    const isAuthor = user && user.openId && c.authorOpenId === user.openId;
                    const canDelete = isAuthor || isAdmin;

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
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                  activeCategory === "all"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "bg-white/80 text-[#7a6e8f] hover:bg-white border border-pink-100"
                }`}
              >
                전체 아티클 ({posts.length})
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

            {/* Posts Grid / Cards */}
            {loading ? (
              <div className="py-24 text-center">
                <div className="w-10 h-10 mx-auto border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3" />
                <p className="text-sm font-bold text-[#7a6e8f]">블로그 포스트를 불러오는 중... 🌸</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="glass-card text-center py-20 max-w-md mx-auto !p-8">
                <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#38314a] mb-1">등록된 글이 없습니다</h3>
                <p className="text-xs text-[#7a6e8f] mb-6">
                  {isAdmin
                    ? "첫 번째 마크다운 테크 아티클을 작성해보세요!"
                    : "아직 작성된 글이 없습니다. 새로운 개발 일지가 올라오길 기대해주세요!"}
                </p>
                {isAdmin && (
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
                          #{post.category}
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
                      <p className="text-xs text-[#4a3952] line-clamp-3 leading-relaxed mb-4">
                        {post.excerpt || post.caption || post.content}
                      </p>
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
                        <span className="flex items-center gap-1 text-pink-600">
                          <ThumbsUp className="w-3.5 h-3.5" /> {post.likesCount || 0}
                        </span>
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
        {isEditorOpen && isAdmin && (
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
                      placeholder="예: Unity, C#, Shader"
                      value={editorCategory}
                      onChange={(e) => setEditorCategory(e.target.value)}
                      className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-purple-200 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#38314a] mb-1">
                    커버 이미지 URL (선택)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... 또는 이미지 URL"
                    value={editorCoverUrl}
                    onChange={(e) => setEditorCoverUrl(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-purple-200 focus:outline-hidden"
                  />
                </div>

                {/* Markdown Editor or Preview */}
                <div className="flex-1 min-h-[300px] flex flex-col">
                  <label className="block text-xs font-bold text-[#38314a] mb-1">
                    마크다운 본문 내용 (#, ##, ```코드, &gt;인용구, - 리스트, **볼드**)
                  </label>
                  {isPreviewMode ? (
                    <div className="flex-1 p-4 rounded-2xl bg-gray-50 border border-purple-200 overflow-y-auto max-h-[400px]">
                      <div
                        className="prose max-w-none text-[#38314a]"
                        dangerouslySetInnerHTML={{
                          __html: renderSimpleMarkdown(editorContent),
                        }}
                      />
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

