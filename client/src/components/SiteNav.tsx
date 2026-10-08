import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BookOpen,
  Calendar,
  FolderGit2,
  Heart,
  Home,
  Mail,
  MessageSquare,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";

interface SiteNavProps {
  active?: string;
}

export default function SiteNav({ active }: SiteNavProps) {
  const [location] = useLocation();
  const currentPath = active || location;
  const [latestPost, setLatestPost] = useState<{ title: string; slug: string; category: string } | null>(null);

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
        // Fallback default notice
        setLatestPost({
          title: "✨ koharu.live v2.0 오픈! 인스타그램 스타일 블로그와 새로운 기능들을 만나보세요.",
          slug: "koharu-live-v2-announcement",
          category: "notice",
        });
      });
  }, []);

  const navLinks = [
    { href: "/profile.html", label: "메인", icon: Home },
    { href: "/projects.html", label: "프로젝트", icon: FolderGit2 },
    { href: "/history.html", label: "히스토리", icon: Calendar },
    { href: "/letter.html", label: "편지", icon: Mail },
    { href: "/partners.html", label: "파트너", icon: Users },
    { href: "/person.html", label: "지인", icon: UserCheck },
    { href: "/board.html", label: "게시판", icon: MessageSquare },
    { href: "/ai.html", label: "AI", icon: Sparkles },
    { href: "/blog.html", label: "블로그", icon: BookOpen },
  ];

  return (
    <>
      {/* Ambient glowing background with orbs and sparkles */}
      <div className="ambient-background" aria-hidden="true">
        <span className="ambient-orb ambient-orb-one" />
        <span className="ambient-orb ambient-orb-two" />
        <span className="ambient-orb ambient-orb-three" />
        <span className="ambient-spark spark-one">✦</span>
        <span className="ambient-spark spark-two">✧</span>
        <span className="ambient-spark spark-three">·</span>
      </div>

      {/* Topbar */}
      <div className="topbar-wrapper">
        <header className="topbar">
          <Link href="/profile.html" className="brand" aria-label="! Koharu 홈으로">
            <img className="brand-avatar" src="/assets/koharu-profile.png" alt="! Koharu 프로필" />
            <div className="brand-text">
              <span className="brand-name-ko">! Koharu</span>
              <span className="brand-name-en">koharu.live</span>
            </div>
          </Link>

          <nav className="main-nav" aria-label="주요 메뉴">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPath === item.href ||
                (item.href === "/profile.html" && (currentPath === "/" || currentPath === "/profile")) ||
                (item.href === "/projects.html" && currentPath.startsWith("/project")) ||
                (item.href === "/blog.html" && currentPath.startsWith("/blog"));

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
        </header>

        {/* Floating Notice Bar */}
        <Link
          href={latestPost ? `/blog/${latestPost.slug}.html` : "/blog.html"}
          className="notice-bar"
        >
          <span className="notice-badge">블로그</span>
          <span className="notice-text">
            {latestPost ? latestPost.title : "새 소식을 불러오는 중… 🌸"}
          </span>
          <span className="notice-more">
            전체 보기 →
          </span>
        </Link>
      </div>
    </>
  );
}
