import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import BlogAdminPage from "./pages/BlogAdminPage";
import BlogPage from "./pages/BlogPage";
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
import TetrisPage from "./pages/TetrisPage";
import UrlShortenerPage from "./pages/UrlShortenerPage";
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
    fetchShortUrl(clean).then((target) => {
      if (!active) return;
      if (target) {
        setIsRedirecting(true);
        incrementShortUrlClicks(clean);
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
    return <BlogPage />;
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
    "instagram",
    "blog",
    "board",
    "ai",
    "admin",
    "contact",
    "tetris",
    "shorten",
    "s",
    "404",
    "api",
    "index",
  ];

  // If not a known static system page, route to BlogPage profile!
  if (clean && !knownStaticPages.includes(clean)) {
    return <BlogPage />;
  }

  return <NotFound />;
}

function Router() {
  return (
    <Switch>
      {/* Home / Profile */}
      <Route path="/" component={Home} />
      <Route path="/profile" component={Home} />
      <Route path="/index.html" component={Home} />
      <Route path="/profile.html" component={Home} />

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

      {/* Instagram (Feed & Gallery, replacing board & blog) */}
      <Route path="/instagram" component={BlogPage} />
      <Route path="/instagram.html" component={BlogPage} />
      <Route path="/instagram/:slug" component={BlogPage} />
      <Route path="/instagram/:slug.html" component={BlogPage} />
      <Route path="/instagram/post/:slug" component={BlogPage} />
      <Route path="/instagram/p/:slug" component={BlogPage} />
      <Route path="/post/:slug" component={BlogPage} />
      <Route path="/post/:slug.html" component={BlogPage} />
      <Route path="/posts/:slug" component={BlogPage} />
      <Route path="/posts/:slug.html" component={BlogPage} />
      <Route path="/share/:slug" component={BlogPage} />
      <Route path="/share/:slug.html" component={BlogPage} />
      <Route path="/p/:slug" component={BlogPage} />
      <Route path="/p/:slug.html" component={BlogPage} />

      {/* Aliases for Board & Blog */}
      <Route path="/blog" component={BlogPage} />
      <Route path="/blog.html" component={BlogPage} />
      <Route path="/blog/:slug" component={BlogPage} />
      <Route path="/blog/:slug.html" component={BlogPage} />
      <Route path="/board" component={BlogPage} />
      <Route path="/board.html" component={BlogPage} />

      {/* AI Category Removed: Redirects to Home */}
      <Route path="/ai" component={Home} />
      <Route path="/ai.html" component={Home} />
      <Route path="/AI.html" component={Home} />

      {/* Admin */}
      <Route path="/admin" component={BlogAdminPage} />
      <Route path="/admin.html" component={BlogAdminPage} />
      <Route path="/admin/blog.html" component={BlogAdminPage} />

      {/* Contact */}
      <Route path="/contact" component={ContactPage} />
      <Route path="/contact.html" component={ContactPage} />

      {/* Mini-Games & Interactive */}
      <Route path="/tetris" component={TetrisPage} />
      <Route path="/tetris.html" component={TetrisPage} />

      {/* URL Shortener */}
      <Route path="/shorten" component={UrlShortenerPage} />
      <Route path="/shorten.html" component={UrlShortenerPage} />
      <Route path="/s" component={UrlShortenerPage} />
      <Route path="/s.html" component={UrlShortenerPage} />

      {/* Explicit Handle & Profile Routes (Prevents regexparam failures) */}
      <Route path="/@koharu.live" component={BlogPage} />
      <Route path="/%40koharu.live" component={BlogPage} />
      <Route path="/koharu.live" component={BlogPage} />
      <Route path="/koharu" component={BlogPage} />
      <Route path="/u/:handle" component={BlogPage} />
      <Route path="/user/:handle" component={BlogPage} />
      <Route path="/profile/:handle" component={BlogPage} />
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
        <TooltipProvider>
          <Toaster position="top-center" richColors />
          <CherryBlossomParticles />
          <Router />
          <FloatingControls />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
