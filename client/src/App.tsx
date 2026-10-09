import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import BlogAdminPage from "./pages/BlogAdminPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
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

function HandleRoute({ params }: { params: { handle?: string } }) {
  const raw = params?.handle || "";
  const decoded = decodeURIComponent(raw).trim();

  // If handle starts with @ or %40 (e.g. /@koharu.live, /%40koharu.live)
  if (decoded.startsWith("@") || raw.startsWith("%40")) {
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
    "404",
    "api",
    "index",
  ];
  const clean = decoded.toLowerCase().replace(/\.html$/, "");

  // If not a known static system page, route to BlogPage profile!
  if (clean && !knownStaticPages.includes(clean)) {
    return <BlogPage />;
  }

  return <NotFound />;
}

function InstagramSlugRoute() {
  return <BlogPage />;
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
      <Route path="/instagram/:slug" component={InstagramSlugRoute} />
      <Route path="/instagram/:slug.html" component={InstagramSlugRoute} />
      <Route path="/post/:slug" component={BlogPage} />
      <Route path="/post/:slug.html" component={BlogPage} />
      <Route path="/share/:slug" component={BlogPage} />
      <Route path="/share/:slug.html" component={BlogPage} />

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

      {/* Handle-based Profile Sharing (e.g. /@koharu.live, /u/koharu.live, /p/...) */}
      <Route path="/u/:handle" component={BlogPage} />
      <Route path="/user/:handle" component={BlogPage} />
      <Route path="/profile/:handle" component={BlogPage} />
      <Route path="/p/:handle" component={BlogPage} />
      <Route path="/@:handle" component={BlogPage} />
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
