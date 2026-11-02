import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Edit3,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Trash2,
  User,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";
import { QRButton } from "@/components/QRCodeModal";
import { useAppAuth } from "@/contexts/AuthContext";
import {
  fetchPostBySlugOrId,
  fetchComments,
  addComment,
  updateComment,
  deleteComment,
  togglePostReaction,
  Post,
  Comment,
} from "@/lib/remoteDb";

export default function PostDetailPage() {
  const [, setLocation] = useLocation();
  const [, paramsMoment] = useRoute("/moment/:id");
  const [, paramsPost] = useRoute("/post/:slug");
  const [, paramsP] = useRoute("/p/:slug");

  const idOrSlug = paramsMoment?.id || paramsPost?.slug || paramsP?.slug || "";

  const { user, isAdmin } = useAppAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!idOrSlug) return;
    loadPostData(idOrSlug);
  }, [idOrSlug]);

  const loadPostData = async (identifier: string) => {
    setLoading(true);
    try {
      const p = await fetchPostBySlugOrId(identifier);
      if (p) {
        setPost(p);
        setLikesCount(p.likesCount || 0);

        // Load comments
        const cList = await fetchComments(p.id);
        setComments(cList);

        // Check liked state
        const likedMap = JSON.parse(localStorage.getItem("koharu_liked_posts") || "{}");
        setIsLiked(Boolean(likedMap[p.id]));
      }
    } catch (e) {
      console.error("Load post error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    const userIdentifier = user?.openId || user?.email || "guest-user";
    try {
      const result = await togglePostReaction(post.id, userIdentifier, "like");
      setIsLiked(result.liked);
      setLikesCount(result.likesCount);

      const likedMap = JSON.parse(localStorage.getItem("koharu_liked_posts") || "{}");
      likedMap[post.id] = result.liked;
      localStorage.setItem("koharu_liked_posts", JSON.stringify(likedMap));

      if (result.liked) toast.success("좋아요를 눌렀습니다! ❤️");
    } catch {
      toast.error("좋아요 처리에 실패했습니다.");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !post) return;

    if (!user) {
      toast.error("댓글을 작성하려면 먼저 Google 로그인을 진행해주세요.");
      return;
    }

    try {
      const newComment = await addComment(
        post.id,
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
      toast.error("댓글 등록 중 오류가 발생했습니다.");
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editingCommentContent.trim()) return;

    try {
      const updated = await updateComment(commentId, editingCommentContent.trim(), {
        userOpenId: user?.openId,
        isAdmin,
      });

      if (updated) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, content: updated.content } : c))
        );
        setEditingCommentId(null);
        setEditingCommentContent("");
        toast.success("댓글이 수정되었습니다! ✏️");
      }
    } catch {
      toast.error("댓글 수정에 실패했습니다.");
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!window.confirm("이 댓글을 삭제하시겠습니까?")) return;

    try {
      const ok = await deleteComment(comment.id, {
        userOpenId: user?.openId,
        isAdmin,
      });

      if (ok) {
        setComments((prev) => prev.filter((c) => c.id !== comment.id));
        toast.success("댓글이 삭제되었습니다.");
      }
    } catch {
      toast.error("댓글 삭제에 실패했습니다.");
    }
  };

  const copyShareLink = () => {
    const fullUrl = `${window.location.origin}/moment/${post?.id || idOrSlug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    toast.success("게시글 공유 링크가 클립보드에 복사되었습니다! 🔗");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <SiteNav active="/moments" />
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-[#7a6e8f]">게시글을 불러오는 중... 🌸</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen">
        <SiteNav active="/moments" />
        <div className="max-w-md mx-auto py-24 text-center px-4">
          <div className="w-16 h-16 rounded-3xl bg-pink-100 text-pink-600 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-[#38314a] mb-2">게시글을 찾을 수 없습니다</h2>
          <p className="text-xs text-[#7a6e8f] mb-6">
            삭제되었거나 올바르지 않은 공유 링크입니다.
          </p>
          <button
            onClick={() => setLocation("/moments")}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow-md cursor-pointer"
          >
            모먼트 피드로 이동
          </button>
        </div>
      </div>
    );
  }

  // Parse media items (images or videos)
  const mediaList = (post.coverUrl || "")
    .split("|||")
    .map((s) => s.trim())
    .filter(Boolean);

  const currentMedia = mediaList[currentImageIndex] || mediaList[0] || "/assets/koharu-profile.png";
  const isVideo = currentMedia.startsWith("data:video") || /\.(mp4|webm|mov)$/i.test(currentMedia);
  const authorHandle = (post.authorName || "koharu").toLowerCase().replace(/\s+/g, "");

  return (
    <div className="min-h-screen pb-24">
      <SiteNav active="/moments" />

      <main className="page-container max-w-4xl mx-auto px-4 pt-4">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setLocation("/moments")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> 모먼트 피드로 돌아가기
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={copyShareLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-xs font-bold text-[#38314a] hover:bg-pink-50 transition cursor-pointer shadow-xs"
              title="링크 복사"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "복사됨" : "공유 링크"}</span>
            </button>
            <QRButton
              url={`${window.location.origin}/moment/${post.id}`}
              label={post.title || "모먼트 게시글"}
            />
          </div>
        </div>

        {/* Post Card */}
        <article className="glass-card !p-0 rounded-3xl overflow-hidden border border-pink-100 shadow-2xl bg-white grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Media Display with Carousel */}
          <div className="relative aspect-square md:aspect-auto bg-black flex items-center justify-center overflow-hidden min-h-[380px] md:min-h-[500px]">
            {isVideo ? (
              <video
                src={currentMedia}
                controls
                autoPlay
                loop
                muted
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={currentMedia}
                alt={post.title}
                className="w-full h-full object-contain"
              />
            )}

            {/* Carousel navigation buttons */}
            {mediaList.length > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <button
                    onClick={() => setCurrentImageIndex((prev) => prev - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {currentImageIndex < mediaList.length - 1 && (
                  <button
                    onClick={() => setCurrentImageIndex((prev) => prev + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                {/* Pagination Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                  {mediaList.map((_, idx) => (
                    <span
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`block rounded-full transition-all cursor-pointer ${
                        currentImageIndex === idx
                          ? "w-4 h-1.5 bg-pink-500"
                          : "w-1.5 h-1.5 bg-white/60 hover:bg-white"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right Column: Author, Caption & Comments Thread */}
          <div className="flex flex-col h-full justify-between p-5 sm:p-7 max-h-[600px] overflow-hidden">
            <div>
              {/* Author Header */}
              <div className="flex items-center justify-between pb-4 border-b border-pink-100 mb-4">
                <div
                  onClick={() => setLocation(`/profile/${authorHandle}`)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <img
                    src={post.authorAvatar || "/assets/koharu-profile.png"}
                    alt={post.authorName}
                    className="w-10 h-10 rounded-full object-cover border border-pink-200 group-hover:scale-105 transition-transform"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm text-[#38314a] group-hover:text-pink-600 transition flex items-center gap-1.5">
                      {post.authorName}
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-pink-100 text-pink-700 font-bold">
                        작성자
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#7a6e8f]">@{authorHandle}</p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-gray-400">
                  {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>

              {/* Caption */}
              <div className="mb-4 pr-1 max-h-36 overflow-y-auto">
                <p className="text-xs sm:text-sm text-[#38314a] leading-relaxed whitespace-pre-line">
                  {post.caption || post.content}
                </p>
                {post.category && (
                  <span className="inline-block mt-2 text-xs font-bold text-pink-600">
                    #{post.category}
                  </span>
                )}
              </div>

              {/* Likes & Interactions */}
              <div className="flex items-center justify-between py-3 border-y border-pink-50 mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleLike}
                    className="flex items-center gap-1.5 text-xs font-bold transition cursor-pointer"
                  >
                    <Heart
                      className={`w-5 h-5 transition-transform active:scale-125 ${
                        isLiked ? "fill-pink-500 text-pink-500" : "text-[#7a6e8f] hover:text-pink-500"
                      }`}
                    />
                    <span className={isLiked ? "text-pink-600 font-black" : "text-[#7a6e8f]"}>
                      {likesCount}
                    </span>
                  </button>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#7a6e8f]">
                    <MessageCircle className="w-5 h-5" />
                    <span>{comments.length}</span>
                  </div>
                </div>

                <button
                  onClick={copyShareLink}
                  className="p-1.5 text-gray-400 hover:text-pink-600 rounded-lg transition cursor-pointer"
                  title="게시글 공유"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Comments List (Scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[140px] max-h-[220px]">
              {comments.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#7a6e8f]">
                  아직 댓글이 없습니다. 첫 댓글을 남겨보세요! 💬
                </div>
              ) : (
                comments.map((c) => {
                  const isAuthor = user && user.openId && c.authorOpenId === user.openId;
                  const canDelete = isAuthor || isAdmin;

                  return (
                    <div key={c.id} className="group flex items-start justify-between gap-2 text-xs">
                      <div className="flex items-start gap-2 min-w-0">
                        <img
                          src={c.authorAvatar || "/assets/koharu-profile.png"}
                          alt={c.authorName}
                          className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-[#38314a] mr-1.5">
                            {c.authorName}
                          </span>
                          {editingCommentId === c.id ? (
                            <div className="mt-1 flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editingCommentContent}
                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                className="text-xs p-1 rounded-lg border border-pink-200"
                              />
                              <button
                                onClick={() => handleEditComment(c.id)}
                                className="text-[10px] bg-pink-600 text-white font-bold px-2 py-1 rounded-md"
                              >
                                저장
                              </button>
                            </div>
                          ) : (
                            <span className="text-[#5a4c66] break-words">{c.content}</span>
                          )}
                        </div>
                      </div>

                      {canDelete && editingCommentId !== c.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isAuthor && (
                            <button
                              onClick={() => {
                                setEditingCommentId(c.id);
                                setEditingCommentContent(c.content);
                              }}
                              className="p-1 text-gray-400 hover:text-pink-600"
                              title="수정"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteComment(c)}
                            className="p-1 text-gray-400 hover:text-red-500"
                            title="삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-pink-50 flex gap-2">
              <input
                type="text"
                placeholder={user ? "댓글 달기..." : "로그인 후 댓글을 남겨보세요"}
                disabled={!user}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 text-xs p-2.5 rounded-xl border border-pink-200 focus:outline-hidden focus:border-pink-500 disabled:bg-gray-50"
              />
              <button
                type="submit"
                disabled={!user || !commentText.trim()}
                className="px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-bold hover:bg-pink-700 disabled:opacity-40 cursor-pointer"
              >
                게시
              </button>
            </form>
          </div>
        </article>
      </main>
    </div>
  );
}
