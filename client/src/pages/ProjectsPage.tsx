import { ArrowUpRight, Bot, Gamepad2, Users } from "lucide-react";
import SiteNav from "@/components/SiteNav";

interface Project {
  title: string;
  category: string;
  desc: string;
  tags: string[];
  image?: string;
  demoUrl: string;
  githubUrl?: string;
  icon: typeof Bot;
  featured?: boolean;
  actionLabel?: string;
}

const PROJECTS: Project[] = [
  {
    title: "Mirae AI (미래 AI)",
    category: "AI Service",
    desc: "코하루가 개발한 AI 어시스턴트 서비스입니다. 편리하고 자연스러운 대화와 다양한 기능들을 웹에서 바로 경험해보실 수 있어요 🌸",
    tags: ["Mirae AI", "AI", "Assistant", "Web"],
    image: "", // 배너 없음
    demoUrl: "https://mirae.koharu.live/",
    githubUrl: "", // 깃허브 명시 제거
    icon: Bot,
    featured: true,
    actionLabel: "Mirae AI 바로가기",
  },
  {
    title: "비공식 스텔라이브 팬서버",
    category: "Community / Fan Discord",
    desc: "7,000명 이상의 파스텔(팬)들이 함께 교류하고 소통하는 비공식 스텔라이브 팬 디스코드 커뮤니티 서버입니다 🌸 팬아트, 클립 공유, 정기 이벤트 등 활발한 커뮤니티 활동이 이루어지고 있습니다.",
    tags: ["스텔라이브", "디스코드", "7000+ Members", "팬서버"],
    image:
      "https://cdn.discordapp.com/banners/1345272253977333801/1606fe46597a8c62fc6dd52ee4d64436.webp?size=480",
    demoUrl: "https://discord.gg/pwRZEZ4zmt",
    githubUrl: "",
    icon: Gamepad2,
    featured: true,
    actionLabel: "디스코드 참여하기",
  },
  {
    title: "Team Light",
    category: "Development Team & Web",
    desc: "더 안전하고 편리한 디스코드 환경을 만들기 위해 봇 보호, 운영 자동화, 커뮤니티 관리 기능을 개발하고 연구하는 팀입니다 ✨",
    tags: ["Team Light", "Discord", "Automation", "Web"],
    image: "", // 배너 없음
    demoUrl: "https://teamlight.pe.kr/",
    githubUrl: "",
    icon: Users,
    featured: true,
    actionLabel: "팀라이트 사이트",
  },
];

/**
 * Automatically determine accurate official favicon or Discord server icon
 */
function getProjectAutoIcon(demoUrl: string): string | null {
  // 1. Mirae AI official high-res logo
  if (demoUrl.includes("mirae.koharu.live") || demoUrl.includes("mirae")) {
    return "https://mirae.koharu.live/mirae-logo.png";
  }

  // 2. Team Light official high-res logo
  if (demoUrl.includes("teamlight.pe.kr") || demoUrl.includes("teamlight")) {
    return "https://teamlight.pe.kr/static/assets/team-light-logo.png";
  }

  // 3. Discord server icon
  if (
    demoUrl.includes("discord.gg") ||
    demoUrl.includes("discordapp") ||
    demoUrl.includes("1345272253977333801")
  ) {
    return "https://cdn.discordapp.com/icons/1345272253977333801/71873c7a2aada58fe448e2c24e1fa07e.png?size=128";
  }

  // 4. Fallback Google favicon service
  try {
    const url = new URL(demoUrl);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
  } catch {
    return null;
  }
}

export default function ProjectsPage() {
  return (
    <div className="min-h-screen">
      <SiteNav active="/projects" />

      <main className="page-container" id="main">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest font-bold text-pink-600">
              Featured Works
            </span>
            <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
              프로젝트 🎮
            </h1>
            <p className="text-sm text-[#7a6e8f] mt-2">
              코하루가 직접 제작거나 제작 도움을 준 대표 프로젝트들입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {PROJECTS.map((proj) => {
              const Icon = proj.icon;
              const autoIcon = getProjectAutoIcon(proj.demoUrl);
              const hasBanner = !!proj.image;

              return (
                <div
                  key={proj.title}
                  className={`glass-card !p-0 overflow-hidden flex flex-col justify-between hover:border-pink-300 transition-all ${
                    proj.featured
                      ? "ring-2 ring-pink-400/40 shadow-xl shadow-pink-500/10"
                      : ""
                  }`}
                >
                  {/* Top section: Banner preview (only if banner exists) or Clean Header */}
                  {hasBanner ? (
                    <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                      <img
                        src={proj.image}
                        alt={proj.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-pink-700 shadow-sm border border-white">
                        {proj.category}
                      </div>
                      {proj.featured && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm">
                          Featured ✨
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 pb-0 flex items-center justify-between">
                      <div className="bg-pink-100/80 px-3 py-1 rounded-full text-xs font-bold text-pink-700 border border-pink-200/50">
                        {proj.category}
                      </div>
                      {proj.featured && (
                        <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm">
                          Featured ✨
                        </div>
                      )}
                    </div>
                  )}

                  {/* Project Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2.5">
                        {/* Auto Favicon / Server Icon */}
                        <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 flex-shrink-0 overflow-hidden border border-pink-200/80 p-1 shadow-sm">
                          {autoIcon ? (
                            <img
                              src={autoIcon}
                              alt=""
                              className="w-full h-full object-contain rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        <h2 className="text-lg font-bold text-[#38314a]">
                          {proj.title}
                        </h2>
                      </div>

                      <p className="text-sm text-[#5a4c66] leading-relaxed mb-4">
                        {proj.desc}
                      </p>
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {proj.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-white text-[#7a6e8f] border border-pink-100"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2.5 pt-3 border-t border-pink-100">
                        <a
                          href={proj.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="insta-action-btn insta-btn-primary !text-xs !py-1.5 !px-3"
                        >
                          {proj.actionLabel
                            ? proj.actionLabel
                            : proj.demoUrl.includes("discord")
                            ? "디스코드 참여하기"
                            : proj.demoUrl.includes("mirae")
                            ? "Mirae AI 바로가기"
                            : "바로가기"}{" "}
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                        {proj.githubUrl ? (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="insta-action-btn insta-btn-secondary !text-xs !py-1.5 !px-3"
                          >
                            GitHub <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
