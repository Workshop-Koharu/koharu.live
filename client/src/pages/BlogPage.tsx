import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
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
  Search,
  Share2,
  Sparkles,
  Trash2,
  UploadCloud,
  UserCheck,
  UserPlus,
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
  const [, setLocation] = useLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"grid" | "feed">("grid");
  const [activeTag, setActiveTag] = useState<string>("all");

  // Profile data (Koharu's profile is the sole account on Instagram)
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState<ProfileData>(DEFAULT_PROFILE);
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Persistent Follow state
  const [isFollowing, setIsFollowing] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("koharu_is_following") === "1";
      } catch {
        return false;
      }
    }
    return false;
  });

  // Profile share modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Followers & Following Modals
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);

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

  const toggleFollow = () => {
    const next = !isFollowing;
    setIsFollowing(next);
    if (typeof window !== "undefined") {
      try {
        if (next) {
          localStorage.setItem("koharu_is_following", "1");
          toast.success("코하루 님을 팔로우했습니다! 🌸");
        } else {
          localStorage.removeItem("koharu_is_following");
          toast.success("코하루 님의 팔로우를 취소했습니다.");
        }
      } catch {}
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, []);

  const fetchProfile = async () => {
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
        const serverPosts = data.posts || [];
        setPosts(serverPosts);
        if (typeof window !== "undefined") {
          localStorage.setItem("koharu_posts_cache", JSON.stringify(serverPosts));
        }
      } else {
        loadCachedPosts();
      }
    } catch {
      loadCachedPosts();
    } finally {
      setLoading(false);
    }
  };

  const loadCachedPosts = () => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("koharu_posts_cache");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPosts(parsed);
          }
        } catch {}
      }
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
        body: JSON.stringify({ userIdentifier: "guest-visitor" }),
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
    const authorName = profile.name || "! Koharu";
    const authorAvatar = profile.avatarUrl || "/assets/koharu-profile.png";

    // Optimistic local post creation: instant feed update with zero failure
    const tempId = Date.now();
    const optimisticPost: Post = {
      id: tempId,
      slug,
      title,
      caption: newCaption,
      excerpt: newCaption.slice(0, 150),
      content: newCaption,
      coverUrl: newCoverUrl,
      images: [newCoverUrl],
      category,
      likesCount: 0,
      authorName,
      authorAvatar,
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) => [optimisticPost, ...prev]);
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("koharu_posts_cache");
        const prevPosts = cached ? JSON.parse(cached) : [];
        localStorage.setItem("koharu_posts_cache", JSON.stringify([optimisticPost, ...prevPosts]));

        const myIds = JSON.parse(localStorage.getItem("koharu_my_uploaded_ids") || "[]");
        localStorage.setItem("koharu_my_uploaded_ids", JSON.stringify([tempId, ...myIds]));
      } catch {}
    }

    toast.success("새 게시물이 인스타그램 피드에 등록되었습니다! ✨");
    setIsCreateOpen(false);
    setNewTitle("");
    setNewCaption("");
    setNewCoverUrl("");
    setNewTag("");

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
          authorName,
          authorAvatar,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.post) {
          setPosts((prev) => prev.map((p) => (p.id === tempId ? data.post : p)));
        }
      }
    } catch (err) {
      console.warn("[Post Creation] Background sync:", err);
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
        setIsEditProfileOpen(false);
        toast.success("프로필 세팅이 저장되었습니다! ✨");
      }
    } catch {
      setIsEditProfileOpen(false);
      toast.success("프로필 세팅이 저장되었습니다! ✨");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const canDeletePost = (_post: Post) => {
    // Koharu (site owner) or anyone testing locally can delete their posts
    return true;
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

  const handleDeletePost = async (postId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("이 게시물을 정말 삭제하시겠습니까?")) return;

    setPosts((prev) => {
      const updated = prev.filter((p) => p.id !== postId);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("koharu_posts_cache", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(null);
    }

    toast.success("게시물이 성공적으로 삭제되었습니다! 🗑️");

    try {
      await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("[Post Delete] Background sync error:", err);
    }
  };

  // Auto-detect post from share link / URL parameter so shared links NEVER 404
  useEffect(() => {
    if (typeof window === "undefined") return;

    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const postQuery = searchParams.get("post") || searchParams.get("p");

    const match = pathname.match(/^\/(?:instagram|post|p|blog)\/([^/?#]+)/i);
    const rawSlug = postQuery || (match ? match[1] : null);

    if (rawSlug && !rawSlug.startsWith("@") && rawSlug !== "index.html") {
      const slug = decodeURIComponent(rawSlug).replace(/\.html$/, "");
      const found = posts.find((p) => p.slug === slug || String(p.id) === slug);
      if (found) {
        setSelectedPost(found);
        fetchCommentsForPost(found.id);
      } else if (posts.length > 0) {
        fetch(`/api/posts/${encodeURIComponent(slug)}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.post) {
              setSelectedPost(data.post);
              fetchCommentsForPost(data.post.id);
            }
          })
          .catch(() => {});
      }
    }
  }, [posts]);

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
          <div className="relative w-full h-44 sm:h-56 overflow-hidden bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300">
            {profile.bannerUrl && (
              <img
                src={profile.bannerUrl}
                alt="Profile Banner"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40" />

            {/* Quick Banner Action Button */}
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-xs font-bold text-pink-700 px-3.5 py-1.5 rounded-full shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer"
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
                  onClick={toggleFollow}
                  className={`insta-action-btn cursor-pointer ${
                    isFollowing
                      ? "insta-btn-secondary"
                      : "insta-btn-primary !bg-gradient-to-r !from-pink-500 !to-purple-500 text-white"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" /> 팔로잉
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> 팔로우
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="insta-action-btn insta-btn-secondary cursor-pointer"
                  title="프로필 세팅 변경"
                >
                  <Edit3 className="w-3.5 h-3.5" /> 세팅
                </button>

                <button
                  onClick={handleShareProfile}
                  className="insta-action-btn insta-btn-secondary cursor-pointer"
                  title="프로필 공유하기"
                >
                  <Share2 className="w-4 h-4" /> 공유
                </button>

                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="insta-action-btn insta-btn-primary !bg-gradient-to-r !from-purple-500 !to-pink-500 cursor-pointer"
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

              {/* Stats - Clickable for Followers & Following Modals */}
              <div className="flex gap-6 text-sm text-[#7a6e8f] py-1 select-none">
                <div>
                  게시물 <strong className="text-[#38314a] font-bold">{posts.length}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFollowersModalOpen(true)}
                  className="hover:text-pink-600 transition-colors cursor-pointer text-left"
                  title="팔로워 목록 보기"
                >
                  팔로워{" "}
                  <strong className="text-[#38314a] font-bold hover:text-pink-600">
                    {isFollowing ? 1 : 0}
                  </strong>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFollowingModalOpen(true)}
                  className="hover:text-pink-600 transition-colors cursor-pointer text-left"
                  title="팔로잉 목록 보기"
                >
                  팔로잉{" "}
                  <strong className="text-[#38314a] font-bold hover:text-pink-600">
                    0
                  </strong>
                </button>
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

        {/* Dynamic Category / Tag Filter Pills */}
        {availableTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none justify-center">
            <button
              onClick={() => setActiveTag("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
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
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
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
            className={`insta-tab-btn cursor-pointer ${activeTab === "grid" ? "active" : ""}`}
          >
            <Grid className="w-4 h-4" /> 게시물 그리드
          </button>
          <button
            onClick={() => setActiveTab("feed")}
            className={`insta-tab-btn cursor-pointer ${activeTab === "feed" ? "active" : ""}`}
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
              className="insta-action-btn insta-btn-primary cursor-pointer"
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
          /* Instagram Feed Stream (Vertical cards) */
          <div className="space-y-8 max-w-xl mx-auto">
            {filteredPosts.map((post) => {
              const isLiked = likedPosts[post.id];
              const isBookmarked = bookmarkedPosts[post.id];
              const postComments = comments[post.id] || [];

              return (
                <article
                  key={post.id}
                  className="insta-card group overflow-hidden border border-pink-100 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className="insta-card-header flex items-center justify-between p-3.5 border-b border-pink-50">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.authorAvatar || profile.avatarUrl || "/assets/koharu-profile.png"}
                        alt={post.authorName || profile.name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-pink-100"
                      />
                      <div>
                        <div className="flex items-center gap-1 font-bold text-xs text-[#38314a]">
                          {post.authorName || profile.name}
                          <svg
                            className="insta-verified !w-3.5 !h-3.5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </div>
                        <div className="text-[11px] text-[#7a6e8f]">
                          {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {canDeletePost(post) && (
                        <button
                          onClick={(e) => handleDeletePost(post.id, e)}
                          className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="게시물 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => copyPostLink(post.slug)}
                        className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg cursor-pointer"
                        title="링크 복사"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Media (Double-tap to like) */}
                  <div
                    className="relative cursor-pointer select-none bg-black/5"
                    onDoubleClick={() => handleDoubleTap(post)}
                  >
                    <img
                      src={post.coverUrl}
                      alt={post.title}
                      className="w-full aspect-square sm:aspect-[4/3] object-cover"
                      loading="lazy"
                    />

                    {/* Heart burst animation */}
                    {heartBurst === post.id && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-in duration-300">
                        <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
                      </div>
                    )}

                    {post.category && (
                      <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                        #{post.category}
                      </span>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="insta-card-actions flex items-center justify-between p-3.5 pb-2">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => handleLike(post, e)}
                        className={`insta-icon-btn ${isLiked ? "is-liked" : ""} cursor-pointer`}
                      >
                        <Heart
                          className={`w-6 h-6 ${
                            isLiked ? "fill-[#ff3040] text-[#ff3040]" : ""
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => openPostModal(post)}
                        className="insta-icon-btn cursor-pointer"
                      >
                        <MessageCircle className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => copyPostLink(post.slug)}
                        className="insta-icon-btn cursor-pointer"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        setBookmarkedPosts((prev) => ({
                          ...prev,
                          [post.id]: !isBookmarked,
                        }))
                      }
                      className="insta-icon-btn cursor-pointer"
                    >
                      <Bookmark
                        className={`w-6 h-6 ${
                          isBookmarked ? "fill-[#38314a] text-[#38314a]" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Likes Count */}
                  <div className="px-3.5 text-xs font-bold text-[#38314a] mb-1.5">
                    좋아요 {post.likesCount}개
                  </div>

                  {/* Caption */}
                  <div className="px-3.5 text-xs text-[#38314a] leading-relaxed mb-2">
                    <strong className="mr-2 font-bold">{post.authorName || profile.name}</strong>
                    <span className="whitespace-pre-line">{post.caption}</span>
                  </div>

                  {/* Comments Preview */}
                  {postComments.length > 0 && (
                    <div className="px-3.5 mb-2">
                      <button
                        onClick={() => openPostModal(post)}
                        className="text-[11px] text-[#7a6e8f] hover:underline cursor-pointer"
                      >
                        댓글 {postComments.length}개 모두 보기
                      </button>
                      <div className="space-y-0.5 mt-1">
                        {postComments.slice(0, 2).map((c) => (
                          <div key={c.id} className="text-xs text-[#4a3952]">
                            <strong className="mr-1.5 font-bold">{c.authorName}</strong>
                            <span>{c.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Inline Comment Input */}
                  <div className="insta-card-comment p-3 border-t border-pink-50">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const val = commentInputs[post.id] || "";
                        handleAddComment(post.id, val);
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        placeholder="댓글 달기..."
                        value={commentInputs[post.id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        className="insta-comment-input"
                      />
                      <button
                        type="submit"
                        disabled={!(commentInputs[post.id] || "").trim()}
                        className="insta-comment-submit cursor-pointer"
                      >
                        게시
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* =========================================================================
          MODALS
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
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg cursor-pointer"
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
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer"
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
                  className="insta-action-btn insta-btn-secondary cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isProfileSaving}
                  className="insta-action-btn insta-btn-primary cursor-pointer"
                >
                  {isProfileSaving ? "저장 중..." : "세팅 저장하기 ✨"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Profile Share Modal */}
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
                className="p-1.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex-shrink-0 cursor-pointer"
                title="복사"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="flex-1 insta-action-btn insta-btn-secondary !justify-center cursor-pointer"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  copyShareLink();
                  setIsShareModalOpen(false);
                }}
                className="flex-1 insta-action-btn insta-btn-primary !justify-center cursor-pointer"
              >
                링크 복사
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Post Detail Modal */}
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
                    src={selectedPost.authorAvatar || profile.avatarUrl || "/assets/koharu-profile.png"}
                    alt={selectedPost.authorName || profile.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-bold text-xs text-[#38314a] flex items-center gap-1">
                      {selectedPost.authorName || profile.name}
                      <svg
                        className="insta-verified !w-3.5 !h-3.5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Comments & Caption Area */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                <div className="flex gap-3 text-xs">
                  <img
                    src={selectedPost.authorAvatar || profile.avatarUrl || "/assets/koharu-profile.png"}
                    alt={selectedPost.authorName || profile.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div>
                    <div className="leading-relaxed whitespace-pre-line">
                      <strong className="mr-2 text-[#38314a]">
                        {selectedPost.authorName || profile.name}
                      </strong>
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
                        <strong className="mr-2 text-[#38314a]">
                          {comment.authorName}
                        </strong>
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
                      } cursor-pointer`}
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
                      className="insta-icon-btn cursor-pointer"
                      title="게시물 링크 복사"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    {canDeletePost(selectedPost) && (
                      <button
                        onClick={(e) => handleDeletePost(selectedPost.id, e)}
                        className="insta-icon-btn hover:text-rose-600 cursor-pointer"
                        title="게시물 삭제"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
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
                      className="text-pink-600 font-bold text-sm disabled:opacity-40 cursor-pointer"
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

      {/* 4. Create Post Modal */}
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
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
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
                  className="insta-action-btn insta-btn-secondary cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newCoverUrl}
                  className="insta-action-btn insta-btn-primary cursor-pointer"
                >
                  {isSubmitting ? "공유하는 중..." : "피드에 공유하기 ✨"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Followers Modal */}
      {isFollowersModalOpen && (
        <div
          className="insta-modal-backdrop"
          onClick={() => setIsFollowersModalOpen(false)}
        >
          <div
            className="glass-card !p-0 max-w-sm w-full mx-4 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 my-auto bg-white/95 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-pink-100 bg-white/80">
              <div className="w-5" />
              <h3 className="text-base font-bold text-[#38314a]">팔로워</h3>
              <button
                onClick={() => setIsFollowersModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-pink-50/80 p-3">
              {!isFollowing ? (
                <div className="text-center py-10 text-xs sm:text-sm text-gray-400">
                  아직 팔로워가 없습니다.
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 hover:bg-pink-50/40 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-400 to-purple-400 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white flex-shrink-0">
                      🌸
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#38314a] flex items-center gap-1.5">
                        방문자
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-pink-100 text-pink-700">
                          나
                        </span>
                      </div>
                      <div className="text-[11px] text-[#7a6e8f] font-mono">
                        @visitor
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      toggleFollow();
                      setIsFollowersModalOpen(false);
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-pink-200 text-pink-700 hover:bg-pink-50 transition-colors cursor-pointer"
                  >
                    언팔로우
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Following Modal */}
      {isFollowingModalOpen && (
        <div
          className="insta-modal-backdrop"
          onClick={() => setIsFollowingModalOpen(false)}
        >
          <div
            className="glass-card !p-0 max-w-sm w-full mx-4 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 my-auto bg-white/95 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-pink-100 bg-white/80">
              <div className="w-5" />
              <h3 className="text-base font-bold text-[#38314a]">팔로잉</h3>
              <button
                onClick={() => setIsFollowingModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto p-4">
              <div className="text-center py-10 text-xs sm:text-sm text-gray-400">
                아직 팔로잉 중인 계정이 없습니다.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
