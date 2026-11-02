import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BookOpen,
  Calendar,
  Camera,
  FolderGit2,
  Home,
  Link2,
  Mail,
  Menu,
  Sparkles,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useAppAuth } from "@/contexts/AuthContext";

interface SiteNavProps {
  active?: string;
}

export default function SiteNav({ active }: SiteNavProps) {
  const [location] = useLocation();
  const currentPath = active || location;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [latestPost, setLatestPost] = useState<{ title: string; slug: string; category: string } | null>(null);
  const { user } = useAppAuth();

  useEffect(() => {
    // Fetch latest post for notice bar
    fetch("/api/posts?limit=1")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.posts && data.posts.length > 0) {
          setLatestPost(data.posts[0]);
        }
      })
      .catch(() => {
        setLatestPost(null);
      });
  }, []);

  // Close mobile menu on path change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { href: "/profile", label: "메인", icon: Home },
    { href: "/moments", label: "모먼트", icon: Camera },
    { href: "/blog", label: "블로그", icon: BookOpen },
    { href: "/projects", label: "프로젝트", icon: FolderGit2 },
    { href: "/history", label: "히스토리", icon: Calendar },
    { href: "/letter", label: "편지", icon: Mail },
    { href: "/partners", label: "파트너", icon: Users },
    { href: "/person", label: "지인", icon: UserCheck },
    { href: "/shorten", label: "단축", icon: Link2 },
  ];

  return (
    <>
      {/* Ambient background with orbs and sparkles */}
      <div className="ambient-background" aria-hidden="true">
        <span className="ambient-orb ambient-orb-one" />
        <span className="ambient-orb ambient-orb-two" />
        <span className="ambient-orb ambient-orb-three" />
        <span className="ambient-spark spark-one">+</span>
        <span className="ambient-spark spark-two">+</span>
        <span className="ambient-spark spark-three">·</span>
      </div>

      {/* Topbar Wrapper */}
      <div className="topbar-wrapper">
        <header className="topbar">
          <Link href="/profile" className="brand" aria-label="! Koharu 홈으로">
            <img className="brand-avatar" src="/assets/koharu-profile.png" alt="! Koharu 프로필" />
            <div className="brand-text">
              <span className="brand-name-ko">! Koharu</span>
              <span className="brand-name-en">koharu.live</span>
            </div>
          </Link>

          {/* Desktop Navigation (Protected from horizontal overflow on smaller screens) */}
          <nav className="main-nav hidden xl:flex overflow-x-auto scrollbar-none" aria-label="주요 메뉴">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPath === item.href ||
                currentPath === `${item.href}.html` ||
                (item.href === "/profile" && (currentPath === "/" || currentPath === "/profile" || currentPath === "/profile.html" || currentPath === "/index.html")) ||
                (item.href === "/moments" && (currentPath.startsWith("/moments") || currentPath.startsWith("/instagram") || currentPath.startsWith("/@"))) ||
                (item.href === "/blog" && currentPath.startsWith("/blog")) ||
                (item.href === "/projects" && currentPath.startsWith("/project")) ||
                (item.href === "/shorten" && (currentPath.startsWith("/shorten") || currentPath.startsWith("/s")));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive ? "active" : ""}`}
                >
                  <Icon className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Controls & Mobile Toggle */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 pl-2">
                <img
                  src={user.avatar || "/assets/koharu-profile.png"}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-pink-300"
                />
                <span className="text-xs font-bold text-[#38314a] hidden sm:inline max-w-[90px] truncate">
                  {user.name}
                </span>
                {user.isAdmin && (
                  <span className="text-[10px] bg-gradient-to-r from-pink-500 to-purple-500 text-white font-extrabold px-1.5 py-0.5 rounded-full shadow-xs">
                    Admin
                  </span>
                )}
              </div>
            ) : null}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-[#38314a] hover:bg-pink-100/60 transition cursor-pointer"
              aria-label="모바일 메뉴 열기"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden px-4 pt-2 pb-4 bg-white/95 backdrop-blur-xl border-b border-pink-200/80 shadow-xl animate-in slide-in-from-top-4 duration-200">
            <nav className="grid grid-cols-3 gap-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentPath === item.href ||
                  (item.href === "/profile" && currentPath === "/") ||
                  (item.href === "/moments" && (currentPath.startsWith("/moments") || currentPath.startsWith("/instagram"))) ||
                  (item.href === "/blog" && currentPath.startsWith("/blog"));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl text-xs font-bold transition ${
                      isActive
                        ? "bg-pink-500 text-white shadow-md shadow-pink-500/20"
                        : "bg-pink-50/50 text-[#38314a] hover:bg-pink-100/70"
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Floating Notice Bar (Only shown when an actual post exists) */}
        {latestPost && latestPost.title && (
          <Link
            href={latestPost.slug ? `/moments?post=${latestPost.slug}` : "/moments"}
            className="notice-bar"
          >
            <span className="notice-badge">소식</span>
            <span className="notice-text">{latestPost.title}</span>
            <span className="notice-more">피드 보기 →</span>
          </Link>
        )}
      </div>

      {/* Mobile Floating Bottom Bar for quick navigation on phone */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-pink-200/80 px-4 py-2 flex items-center justify-around shadow-lg">
        <Link
          href="/profile"
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
            currentPath === "/" || currentPath.startsWith("/profile") ? "text-pink-600" : "text-gray-500"
          }`}
        >
          <Home className="w-4 h-4" />
          <span>홈</span>
        </Link>
        <Link
          href="/moments"
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
            currentPath.startsWith("/moments") || currentPath.startsWith("/instagram") ? "text-pink-600" : "text-gray-500"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>모먼트</span>
        </Link>
        <Link
          href="/blog"
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
            currentPath.startsWith("/blog") ? "text-pink-600" : "text-gray-500"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>블로그</span>
        </Link>
        <Link
          href="/projects"
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
            currentPath.startsWith("/projects") ? "text-pink-600" : "text-gray-500"
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>프로젝트</span>
        </Link>
        <Link
          href="/shorten"
          className={`flex flex-col items-center gap-0.5 text-[11px] font-bold ${
            currentPath.startsWith("/shorten") ? "text-pink-600" : "text-gray-500"
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>단축</span>
        </Link>
      </div>
    </>
  );
}
