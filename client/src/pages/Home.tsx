import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Camera,
  Check,
  Code2,
  Copy,
  Cpu,
  ExternalLink,
  Flame,
  FolderGit2,
  Gamepad2,
  Github,
  Globe,
  Layers,
  Link2,
  Mail,
  Palette,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";

interface ProjectItem {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  liveUrl?: string;
  accent: string;
}

const FEATURED_PROJECTS: ProjectItem[] = [
  {
    id: "lucent-engine",
    title: "Lucent Shader & Custom Render Pipeline",
    category: "Graphics & Rendering",
    description:
      "Unity URP Render Graph 기반 커스텀 툰 셰이더 및 포스트 프로세싱 볼륨 프레임워크. HLSL 수식 최적화와 림 라이트, 셀 셰이딩 파이프라인 구현.",
    tags: ["Unity", "HLSL", "ShaderLab", "URP Render Graph"],
    githubUrl: "https://github.com/Workshop-Koharu",
    accent: "from-pink-500 to-rose-500",
  },
  {
    id: "project-stella",
    title: "Project Stella: Responsive Combat System",
    category: "Game Client & Physics",
    description:
      "상태 머신(FSM) 기반의 유려한 플레이어 액션 컨트롤러와 충돌 판정 히트박스 시스템. 넉백, 대시, 회피 및 콤보 캔슬 아키텍처 설계.",
    tags: ["Unity 6", "C#", "FSM", "2D/3D Physics"],
    githubUrl: "https://github.com/Workshop-Koharu",
    accent: "from-purple-500 to-indigo-500",
  },
  {
    id: "koharu-live",
    title: "Koharu Live Web Platform & Ecosystem",
    category: "Fullstack Web & Tools",
    description:
      "React, TypeScript, Tailwind 기반의 게임 프로그래머 전용 포털. 마크다운 테크 블로그, 모먼트 피드, OAuth 인증 및 은행급 웹 보안 아키텍처 적용.",
    tags: ["React", "TypeScript", "Tailwind", "PostgreSQL"],
    githubUrl: "https://github.com/Workshop-Koharu/koharu.live",
    liveUrl: "https://www.koharu.live",
    accent: "from-sky-500 to-cyan-500",
  },
];

const SKILL_CATEGORIES = [
  {
    title: "Game Engine & Mechanics",
    icon: Gamepad2,
    skills: ["Unity (2022 / 6)", "C# (.NET Core)", "FSM / State Pattern", "Physics 2D / 3D", "NavMesh AI", "Optimization"],
  },
  {
    title: "Graphics & Shaders",
    icon: Palette,
    skills: ["HLSL / ShaderLab", "URP Render Graph", "Custom Lighting", "Post-Processing", "Toon / Stylized Shaders"],
  },
  {
    title: "Web & Tooling",
    icon: Code2,
    skills: ["TypeScript", "React", "Tailwind CSS", "Node.js", "PostgreSQL / Drizzle", "Vite / Modern Toolchains"],
  },
  {
    title: "Engineering Practices",
    icon: Wrench,
    skills: ["Git & GitHub Workflow", "Clean Architecture", "REST API Integration", "Security Headers", "Vercel Deployment"],
  },
];

export default function Home() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("admin@koharu.live");
      setCopied(true);
      toast.success("이메일 주소(admin@koharu.live)를 복사했습니다.");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("복사하지 못했습니다. admin@koharu.live 를 직접 입력해주세요.");
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <SiteNav active="/profile" />

      <main className="page-container max-w-5xl mx-auto px-4 pt-4 sm:pt-6" id="main">
        {/* ── 1. Hero Section (Intro-us Style High-End Developer Banner) ── */}
        <section className="glass-card !p-8 sm:!p-12 mb-10 rounded-[36px] border border-pink-200/80 shadow-2xl relative overflow-hidden bg-gradient-to-br from-white/95 via-pink-50/40 to-purple-50/50 backdrop-blur-xl">
          {/* Subtle Ambient Glow Orbs */}
          <div className="w-72 h-72 bg-gradient-to-tr from-pink-400/15 to-purple-400/15 rounded-full blur-3xl absolute -top-16 -right-16 pointer-events-none" />
          <div className="w-72 h-72 bg-gradient-to-tr from-sky-400/15 to-pink-400/15 rounded-full blur-3xl absolute -bottom-16 -left-16 pointer-events-none" />

          <div className="relative z-10">
            {/* Top Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-pink-100/80">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Available for Indie Game Projects</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-[#7a6e8f]">
                <Globe className="w-3.5 h-3.5 text-pink-500" />
                <span>Seoul, KR · GMT+9</span>
              </div>
            </div>

            {/* Profile Content Body */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Profile Avatar Card */}
              <div className="relative flex-shrink-0 group">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-[32px] p-1.5 bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 shadow-xl shadow-pink-500/25 group-hover:scale-102 transition duration-300">
                  <img
                    src="/assets/koharu-profile.png"
                    alt="! Koharu Profile"
                    className="w-full h-full object-cover rounded-[26px] bg-white"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-white shadow-md border border-pink-200 text-[11px] font-extrabold text-pink-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Dev
                </div>
              </div>

              {/* Title, Bio, & Quick Links */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-pink-600 mb-1 flex items-center justify-center md:justify-start gap-1.5">
                    <Terminal className="w-3.5 h-3.5" /> Game Client & Engine Programmer
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#38314a] tracking-tight">
                    ! Koharu · 코하루
                  </h1>
                </div>

                <p className="text-sm sm:text-base text-[#5f5270] leading-relaxed break-keep max-w-2xl font-medium">
                  플레이되는 아이디어를 정교한 코드로 실체화하는 게임 프로그래머입니다.
                  Unity C#, 커스텀 HLSL 셰이더 및 렌더링 파이프라인, 그리고 안정적인 웹 풀스택 기술을 결합하여 완성도 높은 디지털 경험을 설계합니다.
                </p>

                {/* Core Stack Pills */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                  {["Unity 6", "C# / .NET", "HLSL Shader", "URP Render Graph", "TypeScript", "React"].map((pill) => (
                    <span
                      key={pill}
                      className="px-3 py-1 rounded-xl bg-white/90 border border-pink-200 text-[#38314a] text-xs font-bold shadow-xs hover:border-pink-300 transition"
                    >
                      {pill}
                    </span>
                  ))}
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
                  <a
                    href="#projects"
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white text-xs font-extrabold shadow-lg shadow-pink-500/25 transition cursor-pointer flex items-center gap-2 active:scale-98"
                  >
                    <FolderGit2 className="w-4 h-4" /> 프로젝트 보기
                  </a>
                  <Link
                    href="/blog"
                    className="px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-pink-200 text-[#38314a] text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4 text-purple-600" /> 개발 블로그
                  </Link>
                  <Link
                    href="/moments"
                    className="px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-pink-200 text-[#38314a] text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4 text-pink-600" /> 모먼트 피드
                  </Link>
                  <a
                    href="https://github.com/Workshop-Koharu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-pink-200 text-gray-700 shadow-xs transition"
                    title="GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Featured Projects (Portfolio Showcase) ─────────────────── */}
        <section className="mb-14" id="projects" aria-labelledby="featured-projects-title">
          <div className="flex items-center justify-between mb-6 px-1">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-pink-600 flex items-center gap-1.5 mb-1">
                <FolderGit2 className="w-3.5 h-3.5" /> Portfolio Works
              </span>
              <h2 id="featured-projects-title" className="text-2xl sm:text-3xl font-black text-[#38314a] tracking-tight">
                대표 프로젝트 쇼케이스
              </h2>
            </div>
            <Link
              href="/projects"
              className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 bg-pink-50 hover:bg-pink-100 px-3.5 py-1.5 rounded-xl border border-pink-200 transition"
            >
              전체 프로젝트 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_PROJECTS.map((project) => (
              <div
                key={project.id}
                className="glass-card !p-6 rounded-3xl border border-pink-100 shadow-xl flex flex-col justify-between hover:shadow-2xl hover:border-pink-300 transition duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-extrabold text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-lg border border-pink-100">
                      {project.category}
                    </span>
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${project.accent}`} />
                  </div>

                  <h3 className="text-lg font-black text-[#38314a] mb-2 group-hover:text-pink-600 transition">
                    {project.title}
                  </h3>

                  <p className="text-xs text-[#5f5270] leading-relaxed mb-4 break-keep">
                    {project.description}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-pink-100/60">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-black transition"
                      >
                        <Github className="w-3.5 h-3.5" /> GitHub
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-pink-600 hover:text-pink-700 transition ml-auto"
                      >
                        라이브 링크 <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Core Competencies & Skills Matrix ──────────────────────── */}
        <section className="mb-14" aria-labelledby="skills-matrix-title">
          <div className="flex items-center justify-between mb-6 px-1">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-pink-600 flex items-center gap-1.5 mb-1">
                <Cpu className="w-3.5 h-3.5" /> Technical Expertise
              </span>
              <h2 id="skills-matrix-title" className="text-2xl sm:text-3xl font-black text-[#38314a] tracking-tight">
                보유 기술 및 엔지니어링 역량
              </h2>
            </div>
            <Link
              href="/skills"
              className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 bg-pink-50 hover:bg-pink-100 px-3.5 py-1.5 rounded-xl border border-pink-200 transition"
            >
              상세 스킬 맵 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SKILL_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              return (
                <div
                  key={cat.title}
                  className="glass-card !p-5 rounded-3xl border border-pink-100 shadow-lg hover:border-pink-300 transition"
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-100 to-purple-100 text-pink-600 flex items-center justify-center mb-3.5 border border-pink-200/60">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-[#38314a] mb-3">{cat.title}</h3>
                  <ul className="space-y-1.5">
                    {cat.skills.map((s) => (
                      <li key={s} className="text-xs text-[#5f5270] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 4. Fast Navigation Hub (All Portal Pages) ─────────────────── */}
        <section className="mb-14" aria-labelledby="hub-title">
          <div className="mb-6 px-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-pink-600 flex items-center gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5" /> Portal Directory
            </span>
            <h2 id="hub-title" className="text-2xl sm:text-3xl font-black text-[#38314a] tracking-tight">
              주요 서비스 및 페이지 바로가기
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/moments"
              className="glass-card !p-4 flex items-center justify-between rounded-2xl border border-pink-100 shadow-sm hover:shadow-md hover:border-pink-300 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#38314a]">코하루 모먼트</div>
                  <div className="text-[11px] text-[#7a6e8f]">인스타그램 소셜 피드</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            <Link
              href="/blog"
              className="glass-card !p-4 flex items-center justify-between rounded-2xl border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#38314a]">개발 블로그</div>
                  <div className="text-[11px] text-[#7a6e8f]">마크다운 기술 일지</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            <Link
              href="/projects"
              className="glass-card !p-4 flex items-center justify-between rounded-2xl border border-pink-100 shadow-sm hover:shadow-md hover:border-pink-300 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#38314a]">프로젝트 갤러리</div>
                  <div className="text-[11px] text-[#7a6e8f]">전체 작업물 아카이브</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            <Link
              href="/history"
              className="glass-card !p-4 flex items-center justify-between rounded-2xl border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#38314a]">히스토리</div>
                  <div className="text-[11px] text-[#7a6e8f]">개발 마일스톤 로그</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            <Link
              href="/partners"
              className="glass-card !p-4 flex items-center justify-between rounded-2xl border border-pink-100 shadow-sm hover:shadow-md hover:border-pink-300 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#38314a]">파트너</div>
                  <div className="text-[11px] text-[#7a6e8f]">Team Light 협력사</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            <Link
              href="/person"
              className="glass-card !p-4 flex items-center justify-between rounded-2xl border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#38314a]">지인 목록</div>
                  <div className="text-[11px] text-[#7a6e8f]">소중한 동료 및 친구</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            <Link
              href="/letter"
              className="glass-card !p-4 flex items-center justify-between rounded-2xl border border-pink-100 shadow-sm hover:shadow-md hover:border-pink-300 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#38314a]">비밀 편지함</div>
                  <div className="text-[11px] text-[#7a6e8f]">보안 코드 입력 열람</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            <Link
              href="/shorten"
              className="glass-card !p-4 flex items-center justify-between rounded-2xl border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#38314a]">URL 단축기</div>
                  <div className="text-[11px] text-[#7a6e8f]">고유 단축 링크 생성</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </section>

        {/* ── 5. Contact & Collaboration Box ───────────────────────────── */}
        <section className="glass-card !p-6 sm:!p-8 rounded-3xl border border-pink-200 shadow-xl bg-gradient-to-r from-pink-50/60 via-white to-purple-50/60" id="contact">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <span className="text-xs font-extrabold uppercase tracking-widest text-pink-600 flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                <Send className="w-3.5 h-3.5" /> Collaboration & Inquiries
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#38314a]">
                프로젝트 협업 및 기술 문의
              </h3>
              <p className="text-xs text-[#7a6e8f] mt-1">
                게임 프로그래밍, 셰이더 제작, 혹은 새로운 협업 제안은 언제나 환영합니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={copyEmail}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white text-xs font-bold shadow-md shadow-pink-500/20 transition cursor-pointer flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "이메일 복사완료" : "admin@koharu.live 복사"}</span>
              </button>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                Discord
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="text-center text-xs text-[#7a6e8f] py-8">
          <p className="font-semibold">Designed & Engineered by ! Koharu · koharu.live</p>
          <p className="text-[11px] text-gray-400 mt-1">All Rights Reserved © 2026</p>
        </footer>
      </main>
    </div>
  );
}
