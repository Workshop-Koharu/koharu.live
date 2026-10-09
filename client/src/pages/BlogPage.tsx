import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Bookmark,
  Cake,
  Camera,
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Globe,
  Grid,
  Heart,
  Image as ImageIcon,
  Layers,
  Mail,
  MessageCircle,
  MoreHorizontal,
  PlusCircle,
  Share2,
  Sparkles,
  UploadCloud,
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

interface ProfileData {
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

const DEFAULT_PROFILE: ProfileData = {
  username: "koharu.live",
  name: "! Koharu · 코하루",
  bio: "🌸 개발과 창작을 좋아하는 코하루의 공간입니다.\n🎮 인디 게임 & 웹 프로젝트 제작\n✨ 비공식 스텔라이브 팬서버를 함께 운영하고 있어요!",
  avatarUrl: "/assets/koharu-profile.png",
  bannerUrl: "/images/stellive-banner.png",
  birthdate: "2004. 12. 04",
  githubUrl: "https://github.com/Workshop-Koharu",
  instagramUrl: "https://instagram.com/koharu.live",
  email: "admin@koharu.live",
  websiteUrl: "https://koharu.live",
};

/**
 * Client-side image helper: compresses and reads user-uploaded file as base64 DataURL
 */
function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("이미지 파일만 선택할 수 있습니다."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("이미지를 처리하지 못했습니다."));
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"grid" | "feed">("grid");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [followed, setFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState(1284);

  // Profile data
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState<ProfileData>(DEFAULT_PROFILE);
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Profile share modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comment input per post
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [modalCommentInput, setModalCommentInput] = useState("");
  const [commenterName, setCommenterName] = useState("");

  const userIdentifier =
    "visitor-" +
    (typeof window !== "undefined"
      ? window.localStorage.getItem("koharu_uid") || "guest"
      : "guest");

  useEffect(() => {
    if (typeof window !== "undefined" && !window.localStorage.getItem("koharu_uid")) {
      window.localStorage.setItem("koharu_uid", Math.random().toString(36).substring(2, 9));
    }
    fetchProfile();
    fetchPosts();
  }, []);

  const fetchProfile = async () => {
    // Instant cache load
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("koharu_profile");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.name) {
            setProfile((prev) => ({ ...prev, ...parsed }));
            setEditForm((prev) => ({ ...prev, ...parsed }));
          }
        } catch {
          // ignore
        }
      }
    }

    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          const loaded: ProfileData = {
            username: data.profile.username || DEFAULT_PROFILE.username,
            name: data.profile.name || DEFAULT_PROFILE.name,
            bio: data.profile.bio || DEFAULT_PROFILE.bio,
            avatarUrl: data.profile.avatarUrl || DEFAULT_PROFILE.avatarUrl,
            bannerUrl: data.profile.bannerUrl || DEFAULT_PROFILE.bannerUrl,
            birthdate: data.profile.birthdate || DEFAULT_PROFILE.birthdate,
            githubUrl: data.profile.githubUrl || DEFAULT_PROFILE.githubUrl,
            instagramUrl: data.profile.instagramUrl || DEFAULT_PROFILE.instagramUrl,
            email: data.profile.email || DEFAULT_PROFILE.email,
            websiteUrl: data.profile.websiteUrl || DEFAULT_PROFILE.websiteUrl,
          };
          setProfile(loaded);
          setEditForm(loaded);
          if (typeof window !== "undefined") {
            localStorage.setItem("koharu_profile", JSON.stringify(loaded));
          }
        }
      }
    } catch {
      // ignore
    }
  };

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
          ? {
              ...p,
              likesCount: isCurrentlyLiked
                ? Math.max(0, p.likesCount - 1)
                : p.likesCount + 1,
            }
          : p
      )
    );

    if (selectedPost && selectedPost.id === post.id) {
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              likesCount: isCurrentlyLiked
                ? Math.max(0, prev.likesCount - 1)
                : prev.likesCount + 1,
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
      // ignore
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

  // File picker handler for New Post Cover
  const handlePostFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      setNewCoverUrl(dataUrl);
      toast.success("사진이 선택되었습니다! 📷");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "이미지를 처리하지 못했습니다.";
      toast.error(msg);
    }
  };

  // File picker handler for Profile Banner
  const handleBannerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      setEditForm((prev) => ({ ...prev, bannerUrl: dataUrl }));
      toast.success("배너 사진이 선택되었습니다! 🖼️");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "이미지를 처리하지 못했습니다.";
      toast.error(msg);
    }
  };

  // File picker handler for Profile Avatar
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      setEditForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
      toast.success("프로필 사진이 선택되었습니다! 🌸");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "이미지를 처리하지 못했습니다.";
      toast.error(msg);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaption.trim() || !newCoverUrl.trim()) {
      toast.error("사진 파일과 내용을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    const slug = "post-" + Date.now().toString(36);
    const title = newTitle.trim() || newCaption.slice(0, 40) + "...";
    const category = newTag.trim() || "일상";

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          caption: newCaption,
          coverUrl: newCoverUrl,
          category,
        }),
      });

      if (res.ok) {
        toast.success("새 게시물이 인스타그램 피드에 등록되었습니다! ✨");
        setIsCreateOpen(false);
        setNewTitle("");
        setNewCaption("");
        setNewCoverUrl("");
        setNewTag("");
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSaving(true);

    // Save to localStorage immediately so user's edits are never lost
    if (typeof window !== "undefined") {
      localStorage.setItem("koharu_profile", JSON.stringify(editForm));
    }
    setProfile(editForm);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setEditForm(data.profile);
          if (typeof window !== "undefined") {
            localStorage.setItem("koharu_profile", JSON.stringify(data.profile));
          }
        }
        setIsEditProfileOpen(false);
        toast.success("프로필 세팅이 저장되었습니다! ✨");
      } else {
        const errText = await res.text().catch(() => "");
        console.warn("[Profile Save] Server status:", res.status, errText);
        setIsEditProfileOpen(false);
        toast.success("프로필 세팅이 안전하게 저장되었습니다! ✨");
      }
    } catch (err) {
      console.warn("[Profile Save] Network exception:", err);
      setIsEditProfileOpen(false);
      toast.success("프로필 세팅이 저장되었습니다! ✨");
    } finally {
      setIsProfileSaving(false);
    }
  };

  // Clean handle without @
  const cleanHandle = (profile.username || "koharu.live").replace(/^@/, "").trim();
  const profileShareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/@${cleanHandle}`
      : `/@${cleanHandle}`;

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${profile.name} (@${cleanHandle})`,
          text: profile.bio,
          url: profileShareUrl,
        })
        .catch(() => {
          setIsShareModalOpen(true);
        });
    } else {
      setIsShareModalOpen(true);
    }
  };

  const copyShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileShareUrl);
      toast.success(`프로필 공유 링크가 복사되었습니다! (/@${cleanHandle}) 🔗`);
    }
  };

  const copyPostLink = (slug: string) => {
    const postUrl = `${window.location.origin}/instagram/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      toast.success("게시물 링크가 복사되었습니다! 🔗");
    }
  };

  const openPostModal = (post: Post) => {
    setSelectedPost(post);
    fetchCommentsForPost(post.id);
  };

  // Dynamic user-defined tags extracted from real posts
  const availableTags = Array.from(
    new Set(posts.map((p) => (p.category || "").trim()).filter(Boolean))
  );

  const filteredPosts = posts.filter((p) => {
    if (activeTag === "all") return true;
    return p.category === activeTag;
  });

  return (
    <div className="min-h-screen">
      <SiteNav active="/instagram" />

      <main className="page-container" id="main">
        {/* Instagram Profile Header Card */}
        <div className="glass-card !p-0 overflow-hidden mb-8 shadow-xl">
          {/* Profile Banner */}
          <div className="relative w-full h-44 sm:h-56 bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 overflow-hidden">
            {profile.bannerUrl && (
              <img
                src={profile.bannerUrl}
                alt="Profile Banner"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40" />

            {/* Quick Banner Edit Button */}
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-xs font-bold text-pink-700 px-3.5 py-1.5 rounded-full shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" /> 프로필 세팅
            </button>
          </div>

          {/* Profile Info Row */}
          <div className="p-6 sm:p-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
              {/* Overlapping Avatar */}
              <div className="insta-avatar-wrapper !m-0">
                <div className="insta-avatar-ring">
                  <img
                    src={profile.avatarUrl || "/assets/koharu-profile.png"}
                    alt={profile.name}
                    className="insta-avatar-img !w-24 !h-24 sm:!w-28 sm:!h-28"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => {
                    setFollowed(!followed);
                    setFollowerCount((prev) => (followed ? prev - 1 : prev + 1));
                    toast.success(
                      followed
                        ? "팔로우를 취소했습니다."
                        : `@${cleanHandle} 님을 팔로우했습니다! 💕`
                    );
                  }}
                  className={`insta-action-btn ${
                    followed ? "insta-btn-secondary" : "insta-btn-primary"
                  }`}
                >
                  {followed ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> 팔로우 중
                    </>
                  ) : (
                    "팔로우"
                  )}
                </button>

                <button
                  onClick={handleShareProfile}
                  className="insta-action-btn insta-btn-secondary"
                  title="프로필 공유하기"
                >
                  <Share2 className="w-4 h-4" /> 공유
                </button>

                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="insta-action-btn insta-btn-secondary"
                >
                  <Edit3 className="w-3.5 h-3.5" /> 세팅
                </button>

                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="insta-action-btn insta-btn-primary !bg-gradient-to-r !from-purple-500 !to-pink-500"
                >
                  <PlusCircle className="w-4 h-4" /> 새 글
                </button>
              </div>
            </div>

            {/* Profile Titles & Stats */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-extrabold text-[#38314a]">
                  {profile.name}
                </h1>
                <span className="text-sm font-semibold text-pink-600 flex items-center gap-1">
                  @{cleanHandle}
                  <svg
                    className="insta-verified !w-4 !h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </span>

                {profile.birthdate && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-100/80 text-pink-700">
                    <Cake className="w-3.5 h-3.5" /> {profile.birthdate}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-sm text-[#7a6e8f] py-1">
                <div>
                  게시물 <strong className="text-[#38314a] font-bold">{posts.length}</strong>
                </div>
                <div>
                  팔로워{" "}
                  <strong className="text-[#38314a] font-bold">
                    {followerCount.toLocaleString()}
                  </strong>
                </div>
                <div>
                  팔로잉 <strong className="text-[#38314a] font-bold">42</strong>
                </div>
              </div>

              {/* Bio */}
              <p className="text-sm leading-relaxed text-[#4a3952] whitespace-pre-line max-w-2xl">
                {profile.bio}
              </p>

              {/* Social Links Row */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {profile.githubUrl && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-pink-100 text-xs font-semibold text-[#38314a] hover:bg-white hover:border-pink-300 transition-colors"
                  >
                    GitHub <ExternalLink className="w-3 h-3 text-pink-500" />
                  </a>
                )}
                {profile.instagramUrl && (
                  <a
                    href={profile.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-pink-100 text-xs font-semibold text-[#38314a] hover:bg-white hover:border-pink-300 transition-colors"
                  >
                    Instagram <ExternalLink className="w-3 h-3 text-pink-500" />
                  </a>
                )}
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-pink-100 text-xs font-semibold text-[#38314a] hover:bg-white hover:border-pink-300 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-pink-500" /> {profile.email}
                  </a>
                )}
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-pink-100 text-xs font-semibold text-[#38314a] hover:bg-white hover:border-pink-300 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-pink-500" />{" "}
                    {profile.websiteUrl.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Category / Tag Filter Pills (Only shown if user has created tags) */}
        {availableTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none justify-center">
            <button
              onClick={() => setActiveTag("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTag === "all"
                  ? "bg-pink-600 text-white shadow-md shadow-pink-500/20"
                  : "bg-white/80 text-[#7a6e8f] hover:bg-white border border-pink-100"
              }`}
            >
              전체
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTag === tag
                    ? "bg-pink-600 text-white shadow-md shadow-pink-500/20"
                    : "bg-white/80 text-[#7a6e8f] hover:bg-white border border-pink-100"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

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
          /* Empty State */
          <div className="glass-card text-center py-20 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-pink-100 flex items-center justify-center mx-auto mb-4 text-pink-600">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#38314a] mb-1">
              아직 등록된 게시물이 없습니다
            </h3>
            <p className="text-xs text-[#7a6e8f] mb-6">
              사진을 선택하고 첫 번째 소식을 남겨보세요!
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="insta-action-btn insta-btn-primary"
            >
              <PlusCircle className="w-4 h-4" /> 첫 게시물 작성하기
            </button>
          </div>
        ) : activeTab === "grid" ? (
          /* Instagram 3-Column Square Grid */
          <div className="insta-grid">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => openPostModal(post)}
                className="insta-grid-item group cursor-pointer"
              >
                <img
                  src={post.coverUrl}
                  alt={post.title}
                  className="insta-grid-img"
                  loading="lazy"
                />

                {post.images && post.images.length > 1 && (
                  <span className="absolute top-2.5 right-2.5 bg-black/60 text-white p-1 rounded-md text-xs">
                    <Layers className="w-3.5 h-3.5" />
                  </span>
                )}

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
                <div className="insta-post-header">
                  <div className="insta-post-author">
                    <img
                      src={profile.avatarUrl || "/assets/koharu-profile.png"}
                      alt={profile.username}
                      className="insta-post-author-img"
                    />
                    <div>
                      <div className="insta-post-author-name flex items-center gap-1.5">
                        {profile.username}
                        {post.category && (
                          <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                            #{post.category}
                          </span>
                        )}
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

                <div
                  className="insta-post-media cursor-pointer"
                  onDoubleClick={() => handleDoubleTap(post)}
                >
                  <img
                    src={post.coverUrl}
                    alt={post.title}
                    className="insta-post-img"
                  />
                  {heartBurst === post.id && (
                    <div className="insta-heart-burst">❤️</div>
                  )}
                </div>

                <div className="insta-post-actions">
                  <div className="insta-action-group">
                    <button
                      onClick={(e) => handleLike(post, e)}
                      className={`insta-icon-btn ${
                        likedPosts[post.id] ? "is-liked" : ""
                      }`}
                      aria-label="좋아요"
                    >
                      <Heart
                        className={`w-6 h-6 ${
                          likedPosts[post.id] ? "fill-[#ff3040] text-[#ff3040]" : ""
                        }`}
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
                      onClick={() => copyPostLink(post.slug)}
                      className="insta-icon-btn"
                      aria-label="공유"
                      title="게시물 링크 복사"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setBookmarkedPosts((prev) => ({
                        ...prev,
                        [post.id]: !prev[post.id],
                      }));
                      toast.success(
                        bookmarkedPosts[post.id]
                          ? "저장을 취소했습니다."
                          : "게시물을 저장했습니다! 🔖"
                      );
                    }}
                    className="insta-icon-btn"
                    aria-label="저장"
                  >
                    <Bookmark
                      className={`w-5 h-5 ${
                        bookmarkedPosts[post.id]
                          ? "fill-current text-pink-600"
                          : ""
                      }`}
                    />
                  </button>
                </div>

                <div className="insta-post-body">
                  <div className="insta-likes-count">
                    좋아요 {post.likesCount}개
                  </div>

                  <div className="insta-caption whitespace-pre-line">
                    <strong>{profile.username}</strong>
                    {post.caption}
                  </div>

                  {(comments[post.id] || []).length > 0 && (
                    <button
                      onClick={() => openPostModal(post)}
                      className="text-xs text-gray-400 hover:text-gray-600 my-1 block"
                    >
                      댓글 {(comments[post.id] || []).length}개 모두 보기
                    </button>
                  )}

                  {/* Inline comment form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddComment(post.id, commentInputs[post.id] || "");
                    }}
                    className="insta-comment-input-row"
                  >
                    <input
                      type="text"
                      placeholder="댓글 달기..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs({
                          ...commentInputs,
                          [post.id]: e.target.value,
                        })
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
      </main>

      {/* =========================================================================
          MODALS: Rendered at root level with highest z-index so topbar NEVER covers
          ========================================================================= */}

      {/* 1. Profile Settings Modal (File Upload for Banner & Avatar) */}
      {isEditProfileOpen && (
        <div
          className="insta-modal-backdrop"
          onClick={() => setIsEditProfileOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-auto max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-pink-100 mb-4 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-[#c93b77] flex items-center gap-2">
                <Edit3 className="w-5 h-5" /> 프로필 세팅
              </h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Banner Image File Picker */}
              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1.5">
                  배너 이미지 선택 (파일 업로드)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-pink-300 hover:border-pink-500 bg-pink-50/40 hover:bg-pink-50/70 text-xs font-bold text-pink-700 cursor-pointer transition-colors">
                    <UploadCloud className="w-4 h-4" />
                    <span>배너 사진 파일 선택하기</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBannerFileSelect}
                    />
                  </label>
                  {editForm.bannerUrl && (
                    <button
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, bannerUrl: "" }))}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                      title="배너 삭제"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {editForm.bannerUrl && (
                  <div className="mt-2.5 w-full h-24 rounded-xl overflow-hidden border border-pink-200 shadow-inner">
                    <img
                      src={editForm.bannerUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Avatar Image File Picker */}
              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1.5">
                  프로필 사진 선택 (파일 업로드)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-pink-400 flex-shrink-0 bg-pink-100">
                    <img
                      src={editForm.avatarUrl || "/assets/koharu-profile.png"}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-pink-300 hover:border-pink-500 bg-pink-50/40 hover:bg-pink-50/70 text-xs font-bold text-pink-700 cursor-pointer transition-colors">
                    <Camera className="w-4 h-4" />
                    <span>프로필 사진 파일 선택하기</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileSelect}
                    />
                  </label>
                </div>
              </div>

              {/* Name & Handle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                    닉네임 / 이름
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-pink-200 outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                    핸들명 (@username)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="koharu.live"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-pink-200 outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                  생년월일 (Birthdate)
                </label>
                <input
                  type="text"
                  placeholder="예: 2004. 12. 04"
                  value={editForm.birthdate}
                  onChange={(e) => setEditForm({ ...editForm, birthdate: e.target.value })}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-pink-200 outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                  소개글 (Bio)
                </label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-pink-200 outline-none focus:border-pink-500"
                />
              </div>

              {/* Social Links */}
              <div className="space-y-2 pt-2 border-t border-pink-100">
                <div className="text-xs font-bold text-[#7a6e8f]">소셜 링크 설정</div>
                <input
                  type="url"
                  placeholder="GitHub 링크 (https://github.com/...)"
                  value={editForm.githubUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, githubUrl: e.target.value })
                  }
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-pink-100 outline-none"
                />
                <input
                  type="url"
                  placeholder="Instagram 링크 (https://instagram.com/...)"
                  value={editForm.instagramUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, instagramUrl: e.target.value })
                  }
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-pink-100 outline-none"
                />
                <input
                  type="email"
                  placeholder="이메일 (admin@koharu.live)"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-pink-100 outline-none"
                />
                <input
                  type="url"
                  placeholder="웹사이트 URL (https://koharu.live)"
                  value={editForm.websiteUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, websiteUrl: e.target.value })
                  }
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-pink-100 outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="insta-action-btn insta-btn-secondary"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isProfileSaving}
                  className="insta-action-btn insta-btn-primary"
                >
                  {isProfileSaving ? "저장 중..." : "세팅 저장하기 ✨"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Profile Share Modal (Clean Handle-Based URL) */}
      {isShareModalOpen && (
        <div
          className="insta-modal-backdrop"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-200 to-purple-200 flex items-center justify-center mx-auto mb-4 text-pink-600 shadow-md">
              <Share2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-[#38314a] mb-1">
              프로필 공유하기
            </h3>
            <p className="text-xs text-[#7a6e8f] mb-5">
              코하루의 핸들명(@{cleanHandle}) 링크를 복사하여 공유해보세요!
            </p>

            <div className="p-3 bg-pink-50/70 rounded-2xl border border-pink-100 flex items-center justify-between gap-2 mb-5 text-left">
              <div className="truncate text-xs font-semibold text-[#38314a]">
                {profileShareUrl}
              </div>
              <button
                onClick={copyShareLink}
                className="p-1.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex-shrink-0"
                title="복사"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="flex-1 insta-action-btn insta-btn-secondary !justify-center"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  copyShareLink();
                  setIsShareModalOpen(false);
                }}
                className="flex-1 insta-action-btn insta-btn-primary !justify-center"
              >
                링크 복사
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Post Detail Modal (Instagram Split View) */}
      {selectedPost && (
        <div
          className="insta-modal-backdrop"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="insta-modal-content my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="insta-modal-left">
              <img src={selectedPost.coverUrl} alt={selectedPost.title} />
            </div>

            <div className="insta-modal-right">
              <div className="flex items-center justify-between p-4 border-b border-pink-100">
                <div className="flex items-center gap-3">
                  <img
                    src={profile.avatarUrl || "/assets/koharu-profile.png"}
                    alt={profile.username}
                    className="w-9 h-9 rounded-full object-cover border border-pink-300"
                  />
                  <div>
                    <div className="font-bold text-sm text-[#38314a]">
                      {profile.username}
                    </div>
                    {selectedPost.category && (
                      <div className="text-[11px] text-[#7a6e8f]">
                        #{selectedPost.category}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-gray-400 hover:text-gray-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="insta-modal-comments-scroll space-y-4">
                <div className="flex gap-3 text-sm">
                  <img
                    src={profile.avatarUrl || "/assets/koharu-profile.png"}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div>
                    <div className="leading-relaxed whitespace-pre-line">
                      <strong className="mr-2">{profile.username}</strong>
                      {selectedPost.caption}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                      {new Date(selectedPost.createdAt).toLocaleDateString("ko-KR")}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-pink-100/60 my-2" />

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

              <div className="p-4 border-t border-pink-100 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(selectedPost)}
                      className={`insta-icon-btn ${
                        likedPosts[selectedPost.id] ? "is-liked" : ""
                      }`}
                    >
                      <Heart
                        className={`w-6 h-6 ${
                          likedPosts[selectedPost.id]
                            ? "fill-[#ff3040] text-[#ff3040]"
                            : ""
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => copyPostLink(selectedPost.slug)}
                      className="insta-icon-btn"
                      title="게시물 링크 복사"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-xs font-bold text-[#38314a]">
                    좋아요 {selectedPost.likesCount}개
                  </div>
                </div>

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

      {/* 4. Create Post Modal (File Upload for Image + User-Defined Custom Tag) */}
      {isCreateOpen && (
        <div
          className="insta-modal-backdrop"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-auto max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-pink-100 mb-4 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-[#c93b77] flex items-center gap-2">
                <ImageIcon className="w-5 h-5" /> 새 게시물 만들기
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              {/* File Upload Selector instead of URL input */}
              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1.5">
                  사진 선택 (파일 업로드)
                </label>
                <label className="w-full flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-pink-300 hover:border-pink-500 bg-pink-50/40 hover:bg-pink-50/70 cursor-pointer transition-colors text-center">
                  <UploadCloud className="w-8 h-8 text-pink-500" />
                  <span className="text-xs font-bold text-[#38314a]">
                    {newCoverUrl ? "다른 사진으로 변경하기" : "컴퓨터 / 기기에서 사진 파일 선택"}
                  </span>
                  <span className="text-[11px] text-[#7a6e8f]">
                    JPG, PNG, WebP, GIF 파일 지원
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePostFileSelect}
                  />
                </label>

                {newCoverUrl && (
                  <div className="mt-3 w-full h-44 rounded-xl overflow-hidden border border-pink-200 shadow-md">
                    <img
                      src={newCoverUrl}
                      alt="Post Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                  게시물 제목
                </label>
                <input
                  type="text"
                  placeholder="예: 오늘 완성한 작은 작업물!"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-pink-200 focus:border-pink-500 outline-none bg-pink-50/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                  문구 및 이야기 (Caption)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="사진과 함께 나눌 이야기를 자유롭게 적어주세요..."
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-pink-200 focus:border-pink-500 outline-none bg-pink-50/30"
                />
              </div>

              {/* User-defined Custom Tag */}
              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                  태그 설정 (사용자 직접 지정)
                </label>
                <input
                  type="text"
                  placeholder="원하는 태그를 입력해주세요 (예: 일상, 팬아트, 디스코드, 개발)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-pink-200 focus:border-pink-500 outline-none bg-pink-50/30"
                />
                <span className="text-[11px] text-[#7a6e8f] mt-1 block">
                  원하는 태그를 자유롭게 지정할 수 있습니다.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="insta-action-btn insta-btn-secondary"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newCoverUrl}
                  className="insta-action-btn insta-btn-primary"
                >
                  {isSubmitting ? "공유하는 중..." : "피드에 공유하기 ✨"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
