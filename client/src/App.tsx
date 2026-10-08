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

function Router() {
  return (
    <Switch>
      {/* Home / Profile */}
      <Route path="/" component={Home} />
      <Route path="/index.html" component={Home} />
      <Route path="/profile.html" component={Home} />
      <Route path="/profile" component={Home} />

      {/* Skills */}
      <Route path="/skills.html" component={SkillsPage} />
      <Route path="/skills" component={SkillsPage} />

      {/* Projects */}
      <Route path="/projects.html" component={ProjectsPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/project.html" component={ProjectsPage} />
      <Route path="/project/:slug.html" component={ProjectDetailPage} />
      <Route path="/project/:slug" component={ProjectDetailPage} />

      {/* History Timeline */}
      <Route path="/history.html" component={HistoryPage} />
      <Route path="/history" component={HistoryPage} />

      {/* Secret Letter */}
      <Route path="/letter.html" component={LetterPage} />
      <Route path="/letter" component={LetterPage} />

      {/* Partners */}
      <Route path="/partners.html" component={PartnersPage} />
      <Route path="/partners" component={PartnersPage} />
      <Route path="/partner.html" component={PartnersPage} />

      {/* People / Acquaintances */}
      <Route path="/person.html" component={PeoplePage} />
      <Route path="/person" component={PeoplePage} />
      <Route path="/people" component={PeoplePage} />

      {/* Instagram (Feed & Gallery, replacing board & blog) */}
      <Route path="/instagram.html" component={BlogPage} />
      <Route path="/instagram" component={BlogPage} />
      <Route path="/instagram/:slug.html" component={BlogPostPage} />
      <Route path="/instagram/:slug" component={BlogPostPage} />

      {/* Aliases for Board & Blog */}
      <Route path="/blog.html" component={BlogPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/blog/:slug.html" component={BlogPostPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />
      <Route path="/board.html" component={BlogPage} />
      <Route path="/board" component={BlogPage} />

      {/* AI Category Removed: Redirects to Home */}
      <Route path="/ai.html" component={Home} />
      <Route path="/AI.html" component={Home} />
      <Route path="/ai" component={Home} />

      {/* Admin */}
      <Route path="/admin" component={BlogAdminPage} />
      <Route path="/admin.html" component={BlogAdminPage} />
      <Route path="/admin/blog.html" component={BlogAdminPage} />

      {/* Contact */}
      <Route path="/contact.html" component={ContactPage} />
      <Route path="/contact" component={ContactPage} />

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
