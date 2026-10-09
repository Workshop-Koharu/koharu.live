import { ArrowUpRight, Bot, FolderGit2, Gamepad2, Globe, Sparkles } from "lucide-react";
import SiteNav from "@/components/SiteNav";

const PROJECTS = [
  {
    title: "Mirae AI (미래 AI)",
    category: "AI Service",
    desc: "코하루가 개발한 AI 어시스턴트 서비스입니다. 편리하고 자연스러운 대화와 다양한 기능들을 웹에서 바로 경험해보실 수 있어요 🌸",
    tags: ["Mirae AI", "AI", "Assistant", "Web"],
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    demoUrl: "https://mirae.koharu.live/",
    githubUrl: "https://github.com/Workshop-Koharu",
    icon: Bot,
    featured: true,
  },
  {
    title: "비공식 스텔라이브 팬서버",
    category: "Community / Fan Discord",
    desc: "7,000명 이상의 파스텔(팬)들이 함께 교류하고 소통하는 비공식 스텔라이브 팬 디스코드 커뮤니티 서버입니다 🌸 팬아트, 클립 공유, 정기 이벤트 등 활발한 커뮤니티 활동이 이루어지고 있습니다.",
    tags: ["스텔라이브", "디스코드", "7000+ Members", "팬서버"],
    image: "/images/stellive-banner.png",
    demoUrl: "https://discord.gg/pwRZEZ4zmt",
    githubUrl: "",
    icon: Gamepad2,
    featured: true,
    actionLabel: "디스코드 참여하기",
  },
];

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
              코하루가 직접 제작하고 운영하는 대표 프로젝트들입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PROJECTS.map((proj) => {
              const Icon = proj.icon;
              return (
                <div
                  key={proj.title}
                  className={`glass-card !p-0 overflow-hidden flex flex-col justify-between hover:border-pink-300 transition-all ${
                    proj.featured ? "ring-2 ring-pink-400/40 shadow-xl shadow-pink-500/10" : ""
                  }`}
                >
                  {/* Project Image Preview */}
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

                  {/* Project Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 flex-shrink-0">
                          <Icon className="w-4 h-4" />
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
                          {proj.demoUrl.includes("discord")
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
