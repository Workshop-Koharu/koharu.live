import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";

type PageShellProps = {
  active: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export default function PageShell({
  active,
  eyebrow,
  title,
  description,
  children,
}: PageShellProps) {
  return (
    <div className="min-h-screen">
      <SiteNav active={active} />

      <main className="page-container" id="main">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> 프로필로 돌아가기
            </Link>

            <div className="text-center">
              <span className="text-xs uppercase tracking-widest font-bold text-pink-600">
                {eyebrow}
              </span>
              <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
                {title}
              </h1>
              <p className="text-sm text-[#7a6e8f] mt-2">
                {description}
              </p>
            </div>
          </div>

          {/* Children Content */}
          <div className="glass-card !p-6 sm:!p-8">
            {children}
          </div>

          {/* Footer note */}
          <div className="text-center text-xs text-[#7a6e8f] mt-8 py-4">
            ! Koharu · koharu.live
          </div>
        </div>
      </main>
    </div>
  );
}
