import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Bookmark,
  Check,
  Grid,
  Heart,
  Image as ImageIcon,
  Layers,
  MessageCircle,
  MoreHorizontal,
  PlusCircle,
  Send,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";

interface Post {
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
  authorName: string;
  authorAvatar: string;
  createdAt: string;
}

interface Comment {
  id: number;
  postId: number;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  createdAt: string;
}

const CATEGORIES = [
  { id: "all", label: "전체" },
  { id: "gamedev", label: "#게임개발" },
  { id: "project", label: "#프로젝트" },
  { id: "devlog", label: "#개발일지" },
  { id: "daily", label: "#일상" },
  { id: "notice", label: "#공지" },
];

const HIGHLIGHTS = [
  { icon: "🎮", label: "Devlog" },
  { icon: "🌊", label: "Shader" },
  { icon: "🕹️", label: "Unity" },
  { icon: "☕", label: "Daily" },
  { icon: "✨", label: "Project" },
  { icon: "🌸", label: "SeonA" },
];

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"grid" | "feed">("grid");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [followed, setFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState(1284);

  // Active post for detail modal
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Record<number, boolean>>({});
  const [heartBurst, setHeartBurst] = useState<number | null>(null);

  // New post modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [newCategory, setNewCategory] = useState("gamedev");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comment input per post
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [modalCommentInput, setModalCommentInput] = useState("");
  const [commenterName, setCommenterName] = useState("");

  const userIdentifier = "visitor-" + (typeof window !== "undefined" ? window.localStorage.getItem("koharu_uid") || "guest" : "guest");

  useEffect(() => {
    if (typeof window !== "undefined" && !window.localStorage.getItem("koharu_uid")) {
      window.localStorage.setItem("koharu_uid", Math.random().toString(36).substring(2, 9));
    }
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch {
      toast.error("게시물을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentsForPost = async (postId: number) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => ({ ...prev, [postId]: data.comments || [] }));
      }
    } catch {
      // ignore
    }
  };

  const handleLike = async (post: Post, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCurrentlyLiked = likedPosts[post.id];

    // Optimistic UI update
    setLikedPosts((prev) => ({ ...prev, [post.id]: !isCurrentlyLiked }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likesCount: isCurrentlyLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1 }
          : p
      )
    );

    if (selectedPost && selectedPost.id === post.id) {
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              likesCount: isCurrentlyLiked ? Math.max(0, prev.likesCount - 1) : prev.likesCount + 1,
            }
          : null
      );
    }

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIdentifier }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, likesCount: data.likesCount } : p))
        );
      }
    } catch {
      // Revert if error
    }
  };

  const handleDoubleTap = (post: Post) => {
    setHeartBurst(post.id);
    if (!likedPosts[post.id]) {
      handleLike(post);
    }
    window.setTimeout(() => setHeartBurst(null), 800);
  };

  const handleAddComment = async (postId: number, content: string) => {
    if (!content.trim()) return;
    const author = commenterName.trim() || "익명 친구";

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: author,
          content: content.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => ({
          ...prev,
          [postId]: [data.comment, ...(prev[postId] || [])],
        }));
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
        setModalCommentInput("");
        toast.success("댓글을 등록했습니다! 🌸");
      }
    } catch {
      toast.error("댓글 등록에 실패했습니다.");
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaption.trim() || !newCoverUrl.trim()) {
      toast.error("사진 URL과 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    const slug = "post-" + Date.now().toString(36);
    const title = newTitle.trim() || newCaption.slice(0, 40) + "...";

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          caption: newCaption,
          coverUrl: newCoverUrl,
          category: newCategory,
        }),
      });

      if (res.ok) {
        toast.success("새 게시물이 인스타그램 피드에 등록되었습니다! ✨");
        setIsCreateOpen(false);
        setNewTitle("");
        setNewCaption("");
        setNewCoverUrl("");
        fetchPosts();
      } else {
        toast.error("게시물 등록에 실패했습니다.");
      }
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPostModal = (post: Post) => {
    setSelectedPost(post);
    fetchCommentsForPost(post.id);
  };

  const filteredPosts = posts.filter((p) => {
    if (activeCategory === "all") return true;
    return p.category === activeCategory;
  });

  return (
    <div className="min-h-screen">
      <SiteNav active="/blog.html" />

      <main className="page-container" id="main">
        {/* Instagram Profile Header */}
        <div className="glass-card insta-profile-header">
          <div className="insta-avatar-wrapper">
            <div className="insta-avatar-ring">
              <img
                src="/assets/koharu-profile.png"
                alt="! Koharu Profile"
                className="insta-avatar-img"
              />
            </div>
          </div>

          <div className="insta-info">
            <div className="insta-title-row">
              <h1 className="insta-username">
                koharu.live
                <svg className="insta-verified" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </h1>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFollowed(!followed);
                    setFollowerCount((prev) => (followed ? prev - 1 : prev + 1));
                    toast.success(followed ? "팔로우를 취소했습니다." : "koharu.live 님을 팔로우했습니다! 💕");
                  }}
                  className={`insta-action-btn ${followed ? "insta-btn-secondary" : "insta-btn-primary"}`}
                >
                  {followed ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> 팔로우 중
                    </>
                  ) : (
                    "팔로우"
                  )}
                </button>

                <a
                  href="mailto:admin@koharu.live"
                  className="insta-action-btn insta-btn-secondary"
                >
                  메시지
                </a>

                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="insta-action-btn insta-btn-primary !bg-gradient-to-r !from-purple-500 !to-pink-500"
                >
                  <PlusCircle className="w-4 h-4" /> 새 게시물
                </button>
              </div>
            </div>

            <div className="insta-stats">
              <div className="insta-stat-item">
                게시물 <strong>{posts.length}</strong>
              </div>
              <div className="insta-stat-item">
                팔로워 <strong>{followerCount.toLocaleString()}</strong>
              </div>
              <div className="insta-stat-item">
                팔로잉 <strong>42</strong>
              </div>
            </div>

            <div className="insta-bio">
              <strong>! Koharu | 코하루</strong><br />
              🎮 게임 프로그래머 · 인디 게임 & 커스텀 엔진 제작<br />
              🕹️ Unity / C# · HLSL Shader · TypeScript · Web<br />
              🌸 플레이되는 아이디어를 코드로 실체화하는 중<br />
              <a href="https://koharu.live" className="text-pink-600 font-bold hover:underline">
                🔗 koharu.live
              </a>
            </div>
          </div>
        </div>

        {/* Story Highlights */}
        <div className="insta-highlights">
          {HIGHLIGHTS.map((item) => (
            <div key={item.label} className="insta-highlight-item">
              <div className="insta-highlight-ring">
                <div className="insta-highlight-inner">
                  {item.icon}
                </div>
              </div>
              <span className="insta-highlight-label">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeCategory === cat.id
                  ? "bg-pink-600 text-white shadow-md shadow-pink-500/20"
                  : "bg-white/80 text-[#7a6e8f] hover:bg-white border border-pink-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* View Toggle Tabs */}
        <div className="insta-tabs">
          <button
            onClick={() => setActiveTab("grid")}
            className={`insta-tab-btn ${activeTab === "grid" ? "active" : ""}`}
          >
            <Grid className="w-4 h-4" /> 게시물 그리드
          </button>
          <button
            onClick={() => setActiveTab("feed")}
            className={`insta-tab-btn ${activeTab === "feed" ? "active" : ""}`}
          >
            <Layers className="w-4 h-4" /> 피드 스트림
          </button>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="text-center py-20 text-[#7a6e8f]">
            <Sparkles className="w-8 h-8 animate-spin mx-auto mb-3 text-pink-500" />
            인스타그램 피드를 불러오는 중...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 glass-card">
            <p className="text-base font-semibold text-[#7a6e8f]">아직 등록된 게시물이 없습니다.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 insta-action-btn insta-btn-primary"
            >
              첫 게시물 올리기
            </button>
          </div>
        ) : activeTab === "grid" ? (
          /* Instagram 3-Column Square Grid */
          <div className="insta-grid">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => openPostModal(post)}
                className="insta-grid-item group"
              >
                <img
                  src={post.coverUrl}
                  alt={post.title}
                  className="insta-grid-img"
                  loading="lazy"
                />

                {/* Multiple photos badge if carousel */}
                {post.images && post.images.length > 1 && (
                  <span className="absolute top-2.5 right-2.5 bg-black/60 text-white p-1 rounded-md text-xs">
                    <Layers className="w-3.5 h-3.5" />
                  </span>
                )}

                {/* Hover Dark Overlay with Stats */}
                <div className="insta-grid-overlay">
                  <div className="insta-overlay-stat">
                    <Heart className="w-5 h-5 fill-current" />
                    <span>{post.likesCount}</span>
                  </div>
                  <div className="insta-overlay-stat">
                    <MessageCircle className="w-5 h-5 fill-current" />
                    <span>{(comments[post.id] || []).length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Instagram Single Column Scroll Feed */
          <div className="insta-feed">
            {filteredPosts.map((post) => (
              <article key={post.id} className="insta-post-card">
                {/* Post Header */}
                <div className="insta-post-header">
                  <div className="insta-post-author">
                    <img
                      src="/assets/koharu-profile.png"
                      alt="koharu.live"
                      className="insta-post-author-img"
                    />
                    <div>
                      <div className="insta-post-author-name flex items-center gap-1.5">
                        koharu.live
                        <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                          {post.category}
                        </span>
                      </div>
                      <div className="insta-post-time">
                        {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                      </div>
                    </div>
                  </div>

                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Post Media with Double-Click Heart */}
                <div
                  className="insta-post-media"
                  onDoubleClick={() => handleDoubleTap(post)}
                >
                  <img
                    src={post.coverUrl}
                    alt={post.title}
                    className="insta-post-img"
                  />
                  {heartBurst === post.id && (
                    <div className="insta-heart-burst">
                      ❤️
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="insta-post-actions">
                  <div className="insta-action-group">
                    <button
                      onClick={(e) => handleLike(post, e)}
                      className={`insta-icon-btn ${likedPosts[post.id] ? "is-liked" : ""}`}
                      aria-label="좋아요"
                    >
                      <Heart
                        className={`w-6 h-6 ${likedPosts[post.id] ? "fill-[#ff3040] text-[#ff3040]" : ""}`}
                      />
                    </button>
                    <button
                      onClick={() => openPostModal(post)}
                      className="insta-icon-btn"
                      aria-label="댓글"
                    >
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(`${window.location.origin}/blog/${post.slug}.html`);
                          toast.success("게시물 링크를 복사했습니다! 🔗");
                        }
                      }}
                      className="insta-icon-btn"
                      aria-label="공유"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setBookmarkedPosts((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
                      toast.success(bookmarkedPosts[post.id] ? "저장을 취소했습니다." : "게시물을 저장했습니다! 🔖");
                    }}
                    className="insta-icon-btn"
                    aria-label="저장"
                  >
                    <Bookmark
                      className={`w-5 h-5 ${bookmarkedPosts[post.id] ? "fill-current text-pink-600" : ""}`}
                    />
                  </button>
                </div>

                {/* Post Body & Caption */}
                <div className="insta-post-body">
                  <div className="insta-likes-count">
                    좋아요 {post.likesCount}개
                  </div>

                  <div className="insta-caption whitespace-pre-line">
                    <strong>koharu.live</strong>
                    {post.caption}
                  </div>

                  {/* Comments Preview */}
                  <div className="insta-comments-preview">
                    {(comments[post.id] || []).length > 0 ? (
                      <>
                        <button
                          onClick={() => openPostModal(post)}
                          className="insta-view-comments-btn"
                        >
                          댓글 {(comments[post.id] || []).length}개 모두 보기
                        </button>
                        {(comments[post.id] || []).slice(0, 2).map((c) => (
                          <div key={c.id} className="insta-comment-item">
                            <strong>{c.authorName}</strong>
                            <span>{c.content}</span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <button
                        onClick={() => openPostModal(post)}
                        className="insta-view-comments-btn"
                      >
                        댓글 남기기...
                      </button>
                    )}
                  </div>

                  {/* Add Comment Row */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddComment(post.id, commentInputs[post.id] || "");
                    }}
                    className="insta-add-comment-row"
                  >
                    <input
                      type="text"
                      placeholder="칭찬이나 댓글을 남겨보세요..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      className="insta-comment-input"
                    />
                    <button
                      type="submit"
                      disabled={!(commentInputs[post.id] || "").trim()}
                      className="insta-comment-submit"
                    >
                      게시
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Post Detail Modal (Instagram Split View) */}
        {selectedPost && (
          <div
            className="insta-modal-backdrop"
            onClick={() => setSelectedPost(null)}
          >
            <div
              className="insta-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Column: Media */}
              <div className="insta-modal-left">
                <img src={selectedPost.coverUrl} alt={selectedPost.title} />
              </div>

              {/* Right Column: Comments & Caption */}
              <div className="insta-modal-right">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-pink-100">
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/koharu-profile.png"
                      alt="koharu.live"
                      className="w-9 h-9 rounded-full object-cover border border-pink-300"
                    />
                    <div>
                      <div className="font-bold text-sm text-[#38314a]">koharu.live</div>
                      <div className="text-[11px] text-[#7a6e8f]">{selectedPost.category}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="text-gray-400 hover:text-gray-700 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Comments Scrollable Area */}
                <div className="insta-modal-comments-scroll space-y-4">
                  {/* Caption item */}
                  <div className="flex gap-3 text-sm">
                    <img
                      src="/assets/koharu-profile.png"
                      alt=""
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div>
                      <div className="leading-relaxed whitespace-pre-line">
                        <strong className="mr-2">koharu.live</strong>
                        {selectedPost.caption}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        {new Date(selectedPost.createdAt).toLocaleDateString("ko-KR")}
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-pink-100/60 my-2" />

                  {/* Visitor Comments */}
                  {(comments[selectedPost.id] || []).map((comment) => (
                    <div key={comment.id} className="flex gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center font-bold text-xs text-pink-600 flex-shrink-0">
                        {comment.authorName[0]}
                      </div>
                      <div>
                        <div>
                          <strong className="mr-2">{comment.authorName}</strong>
                          <span>{comment.content}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {new Date(comment.createdAt).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions & Add Comment Form */}
                <div className="p-4 border-t border-pink-100 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(selectedPost)}
                        className={`insta-icon-btn ${likedPosts[selectedPost.id] ? "is-liked" : ""}`}
                      >
                        <Heart
                          className={`w-6 h-6 ${likedPosts[selectedPost.id] ? "fill-[#ff3040] text-[#ff3040]" : ""}`}
                        />
                      </button>
                      <button
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(`${window.location.origin}/blog/${selectedPost.slug}.html`);
                            toast.success("게시물 링크를 복사했습니다! 🔗");
                          }
                        }}
                        className="insta-icon-btn"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-xs font-bold text-[#38314a]">
                      좋아요 {selectedPost.likesCount}개
                    </div>
                  </div>

                  {/* Nickname input + comment form */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="작성자 닉네임 (기본: 익명 친구)"
                      value={commenterName}
                      onChange={(e) => setCommenterName(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-pink-50/50 border border-pink-100 outline-none"
                    />
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddComment(selectedPost.id, modalCommentInput);
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        placeholder="댓글 달기..."
                        value={modalCommentInput}
                        onChange={(e) => setModalCommentInput(e.target.value)}
                        className="flex-1 text-sm bg-transparent border-none outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!modalCommentInput.trim()}
                        className="text-pink-600 font-bold text-sm disabled:opacity-40"
                      >
                        게시
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Post Modal (Instagram Style) */}
        {isCreateOpen && (
          <div
            className="insta-modal-backdrop"
            onClick={() => setIsCreateOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-pink-100 mb-4">
                <h3 className="text-lg font-bold text-[#c93b77] flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" /> 새 게시물 만들기
                </h3>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="text-gray-400 hover:text-gray-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                    사진 URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/... 또는 이미지 URL"
                    value={newCoverUrl}
                    onChange={(e) => setNewCoverUrl(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-pink-200 focus:border-pink-500 outline-none bg-pink-50/30"
                  />
                  {newCoverUrl && (
                    <div className="mt-2 w-full h-36 rounded-xl overflow-hidden border border-pink-100">
                      <img src={newCoverUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                    게시물 제목
                  </label>
                  <input
                    type="text"
                    placeholder="예: 새로운 셰이더 프로토타입 완성!"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-pink-200 focus:border-pink-500 outline-none bg-pink-50/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                    문구 및 해시태그 (Caption)
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="사진과 함께 공유할 이야기를 들려주세요...&#10;#Unity #GameDev #Shader"
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-pink-200 focus:border-pink-500 outline-none bg-pink-50/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                    카테고리
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-pink-200 outline-none bg-white font-medium text-[#38314a]"
                  >
                    <option value="gamedev">게임개발 (#gamedev)</option>
                    <option value="project">프로젝트 (#project)</option>
                    <option value="devlog">개발일지 (#devlog)</option>
                    <option value="daily">일상 (#daily)</option>
                    <option value="notice">공지사항 (#notice)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="insta-action-btn insta-btn-secondary"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="insta-action-btn insta-btn-primary"
                  >
                    {isSubmitting ? "공유하는 중..." : "피드에 공유하기 ✨"}
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
