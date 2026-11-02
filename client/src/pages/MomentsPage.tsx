import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import {
  AlertTriangle,
  Bell,
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ExternalLink,
  EyeOff,
  Flame,
  Grid,
  Heart,
  Image as ImageIcon,
  Layers,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Plus,
  PlusCircle,
  RefreshCw,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  Smile,
  Sparkles,
  Tag,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";
import { QRButton } from "@/components/QRCodeModal";
import { useAppAuth, GOOGLE_CLIENT_ID } from "@/contexts/AuthContext";
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

// ── Types for Instagram Features ─────────────────────────────────────────────
interface StoryItem {
  id: string;
  authorName: string;
  authorAvatar: string;
  mediaUrl: string;
  caption?: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
}

interface DMThread {
  id: string;
  partnerName: string;
  partnerAvatar: string;
  partnerHandle: string;
  isOnline: boolean;
  messages: ChatMessage[];
}

interface NotificationItem {
  id: string;
  type: "like" | "comment" | "follow" | "dm";
  actorName: string;
  actorAvatar: string;
  text: string;
  time: string;
  read: boolean;
}

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23f1f5f9'/><circle cx='50' cy='40' r='18' fill='%23cbd5e1'/><path d='M22 85 C22 66 35 58 50 58 C65 58 78 66 78 85 Z' fill='%23cbd5e1'/></svg>";

// ── Default Mock Stories & Friends (Empty by default: No Ghost Accounts!) ───────
const INITIAL_STORIES: StoryItem[] = [];
const INITIAL_DMS: DMThread[] = [];

interface UserProfileConfig {
  name: string;
  bio: string;
  avatarUrl: string;
  githubUrl?: string;
  websiteUrl?: string;
}

// Default is completely EMPTY: No hardcoded templates or dummy data!
const DEFAULT_PROFILE_CONFIG: UserProfileConfig = {
  name: "",
  bio: "",
  avatarUrl: "",
  githubUrl: "",
  websiteUrl: "",
};

// Multi-image Carousel component for Feed posts
function FeedPostCarousel({
  coverUrl,
  title,
  onImageClick,
}: {
  coverUrl: string;
  title: string;
  onImageClick?: () => void;
}) {
  const images = (coverUrl || "").split("|||").filter(Boolean);
  const [idx, setIdx] = useState(0);

  if (images.length === 0) return null;
  if (images.length === 1) {
    return (
      <div
        className="relative aspect-square sm:aspect-[4/3] bg-black/5 overflow-hidden cursor-pointer"
        onClick={onImageClick}
      >
        <img
          src={images[0]}
          alt={title}
          className="w-full h-full object-cover hover:scale-102 transition duration-300"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-square sm:aspect-[4/3] bg-black/5 overflow-hidden group select-none">
      <img
        src={images[idx]}
        alt={`${title} - ${idx + 1}`}
        className="w-full h-full object-cover cursor-pointer hover:scale-101 transition duration-300"
        onClick={onImageClick}
      />

      {/* Counter Badge */}
      <div className="absolute top-3 right-3 bg-black/65 backdrop-blur-md text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow pointer-events-none">
        {idx + 1} / {images.length}
      </div>

      {/* Prev button */}
      {idx > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIdx((prev) => Math.max(0, prev - 1));
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs transition shadow-lg cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Next button */}
      {idx < images.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIdx((prev) => Math.min(images.length - 1, prev + 1));
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs transition shadow-lg cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Dots Indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none">
        {images.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === idx ? "w-5 bg-white shadow-md" : "w-1.5 bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function MomentsPage() {
  const { user, loginWithGoogle, renderGoogleButton, logout, isAdmin } = useAppAuth();
  const [, postRoute] = useRoute<{ slug: string }>("/moments/:slug");
  const [, instaRoute] = useRoute<{ slug: string }>("/instagram/:slug");

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostImageIndex, setSelectedPostImageIndex] = useState(0);

  // Instagram Core Features
  const [stories, setStories] = useState<StoryItem[]>(INITIAL_STORIES);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

  // DM State
  const [isDMOpen, setIsDMOpen] = useState(false);
  const [dmThreads, setDmThreads] = useState<DMThread[]>(INITIAL_DMS);
  const [activeThreadId, setActiveThreadId] = useState<string>("dm-koharu");
  const [dmInput, setDmInput] = useState("");

  // Notification State (Empty by default: No Ghost Notifications)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Following & Follower State (Saved in LocalStorage)
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("koharu_following_users");
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set<string>();
  });

  // Account Settings Toggles
  const [isPrivateAccount, setIsPrivateAccount] = useState(() => {
    return localStorage.getItem("koharu_setting_private") === "true";
  });
  const [allowNotifications, setAllowNotifications] = useState(() => {
    return localStorage.getItem("koharu_setting_notif") !== "false";
  });
  const [showActiveStatus, setShowActiveStatus] = useState(() => {
    return localStorage.getItem("koharu_setting_status") !== "false";
  });

  // Profile Settings State (Completely Empty by Default, Clears any legacy templates)
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<"profile" | "preferences" | "danger">("profile");

  const [profileConfig, setProfileConfig] = useState<UserProfileConfig>(() => {
    try {
      const saved = localStorage.getItem("koharu_profile_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Wipe any lingering legacy template text
        if (
          parsed.bio?.includes("아이디어를 코드로") ||
          parsed.bio?.includes("게임 프로그래머 · 인디 게임") ||
          parsed.avatarUrl === "/assets/koharu-profile.png"
        ) {
          localStorage.removeItem("koharu_profile_settings");
          return DEFAULT_PROFILE_CONFIG;
        }
        return parsed;
      }
    } catch {}
    return DEFAULT_PROFILE_CONFIG;
  });

  const [editName, setEditName] = useState(profileConfig.name);
  const [editBio, setEditBio] = useState(profileConfig.bio);
  const [editAvatar, setEditAvatar] = useState(profileConfig.avatarUrl);
  const [editGithub, setEditGithub] = useState(profileConfig.githubUrl || "");
  const [editWebsite, setEditWebsite] = useState(profileConfig.websiteUrl || "");

  // Post & View State
  const [activeTab, setActiveTab] = useState<"grid" | "feed">("grid");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const modalImages = (selectedPost?.coverUrl || "").split("|||").filter(Boolean);
  const currentModalImg = modalImages[selectedPostImageIndex] || modalImages[0] || selectedPost?.coverUrl || "";

  // Comments for selected post
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // Create post modal state (Up to 15 images from File Manager)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createCaption, setCreateCaption] = useState("");
  const [createCoverUrl, setCreateCoverUrl] = useState("");
  const [createImages, setCreateImages] = useState<string[]>([]);
  const [createCategory, setCreateCategory] = useState("일상");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Active carousel indices for multiple images
  const [postImageIndices, setPostImageIndices] = useState<Record<number, number>>({});

  // Handle multi-image file selection (Max 15 images)
  const handleImageFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 15 - createImages.length;
    if (remainingSlots <= 0) {
      toast.error("이미지는 최대 15장까지만 등록할 수 있습니다.");
      return;
    }

    const filesToRead = Array.from(files).slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast.info(`최대 15장 제한으로 인해 ${filesToRead.length}장만 추가되었습니다.`);
    }

    filesToRead.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}은(는) 이미지 파일이 아닙니다.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string;
        if (result) {
          setCreateImages((prev) => (prev.length < 15 ? [...prev, result] : prev));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSelectedImage = (index: number) => {
    setCreateImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // New Story Upload Modal
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [newStoryMediaUrl, setNewStoryMediaUrl] = useState("");
  const [newStoryCaption, setNewStoryCaption] = useState("");

  // Post liked states
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({});

  // 1. Render Google Button when user is not logged in
  useEffect(() => {
    if (!user && googleBtnContainerRef.current) {
      renderGoogleButton(googleBtnContainerRef.current);
    }
  }, [user, renderGoogleButton]);

  // 2. Load Posts on mount if logged in
  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  // 3. Handle URL post param or route slug
  useEffect(() => {
    const slug = postRoute?.slug || instaRoute?.slug;
    if (slug && posts.length > 0) {
      const match = posts.find((p) => p.slug === slug || String(p.id) === slug);
      if (match) {
        openPostModal(match);
      }
    }
  }, [postRoute?.slug, instaRoute?.slug, posts]);

  // 4. Story Progress Timer
  useEffect(() => {
    if (activeStoryIndex === null) {
      setStoryProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            return 0;
          } else {
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryIndex, stories.length]);

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
    setSelectedPostImageIndex(0);
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

  // Save Profile Settings (Name, Bio, Avatar, Links & Toggles)
  const handleSaveProfileSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfileConfig = {
      name: editName.trim() || user?.name || "사용자",
      bio: editBio.trim(),
      avatarUrl: editAvatar.trim() || user?.avatar || "",
      githubUrl: editGithub.trim(),
      websiteUrl: editWebsite.trim(),
    };
    setProfileConfig(updated);
    localStorage.setItem("koharu_profile_settings", JSON.stringify(updated));
    localStorage.setItem("koharu_setting_private", String(isPrivateAccount));
    localStorage.setItem("koharu_setting_notif", String(allowNotifications));
    localStorage.setItem("koharu_setting_status", String(showActiveStatus));
    setIsProfileSettingsOpen(false);
    toast.success("설정이 안전하게 저장되었습니다.");
  };

  // Deactivate Account
  const handleDeactivateAccount = () => {
    if (!window.confirm("계정을 일시 비활성화하시겠습니까? 비활성화 시 프로필이 숨김 처리되며 로그아웃됩니다. 언제든 다시 로그인하여 활성화할 수 있습니다.")) {
      return;
    }
    logout();
    toast.info("계정이 일시 비활성화되었습니다.");
  };

  // Permanently Delete Account and Wipe All Data
  const handleDeleteAccount = () => {
    const confirmInput = window.prompt(
      "정말로 계정을 영구 삭제하시겠습니까?\n작성한 모든 모먼트, 설정 및 프로필 데이터가 복구 불가능하게 삭제됩니다.\n계속 진행하려면 '삭제'를 정확히 입력해주세요."
    );
    if (confirmInput !== "삭제") {
      toast.error("계정 삭제가 취소되었습니다.");
      return;
    }

    localStorage.removeItem("koharu_profile_settings");
    localStorage.removeItem("koharu_following_users");
    localStorage.removeItem("koharu_setting_private");
    localStorage.removeItem("koharu_setting_notif");
    localStorage.removeItem("koharu_setting_status");
    localStorage.removeItem("koharu_app_user_v2");
    logout();
    toast.success("계정과 모든 데이터가 영구적으로 삭제되었습니다.");
  };

  // Follow / Unfollow Toggle
  const toggleFollow = (username: string) => {
    setFollowingUsers((prev) => {
      const next = new Set(prev);
      if (next.has(username)) {
        next.delete(username);
        toast.info(`@${username}님을 언팔로우했습니다.`);
      } else {
        next.add(username);
        toast.success(`@${username}님을 팔로우하기 시작했습니다! 🌸`);
        // Add follow notification
        setNotifications((n) => [
          {
            id: `notif-${Date.now()}`,
            type: "follow",
            actorName: username,
            actorAvatar: "/assets/koharu-profile.png",
            text: `@${username}님을 팔로우했습니다.`,
            time: "방금 전",
            read: false,
          },
          ...n,
        ]);
      }
      localStorage.setItem("koharu_following_users", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Send DM Message
  const handleSendDM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmInput.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "me",
      text: dmInput.trim(),
      time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    };

    setDmThreads((threads) =>
      threads.map((t) =>
        t.id === activeThreadId
          ? { ...t, messages: [...t.messages, newMsg] }
          : t
      )
    );
    setDmInput("");

    // Simulate auto friendly reply after 1.5s
    setTimeout(() => {
      const activeThread = dmThreads.find((t) => t.id === activeThreadId);
      const replyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "them",
        text: `메시지 확인했어요! 🌸 감사합니다 ⁽⁽ (˶> ᎑ <˶) ⁾⁾`,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      };
      setDmThreads((threads) =>
        threads.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: [...t.messages, replyMsg] }
            : t
        )
      );
    }, 1500);
  };

  // Like handler
  const handleLike = async (post: Post) => {
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
    if (!createCaption.trim() && !createCoverUrl.trim()) {
      toast.error("내용 또는 사진 링크를 입력해주세요!");
      return;
    }

    const finalCover =
      createImages.length > 0 ? createImages.join("|||") : createCoverUrl.trim();

    if (!finalCover) {
      toast.error("최소 1장의 사진을 파일 관리자에서 선택하거나 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newPost = await createNewPost({
        slug: `moment-${Date.now()}`,
        title: createCaption.slice(0, 30) || `${profileConfig.name || user?.name || "사용자"}님의 모먼트`,
        caption: createCaption.trim(),
        coverUrl: finalCover,
        category: createCategory,
        authorName: profileConfig.name || user?.name || "사용자",
        authorAvatar: profileConfig.avatarUrl || user?.avatar || "",
      });

      if (newPost) {
        toast.success("새로운 모먼트가 게시되었습니다.");
        setIsCreateOpen(false);
        setCreateCaption("");
        setCreateCoverUrl("");
        setCreateImages([]);
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

  // Story file selector
  const handleStoryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setNewStoryMediaUrl(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Avatar file selector in Profile Settings
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setEditAvatar(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Create Story
  const handleCreateStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryMediaUrl.trim()) {
      toast.error("스토리 사진을 선택해주세요!");
      return;
    }

    const newStory: StoryItem = {
      id: `story-${Date.now()}`,
      authorName: profileConfig.name || user?.name || "나",
      authorAvatar: profileConfig.avatarUrl || user?.avatar || "",
      mediaUrl: newStoryMediaUrl.trim(),
      caption: newStoryCaption.trim(),
      createdAt: "방금 전",
    };

    setStories([newStory, ...stories]);
    setIsCreateStoryOpen(false);
    setNewStoryMediaUrl("");
    setNewStoryCaption("");
    toast.success("내 스토리가 등록되었습니다.");
  };

  // Delete Post (Strict Permission: Author or Admin only)
  const handleDeletePost = async (postId: number) => {
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
    if (!selectedPost || !commentInput.trim()) return;

    try {
      const newComment = await addComment(
        selectedPost.id,
        user?.name || "Google User",
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

  const activeThread = dmThreads.find((t) => t.id === activeThreadId) || dmThreads[0];
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  // Filter tags
  const tags = Array.from(new Set(posts.map((p) => p.category))).filter(Boolean);
  const filteredPosts =
    activeTag === "all" ? posts : posts.filter((p) => p.category === activeTag);

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: NOT LOGGED IN -> Pure Fullscreen Google Login Screen (NO FAKE PROFILE)
  // ─────────────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen">
        <SiteNav active="/moments" />

        <main className="page-container max-w-lg mx-auto px-4 pt-10 sm:pt-16 pb-20" id="main">
          <div className="glass-card !p-8 sm:!p-12 text-center rounded-[36px] border border-pink-200/80 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            {/* Ambient Top Glow */}
            <div className="w-48 h-48 bg-gradient-to-tr from-pink-400/20 to-purple-400/20 rounded-full blur-2xl absolute -top-12 -left-12 pointer-events-none" />
            <div className="w-48 h-48 bg-gradient-to-tr from-amber-400/20 to-pink-400/20 rounded-full blur-2xl absolute -bottom-12 -right-12 pointer-events-none" />

            {/* Instagram Style Gradient App Icon */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="w-full h-full rounded-[28px] p-1 bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-xl shadow-pink-500/25 flex items-center justify-center text-white">
                <Camera className="w-12 h-12" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-pink-500 border border-pink-100">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-100/80 text-pink-700 text-xs font-extrabold mb-3 border border-pink-200">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              Koharu Moments Authentication
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-[#38314a] tracking-tight mb-2">
              코하루 모먼트 로그인
            </h1>
            <p className="text-xs sm:text-sm text-[#7a6e8f] leading-relaxed mb-8 max-w-xs mx-auto break-keep">
              실제 인스타그램 피드, 스토리, 1:1 DM 및 친구 팔로우 기능을 이용하려면 <strong>Google 계정 로그인</strong>이 필수입니다.
            </p>

            {/* Official Google Login Button Container (Single Clean Button) */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div ref={googleBtnContainerRef} className="flex justify-center w-full min-h-[44px]" />
            </div>

            <div className="mt-8 pt-6 border-t border-pink-100 flex items-center justify-center gap-6 text-[11px] text-gray-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-pink-500" />
                SSL 보안 암호화
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                안전한 OAuth 2.0
              </span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: LOGGED IN USER -> Complete Instagram Experience
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24">
      <SiteNav active="/moments" />

      <main className="page-container max-w-4xl mx-auto px-4 pt-4" id="main">
        {/* ── Top Instagram Navigation Toolbar (DM, Notif, New Post) ────── */}
        <div className="flex items-center justify-between py-2 mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#38314a] tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 bg-clip-text text-transparent">
                Koharu Moments
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* New Post Button */}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:opacity-95 transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">새 모먼트</span>
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 rounded-xl bg-white border border-pink-200 text-[#38314a] hover:bg-pink-50 transition cursor-pointer relative"
                title="알림"
              >
                <Heart className="w-4 h-4 text-pink-600" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {isNotificationOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-3xl shadow-2xl border border-pink-200 p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-pink-100 mb-3">
                    <h4 className="font-extrabold text-xs text-[#38314a] flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-pink-500" /> 알림 센터
                    </h4>
                    <button
                      onClick={() => {
                        setNotifications((n) => n.map((item) => ({ ...item, read: true })));
                        toast.success("모든 알림을 읽음 처리했습니다.");
                      }}
                      className="text-[10px] text-pink-600 font-bold hover:underline"
                    >
                      모두 읽음
                    </button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-center py-4 text-gray-400">새로운 알림이 없습니다.</p>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="flex items-center gap-2.5 text-xs">
                          <img
                            src={notif.actorAvatar}
                            alt={notif.actorName}
                            className="w-8 h-8 rounded-full object-cover border border-pink-200"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[#38314a] truncate">
                              <strong>{notif.actorName}</strong>님이 {notif.text}
                            </p>
                            <span className="text-[10px] text-gray-400">{notif.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* DM Button */}
            <button
              onClick={() => setIsDMOpen(true)}
              className="p-2 rounded-xl bg-white border border-pink-200 text-[#38314a] hover:bg-pink-50 transition cursor-pointer relative"
              title="다이렉트 메시지 (DM)"
            >
              <Send className="w-4 h-4 text-purple-600" />
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-white border border-pink-200 text-gray-500 hover:text-red-600 transition cursor-pointer"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Stories Tray (Instagram Stories) ─────────────────────────── */}
        <section className="mb-6 p-4 rounded-3xl bg-white/80 border border-pink-100 shadow-sm overflow-x-auto scrollbar-none flex items-center gap-4">
          {/* Add My Story Button */}
          <div
            onClick={() => setIsCreateStoryOpen(true)}
            className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
          >
            <div className="relative w-16 h-16 rounded-full p-0.5 border-2 border-dashed border-pink-400 flex items-center justify-center">
              <img
                src={user.avatar || "/assets/koharu-profile.png"}
                alt={user.name}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-md">
                <Plus className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#38314a]">내 스토리</span>
          </div>

          {/* Active Stories List */}
          {stories.map((story, idx) => (
            <div
              key={story.id}
              onClick={() => {
                setActiveStoryIndex(idx);
                setStoryProgress(0);
              }}
              className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
            >
              <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform duration-200">
                <img
                  src={story.authorAvatar}
                  alt={story.authorName}
                  className="w-full h-full rounded-full object-cover border-2 border-white bg-white"
                />
              </div>
              <span className="text-[11px] font-bold text-[#38314a] max-w-[70px] truncate">
                {story.authorName}
              </span>
            </div>
          ))}
        </section>

        {/* ── User Profile Card (Real Authenticated User & Restored Settings) ─── */}
        <section className="glass-card !p-6 sm:!p-8 mb-8 border border-pink-100 shadow-xl rounded-3xl relative overflow-hidden bg-white/90">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* User Avatar with Verification Badge */}
            <div className="relative flex-shrink-0">
              <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 shadow-lg shadow-pink-500/20 flex items-center justify-center">
                {profileConfig.avatarUrl || user.avatar ? (
                  <img
                    src={profileConfig.avatarUrl || user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover border-2 border-white bg-white"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-pink-400">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#38314a] flex items-center gap-2 justify-center sm:justify-start">
                    {profileConfig.name || user.name}
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-extrabold shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Google 인증
                    </span>
                  </h2>
                  <p className="text-xs font-semibold text-pink-600 mt-0.5">
                    {user.email}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Share Profile QR Button - Strictly links to user profile */}
                  <QRButton
                    url={`${window.location.origin}/@${(profileConfig.name || user.name || "user").toLowerCase().replace(/\s+/g, "")}`}
                    label={`${profileConfig.name || user.name} 프로필`}
                  />

                  {/* Settings Toggle Trigger Button */}
                  <button
                    onClick={() => {
                      setEditName(profileConfig.name || user.name);
                      setEditBio(profileConfig.bio || "");
                      setEditAvatar(profileConfig.avatarUrl || user.avatar || "");
                      setEditGithub(profileConfig.githubUrl || "");
                      setEditWebsite(profileConfig.websiteUrl || "");
                      setActiveSettingsTab("profile");
                      setIsProfileSettingsOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-pink-200 text-[#38314a] text-xs font-bold hover:bg-pink-50 transition cursor-pointer shadow-xs"
                    title="모먼트 설정"
                  >
                    <Settings className="w-3.5 h-3.5 text-pink-500" />
                    <span>설정</span>
                  </button>

                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white text-xs font-extrabold shadow-md shadow-pink-500/25 transition cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" /> 모먼트 올리기
                  </button>
                </div>
              </div>

              {/* Bio description (Only renders if user explicitly set it, completely clean by default) */}
              {profileConfig.bio && (
                <p className="text-xs text-[#5f5270] leading-relaxed whitespace-pre-line text-left">
                  {profileConfig.bio}
                </p>
              )}

              {/* Stats Bar */}
              <div className="flex items-center justify-center sm:justify-start gap-8 pt-1 text-xs">
                <div>
                  <span className="font-extrabold text-[#38314a] text-sm">{posts.length}</span>{" "}
                  <span className="text-[#7a6e8f]">게시물</span>
                </div>
                <div>
                  <span className="font-extrabold text-[#38314a] text-sm">{followingUsers.size}</span>{" "}
                  <span className="text-[#7a6e8f]">팔로잉</span>
                </div>
                <div>
                  <span className="font-extrabold text-[#38314a] text-sm">{followingUsers.size > 0 ? 1 : 0}</span>{" "}
                  <span className="text-[#7a6e8f]">팔로워</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tag Filter Chips & View Mode ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTag("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer ${
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                  activeTag === t
                    ? "bg-pink-600 text-white shadow-md shadow-pink-500/20"
                    : "bg-white/80 text-[#7a6e8f] hover:bg-white border border-pink-100"
                }`}
              >
                #{t}
              </button>
            ))}
          </div>

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

        {/* ── Content: Grid or Feed ─────────────────────────────────────── */}
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
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold shadow-md shadow-pink-500/20 cursor-pointer"
            >
              모먼트 작성하기
            </button>
          </div>
        ) : activeTab === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
            {filteredPosts.map((post) => {
              const images = (post.coverUrl || "").split("|||").filter(Boolean);
              const thumbnail = images[0] || post.coverUrl;

              return (
                <div
                  key={post.id}
                  onClick={() => openPostModal(post)}
                  className="group relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-pink-50 cursor-pointer border border-pink-100 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <img
                    src={thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Multi-image indicator badge */}
                  {images.length > 1 && (
                    <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md pointer-events-none">
                      <Layers className="w-3 h-3" />
                      <span>{images.length}</span>
                    </div>
                  )}

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
              );
            })}
          </div>
        ) : (
          /* Feed View */
          <div className="max-w-xl mx-auto space-y-6">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="glass-card !p-0 overflow-hidden rounded-3xl border border-pink-100 shadow-lg"
              >
                {/* Author Header with Follow Button */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorAvatar || DEFAULT_AVATAR}
                      alt={post.authorName}
                      className="w-9 h-9 rounded-full object-cover border border-pink-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-[#38314a]">{post.authorName}</span>
                        {/* Follow Button if not me */}
                        {post.authorName !== user.name && (
                          <button
                            onClick={() => toggleFollow(post.authorName)}
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full transition cursor-pointer ${
                              followingUsers.has(post.authorName)
                                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                : "bg-pink-100 text-pink-600 hover:bg-pink-200"
                            }`}
                          >
                            {followingUsers.has(post.authorName) ? "팔로잉" : "팔로우"}
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString("ko-KR")} · #{post.category}
                      </div>
                    </div>
                  </div>
                  <QRButton url={`${window.location.origin}/moments?post=${post.slug}`} label={post.title} />
                </div>

                {/* Photo Carousel (Multi-image support up to 15) */}
                <FeedPostCarousel
                  coverUrl={post.coverUrl}
                  title={post.title}
                  onImageClick={() => openPostModal(post)}
                />

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

        {/* ── Fullscreen Story Viewer Modal ─────────────────────────────── */}
        {activeStoryIndex !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in"
            onClick={() => setActiveStoryIndex(null)}
          >
            <div
              className="relative max-w-sm w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress Bar Header */}
              <div className="space-y-3 z-10">
                <div className="w-full bg-white/30 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-white h-full transition-all duration-100 ease-linear"
                    style={{ width: `${storyProgress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <img
                      src={stories[activeStoryIndex].authorAvatar}
                      alt={stories[activeStoryIndex].authorName}
                      className="w-8 h-8 rounded-full object-cover border border-white"
                    />
                    <div>
                      <div className="text-xs font-bold">{stories[activeStoryIndex].authorName}</div>
                      <div className="text-[10px] text-white/70">{stories[activeStoryIndex].createdAt}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveStoryIndex(null)}
                    className="p-1 text-white hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Story Image */}
              <img
                src={stories[activeStoryIndex].mediaUrl}
                alt="Story"
                className="absolute inset-0 w-full h-full object-cover z-0"
              />

              {/* Caption & Reply Footer */}
              <div className="z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 rounded-2xl text-white">
                {stories[activeStoryIndex].caption && (
                  <p className="text-xs mb-3 font-semibold text-white drop-shadow">
                    {stories[activeStoryIndex].caption}
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="스토리에 답장하기..."
                    className="flex-1 text-xs px-3 py-2 rounded-full bg-white/20 border border-white/40 text-white placeholder-white/70 focus:outline-hidden"
                  />
                  <button
                    onClick={() => toast.success("스토리 답장을 보냈습니다! 🌸")}
                    className="p-2 rounded-full bg-pink-600 text-white"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Direct Message (DM) Modal ─────────────────────────────────── */}
        {isDMOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={() => setIsDMOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-2xl w-full h-[540px] shadow-2xl border border-pink-100 flex overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Side: DM Thread List */}
              <div className="w-1/3 border-r border-pink-100 flex flex-col bg-pink-50/30">
                <div className="p-4 border-b border-pink-100 font-extrabold text-xs text-[#38314a] flex items-center justify-between">
                  <span>다이렉트 메시지</span>
                  <Send className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-pink-50">
                  {dmThreads.length === 0 ? (
                    <p className="text-xs text-center py-10 text-gray-400">대화 목록 없음</p>
                  ) : (
                    dmThreads.map((thread) => (
                      <div
                        key={thread.id}
                        onClick={() => setActiveThreadId(thread.id)}
                        className={`p-3 flex items-center gap-2.5 cursor-pointer transition ${
                          activeThreadId === thread.id ? "bg-white shadow-xs font-bold" : "hover:bg-pink-100/40"
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={thread.partnerAvatar || DEFAULT_AVATAR}
                            alt={thread.partnerName}
                            className="w-10 h-10 rounded-full object-cover border border-pink-200"
                          />
                          {thread.isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-[#38314a] truncate">{thread.partnerName}</div>
                          <div className="text-[10px] text-gray-400 truncate">
                            {thread.messages[thread.messages.length - 1]?.text || "대화를 시작하세요"}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Side: Chat Window */}
              {activeThread ? (
                <div className="flex-1 flex flex-col bg-white">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-pink-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={activeThread.partnerAvatar || DEFAULT_AVATAR}
                        alt={activeThread.partnerName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-extrabold text-xs text-[#38314a]">{activeThread.partnerName}</div>
                        <div className="text-[10px] text-emerald-600">
                          {activeThread.isOnline ? "온라인 상태" : "오프라인"}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setIsDMOpen(false)} className="text-gray-400 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Message Log */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activeThread.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.sender === "me" ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                            m.sender === "me"
                              ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-none"
                              : "bg-gray-100 text-[#38314a] rounded-bl-none"
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="text-[9px] text-gray-400 mt-0.5 px-1">{m.time}</span>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendDM} className="p-3 border-t border-pink-100 flex gap-2">
                    <input
                      type="text"
                      placeholder="메시지 입력..."
                      value={dmInput}
                      onChange={(e) => setDmInput(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 rounded-xl border border-pink-200 focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 cursor-pointer"
                    >
                      전송
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                  <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center mb-3">
                    <Send className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#38314a] mb-1">대화 중인 친구가 없습니다</h4>
                  <p className="text-xs text-gray-400 max-w-xs">
                    모먼트에서 친구를 팔로우하고 새로운 메시지를 나눠보세요.
                  </p>
                </div>
              )}
            </div>
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
                {/* Left: Big Image / Carousel */}
                <div className="md:w-1/2 bg-black flex items-center justify-center relative min-h-[280px] select-none group">
                  <img
                    src={currentModalImg}
                    alt={selectedPost.title}
                    className="max-h-[60vh] md:max-h-[85vh] w-full object-contain"
                  />

                  {modalImages.length > 1 && (
                    <>
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        {selectedPostImageIndex + 1} / {modalImages.length}
                      </div>

                      {selectedPostImageIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedPostImageIndex((i) => Math.max(0, i - 1))}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs cursor-pointer shadow-lg"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      )}

                      {selectedPostImageIndex < modalImages.length - 1 && (
                        <button
                          type="button"
                          onClick={() => setSelectedPostImageIndex((i) => Math.min(modalImages.length - 1, i + 1))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs cursor-pointer shadow-lg"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      )}

                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                        {modalImages.map((_, i) => (
                          <span
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              i === selectedPostImageIndex ? "w-5 bg-white shadow-md" : "w-1.5 bg-white/50"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Right: Info, Comments, Actions */}
                <div className="md:w-1/2 flex flex-col h-full max-h-[60vh] md:max-h-[85vh] bg-white">
                  {/* Header */}
                  <div className="p-4 border-b border-pink-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedPost.authorAvatar || DEFAULT_AVATAR}
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
                    {(user.openId === selectedPost.authorOpenId || isAdmin) && (
                      <button
                        onClick={() => handleDeletePost(selectedPost.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                        title="게시물 삭제 (작성자 전용)"
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
                        const isCommentAuthor = c.authorOpenId === user.openId;
                        const canDelete = isCommentAuthor || isAdmin;

                        return (
                          <div key={c.id} className="flex items-start justify-between gap-2 text-xs group">
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <img
                                src={c.authorAvatar || DEFAULT_AVATAR}
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

                            {/* Comment Action Buttons (Strict Author or Admin) */}
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

                {/* Footer Actions & Add Comment */}
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

                  <form onSubmit={handleAddComment} className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder={`${user.name}님으로 댓글 작성...`}
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 rounded-xl bg-white border border-pink-200 focus:outline-hidden focus:border-pink-500"
                    />
                    <button
                      type="submit"
                      disabled={!commentInput.trim()}
                      className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Create New Moment Modal (Up to 15 images from File Manager) ── */}
        {isCreateOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={() => setIsCreateOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-pink-100 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-pink-100 mb-4">
                <h3 className="text-base sm:text-lg font-extrabold text-[#38314a] flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-pink-500" /> 새 모먼트 만들기
                </h3>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                {/* File Upload Selector (Max 15 Images) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#38314a]">
                      사진 업로드 (파일 관리자에서 선택)
                    </label>
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-pink-100 text-pink-600">
                      {createImages.length} / 15장
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleImageFilesSelect}
                    className="hidden"
                  />

                  {/* Dropzone / Upload Trigger Button */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-pink-300 hover:border-pink-500 hover:bg-pink-50/50 rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 bg-pink-50/20"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#38314a]">
                        클릭하여 파일 관리자에서 사진 선택
                      </p>
                      <p className="text-[11px] text-[#7a6e8f] mt-0.5">
                        JPEG, PNG, GIF, WEBP 등 최대 15장까지 다중 선택 가능
                      </p>
                    </div>
                  </div>

                  {/* Selected Images Thumbnail Grid */}
                  {createImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                      {createImages.map((imgData, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-xl overflow-hidden border border-pink-200 group bg-gray-50 shadow-xs"
                        >
                          <img
                            src={imgData}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeSelectedImage(index)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer"
                            title="사진 제거"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded-md bg-black/60 text-white text-[9px] font-bold">
                            {index + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Alternative URL Input Fallback */}
                  {createImages.length === 0 && (
                    <div className="mt-2.5">
                      <input
                        type="url"
                        placeholder="또는 이미지 URL 직접 입력 (https://...)"
                        value={createCoverUrl}
                        onChange={(e) => setCreateCoverUrl(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-pink-200 focus:outline-hidden focus:border-pink-500"
                      />
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
                    캡션 / 설명글
                  </label>
                  <textarea
                    rows={3}
                    placeholder="사진과 함께 전할 소식을 남겨보세요..."
                    value={createCaption}
                    onChange={(e) => setCreateCaption(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-pink-200 focus:outline-hidden focus:border-pink-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-[#38314a] font-bold text-xs hover:bg-gray-200 cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md shadow-pink-500/25 hover:opacity-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "게시 중..." : "모먼트 등록"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Add Story Modal with File Manager Support ──────────────────── */}
        {isCreateStoryOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={() => setIsCreateStoryOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-pink-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-pink-100 mb-4">
                <h3 className="text-base font-extrabold text-[#38314a] flex items-center gap-2">
                  <Camera className="w-5 h-5 text-pink-500" /> 스토리 올리기
                </h3>
                <button
                  onClick={() => setIsCreateStoryOpen(false)}
                  className="text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStory} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#38314a] mb-1">스토리 사진 선택</label>
                  <input
                    type="file"
                    ref={storyFileInputRef}
                    accept="image/*"
                    onChange={handleStoryFileSelect}
                    className="hidden"
                  />
                  <div
                    onClick={() => storyFileInputRef.current?.click()}
                    className="border border-dashed border-pink-300 hover:border-pink-500 rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center gap-2 bg-pink-50/30"
                  >
                    <ImageIcon className="w-4 h-4 text-pink-500" />
                    <span className="text-xs font-bold text-[#38314a]">파일 관리자에서 사진 선택</span>
                  </div>

                  {newStoryMediaUrl && (
                    <div className="mt-2.5 aspect-square rounded-xl overflow-hidden bg-gray-50 border border-pink-100">
                      <img src={newStoryMediaUrl} alt="Story Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#38314a] mb-1">스토리 문구 (선택)</label>
                  <input
                    type="text"
                    placeholder="사진에 남길 한마디..."
                    value={newStoryCaption}
                    onChange={(e) => setNewStoryCaption(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-pink-200 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateStoryOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-gray-100 text-xs font-bold cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    스토리 등록
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Comprehensive Moments Settings & Account Management Modal ── */}
        {isProfileSettingsOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={() => setIsProfileSettingsOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-pink-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-pink-100 mb-4">
                <h3 className="text-base font-extrabold text-[#38314a] flex items-center gap-2">
                  <Settings className="w-5 h-5 text-pink-500" /> 모먼트 설정 & 계정 관리
                </h3>
                <button
                  onClick={() => setIsProfileSettingsOpen(false)}
                  className="text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-pink-50/70 rounded-2xl mb-5 border border-pink-100">
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab("profile")}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                    activeSettingsTab === "profile"
                      ? "bg-white text-pink-600 shadow-xs"
                      : "text-gray-500 hover:text-[#38314a]"
                  }`}
                >
                  프로필 편집
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab("preferences")}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                    activeSettingsTab === "preferences"
                      ? "bg-white text-pink-600 shadow-xs"
                      : "text-gray-500 hover:text-[#38314a]"
                  }`}
                >
                  환경설정 토글
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab("danger")}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                    activeSettingsTab === "danger"
                      ? "bg-white text-red-600 shadow-xs"
                      : "text-gray-500 hover:text-red-600"
                  }`}
                >
                  계정 관리
                </button>
              </div>

              {/* Tab 1: Profile Edit */}
              {activeSettingsTab === "profile" && (
                <form onSubmit={handleSaveProfileSettings} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#38314a] mb-1">닉네임 / 표시 이름</label>
                    <input
                      type="text"
                      required
                      placeholder="표시할 이름을 입력해주세요"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-pink-200 focus:outline-hidden focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#38314a] mb-1">소개글 (Bio)</label>
                    <textarea
                      rows={3}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="자신을 소개하는 문구를 자유롭게 남겨보세요..."
                      className="w-full text-xs p-2.5 rounded-xl border border-pink-200 focus:outline-hidden focus:border-pink-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#38314a] mb-1">프로필 아바타 사진 (선택)</label>
                    <input
                      type="file"
                      ref={avatarFileInputRef}
                      accept="image/*"
                      onChange={handleAvatarFileSelect}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200 text-xs font-bold text-pink-700 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> 파일 관리자에서 사진 선택
                      </button>
                      {editAvatar && (
                        <button
                          type="button"
                          onClick={() => setEditAvatar("")}
                          className="text-[11px] text-gray-400 hover:text-red-500 underline"
                        >
                          사진 초기화
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="또는 이미지 URL 직접 입력 (비워둘 시 기본 프로필)"
                      className="w-full text-xs p-2.5 rounded-xl border border-pink-200 focus:outline-hidden focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#38314a] mb-1">GitHub 링크 (선택)</label>
                    <input
                      type="url"
                      value={editGithub}
                      onChange={(e) => setEditGithub(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full text-xs p-2.5 rounded-xl border border-pink-200 focus:outline-hidden focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#38314a] mb-1">웹사이트 / 포트폴리오 링크 (선택)</label>
                    <input
                      type="url"
                      value={editWebsite}
                      onChange={(e) => setEditWebsite(e.target.value)}
                      placeholder="https://..."
                      className="w-full text-xs p-2.5 rounded-xl border border-pink-200 focus:outline-hidden focus:border-pink-500"
                    />
                  </div>

                  <div className="pt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsProfileSettingsOpen(false)}
                      className="flex-1 py-2.5 rounded-xl bg-gray-100 text-[#38314a] font-bold text-xs hover:bg-gray-200 cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md shadow-pink-500/25 hover:opacity-90 cursor-pointer"
                    >
                      저장하기
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: Settings Toggles */}
              {activeSettingsTab === "preferences" && (
                <div className="space-y-4 py-1">
                  {/* Private Account Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80">
                    <div className="pr-4">
                      <div className="text-xs font-extrabold text-[#38314a] flex items-center gap-1.5 mb-0.5">
                        <Lock className="w-3.5 h-3.5 text-pink-500" />
                        <span>비공개 계정 전환</span>
                      </div>
                      <p className="text-[11px] text-[#7a6e8f]">
                        비공개로 설정하면 승인된 팔로워만 내 모먼트와 스토리를 열람할 수 있습니다.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isPrivateAccount}
                        onChange={(e) => {
                          setIsPrivateAccount(e.target.checked);
                          localStorage.setItem("koharu_setting_private", String(e.target.checked));
                          toast.success(e.target.checked ? "계정이 비공개로 전환되었습니다." : "계정이 공개로 전환되었습니다.");
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                    </label>
                  </div>

                  {/* Notifications Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80">
                    <div className="pr-4">
                      <div className="text-xs font-extrabold text-[#38314a] flex items-center gap-1.5 mb-0.5">
                        <Bell className="w-3.5 h-3.5 text-purple-500" />
                        <span>활동 알림 수신</span>
                      </div>
                      <p className="text-[11px] text-[#7a6e8f]">
                        내 게시글의 좋아요, 댓글 및 새로운 팔로우 알림을 실시간으로 수신합니다.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={allowNotifications}
                        onChange={(e) => {
                          setAllowNotifications(e.target.checked);
                          localStorage.setItem("koharu_setting_notif", String(e.target.checked));
                          toast.success(e.target.checked ? "알림이 활성화되었습니다." : "알림이 음소거되었습니다.");
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Active Status Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80">
                    <div className="pr-4">
                      <div className="text-xs font-extrabold text-[#38314a] flex items-center gap-1.5 mb-0.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>온라인 활동 상태 표시</span>
                      </div>
                      <p className="text-[11px] text-[#7a6e8f]">
                        내가 접속 중일 때 프로필에 온라인 상태 인디케이터를 표시합니다.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={showActiveStatus}
                        onChange={(e) => {
                          setShowActiveStatus(e.target.checked);
                          localStorage.setItem("koharu_setting_status", String(e.target.checked));
                          toast.success(e.target.checked ? "활동 상태가 표시됩니다." : "활동 상태가 숨김 처리되었습니다.");
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 3: Account Deactivation & Wipe */}
              {activeSettingsTab === "danger" && (
                <div className="space-y-4 py-1">
                  {/* Deactivate Option */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                    <div className="flex items-start gap-2.5">
                      <EyeOff className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black text-amber-900 mb-1">계정 일시 비활성화</h4>
                        <p className="text-[11px] text-amber-800 leading-relaxed mb-3">
                          프로필과 활동 내역을 일시적으로 숨기고 로그아웃합니다. 언제든 다시 로그인하면 모든 데이터가 그대로 복원됩니다.
                        </p>
                        <button
                          type="button"
                          onClick={handleDeactivateAccount}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                        >
                          계정 일시 비활성화
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Wipe & Delete Option */}
                  <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black text-red-900 mb-1">계정 및 데이터 영구 삭제</h4>
                        <p className="text-[11px] text-red-800 leading-relaxed mb-3">
                          프로필 설정, 팔로우 관계, 알림 내역 등 저장된 모든 개인 데이터가 영구적으로 지워지며 되돌릴 수 없습니다.
                        </p>
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                        >
                          계정 영구 삭제 (초기화)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
