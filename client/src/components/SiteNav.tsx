import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Calendar,
  Camera,
  FolderGit2,
  Home,
  Link2,
  Mail,
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
          title: "✨ koharu.live 인스타그램 피드에 오신 것을 환영합니다! 🌸",
          slug: "",
          category: "instagram",
        });
      });
  }, []);

  const navLinks = [
    { href: "/profile", label: "메인", icon: Home },
    { href: "/projects", label: "프로젝트", icon: FolderGit2 },
    { href: "/history", label: "히스토리", icon: Calendar },
    { href: "/letter", label: "편지", icon: Mail },
    { href: "/partners", label: "파트너", icon: Users },
    { href: "/person", label: "지인", icon: UserCheck },
    { href: "/instagram", label: "인스타그램", icon: Camera },
    { href: "/shorten", label: "단축", icon: Link2 },
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
          <Link href="/profile" className="brand" aria-label="! Koharu 홈으로">
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
                currentPath === `${item.href}.html` ||
                (item.href === "/profile" && (currentPath === "/" || currentPath === "/profile" || currentPath === "/profile.html" || currentPath === "/index.html")) ||
                (item.href === "/projects" && currentPath.startsWith("/project")) ||
                (item.href === "/shorten" && (currentPath.startsWith("/shorten") || currentPath.startsWith("/s"))) ||
                (item.href === "/instagram" && (currentPath.startsWith("/instagram") || currentPath.startsWith("/@") || currentPath.startsWith("/blog") || currentPath.startsWith("/board")));

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
          href={latestPost && latestPost.slug ? `/instagram/${latestPost.slug}` : "/instagram"}
          className="notice-bar"
        >
          <span className="notice-badge">인스타그램</span>
          <span className="notice-text">
            {latestPost ? latestPost.title : "새 소식을 확인해보세요 🌸"}
          </span>
          <span className="notice-more">
            피드 보기 →
          </span>
        </Link>
      </div>
    </>
  );
}
