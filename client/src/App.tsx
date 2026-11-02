import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import MomentsPage from "./pages/MomentsPage";
import TechBlogPage from "./pages/TechBlogPage";
import DiscordCallbackPage from "./pages/DiscordCallbackPage";
import ContactPage from "./pages/ContactPage";
import HistoryPage from "./pages/HistoryPage";
import Home from "./pages/Home";
import LetterPage from "./pages/LetterPage";
import NotFound from "./pages/NotFound";
import PartnersPage from "./pages/PartnersPage";
import PeoplePage from "./pages/PeoplePage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProjectsPage from "./pages/ProjectsPage";
import SkillsPage from "./pages/SkillsPage";
import UrlShortenerPage from "./pages/UrlShortenerPage";
import ProfilePage from "./pages/ProfilePage";
import PostDetailPage from "./pages/PostDetailPage";
import CherryBlossomParticles from "./components/CherryBlossomParticles";
import FloatingControls from "./components/FloatingControls";
import { fetchShortUrl, incrementShortUrlClicks } from "./lib/remoteDb";

function HandleRoute({ params }: { params: { handle?: string } }) {
  const raw = params?.handle || "";
  const decoded = decodeURIComponent(raw).trim();
  const clean = decoded.toLowerCase().replace(/\.html$/, "");
  const [checking, setChecking] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!clean) {
      setChecking(false);
      return;
    }

    // Check if clean matches a short URL
    fetchShortUrl(clean).then(async (target) => {
      if (!active) return;
      if (target) {
        setIsRedirecting(true);
        try {
          await incrementShortUrlClicks(clean);
        } catch {}
        window.location.replace(target);
      } else {
        setChecking(false);
      }
    });

    return () => {
      active = false;
    };
  }, [clean]);

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-[#c93b77]">
          단축 링크로 연결하는 중입니다... 🚀
        </p>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  // If handle starts with @ or %40 (e.g. /@koharu.live, /%40koharu.live) or is koharu
  if (
    decoded.startsWith("@") ||
    raw.startsWith("%40") ||
    decoded.toLowerCase() === "koharu.live" ||
    decoded.toLowerCase() === "koharu"
  ) {
    return <ProfilePage />;
  }

  // Known static/system routes that are not user profile handles
  const knownStaticPages = [
    "skills",
    "projects",
    "project",
    "history",
    "letter",
    "partners",
    "partner",
    "person",
    "people",
    "moments",
    "instagram",
    "blog",
    "board",
    "ai",
    "admin",
    "contact",
    "shorten",
    "s",
    "404",
    "api",
    "index",
    "auth",
  ];

  // If not a known static system page, route to ProfilePage!
  if (clean && !knownStaticPages.includes(clean)) {
    return <ProfilePage />;
  }

  return <NotFound />;
}

function Router() {
  return (
    <Switch>
      {/* Home */}
      <Route path="/" component={Home} />
      <Route path="/index.html" component={Home} />

      {/* Dedicated Standalone Profile Pages */}
      <Route path="/profile" component={ProfilePage} />
      <Route path="/profile.html" component={ProfilePage} />
      <Route path="/profile/:handle" component={ProfilePage} />
      <Route path="/u/:handle" component={ProfilePage} />
      <Route path="/user/:handle" component={ProfilePage} />

      {/* Koharu Moments (Feed) */}
      <Route path="/moments" component={MomentsPage} />
      <Route path="/moments.html" component={MomentsPage} />
      <Route path="/instagram" component={MomentsPage} />
      <Route path="/instagram.html" component={MomentsPage} />

      {/* Dedicated Moment & Post Share Links */}
      <Route path="/moment/:id" component={PostDetailPage} />
      <Route path="/moment/:id.html" component={PostDetailPage} />
      <Route path="/post/:slug" component={PostDetailPage} />
      <Route path="/post/:slug.html" component={PostDetailPage} />
      <Route path="/posts/:slug" component={PostDetailPage} />
      <Route path="/posts/:slug.html" component={PostDetailPage} />
      <Route path="/p/:slug" component={PostDetailPage} />
      <Route path="/p/:slug.html" component={PostDetailPage} />
      <Route path="/instagram/post/:slug" component={PostDetailPage} />
      <Route path="/instagram/p/:slug" component={PostDetailPage} />

      {/* Dedicated Tech Blog */}
      <Route path="/blog" component={TechBlogPage} />
      <Route path="/blog.html" component={TechBlogPage} />
      <Route path="/blog/:slug" component={TechBlogPage} />
      <Route path="/blog/:slug.html" component={TechBlogPage} />
      <Route path="/board" component={TechBlogPage} />
      <Route path="/board.html" component={TechBlogPage} />

      {/* Discord OAuth Callback */}
      <Route path="/auth/discord/callback" component={DiscordCallbackPage} />

      {/* Skills */}
      <Route path="/skills" component={SkillsPage} />
      <Route path="/skills.html" component={SkillsPage} />

      {/* Projects */}
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/projects.html" component={ProjectsPage} />
      <Route path="/project.html" component={ProjectsPage} />
      <Route path="/project/:slug" component={ProjectDetailPage} />
      <Route path="/project/:slug.html" component={ProjectDetailPage} />
      <Route path="/projects/:slug" component={ProjectDetailPage} />
      <Route path="/projects/:slug.html" component={ProjectDetailPage} />

      {/* History Timeline */}
      <Route path="/history" component={HistoryPage} />
      <Route path="/history.html" component={HistoryPage} />

      {/* Secret Letter */}
      <Route path="/letter" component={LetterPage} />
      <Route path="/letter.html" component={LetterPage} />

      {/* Partners */}
      <Route path="/partners" component={PartnersPage} />
      <Route path="/partners.html" component={PartnersPage} />
      <Route path="/partner.html" component={PartnersPage} />

      {/* People / Acquaintances */}
      <Route path="/person" component={PeoplePage} />
      <Route path="/person.html" component={PeoplePage} />
      <Route path="/people" component={PeoplePage} />

      {/* Admin */}
      <Route path="/admin" component={TechBlogPage} />
      <Route path="/admin.html" component={TechBlogPage} />

      {/* Contact */}
      <Route path="/contact" component={ContactPage} />
      <Route path="/contact.html" component={ContactPage} />

      {/* URL Shortener */}
      <Route path="/shorten" component={UrlShortenerPage} />
      <Route path="/shorten.html" component={UrlShortenerPage} />
      <Route path="/s" component={UrlShortenerPage} />
      <Route path="/s.html" component={UrlShortenerPage} />

      {/* Explicit Handle & Profile Routes */}
      <Route path="/@:handle" component={ProfilePage} />
      <Route path="/@koharu.live" component={ProfilePage} />
      <Route path="/%40koharu.live" component={ProfilePage} />
      <Route path="/koharu.live" component={ProfilePage} />
      <Route path="/koharu" component={ProfilePage} />
      <Route path="/:handle" component={HandleRoute} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster position="top-center" richColors />
            <CherryBlossomParticles />
            <Router />
            <FloatingControls />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
