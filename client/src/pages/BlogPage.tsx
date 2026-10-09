import { useEffect, useState } from "react";
import { useLocation } from "wouter";
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
  PlusCircle,
  Share2,
  Sparkles,
  Trash2,
  UploadCloud,
  User,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";
import {
  fetchAllPosts,
  createNewPost,
  fetchComments,
  addComment,
  fetchPostBySlugOrId,
} from "@/lib/remoteDb";
import { QRButton } from "@/components/QRCodeModal";

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

// ─── Koharu's canonical profile (editable via profile settings) ───────────────
const KOHARU_PROFILE_DEFAULTS: ProfileData = {
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

const STORAGE_KEY_PROFILE = "koharu_profile_v2";
const STORAGE_KEY_POSTS = "koharu_posts_cache";
const STORAGE_KEY_MY_IDS = "koharu_my_uploaded_ids";
const STORAGE_KEY_LIKED = "koharu_liked_posts";
const STORAGE_KEY_BOOKMARKED = "koharu_bookmarked_posts";
const STORAGE_KEY_FOLLOWING = "koharu_following_list"; // JSON array of {name, username, avatar}

const DEFAULT_POSTS: Post[] = [
  {
    id: 1,
    slug: "koharu-live-v2-announcement",
    title: "✨ koharu.live v2.0 오픈 안내 & 새로운 기능들",
    caption:
      "코하루 포트폴리오가 새롭게 단장했습니다! 인스타그램 피드, 비밀 편지, 방명록까지 모두 준비되어 있어요. 둘러보시고 방명록이나 댓글로 편하게 인사 남겨주세요 💕\n\n#공지사항 #Notice #Portfolio #WebDev #KoharuLive",
    excerpt: "코하루 포트폴리오 v2.0 공식 릴리즈 공지사항입니다.",
    content:
      "코하루 포트폴리오 v2.0 공식 릴리즈 공지사항입니다. 인스타그램 피드, 비밀 편지, 방명록 기능이 모두 오픈되었습니다.",
    coverUrl:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
    ],
    category: "공지",
    likesCount: 89,
    authorName: "! Koharu",
    authorAvatar: "/assets/koharu-profile.png",
    createdAt: "2026-03-28T12:00:00.000Z",
  },
  {
    id: 2,
    slug: "stellive-fan-server-community",
    title: "🎮 비공식 스텔라이브 팬서버 7,000+ 멤버 돌파 기념",
    caption:
      "어느덧 7,000명이 넘는 파스텔 분들과 함께하는 활기찬 공간이 되었어요! 매일매일 올라오는 멋진 팬아트와 클립들 보며 항상 힘을 얻고 있습니다 🌸 모두 감사해요!\n\n#스텔라이브 #디스코드 #커뮤니티 #FanCommunity",
    excerpt: "스텔라이브 팬 커뮤니티 7,000명 돌파 감사 소식입니다.",
    content: "7,000명 이상의 파스텔들이 함께하는 비공식 스텔라이브 팬 커뮤니티 이야기입니다.",
    coverUrl:
      "https://cdn.discordapp.com/banners/1345272253977333801/1606fe46597a8c62fc6dd52ee4d64436.webp?size=480",
    images: [
      "https://cdn.discordapp.com/banners/1345272253977333801/1606fe46597a8c62fc6dd52ee4d64436.webp?size=480",
    ],
    category: "커뮤니티",
    likesCount: 142,
    authorName: "! Koharu",
    authorAvatar: "/assets/koharu-profile.png",
    createdAt: "2026-03-15T09:30:00.000Z",
  },
  {
    id: 3,
    slug: "mirae-ai-development-devlog",
    title: "🌸 Mirae AI 어시스턴트 웹 서비스 개발 일지",
    caption:
      "더 자연스럽고 다정한 대화 경험을 위해 프롬프트 튜닝과 반응형 인터페이스를 개선했습니다. 웹에서 바로 사용해보실 수 있어요 ✨ 피드백은 언제나 환영입니다!\n\n#MiraeAI #AI #웹개발 #WebDev #Project",
    excerpt: "Mirae AI 어시스턴트 서비스 개발 이야기입니다.",
    content: "Mirae AI 서비스 개발 및 인터페이스 최적화 일지입니다.",
    coverUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    ],
    category: "개발",
    likesCount: 67,
    authorName: "! Koharu",
    authorAvatar: "/assets/koharu-profile.png",
    createdAt: "2026-02-20T15:00:00.000Z",
  },
];

/** Compress and read an image file as base64 DataURL */
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
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function ls<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (v) return JSON.parse(v) as T;
  } catch {}
  return fallback;
}

function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export default function BlogPage() {
  const [, setLocation] = useLocation();

  // ── Profile (single Koharu account, editable) ─────────────────────────────
  const [profile, setProfile] = useState<ProfileData>(() => {
    const stored = ls<ProfileData | null>(STORAGE_KEY_PROFILE, null);
    if (stored && stored.username) return { ...KOHARU_PROFILE_DEFAULTS, ...stored };
    return KOHARU_PROFILE_DEFAULTS;
  });

  // ── Posts ─────────────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<Post[]>(() => {
    const cached = ls<Post[]>(STORAGE_KEY_POSTS, []);
    return cached.length > 0 ? cached : DEFAULT_POSTS;
  });
  const [loading, setLoading] = useState(false);

  // ── View ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"grid" | "feed">("grid");
  const [activeTag, setActiveTag] = useState<string>("all");

  // ── Interactions ──────────────────────────────────────────────────────────
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>(() =>
    ls(STORAGE_KEY_LIKED, {})
  );
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Record<number, boolean>>(() =>
    ls(STORAGE_KEY_BOOKMARKED, {})
  );
  const [heartBurst, setHeartBurst] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});

  // ── Following list (accounts this profile follows) ────────────────────────
  // Each entry: { name, username, avatarUrl }
  const [followingList, setFollowingList] = useState<
    Array<{ name: string; username: string; avatarUrl: string }>
  >(() => ls(STORAGE_KEY_FOLLOWING, []));

  // Followers: people who follow Koharu (they hit "팔로우" from visitor state)
  // Since this is a personal portfolio site, we simulate followers as external visitors
  // The owner (Koharu) doesn't follow themselves
  const [followers, setFollowers] = useState<
    Array<{ name: string; username: string; avatarUrl: string }>
  >(() => ls("koharu_followers_list", []));

  // ── Modals ────────────────────────────────────────────────────────────────
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState<ProfileData>(profile);
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New post fields
  const [newTitle, setNewTitle] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comment inputs
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [modalCommentInput, setModalCommentInput] = useState("");

  // ── Derived ───────────────────────────────────────────────────────────────
  const cleanHandle = (profile.username || "koharu.live").replace(/^@/, "").trim();
  const profileShareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/@${cleanHandle}`
      : `/@${cleanHandle}`;

  const availableTags = Array.from(
    new Set(posts.map((p) => (p.category || "").trim()).filter(Boolean))
  );

  const filteredPosts = posts.filter((p) => {
    if (activeTag === "all") return true;
    return p.category === activeTag;
  });

  // ── Init: fetch remote posts ──────────────────────────────────────────────
  useEffect(() => {
    fetchPosts();
  }, []);

  // ── Auto-open post from URL ───────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const postQuery =
      searchParams.get("post") ||
      searchParams.get("p") ||
      searchParams.get("slug") ||
      searchParams.get("id");

    const pathname = window.location.pathname;
    const match = pathname.match(
      /^\/(?:instagram|posts|post|share|p|blog|board)(?:\/post|\/p)?\/([^/?#]+)/i
    );
    const rawSlug = postQuery || (match ? match[1] : null);

    if (rawSlug && !rawSlug.startsWith("@") && rawSlug !== "index.html") {
      const cleanSlug = decodeURIComponent(rawSlug).replace(/\.html$/, "").trim();
      const found = posts.find((p) => p.slug === cleanSlug || String(p.id) === cleanSlug);
      if (found) {
        setSelectedPost(found);
        fetchCommentsForPost(found.id);
      } else {
        fetchPostBySlugOrId(cleanSlug).then((remote) => {
          if (remote) {
            setSelectedPost(remote);
            fetchCommentsForPost(remote.id);
            setPosts((prev) =>
              prev.some((p) => p.id === remote.id) ? prev : [remote, ...prev]
            );
          }
        });
      }
    }
  }, [posts]);

  // ── Persist liked/bookmarked ──────────────────────────────────────────────
  useEffect(() => {
    lsSet(STORAGE_KEY_LIKED, likedPosts);
  }, [likedPosts]);

  useEffect(() => {
    lsSet(STORAGE_KEY_BOOKMARKED, bookmarkedPosts);
  }, [bookmarkedPosts]);

  useEffect(() => {
    lsSet(STORAGE_KEY_FOLLOWING, followingList);
  }, [followingList]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const dbPosts = await fetchAllPosts();
      if (Array.isArray(dbPosts) && dbPosts.length > 0) {
        setPosts((prev) => {
          const serverIds = new Set(dbPosts.map((p) => p.id));
          const serverSlugs = new Set(dbPosts.map((p) => p.slug));
          const localOnly = prev.filter(
            (p) => !serverIds.has(p.id) && !serverSlugs.has(p.slug)
          );
          const merged = [...localOnly, ...dbPosts];
          lsSet(STORAGE_KEY_POSTS, merged);
          return merged;
        });
      }
    } catch (err) {
      console.warn("fetchPosts error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentsForPost = async (postId: number) => {
    try {
      const list = await fetchComments(postId);
      if (Array.isArray(list)) {
        setComments((prev) => ({ ...prev, [postId]: list }));
      }
    } catch {}
  };

  /** Is this post uploaded by Koharu (the owner)? */
  const isMyPost = (post: Post) => {
    try {
      const myIds: number[] = ls(STORAGE_KEY_MY_IDS, []);
      if (myIds.includes(post.id)) return true;
      if (
        post.authorName === "! Koharu" ||
        post.authorName === "코하루" ||
        post.authorName === "! Koharu · 코하루" ||
        post.authorName === profile.name
      ) {
        return true;
      }
    } catch {}
    return false;
  };

  // ── Like ──────────────────────────────────────────────────────────────────
  const handleLike = async (post: Post, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (isMyPost(post)) {
      toast.error("자신의 게시물에는 좋아요를 누를 수 없습니다 🙅");
      return;
    }

    const isCurrentlyLiked = likedPosts[post.id];
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
        body: JSON.stringify({ userIdentifier: profile.username || "koharu.live", isOwner: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, likesCount: data.likesCount } : p))
        );
      }
    } catch {}
  };

  const handleDoubleTap = (post: Post) => {
    if (isMyPost(post)) {
      toast.error("자신의 게시물에는 좋아요를 누를 수 없습니다 🙅");
      return;
    }
    setHeartBurst(post.id);
    if (!likedPosts[post.id]) handleLike(post);
    window.setTimeout(() => setHeartBurst(null), 800);
  };

  // ── Comment ───────────────────────────────────────────────────────────────
  const handleAddComment = async (postId: number, content: string) => {
    if (!content.trim()) return;
    const author = profile.name || "코하루";
    const authorAvatar = profile.avatarUrl || "";

    try {
      const created = await addComment(postId, author, authorAvatar, content.trim());
      const fallback: Comment = {
        id: Date.now(),
        postId,
        authorName: author,
        authorAvatar: authorAvatar || null,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => ({
        ...prev,
        [postId]: [created || fallback, ...(prev[postId] || [])],
      }));
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      setModalCommentInput("");
      toast.success("댓글을 등록했습니다! 🌸");
    } catch {
      toast.error("댓글 등록에 실패했습니다.");
    }
  };

  // ── Create Post ───────────────────────────────────────────────────────────
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

    setPosts((prev) => {
      const next = [optimisticPost, ...prev];
      lsSet(STORAGE_KEY_POSTS, next);
      const myIds = ls<number[]>(STORAGE_KEY_MY_IDS, []);
      lsSet(STORAGE_KEY_MY_IDS, [tempId, ...myIds]);
      return next;
    });

    toast.success("새 게시물이 피드에 등록되었습니다! ✨");
    setIsCreateOpen(false);
    setNewTitle("");
    setNewCaption("");
    setNewCoverUrl("");
    setNewTag("");

    try {
      const created = await createNewPost({
        slug,
        title,
        caption: newCaption,
        coverUrl: newCoverUrl,
        category,
        authorName,
        authorAvatar,
      });

      if (created) {
        setPosts((prev) => prev.map((p) => (p.id === tempId ? created : p)));
        const myIds = ls<number[]>(STORAGE_KEY_MY_IDS, []);
        lsSet(STORAGE_KEY_MY_IDS, [created.id, ...myIds]);
      }
    } catch {
      // keep optimistic
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete Post ───────────────────────────────────────────────────────────
  const handleDeletePost = async (postId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("이 게시물을 정말 삭제하시겠습니까?")) return;

    setPosts((prev) => {
      const updated = prev.filter((p) => p.id !== postId);
      lsSet(STORAGE_KEY_POSTS, updated);
      return updated;
    });
    if (selectedPost && selectedPost.id === postId) setSelectedPost(null);
    toast.success("게시물이 삭제되었습니다! 🗑️");
    try {
      await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    } catch {}
  };

  // ── Save Profile ──────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSaving(true);
    lsSet(STORAGE_KEY_PROFILE, editForm);
    setProfile(editForm);
    setIsEditProfileOpen(false);
    toast.success("프로필이 저장되었습니다! ✨");
    setIsProfileSaving(false);
  };

  // ── Share ─────────────────────────────────────────────────────────────────
  const copyPostLink = (slug: string) => {
    const postUrl = `${window.location.origin}/instagram?post=${encodeURIComponent(slug)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      toast.success("게시물 공유 링크가 복사되었습니다! 🔗");
    }
  };

  const copyShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileShareUrl);
      toast.success(`프로필 링크가 복사되었습니다! 🔗`);
    }
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${profile.name} (@${cleanHandle})`,
          text: profile.bio || "포트폴리오 인스타그램 프로필",
          url: profileShareUrl,
        })
        .catch(() => setIsShareModalOpen(true));
    } else {
      setIsShareModalOpen(true);
    }
  };

  const openPostModal = (post: Post) => {
    setSelectedPost(post);
    fetchCommentsForPost(post.id);
  };

  // File handlers
  const handlePostFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setNewCoverUrl(await processImageFile(file));
      toast.success("사진이 선택되었습니다! 📷");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "이미지를 처리하지 못했습니다.");
    }
  };

  const handleBannerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      setEditForm((prev) => ({ ...prev, bannerUrl: dataUrl }));
      toast.success("배너 사진이 선택되었습니다! 🖼️");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "이미지를 처리하지 못했습니다.");
    }
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      setEditForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
      toast.success("프로필 사진이 선택되었습니다! 🌸");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "이미지를 처리하지 못했습니다.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <SiteNav active="/instagram" />

      <main className="page-container" id="main">
        {/* ── Profile Card ───────────────────────────────────────────────── */}
        <div className="glass-card !p-0 overflow-hidden mb-8 shadow-xl">
          {/* Banner */}
          <div className="relative w-full h-44 sm:h-56 overflow-hidden bg-gradient-to-r from-pink-200 via-purple-200 to-sky-200">
            {profile.bannerUrl ? (
              <img
                src={profile.bannerUrl}
                alt="Profile Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-pink-200 via-purple-100 to-sky-200 opacity-80" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/30" />

            {/* Quick edit button on banner */}
            <button
              onClick={() => {
                setEditForm(profile);
                setIsEditProfileOpen(true);
              }}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-xs font-bold text-pink-700 px-3.5 py-1.5 rounded-full shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> 프로필 세팅
            </button>
          </div>

          {/* Profile Info */}
          <div className="p-6 sm:p-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
              {/* Avatar */}
              <div className="insta-avatar-wrapper !m-0">
                <div className="insta-avatar-ring">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="insta-avatar-img !w-24 !h-24 sm:!w-28 sm:!h-28"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-pink-50 to-purple-100 flex items-center justify-center text-pink-400 border-2 border-white shadow-inner">
                      <User className="w-12 h-12 sm:w-14 sm:h-14 stroke-[1.5]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => {
                    setEditForm(profile);
                    setIsEditProfileOpen(true);
                  }}
                  className="insta-action-btn insta-btn-secondary cursor-pointer"
                  title="프로필 세팅 변경"
                >
                  <Edit3 className="w-3.5 h-3.5" /> 프로필 세팅
                </button>

                <button
                  onClick={handleShareProfile}
                  className="insta-action-btn insta-btn-secondary cursor-pointer"
                  title="프로필 공유하기"
                >
                  <Share2 className="w-4 h-4" /> 공유
                </button>

                <QRButton url={profileShareUrl} label={`@${cleanHandle}`} />

                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="insta-action-btn insta-btn-primary !bg-gradient-to-r !from-purple-500 !to-pink-500 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" /> 새 글
                </button>
              </div>
            </div>

            {/* Name / Handle / Stats / Bio */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-extrabold text-[#38314a]">
                  {profile.name || "코하루"}
                </h1>
                <span className="text-sm font-semibold text-pink-600 flex items-center gap-1">
                  @{cleanHandle}
                  {/* Verified badge always shown for owner */}
                  <svg className="insta-verified !w-4 !h-4" viewBox="0 0 24 24" fill="currentColor">
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
                    {followers.length}
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
                    {followingList.length}
                  </strong>
                </button>
              </div>

              {/* Bio */}
              {profile.bio ? (
                <p className="text-sm leading-relaxed text-[#4a3952] whitespace-pre-line max-w-2xl">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-xs italic text-[#9e8fa6] py-1">
                  소개글이 없습니다. 프로필 세팅을 눌러 나만의 소개글을 등록해보세요 🌸
                </p>
              )}

              {/* Social Links */}
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

        {/* ── Tag Filter ─────────────────────────────────────────────────── */}
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

        {/* ── View Tabs ──────────────────────────────────────────────────── */}
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

        {/* ── Content ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="text-center py-20 text-[#7a6e8f]">
            <Sparkles className="w-8 h-8 animate-spin mx-auto mb-3 text-pink-500" />
            피드를 불러오는 중...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="glass-card text-center py-20 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-pink-100 flex items-center justify-center mx-auto mb-4 text-pink-600">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#38314a] mb-1">
              아직 등록된 게시물이 없습니다
            </h3>
            <p className="text-xs text-[#7a6e8f] mb-6">사진을 선택하고 첫 번째 소식을 남겨보세요!</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="insta-action-btn insta-btn-primary cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> 첫 게시물 작성하기
            </button>
          </div>
        ) : activeTab === "grid" ? (
          /* Grid */
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
          /* Feed */
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
                      {post.authorAvatar ? (
                        <img
                          src={post.authorAvatar}
                          alt={post.authorName || "코하루"}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-pink-100"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 ring-2 ring-pink-100">
                          <User className="w-5 h-5 stroke-[1.8]" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1 font-bold text-xs text-[#38314a]">
                          {post.authorName || "코하루"}
                          {(post.authorName === "! Koharu" ||
                            post.authorName === "코하루" ||
                            post.authorName === "! Koharu · 코하루" ||
                            post.authorName === profile.name) && (
                            <svg
                              className="insta-verified !w-3.5 !h-3.5"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          )}
                        </div>
                        <div className="text-[11px] text-[#7a6e8f]">
                          {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isMyPost(post) && (
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

                  {/* Image */}
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

                  {/* Actions */}
                  <div className="insta-card-actions flex items-center justify-between p-3.5 pb-2">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => handleLike(post, e)}
                        className={`insta-icon-btn ${isLiked ? "is-liked" : ""} ${
                          isMyPost(post) ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                        }`}
                        title={isMyPost(post) ? "자신의 게시물에는 좋아요를 누를 수 없습니다" : "좋아요"}
                      >
                        <Heart className={`w-6 h-6 ${isLiked ? "fill-[#ff3040] text-[#ff3040]" : ""}`} />
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
                        setBookmarkedPosts((prev) => ({ ...prev, [post.id]: !isBookmarked }))
                      }
                      className="insta-icon-btn cursor-pointer"
                    >
                      <Bookmark
                        className={`w-6 h-6 ${isBookmarked ? "fill-[#38314a] text-[#38314a]" : ""}`}
                      />
                    </button>
                  </div>

                  <div className="px-3.5 text-xs font-bold text-[#38314a] mb-1.5">
                    좋아요 {post.likesCount}개
                  </div>

                  <div className="px-3.5 text-xs text-[#38314a] leading-relaxed mb-2">
                    <strong className="mr-2 font-bold">{post.authorName || profile.name}</strong>
                    <span className="whitespace-pre-line">{post.caption}</span>
                  </div>

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

                  {/* Inline Comment */}
                  <div className="insta-card-comment p-3 border-t border-pink-50">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddComment(post.id, commentInputs[post.id] || "");
                      }}
                      className="flex items-center gap-2"
                    >
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt="profile"
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-pink-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-400 flex-shrink-0 ring-1 ring-pink-200">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder="댓글 달기..."
                        value={commentInputs[post.id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        className="insta-comment-input flex-1"
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

      {/* 1. Profile Settings Modal */}
      {isEditProfileOpen && (
        <div className="insta-modal-backdrop" onClick={() => setIsEditProfileOpen(false)}>
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
              {/* Banner */}
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
                    <img src={editForm.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1.5">
                  프로필 사진 선택 (파일 업로드)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-pink-400 flex-shrink-0 bg-pink-100 flex items-center justify-center">
                    {editForm.avatarUrl ? (
                      <img src={editForm.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-pink-400 stroke-[1.8]" />
                    )}
                  </div>
                  {editForm.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, avatarUrl: "" }))}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer"
                      title="사진 삭제"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
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
                  <label className="block text-xs font-bold text-[#7a6e8f] mb-1">닉네임 / 이름</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-pink-200 outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7a6e8f] mb-1">핸들명 (@username)</label>
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
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1">생년월일 (Birthdate)</label>
                <input
                  type="text"
                  placeholder="예: 2004. 12. 04"
                  value={editForm.birthdate}
                  onChange={(e) => setEditForm({ ...editForm, birthdate: e.target.value })}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-pink-200 outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1">소개글 (Bio)</label>
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
                  onChange={(e) => setEditForm({ ...editForm, githubUrl: e.target.value })}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-pink-100 outline-none"
                />
                <input
                  type="url"
                  placeholder="Instagram 링크 (https://instagram.com/...)"
                  value={editForm.instagramUrl}
                  onChange={(e) => setEditForm({ ...editForm, instagramUrl: e.target.value })}
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
                  onChange={(e) => setEditForm({ ...editForm, websiteUrl: e.target.value })}
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
        <div className="insta-modal-backdrop" onClick={() => setIsShareModalOpen(false)}>
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-200 to-purple-200 flex items-center justify-center mx-auto mb-4 text-pink-600 shadow-md">
              <Share2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#38314a] mb-1">프로필 공유하기</h3>
            <p className="text-xs text-[#7a6e8f] mb-5">
              코하루의 핸들명(@{cleanHandle}) 링크를 복사하여 공유해보세요!
            </p>
            <div className="p-3 bg-pink-50/70 rounded-2xl border border-pink-100 flex items-center justify-between gap-2 mb-5 text-left">
              <div className="truncate text-xs font-semibold text-[#38314a]">{profileShareUrl}</div>
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
        <div className="insta-modal-backdrop" onClick={() => setSelectedPost(null)}>
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
                  {selectedPost.authorAvatar ? (
                    <img
                      src={selectedPost.authorAvatar}
                      alt={selectedPost.authorName || "코하루"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-400">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-xs text-[#38314a] flex items-center gap-1">
                      {selectedPost.authorName || profile.name}
                      <svg className="insta-verified !w-3.5 !h-3.5" viewBox="0 0 24 24" fill="currentColor">
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

              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {/* Caption */}
                <div className="flex gap-3 text-xs">
                  {selectedPost.authorAvatar ? (
                    <img
                      src={selectedPost.authorAvatar}
                      alt={selectedPost.authorName || "코하루"}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-400 flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <div className="leading-relaxed whitespace-pre-line">
                      <strong className="mr-2 text-[#38314a]">{selectedPost.authorName || "코하루"}</strong>
                      {selectedPost.caption}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                      {new Date(selectedPost.createdAt).toLocaleDateString("ko-KR")}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-pink-100/60 my-2" />

                {/* Comments */}
                {(comments[selectedPost.id] || []).map((comment) => (
                  <div key={comment.id} className="flex gap-3 text-sm">
                    {comment.authorAvatar ? (
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-pink-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-400 flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div>
                        <strong className="mr-1.5 text-[#38314a] font-bold">{comment.authorName}</strong>
                        {(comment.authorName === profile.name ||
                          comment.authorName === "! Koharu · 코하루" ||
                          comment.authorName === "코하루") && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-pink-100 text-pink-700 mr-2">
                            작성자
                          </span>
                        )}
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

              {/* Modal Actions + Comment Input */}
              <div className="p-4 border-t border-pink-100 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(selectedPost)}
                      className={`insta-icon-btn ${likedPosts[selectedPost.id] ? "is-liked" : ""} ${
                        isMyPost(selectedPost) ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                      }`}
                      title={isMyPost(selectedPost) ? "자신의 게시물에는 좋아요를 누를 수 없습니다" : "좋아요"}
                    >
                      <Heart
                        className={`w-6 h-6 ${likedPosts[selectedPost.id] ? "fill-[#ff3040] text-[#ff3040]" : ""}`}
                      />
                    </button>
                    <button
                      onClick={() => copyPostLink(selectedPost.slug)}
                      className="insta-icon-btn cursor-pointer"
                      title="게시물 링크 복사"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <QRButton
                      url={`${window.location.origin}/instagram?post=${encodeURIComponent(selectedPost.slug)}`}
                      label={selectedPost.title}
                      buttonClassName="insta-icon-btn !p-2 !bg-transparent !shadow-none !border-none !text-[#7a6e8f] hover:!text-pink-600 cursor-pointer"
                    />
                    {isMyPost(selectedPost) && (
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
                  <div className="flex items-center gap-2 text-xs text-[#7a6e8f] px-1 font-medium">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt="profile"
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-pink-200"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center text-pink-400">
                        <User className="w-3 h-3" />
                      </div>
                    )}
                    <span>
                      <strong className="text-[#38314a] font-bold">{profile.name}</strong>
                      <span className="text-[10px] ml-1.5 px-1.5 py-0.2 rounded-full bg-pink-100 text-pink-700 font-bold">
                        내 프로필
                      </span>
                      {" "}로 댓글 작성
                    </span>
                  </div>

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
        <div className="insta-modal-backdrop" onClick={() => setIsCreateOpen(false)}>
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
                    <img src={newCoverUrl} alt="Post Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1">게시물 제목</label>
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
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1">태그 설정</label>
                <input
                  type="text"
                  placeholder="원하는 태그를 입력해주세요 (예: 일상, 팬아트, 개발)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-pink-200 focus:border-pink-500 outline-none bg-pink-50/30"
                />
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
        <div className="insta-modal-backdrop" onClick={() => setIsFollowersModalOpen(false)}>
          <div
            className="glass-card !p-0 max-w-sm w-full mx-4 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 my-auto bg-white/95 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-pink-100 bg-white/80">
              <div className="w-5" />
              <h3 className="text-base font-bold text-[#38314a]">팔로워</h3>
              <button
                onClick={() => setIsFollowersModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-pink-50/80 p-3">
              {followers.length === 0 ? (
                <div className="text-center py-10 text-xs sm:text-sm text-gray-400">
                  아직 팔로워가 없습니다.
                </div>
              ) : (
                followers.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 hover:bg-pink-50/40 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {f.avatarUrl ? (
                        <img
                          src={f.avatarUrl}
                          alt={f.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-400 to-purple-400 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white flex-shrink-0">
                          🌸
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-xs text-[#38314a]">{f.name}</div>
                        <div className="text-[11px] text-[#7a6e8f] font-mono">@{f.username}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Following Modal */}
      {isFollowingModalOpen && (
        <div className="insta-modal-backdrop" onClick={() => setIsFollowingModalOpen(false)}>
          <div
            className="glass-card !p-0 max-w-sm w-full mx-4 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 my-auto bg-white/95 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-pink-100 bg-white/80">
              <div className="w-5" />
              <h3 className="text-base font-bold text-[#38314a]">팔로잉</h3>
              <button
                onClick={() => setIsFollowingModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-4">
              {followingList.length === 0 ? (
                <div className="text-center py-10 text-xs sm:text-sm text-gray-400">
                  아직 팔로잉 중인 계정이 없습니다.
                </div>
              ) : (
                followingList.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 hover:bg-pink-50/40 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {f.avatarUrl ? (
                        <img
                          src={f.avatarUrl}
                          alt={f.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-400 to-purple-400 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white flex-shrink-0">
                          👤
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-xs text-[#38314a] flex items-center gap-1">
                          {f.name}
                        </div>
                        <div className="text-[11px] text-[#7a6e8f] font-mono">@{f.username}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFollowingList((prev) => prev.filter((_, idx) => idx !== i));
                        toast.success(`${f.name} 팔로우를 취소했습니다.`);
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-pink-200 text-pink-700 hover:bg-pink-50 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <UserMinus className="w-3.5 h-3.5" /> 팔로우 취소
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
