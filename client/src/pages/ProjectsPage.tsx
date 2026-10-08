import { ArrowUpRight, Bot, FolderGit2, Gamepad2, Globe, Sparkles } from "lucide-react";
import SiteNav from "@/components/SiteNav";

const PROJECTS = [
  {
    title: "Mirae AI (미래 AI)",
    category: "AI / Next-Gen Platform",
    desc: "차세대 지능형 인터랙션과 대화 엔진을 구현한 코하루의 핵심 AI 프로젝트입니다. 자연스러운 맥락 이해와 창의적인 어시스턴트 기능을 제공합니다.",
    tags: ["Mirae AI", "LLM", "Interactive", "Web"],
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    demoUrl: "https://mirae.koharu.live/",
    githubUrl: "https://github.com/Workshop-Koharu",
    icon: Bot,
    featured: true,
  },
  {
    title: "스텔라이브 협업 팬 프로젝트 (Stellive Project)",
    category: "Fan Game / Media Collab",
    desc: "스텔라이브 크리에이터와 함께하는 인터랙티브 팬 게임 및 미디어 협업 프로젝트입니다. 고유한 캐릭터 액션과 화려한 비주얼 연출을 담았습니다.",
    tags: ["Stellive", "Fan Game", "Unity", "Action"],
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    demoUrl: "https://stellive.me",
    githubUrl: "https://github.com/Workshop-Koharu",
    icon: Gamepad2,
    featured: true,
  },
  {
    title: "Custom HLSL Shader Graph Pack",
    category: "Unity / Graphics",
    desc: "물 반사 림라이트, 수채화 셰이더, 카툰 렌더링을 구현한 유니티 URP 커스텀 셰이더 패키지입니다. 씬 라이팅 최적화와 절차적 노이즈를 결합했습니다.",
    tags: ["Unity", "HLSL", "ShaderGraph", "URP"],
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    demoUrl: "https://koharu.live",
    githubUrl: "https://github.com/Workshop-Koharu/koharu.live",
    icon: Sparkles,
  },
  {
    title: "Procedural 2D Dungeon Crawler",
    category: "Game / Algorithm",
    desc: "Bsp Tree와 셀룰러 오토마타를 결합하여 절차적으로 생성되는 맵과 타격감 있는 전투 액션 프로토타입입니다.",
    tags: ["C#", "Algorithm", "2D Action", "PixelArt"],
    image: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    demoUrl: "https://koharu.live",
    githubUrl: "https://github.com/Workshop-Koharu",
    icon: Gamepad2,
  },
  {
    title: "Koharu Script Engine (AST Interpreter)",
    category: "Language / Tool",
    desc: "게임 내 대화 분기 트리와 퀘스트 트리거를 빌드 없이 실시간 핫리로드할 수 있는 C# 기반 경량 스크립트 인터프리터입니다.",
    tags: ["Compiler", "Lexer", "Parser", "C#"],
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    demoUrl: "https://koharu.live",
    githubUrl: "https://github.com/Workshop-Koharu",
    icon: FolderGit2,
  },
  {
    title: "koharu.live v2.0 Portfolio",
    category: "Full-Stack Web",
    desc: "감성적인 파스텔 비주얼과 인터랙티브 반응형 인터페이스를 갖춘 코하루의 포트폴리오. 인스타그램 피드 및 Neon PostgreSQL 연동.",
    tags: ["React 19", "Vite", "Neon Postgres", "Instagram"],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    demoUrl: "https://koharu.live",
    githubUrl: "https://github.com/Workshop-Koharu/koharu.live",
    icon: Globe,
  },
];

export default function ProjectsPage() {
  return (
    <div className="min-h-screen">
      <SiteNav active="/projects.html" />

      <main className="page-container" id="main">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest font-bold text-pink-600">
              Works & Experiments
            </span>
            <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
              프로젝트 🎮
            </h1>
            <p className="text-sm text-[#7a6e8f] mt-2">
              직접 고민하고 코드로 실체화한 AI, 게임, 셰이더, 엔진 툴 작업물들입니다.
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
                          {proj.demoUrl.includes("mirae") ? "Mirae AI 바로가기" : "라이브 데모"}{" "}
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="insta-action-btn insta-btn-secondary !text-xs !py-1.5 !px-3"
                        >
                          GitHub <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
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
