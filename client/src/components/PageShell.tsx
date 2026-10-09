import { ArrowLeft } from "lucide-react";
import SiteNav from "@/components/SiteNav";

type PageShellProps = {
  active: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export default function PageShell({ active, eyebrow, title, description, children }: PageShellProps) {
  return (
    <main className="site-shell">
      <SiteNav active={active} />
      <div className="page-frame">
        <div className="content-column">
          <header className="subpage-header entrance">
            <a className="back-link" href="/profile"><ArrowLeft size={14} /> 프로필로 돌아가기</a>
            <div className="section-kicker" style={{ marginTop: "20px" }}>{eyebrow}</div>
            <h1 className="subpage-title">{title}</h1>
            <p className="subpage-copy">{description}</p>
          </header>
          {children}
          <footer className="footer-note"><span>made with code & curiosity</span><span>! Koharu · koharu.live</span></footer>
        </div>
      </div>
    </main>
  );
}
