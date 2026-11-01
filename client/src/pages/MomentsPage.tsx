import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import {
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ExternalLink,
  Globe,
  Grid,
  Heart,
  Layers,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  MoreVertical,
  PlusCircle,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  Tag,
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
  ProfileData,
} from "@/lib/remoteDb";

const DEFAULT_PROFILE: ProfileData = {
  username: "koharu.live",
  name: "! Koharu · 코하루",
  bio: "🎮 게임 프로그래머 · 인디 게임 & 커스텀 엔진 제작\n🕹️ Unity / C# · HLSL Shader · TypeScript · Web\n🌸 플레이되는 아이디어를 코드로 실체화하는 중",
  avatarUrl: "/assets/koharu-profile.png",
  bannerUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1400&q=80",
  birthdate: "2004. 12. 04",
  githubUrl: "https://github.com/Workshop-Koharu",
  instagramUrl: "https://instagram.com/koharu.live",
  email: "admin@koharu.live",
  websiteUrl: "https://koharu.live",
};

export default function MomentsPage() {
  const { user, loginWithGoogle, logout, isAdmin } = useAppAuth();
  const [, postRoute] = useRoute<{ slug: string }>("/moments/:slug");
  const [, instaRoute] = useRoute<{ slug: string }>("/instagram/:slug");

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);

  const [activeTab, setActiveTab] = useState<"grid" | "feed">("grid");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Comments for selected post
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // Create post modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createCaption, setCreateCaption] = useState("");
  const [createCoverUrl, setCreateCoverUrl] = useState("");
  const [createCategory, setCreateCategory] = useState("일상");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit profile modal state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileData>(DEFAULT_PROFILE);

  // Google Login Modal state (if user tries to access features without google sign-in)
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState("");
  const [googleNameInput, setGoogleNameInput] = useState("");

  // Post liked states
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadProfile();
    loadPosts();
  }, []);

  // Handle URL post param or route slug
  useEffect(() => {
    const slug = postRoute?.slug || instaRoute?.slug;
    if (slug && posts.length > 0) {
      const match = posts.find((p) => p.slug === slug || String(p.id) === slug);
      if (match) {
        openPostModal(match);
      }
    }
  }, [postRoute?.slug, instaRoute?.slug, posts]);

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        if (data?.profile) {
          setProfile(data.profile);
          setProfileForm(data.profile);
        }
      }
    } catch {}
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchAllPosts("moment");
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openPostModal = async (post: Post) => {
    setSelectedPost(post);
    setLoadingComments(true);
    try {
      const list = await fetchComments(post.id);
      setComments(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const closePostModal = () => {
    setSelectedPost(null);
    setComments([]);
    setEditingCommentId(null);
  };

  // Google Login requirement guard
  const requireGoogleAuth = (actionName: string = "이 기능"): boolean => {
    if (!user) {
      toast.error(`코하루 모먼트를 이용하려면 구글 로그인이 필요합니다. 🔒`);
      setIsGoogleModalOpen(true);
      return false;
    }
    return true;
  };

  const handleCustomGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmailInput.trim()) {
      toast.error("이메일 주소를 입력해주세요.");
      return;
    }
    const email = googleEmailInput.trim();
    const name = googleNameInput.trim() || email.split("@")[0];
    const success = await loginWithGoogle({
      id: `google-${Math.random().toString(36).slice(2, 10)}`,
      email,
      name,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    });
    if (success) {
      setIsGoogleModalOpen(false);
      setGoogleEmailInput("");
      setGoogleNameInput("");
    }
  };

  // Like handler
  const handleLike = async (post: Post) => {
    if (!requireGoogleAuth("좋아요를 누르려면")) return;

    const userIdentifier = user?.openId || user?.email || "anonymous";
    try {
      const result = await togglePostReaction(post.id, userIdentifier, "like");
      setLikedPosts((prev) => ({ ...prev, [post.id]: result.liked }));
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, likesCount: result.likesCount } : p))
      );
      if (selectedPost && selectedPost.id === post.id) {
        setSelectedPost((prev) => (prev ? { ...prev, likesCount: result.likesCount } : null));
      }
      if (result.liked) toast.success("좋아요를 눌렀습니다! ❤️");
    } catch {
      toast.error("좋아요 처리에 실패했습니다.");
    }
  };

  // Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireGoogleAuth("게시글을 작성하려면")) return;
    if (!createCaption.trim() && !createCoverUrl.trim()) {
      toast.error("내용 또는 사진 링크를 입력해주세요!");
      return;
    }

    setIsSubmitting(true);
    try {
      const newPost = await createNewPost({
        slug: `moment-${Date.now()}`,
        title: createCaption.slice(0, 30) || "코하루 모먼트",
        caption: createCaption.trim(),
        coverUrl: createCoverUrl.trim() || "/assets/koharu-profile.png",
        category: createCategory,
        authorName: user?.name || profile.name,
        authorAvatar: user?.avatar || profile.avatarUrl,
      });

      if (newPost) {
        toast.success("새로운 모먼트가 게시되었습니다! ✨");
        setIsCreateOpen(false);
        setCreateCaption("");
        setCreateCoverUrl("");
        loadPosts();
      } else {
        toast.error("게시물 업로드에 실패했습니다.");
      }
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Post (Strict Permission: Author or Admin only)
  const handleDeletePost = async (postId: number) => {
    if (!requireGoogleAuth()) return;
    if (!window.confirm("이 모먼트 게시물을 삭제하시겠습니까?")) return;

    try {
      const success = await deletePost(postId, {
        userOpenId: user?.openId,
        isAdmin,
      });

      if (success) {
        toast.success("게시물이 삭제되었습니다. 🗑️");
        closePostModal();
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        toast.error("본인이 작성한 글만 삭제할 수 있습니다!");
      }
    } catch {
      toast.error("삭제 처리 중 오류가 발생했습니다.");
    }
  };

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireGoogleAuth("댓글을 작성하려면")) return;
    if (!selectedPost || !commentInput.trim()) return;

    try {
      const newComment = await addComment(
        selectedPost.id,
        user?.name || "방문자",
        user?.avatar || "/assets/koharu-profile.png",
        commentInput.trim(),
        user?.openId
      );

      if (newComment) {
        setComments((prev) => [newComment, ...prev]);
        setCommentInput("");
        toast.success("댓글이 등록되었습니다! 💬");
      }
    } catch {
      toast.error("댓글 작성에 실패했습니다.");
    }
  };

  // Edit Comment (Strict Author only)
  const handleEditComment = async (commentId: number) => {
    if (!requireGoogleAuth()) return;
    if (!editingCommentText.trim()) return;

    try {
      const updated = await updateComment(commentId, editingCommentText.trim(), {
        userOpenId: user?.openId,
        isAdmin,
      });

      if (updated) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, content: updated.content } : c))
        );
        setEditingCommentId(null);
        setEditingCommentText("");
        toast.success("댓글이 수정되었습니다! ✏️");
      } else {
        toast.error("본인이 작성한 댓글만 수정할 수 있습니다.");
      }
    } catch {
      toast.error("댓글 수정에 실패했습니다.");
    }
  };

  // Delete Comment (Strict Author or Admin only)
  const handleDeleteComment = async (comment: Comment) => {
    if (!requireGoogleAuth()) return;
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      const ok = await deleteComment(comment.id, {
        userOpenId: user?.openId,
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

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("프로필 설정 변경은 관리자 계정만 가능합니다.");
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setIsEditProfileOpen(false);
        toast.success("프로필 정보가 저장되었습니다! 🌸");
      }
    } catch {
      toast.error("저장에 실패했습니다.");
    }
  };

  // Filter tags
  const tags = Array.from(new Set(posts.map((p) => p.category))).filter(Boolean);
  const filteredPosts =
    activeTag === "all" ? posts : posts.filter((p) => p.category === activeTag);

  return (
    <div className="min-h-screen pb-20">
      <SiteNav active="/moments" />

      <main className="page-container max-w-5xl mx-auto px-4 pt-4" id="main">
        {/* Top Profile Header Card */}
        <section className="glass-card !p-6 sm:!p-8 mb-8 border border-pink-100 shadow-xl rounded-3xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Story Highlight Ring Profile Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-lg shadow-pink-500/20">
                <img
                  src={profile.avatarUrl || "/assets/koharu-profile.png"}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover border-2 border-white bg-white"
                />
              </div>
              <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold" title="온라인 상태">
                ✓
              </span>
            </div>

            {/* Profile Info & Actions */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#38314a] flex items-center gap-2 justify-center sm:justify-start">
                    {profile.name}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold shadow-xs">
                      Moments
                    </span>
                  </h1>
                  <p className="text-xs font-semibold text-pink-600 mt-0.5">@{profile.username}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {user ? (
                    <button
                      onClick={logout}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-xs font-bold text-gray-600 border border-pink-200 transition cursor-pointer shadow-xs"
                    >
                      <LogOut className="w-3.5 h-3.5" /> 로그아웃
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsGoogleModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-pink-50 text-xs font-bold text-[#38314a] border border-pink-200 shadow-sm transition cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5 text-pink-500" /> Google 로그인
                    </button>
                  )}

                  <QRButton url={`${window.location.origin}/moments`} label={`@${profile.username}`} />

                  {isAdmin && (
                    <button
                      onClick={() => setIsEditProfileOpen(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-pink-50 text-xs font-bold text-pink-600 border border-pink-200 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> 프로필 수정
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (requireGoogleAuth("새 글을 작성하려면")) {
                        setIsCreateOpen(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white text-xs font-bold shadow-md shadow-pink-500/25 transition cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" /> 새 모먼트
                  </button>
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs sm:text-sm text-[#4a3952] leading-relaxed whitespace-pre-line max-w-2xl break-keep">
                {profile.bio}
              </p>

              {/* Stats Bar */}
              <div className="flex items-center justify-center sm:justify-start gap-6 pt-1 text-xs">
                <div>
                  <span className="font-extrabold text-[#38314a] text-sm">{posts.length}</span>{" "}
                  <span className="text-[#7a6e8f]">게시물</span>
                </div>
                <div>
                  <span className="font-extrabold text-[#38314a] text-sm">
                    {posts.reduce((acc, cur) => acc + (cur.likesCount || 0), 0)}
                  </span>{" "}
                  <span className="text-[#7a6e8f]">총 좋아요</span>
                </div>
                {profile.birthdate && (
                  <div className="text-[#7a6e8f] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-pink-500" />
                    <span>{profile.birthdate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Tag Filters & View Mode */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          {/* Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTag("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTag === "all"
                  ? "bg-pink-600 text-white shadow-md shadow-pink-500/20"
                  : "bg-white/80 text-[#7a6e8f] hover:bg-white border border-pink-100"
              }`}
            >
              전체 ({posts.length})
            </button>
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTag(t)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  activeTag === t
                    ? "bg-pink-600 text-white shadow-md shadow-pink-500/20"
                    : "bg-white/80 text-[#7a6e8f] hover:bg-white border border-pink-100"
                }`}
              >
                #{t}
              </button>
            ))}
          </div>

          {/* View Toggles & Refresh */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-2xl bg-white/80 border border-pink-200">
              <button
                onClick={() => setActiveTab("grid")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  activeTab === "grid" ? "bg-pink-500 text-white shadow-xs" : "text-[#7a6e8f] hover:text-pink-600"
                }`}
              >
                <Grid className="w-3.5 h-3.5" /> 그리드
              </button>
              <button
                onClick={() => setActiveTab("feed")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  activeTab === "feed" ? "bg-pink-500 text-white shadow-xs" : "text-[#7a6e8f] hover:text-pink-600"
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> 피드
              </button>
            </div>
            <button
              onClick={loadPosts}
              disabled={loading}
              className="p-2 rounded-2xl bg-white/80 hover:bg-white border border-pink-200 text-pink-500 shadow-sm transition cursor-pointer disabled:opacity-50"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Content Display */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 mx-auto border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin mb-3" />
            <p className="text-sm font-bold text-[#7a6e8f]">모먼트를 불러오는 중... 🌸</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="glass-card text-center py-20 max-w-md mx-auto !p-8">
            <div className="w-16 h-16 rounded-3xl bg-pink-100 text-pink-500 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#38314a] mb-1">등록된 모먼트가 없습니다</h3>
            <p className="text-xs text-[#7a6e8f] mb-6">첫 번째 사진과 일상을 남겨보세요!</p>
            <button
              onClick={() => {
                if (requireGoogleAuth()) setIsCreateOpen(true);
              }}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold shadow-md shadow-pink-500/20 cursor-pointer"
            >
              모먼트 작성하기
            </button>
          </div>
        ) : activeTab === "grid" ? (
          /* Grid View (Instagram 3-column / 2-column on mobile) */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => openPostModal(post)}
                className="group relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-pink-50 cursor-pointer border border-pink-100 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <img
                  src={post.coverUrl}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                  <p className="text-xs font-bold line-clamp-2 mb-2">{post.caption || post.title}</p>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400" /> {post.likesCount || 0}
                    </span>
                    <span className="text-[10px] bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full">
                      #{post.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Feed View (Single column feed with cards) */
          <div className="max-w-xl mx-auto space-y-6">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="glass-card !p-0 overflow-hidden rounded-3xl border border-pink-100 shadow-lg"
              >
                {/* Author Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorAvatar || "/assets/koharu-profile.png"}
                      alt={post.authorName}
                      className="w-9 h-9 rounded-full object-cover border border-pink-200"
                    />
                    <div>
                      <div className="font-extrabold text-xs text-[#38314a]">{post.authorName}</div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString("ko-KR")} · #{post.category}
                      </div>
                    </div>
                  </div>
                  <QRButton url={`${window.location.origin}/moments?post=${post.slug}`} label={post.title} />
                </div>

                {/* Photo */}
                <div
                  className="relative aspect-square sm:aspect-[4/3] bg-black/5 overflow-hidden cursor-pointer"
                  onClick={() => openPostModal(post)}
                >
                  <img
                    src={post.coverUrl}
                    alt={post.title}
                    className="w-full h-full object-cover hover:scale-102 transition duration-300"
                  />
                </div>

                {/* Actions & Caption */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLike(post)}
                        className="p-1 text-gray-600 hover:text-red-500 transition cursor-pointer"
                      >
                        <Heart
                          className={`w-5 h-5 ${likedPosts[post.id] ? "fill-red-500 text-red-500" : ""}`}
                        />
                      </button>
                      <button
                        onClick={() => openPostModal(post)}
                        className="p-1 text-gray-600 hover:text-pink-600 transition cursor-pointer"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/moments?post=${post.slug}`);
                          toast.success("링크가 복사되었습니다! 🔗");
                        }}
                        className="p-1 text-gray-600 hover:text-pink-600 transition cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-xs font-bold text-[#38314a]">좋아요 {post.likesCount || 0}개</span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#4a3952] leading-relaxed whitespace-pre-line">
                    <span className="font-extrabold mr-2 text-[#38314a]">{post.authorName}</span>
                    {post.caption}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ── Post Detail Modal ─────────────────────────────────────────── */}
        {selectedPost && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200"
            onClick={closePostModal}
          >
            <div
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-pink-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left: Big Image */}
              <div className="md:w-1/2 bg-black flex items-center justify-center relative min-h-[280px]">
                <img
                  src={selectedPost.coverUrl}
                  alt={selectedPost.title}
                  className="max-h-[60vh] md:max-h-[85vh] w-full object-contain"
                />
              </div>

              {/* Right: Info, Comments, Actions */}
              <div className="md:w-1/2 flex flex-col h-full max-h-[60vh] md:max-h-[85vh] bg-white">
                {/* Header */}
                <div className="p-4 border-b border-pink-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedPost.authorAvatar || "/assets/koharu-profile.png"}
                      alt={selectedPost.authorName}
                      className="w-9 h-9 rounded-full object-cover border border-pink-200"
                    />
                    <div>
                      <div className="font-extrabold text-sm text-[#38314a]">{selectedPost.authorName}</div>
                      <div className="text-[10px] text-gray-400">#{selectedPost.category}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* STRICT DELETE PERMISSION: Owner or Admin only */}
                    {user && (user.openId === selectedPost.authorOpenId || isAdmin) && (
                      <button
                        onClick={() => handleDeletePost(selectedPost.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                        title="게시물 삭제 (작성자/관리자 전용)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={closePostModal}
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Caption & Comments Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Post Caption */}
                  <div className="flex items-start gap-3 pb-3 border-b border-pink-50">
                    <img
                      src={selectedPost.authorAvatar || "/assets/koharu-profile.png"}
                      alt={selectedPost.authorName}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="text-xs leading-relaxed text-[#4a3952]">
                      <span className="font-extrabold mr-1.5 text-[#38314a]">{selectedPost.authorName}</span>
                      {selectedPost.caption}
                      <div className="text-[10px] text-gray-400 mt-1">
                        {new Date(selectedPost.createdAt).toLocaleString("ko-KR")}
                      </div>
                    </div>
                  </div>

                  {/* Comments list */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-[#7a6e8f]">댓글 ({comments.length})</div>
                    {loadingComments ? (
                      <p className="text-xs text-center py-4 text-gray-400">댓글을 불러오는 중...</p>
                    ) : comments.length === 0 ? (
                      <p className="text-xs text-center py-4 text-gray-400">첫 댓글을 남겨보세요! 🌸</p>
                    ) : (
                      comments.map((c) => {
                        const isCommentAuthor = user && user.openId && c.authorOpenId === user.openId;
                        const canDelete = isCommentAuthor || isAdmin;

                        return (
                          <div key={c.id} className="flex items-start justify-between gap-2 text-xs group">
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <img
                                src={c.authorAvatar || "/assets/koharu-profile.png"}
                                alt={c.authorName}
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                {editingCommentId === c.id ? (
                                  <div className="space-y-1 mt-1">
                                    <input
                                      type="text"
                                      value={editingCommentText}
                                      onChange={(e) => setEditingCommentText(e.target.value)}
                                      className="w-full text-xs p-1.5 rounded-lg border border-pink-300 focus:outline-hidden"
                                    />
                                    <div className="flex gap-1 justify-end">
                                      <button
                                        onClick={() => setEditingCommentId(null)}
                                        className="text-[10px] text-gray-400 px-2 py-0.5"
                                      >
                                        취소
                                      </button>
                                      <button
                                        onClick={() => handleEditComment(c.id)}
                                        className="text-[10px] bg-pink-600 text-white font-bold px-2 py-0.5 rounded"
                                      >
                                        저장
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <span className="font-extrabold mr-1 text-[#38314a]">{c.authorName}</span>
                                    <span className="text-[#4a3952] break-words">{c.content}</span>
                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                      {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Comment Action Buttons (Strictly checked) */}
                            {canDelete && editingCommentId !== c.id && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isCommentAuthor && (
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(c.id);
                                      setEditingCommentText(c.content);
                                    }}
                                    className="p-1 text-gray-400 hover:text-pink-600 transition"
                                    title="댓글 수정"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteComment(c)}
                                  className="p-1 text-gray-400 hover:text-red-500 transition"
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
                </div>

                {/* Footer Input & Actions */}
                <div className="p-4 border-t border-pink-100 bg-pink-50/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLike(selectedPost)}
                        className="p-1 text-gray-600 hover:text-red-500 transition cursor-pointer"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            likedPosts[selectedPost.id] ? "fill-red-500 text-red-500" : ""
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/moments?post=${selectedPost.slug}`
                          );
                          toast.success("링크가 복사되었습니다! 🔗");
                        }}
                        className="p-1 text-gray-600 hover:text-pink-600 transition cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <QRButton
                        url={`${window.location.origin}/moments?post=${selectedPost.slug}`}
                        label={selectedPost.title}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#38314a]">
                      좋아요 {selectedPost.likesCount || 0}개
                    </span>
                  </div>

                  {/* Add Comment Input */}
                  <form onSubmit={handleAddComment} className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder={
                        user
                          ? `${user.name}님으로 댓글 작성...`
                          : "Google 로그인 후 댓글을 작성할 수 있습니다..."
                      }
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onClick={() => !user && setIsGoogleModalOpen(true)}
                      className="flex-1 text-xs px-3 py-2 rounded-xl bg-white border border-pink-200 focus:outline-hidden focus:border-pink-500"
                    />
                    <button
                      type="submit"
                      disabled={!commentInput.trim()}
                      className="px-3 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Create Post Modal ─────────────────────────────────────────── */}
        {isCreateOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={() => setIsCreateOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-pink-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-pink-100 mb-4">
                <h3 className="text-lg font-extrabold text-[#38314a] flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-pink-500" /> 새 모먼트 만들기
                </h3>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#38314a] mb-1">
                    사진 이미지 URL (필수)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... 또는 이미지 링크"
                    value={createCoverUrl}
                    onChange={(e) => setCreateCoverUrl(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-pink-200 focus:outline-hidden focus:border-pink-500"
                  />
                  {createCoverUrl && (
                    <div className="mt-2 aspect-video rounded-xl overflow-hidden bg-gray-50 border border-pink-100">
                      <img src={createCoverUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#38314a] mb-1">카테고리 / 태그</label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-pink-200 focus:outline-hidden"
                  >
                    <option value="일상">#일상</option>
                    <option value="개발일지">#개발일지</option>
                    <option value="작업물">#작업물</option>
                    <option value="생각">#생각</option>
                    <option value="게임">#게임</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#38314a] mb-1">
                    캡션 / 설명글 (자유롭게 작성)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="오늘 있었던 일이나 소식을 남겨보세요 🌸"
                    value={createCaption}
                    onChange={(e) => setCreateCaption(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-pink-200 focus:outline-hidden focus:border-pink-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-[#38314a] font-bold text-xs hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md shadow-pink-500/25 hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmitting ? "게시 중..." : "모먼트 등록"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Edit Profile Modal (Admin only) ────────────────────────────── */}
        {isEditProfileOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={() => setIsEditProfileOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-pink-100 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-pink-100 mb-4">
                <h3 className="text-lg font-extrabold text-[#38314a] flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-pink-500" /> 프로필 세팅 수정
                </h3>
                <button
                  onClick={() => setIsEditProfileOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[#38314a] mb-1">이름</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pink-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#38314a] mb-1">핸들 (@아이디)</label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pink-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#38314a] mb-1">아바타 이미지 URL</label>
                  <input
                    type="text"
                    value={profileForm.avatarUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pink-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#38314a] mb-1">소개글 (Bio)</label>
                  <textarea
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pink-200 resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditProfileOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-gray-100 font-bold"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-pink-600 text-white font-bold shadow-md"
                  >
                    저장하기
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Google Login Modal ────────────────────────────────────────── */}
        {isGoogleModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={() => setIsGoogleModalOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-pink-100 text-center animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-pink-500/25">
                <Camera className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-extrabold text-[#38314a] mb-1">코하루 모먼트 로그인</h3>
              <p className="text-xs text-[#7a6e8f] mb-5">
                모먼트 피드를 둘러보고 좋아요나 댓글을 남기려면 Google 계정 로그인이 필요합니다 🌸
              </p>

              <form onSubmit={handleCustomGoogleLogin} className="space-y-3 text-left">
                <div>
                  <label className="block text-[11px] font-bold text-[#38314a] mb-1">
                    Google 계정 이메일
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-pink-200 focus:outline-hidden focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#38314a] mb-1">닉네임 / 표시 이름</label>
                  <input
                    type="text"
                    placeholder="코하루 팬"
                    value={googleNameInput}
                    onChange={(e) => setGoogleNameInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-pink-200 focus:outline-hidden focus:border-pink-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-pink-500/25 transition cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <LogIn className="w-4 h-4" /> Google 계정으로 계속하기
                </button>
              </form>

              <button
                onClick={() => setIsGoogleModalOpen(false)}
                className="mt-3 text-xs text-gray-400 hover:text-gray-600 font-semibold"
              >
                나중에 하기
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
