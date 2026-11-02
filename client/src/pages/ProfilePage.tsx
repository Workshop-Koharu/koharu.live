import { useEffect, useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft,
  Camera,
  Check,
  Code2,
  Copy,
  Edit3,
  ExternalLink,
  Globe,
  Grid,
  Heart,
  ImageIcon,
  LayoutGrid,
  List,
  Mail,
  MessageCircle,
  Palette,
  Plus,
  QrCode,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Tag,
  User,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";
import { QRButton } from "@/components/QRCodeModal";
import { useAppAuth } from "@/contexts/AuthContext";
import {
  fetchAllPosts,
  Post,
} from "@/lib/remoteDb";

import { compressImageFile } from "@/lib/imageCompressor";

interface ProfileCustomConfig {
  name: string;
  handle: string;
  bio: string;
  statusQuote: string;
  avatarUrl: string;
  bannerUrl: string;
  themeColor: string; // Hex color code
  techTags: string[];
  githubUrl?: string;
  websiteUrl?: string;
  discordId?: string;
}

// Clean default profile config: Zero hardcoded fake data or template values
const DEFAULT_PROFILE_CONFIG: ProfileCustomConfig = {
  name: "",
  handle: "",
  bio: "",
  statusQuote: "",
  avatarUrl: "",
  bannerUrl: "",
  themeColor: "#ec4899", // Pink
  techTags: [],
  githubUrl: "",
  websiteUrl: "",
  discordId: "",
};

const THEME_COLORS = [
  { name: "Sakura Pink", color: "#ec4899" },
  { name: "Neon Violet", color: "#8b5cf6" },
  { name: "Cyber Blue", color: "#3b82f6" },
  { name: "Mint Emerald", color: "#10b981" },
  { name: "Amber Sunset", color: "#f59e0b" },
  { name: "Ruby Crimson", color: "#e11d48" },
];

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const [, paramsProfile] = useRoute("/profile/:handle");
  const [, paramsU] = useRoute("/u/:handle");
  const [, paramsUser] = useRoute("/user/:handle");

  const { user, updateUserProfile } = useAppAuth();
  const rawHandle =
    paramsProfile?.handle ||
    paramsU?.handle ||
    paramsUser?.handle ||
    (user?.email ? user.email.split("@")[0] : "");
  const cleanHandle = rawHandle.replace(/^@/, "").toLowerCase();

  const [profile, setProfile] = useState<ProfileCustomConfig>(() => {
    try {
      const storageKey = cleanHandle ? `koharu_profile_v3_${cleanHandle}` : "koharu_profile_settings";
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const discordId = parsed.discordId === "1339604814631534667" ? "" : (parsed.discordId || "");
        return {
          ...DEFAULT_PROFILE_CONFIG,
          ...parsed,
          discordId,
        };
      }

      const generalSaved = localStorage.getItem("koharu_profile_settings");
      if (generalSaved) {
        const parsed = JSON.parse(generalSaved);
        const discordId = parsed.discordId === "1339604814631534667" ? "" : (parsed.discordId || "");
        return {
          ...DEFAULT_PROFILE_CONFIG,
          name: parsed.name || user?.name || "",
          bio: parsed.bio || "",
          avatarUrl: parsed.avatarUrl || user?.avatar || "",
          githubUrl: parsed.githubUrl || "",
          websiteUrl: parsed.websiteUrl || "",
          discordId,
          handle: parsed.handle || (user?.email ? user.email.split("@")[0] : ""),
        };
      }
    } catch {}
    return {
      ...DEFAULT_PROFILE_CONFIG,
      name: user?.name || "",
      avatarUrl: user?.avatar || "",
      handle: user?.email ? user.email.split("@")[0] : "",
      discordId: "",
    };
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");
  const [viewMode, setViewMode] = useState<"grid" | "feed">("grid");

  // Following state
  const [isFollowing, setIsFollowing] = useState<boolean>(() => {
    try {
      const follows = JSON.parse(localStorage.getItem("koharu_following_users") || "[]");
      return follows.includes(cleanHandle);
    } catch {
      return false;
    }
  });

  // Customization Modal State
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editHandle, setEditHandle] = useState(profile.handle);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editStatusQuote, setEditStatusQuote] = useState(profile.statusQuote);
  const [editAvatar, setEditAvatar] = useState(profile.avatarUrl);
  const [editBanner, setEditBanner] = useState(profile.bannerUrl);
  const [editThemeColor, setEditThemeColor] = useState(profile.themeColor);
  const [editTagsInput, setEditTagsInput] = useState(profile.techTags.join(", "));
  const [editGithub, setEditGithub] = useState(profile.githubUrl || "");
  const [editWebsite, setEditWebsite] = useState(profile.websiteUrl || "");
  const [editDiscordId, setEditDiscordId] = useState(profile.discordId || "");

  const [copiedLink, setCopiedLink] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Check if this is the authenticated user's own profile
  const isOwnProfile =
    Boolean(user) &&
    (cleanHandle === "me" ||
      cleanHandle === (user?.name || "").toLowerCase().replace(/\s+/g, "") ||
      cleanHandle === (profile.name || "").toLowerCase().replace(/\s+/g, "") ||
      cleanHandle === profile.handle.toLowerCase());

  useEffect(() => {
    loadUserPosts();
  }, [cleanHandle]);

  const loadUserPosts = async () => {
    setLoading(true);
    try {
      const all = await fetchAllPosts();
      setPosts(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = () => {
    try {
      const current = JSON.parse(localStorage.getItem("koharu_following_users") || "[]") as string[];
      let updated: string[];
      if (isFollowing) {
        updated = current.filter((h) => h !== cleanHandle);
        setIsFollowing(false);
        toast.info(`@${profile.handle}님을 언팔로우했습니다.`);
      } else {
        updated = [...current, cleanHandle];
        setIsFollowing(true);
        toast.success(`@${profile.handle}님을 팔로우했습니다.`);
      }
      localStorage.setItem("koharu_following_users", JSON.stringify(updated));
    } catch {}
  };

  // Avatar file upload handler with auto compression
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 400, 0.85);
      if (compressed) {
        setEditAvatar(compressed);
      }
    } catch (err) {
      console.error(err);
    }
    e.target.value = "";
  };

  // Banner file upload handler with auto compression
  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 1200, 0.82);
      if (compressed) {
        setEditBanner(compressed);
      }
    } catch (err) {
      console.error(err);
    }
    e.target.value = "";
  };

  // Save Customization
  const handleSaveCustomization = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedTags = editTagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    const updatedConfig: ProfileCustomConfig = {
      name: editName.trim() || profile.name,
      handle: editHandle.trim().replace(/^@/, "") || profile.handle,
      bio: editBio.trim(),
      statusQuote: editStatusQuote.trim(),
      avatarUrl: editAvatar.trim() || profile.avatarUrl,
      bannerUrl: editBanner.trim(),
      themeColor: editThemeColor || profile.themeColor,
      techTags: parsedTags.length > 0 ? parsedTags : profile.techTags,
      githubUrl: editGithub.trim(),
      websiteUrl: editWebsite.trim(),
      discordId: editDiscordId.trim(),
    };

    setProfile(updatedConfig);
    localStorage.setItem(`koharu_profile_v3_${cleanHandle}`, JSON.stringify(updatedConfig));
    localStorage.setItem(
      "koharu_profile_settings",
      JSON.stringify({
        name: updatedConfig.name,
        bio: updatedConfig.bio,
        avatarUrl: updatedConfig.avatarUrl,
        githubUrl: updatedConfig.githubUrl,
        websiteUrl: updatedConfig.websiteUrl,
      })
    );

    if (isOwnProfile && user) {
      updateUserProfile({
        name: updatedConfig.name,
        avatar: updatedConfig.avatarUrl,
      });
    }

    setIsCustomizeOpen(false);
    toast.success("프로필 커스터마이징이 저장되었습니다.");
  };

  const copyProfileShareUrl = () => {
    const fullUrl = `${window.location.origin}/profile/${profile.handle}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    toast.success("프로필 공유 링크가 클립보드에 복사되었습니다.");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen pb-24">
      <SiteNav active="/moments" />

      <main className="page-container max-w-4xl mx-auto px-4 pt-4">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setLocation("/moments")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> 모먼트 피드로 돌아가기
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={copyProfileShareUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-xs font-bold text-[#38314a] hover:bg-pink-50 transition cursor-pointer shadow-xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "복사됨" : "프로필 공유"}</span>
            </button>
            <QRButton
              url={`${window.location.origin}/profile/${profile.handle}`}
              label={`${profile.name} 프로필`}
            />
          </div>
        </div>

        {/* ── Standalone Profile Header Card ───────────────────────────────── */}
        <div className="glass-card !p-0 rounded-3xl overflow-hidden border border-pink-100 shadow-xl bg-white mb-8">
          {/* Custom Banner / Cover Image */}
          <div
            className="h-36 sm:h-48 w-full relative overflow-hidden flex items-center justify-center"
            style={{
              background: profile.bannerUrl
                ? `url(${profile.bannerUrl}) center/cover no-repeat`
                : `linear-gradient(135deg, ${profile.themeColor}33 0%, #fae8ff 50%, #ffffff 100%)`,
            }}
          >
            {isOwnProfile && (
              <button
                onClick={() => {
                  setEditName(profile.name);
                  setEditHandle(profile.handle);
                  setEditBio(profile.bio);
                  setEditStatusQuote(profile.statusQuote);
                  setEditAvatar(profile.avatarUrl);
                  setEditBanner(profile.bannerUrl);
                  setEditThemeColor(profile.themeColor);
                  setEditTagsInput(profile.techTags.join(", "));
                  setIsCustomizeOpen(true);
                }}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-xs font-bold text-[#38314a] shadow-md flex items-center gap-1.5 cursor-pointer backdrop-blur-xs transition"
              >
                <Palette className="w-3.5 h-3.5 text-pink-600" />
                <span>프로필 꾸미기</span>
              </button>
            )}
          </div>

          {/* Profile Bio & Controls Area */}
          <div className="p-6 sm:p-8 pt-0 relative">
            {/* Avatar & Main Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-5">
              {/* Avatar with Status Ring */}
              <div className="relative">
                <div
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 shadow-xl flex items-center justify-center bg-white"
                  style={{ border: `3px solid ${profile.themeColor}` }}
                >
                  <img
                    src={profile.avatarUrl || "/assets/koharu-profile.png"}
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <span className="absolute bottom-1 right-2 w-6 h-6 rounded-full bg-emerald-500 border-3 border-white flex items-center justify-center text-white shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-center sm:self-end">
                {isOwnProfile ? (
                  <button
                    onClick={() => {
                      setEditName(profile.name);
                      setEditHandle(profile.handle);
                      setEditBio(profile.bio);
                      setEditStatusQuote(profile.statusQuote);
                      setEditAvatar(profile.avatarUrl);
                      setEditBanner(profile.bannerUrl);
                      setEditThemeColor(profile.themeColor);
                      setEditTagsInput(profile.techTags.join(", "));
                      setIsCustomizeOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white text-xs font-bold shadow-md shadow-pink-500/25 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-4 h-4" /> 프로필 편집 & 꾸미기
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleToggleFollow}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                        isFollowing
                          ? "bg-gray-100 text-[#38314a] hover:bg-gray-200"
                          : "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 shadow-pink-500/20"
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4" /> 팔로잉
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" /> 팔로우
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        toast.info(`@${profile.handle}님과의 1:1 DM을 준비 중입니다.`);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white border border-pink-200 text-[#38314a] hover:bg-pink-50 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4 text-pink-500" /> 메시지
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Profile Info Details */}
            <div className="space-y-3 text-center sm:text-left">
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#38314a]">
                    {profile.name}
                  </h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-extrabold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> 인증된 프로필
                  </span>
                </div>
                <p className="text-xs font-bold text-pink-600 mt-0.5">@{profile.handle}</p>
              </div>

              {/* Status Slogan / Quote */}
              {profile.statusQuote && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50/70 border border-pink-100 text-xs font-semibold text-[#5a4c66]">
                  <MessageCircle className="w-3.5 h-3.5 text-pink-500" />
                  <span>{profile.statusQuote}</span>
                </div>
              )}

              {/* Bio */}
              <p className="text-xs sm:text-sm text-[#4a3952] leading-relaxed max-w-2xl whitespace-pre-line">
                {profile.bio}
              </p>

              {/* Tech Stack Tags */}
              {profile.techTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 justify-center sm:justify-start">
                  {profile.techTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-[#38314a] border border-gray-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Social / External Links */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#7a6e8f] justify-center sm:justify-start">
                {profile.githubUrl && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-pink-600 flex items-center gap-1 font-semibold"
                  >
                    <Code2 className="w-3.5 h-3.5" /> GitHub
                  </a>
                )}
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-pink-600 flex items-center gap-1 font-semibold"
                  >
                    <Globe className="w-3.5 h-3.5" /> {profile.websiteUrl.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {profile.discordId && (
                  <a
                    href={`https://discord.com/users/${profile.discordId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-indigo-600 flex items-center gap-1 font-semibold"
                  >
                    <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    Discord
                  </a>
                )}
              </div>

              {/* Stats Bar */}
              <div className="flex items-center gap-6 pt-3 border-t border-pink-50 justify-center sm:justify-start">
                <div>
                  <span className="font-black text-sm text-[#38314a]">{posts.length}</span>
                  <span className="text-xs text-[#7a6e8f] ml-1">게시물</span>
                </div>
                <div>
                  <span className="font-black text-sm text-[#38314a]">
                    {isFollowing ? "1" : "0"}
                  </span>
                  <span className="text-xs text-[#7a6e8f] ml-1">팔로워</span>
                </div>
                <div>
                  <span className="font-black text-sm text-[#38314a]">0</span>
                  <span className="text-xs text-[#7a6e8f] ml-1">팔로잉</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content View Tabs & Switcher ─────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-pink-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("posts")}
              className={`pb-2 text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "posts"
                  ? "text-pink-600 border-b-2 border-pink-600"
                  : "text-[#7a6e8f] hover:text-[#38314a]"
              }`}
            >
              <Grid className="w-4 h-4" /> 게시물 ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`pb-2 text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "about"
                  ? "text-pink-600 border-b-2 border-pink-600"
                  : "text-[#7a6e8f] hover:text-[#38314a]"
              }`}
            >
              <User className="w-4 h-4" /> 정보 및 소개
            </button>
          </div>

          {activeTab === "posts" && (
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-pink-600 shadow-xs" : "text-gray-400"
                }`}
                title="그리드 보기"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("feed")}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  viewMode === "feed" ? "bg-white text-pink-600 shadow-xs" : "text-gray-400"
                }`}
                title="피드 보기"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Tab Content ──────────────────────────────────────────────────── */}
        {activeTab === "posts" ? (
          loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 mx-auto border-3 border-pink-200 border-t-pink-600 rounded-full animate-spin mb-3" />
              <p className="text-xs font-bold text-[#7a6e8f]">게시글을 불러오는 중...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="glass-card text-center py-20 !p-8">
              <div className="w-16 h-16 rounded-3xl bg-pink-100 text-pink-600 flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#38314a]">등록된 게시물이 없습니다</h3>
              <p className="text-xs text-[#7a6e8f] mt-1">
                새로운 모먼트를 작성하면 여기에 표시됩니다.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {posts.map((post) => {
                const firstMedia = (post.coverUrl || "").split("|||")[0] || "/assets/koharu-profile.png";
                const isVid = firstMedia.startsWith("data:video") || /\.(mp4|webm|mov)$/i.test(firstMedia);

                return (
                  <div
                    key={post.id}
                    onClick={() => setLocation(`/moment/${post.id}`)}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-pink-100 group cursor-pointer shadow-xs hover:shadow-md transition duration-300"
                  >
                    {isVid ? (
                      <video src={firstMedia} className="w-full h-full object-cover" muted />
                    ) : (
                      <img
                        src={firstMedia}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-extrabold text-sm">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4 fill-white" /> {post.likesCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4 fill-white" /> 0
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-5 max-w-lg mx-auto">
              {posts.map((post) => {
                const mediaItems = (post.coverUrl || "").split("|||").filter(Boolean);
                const first = mediaItems[0] || "/assets/koharu-profile.png";
                const isVid = first.startsWith("data:video") || /\.(mp4|webm|mov)$/i.test(first);

                return (
                  <article
                    key={post.id}
                    onClick={() => setLocation(`/moment/${post.id}`)}
                    className="glass-card !p-5 rounded-3xl border border-pink-100 shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <img
                        src={post.authorAvatar || "/assets/koharu-profile.png"}
                        alt={post.authorName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-[#38314a]">{post.authorName}</div>
                        <div className="text-[10px] text-gray-400">
                          {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                        </div>
                      </div>
                    </div>

                    <div className="aspect-square rounded-2xl overflow-hidden bg-black mb-3">
                      {isVid ? (
                        <video src={first} controls className="w-full h-full object-contain" />
                      ) : (
                        <img src={first} alt={post.title} className="w-full h-full object-cover" />
                      )}
                    </div>

                    <p className="text-xs text-[#38314a] leading-relaxed line-clamp-3">
                      {post.caption || post.content}
                    </p>
                  </article>
                );
              })}
            </div>
          )
        ) : (
          /* ── About Tab ──────────────────────────────────────────────────── */
          <div className="glass-card !p-6 sm:!p-8 rounded-3xl border border-pink-100 shadow-md space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-[#38314a] mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-600" /> 상세 프로필 소개
              </h3>
              <p className="text-xs sm:text-sm text-[#5a4c66] leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-[#38314a] mb-2 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-600" /> 보유 기술 스택 & 관심 영역
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.techTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Profile Customization Modal (Own Profile Only) ──────────────── */}
        {isCustomizeOpen && isOwnProfile && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in select-none"
            onClick={() => setIsCustomizeOpen(false)}
          >
            <div
              className="bg-white rounded-[28px] max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-pink-100 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-pink-100/70 mb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#38314a]">프로필 커스터마이징</h3>
                    <p className="text-[11px] text-[#7a6e8f]">내 프로필 화면에 표시될 정보를 자유롭게 설정하세요.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCustomizeOpen(false)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomization} className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* 1. Theme Color Selector */}
                <div className="p-3 rounded-2xl bg-pink-50/50 border border-pink-100/60">
                  <label className="block text-xs font-bold text-[#38314a] mb-2">테마 포인트 색상</label>
                  <div className="flex items-center gap-2.5">
                    {THEME_COLORS.map((tc) => (
                      <button
                        key={tc.color}
                        type="button"
                        onClick={() => setEditThemeColor(tc.color)}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer shadow-xs ${
                          editThemeColor === tc.color ? "scale-125 ring-2 ring-offset-2 ring-pink-500" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: tc.color }}
                        title={tc.name}
                      />
                    ))}
                  </div>
                </div>

                {/* 2. Banner & Avatar Upload via File Manager */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Banner Upload */}
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <label className="block text-xs font-bold text-[#38314a] mb-1.5">
                      배너 커버 사진
                    </label>
                    <input
                      type="file"
                      ref={bannerInputRef}
                      accept="image/*"
                      onChange={handleBannerSelect}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-xs font-bold text-pink-700 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-pink-500" /> 파일 선택
                      </button>
                      {editBanner && (
                        <button
                          type="button"
                          onClick={() => setEditBanner("")}
                          className="text-xs text-red-500 hover:underline cursor-pointer"
                        >
                          초기화
                        </button>
                      )}
                    </div>
                    {editBanner && (
                      <div className="mt-2 h-14 w-full rounded-xl overflow-hidden border border-pink-200 shadow-xs">
                        <img src={editBanner} alt="Banner Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Avatar Upload */}
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <label className="block text-xs font-bold text-[#38314a] mb-1.5">
                      프로필 아바타
                    </label>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      accept="image/*"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-xs font-bold text-pink-700 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <User className="w-3.5 h-3.5 text-pink-500" /> 파일 선택
                      </button>
                      {editAvatar && (
                        <button
                          type="button"
                          onClick={() => setEditAvatar("")}
                          className="text-xs text-red-500 hover:underline cursor-pointer"
                        >
                          초기화
                        </button>
                      )}
                    </div>
                    {editAvatar && (
                      <div className="mt-2 w-12 h-12 rounded-full overflow-hidden border-2 border-pink-200 shadow-xs">
                        <img src={editAvatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Display Name & Handle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#38314a] mb-1">표시 이름</label>
                    <input
                      type="text"
                      placeholder="이름 (예: 코하루)"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-pink-500 focus:ring-2 focus:ring-pink-100 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#38314a] mb-1">고유 핸들 (@)</label>
                    <input
                      type="text"
                      placeholder="핸들 아이디 (예: my_handle)"
                      value={editHandle}
                      onChange={(e) => setEditHandle(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-pink-500 focus:ring-2 focus:ring-pink-100 bg-white"
                    />
                  </div>
                </div>

                {/* 4. Status Quote */}
                <div>
                  <label className="block text-xs font-bold text-[#38314a] mb-1">한 줄 상태 메시지</label>
                  <input
                    type="text"
                    placeholder="프로필에 노출될 한 줄 메시지를 입력하세요 (선택)"
                    value={editStatusQuote}
                    onChange={(e) => setEditStatusQuote(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-pink-500 focus:ring-2 focus:ring-pink-100 bg-white"
                  />
                </div>

                {/* 5. Bio */}
                <div>
                  <label className="block text-xs font-bold text-[#38314a] mb-1">소개글 (Bio)</label>
                  <textarea
                    rows={2}
                    placeholder="본인을 소개하는 글을 자유롭게 작성해보세요 (선택)"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-pink-500 focus:ring-2 focus:ring-pink-100 bg-white resize-none"
                  />
                </div>

                {/* 6. Tech Stack Tags */}
                <div>
                  <label className="block text-xs font-bold text-[#38314a] mb-1">
                    기술 태그 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    placeholder="예: 언리얼5, Unity, C++, HLSL (선택)"
                    value={editTagsInput}
                    onChange={(e) => setEditTagsInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-pink-500 focus:ring-2 focus:ring-pink-100 bg-white"
                  />
                </div>

                {/* 7. Links & Socials */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#38314a] mb-1">GitHub 링크 (선택)</label>
                    <input
                      type="url"
                      placeholder="https://github.com/아이디"
                      value={editGithub}
                      onChange={(e) => setEditGithub(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-pink-500 focus:ring-2 focus:ring-pink-100 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#38314a] mb-1">웹사이트 링크 (선택)</label>
                    <input
                      type="url"
                      placeholder="https://내사이트.com"
                      value={editWebsite}
                      onChange={(e) => setEditWebsite(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-pink-500 focus:ring-2 focus:ring-pink-100 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#38314a] mb-1">Discord 사용자 ID (선택)</label>
                    <input
                      type="text"
                      placeholder="비워두면 비활성화"
                      value={editDiscordId}
                      onChange={(e) => setEditDiscordId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-pink-500 focus:ring-2 focus:ring-pink-100 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-pink-100/70 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCustomizeOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-100 transition cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-extrabold shadow-md shadow-pink-500/25 hover:opacity-95 transition cursor-pointer"
                  >
                    저장 완료
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

