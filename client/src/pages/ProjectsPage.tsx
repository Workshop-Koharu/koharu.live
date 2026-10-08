import { ArrowUpRight, FolderGit2, Gamepad2, Globe, Sparkles } from "lucide-react";
import SiteNav from "@/components/SiteNav";

const PROJECTS = [
  {
    title: "Custom HLSL Shader Graph Pack",
    category: "Unity / Graphics",
    desc: "물 반사 림라이트, 수채화 셰이더, 카툰 렌더링을 구현한 유니티 URP 커스텀 셰이더 패키지입니다.",
    tags: ["Unity", "HLSL", "ShaderGraph", "URP"],
    demoUrl: "https://koharu.live",
    githubUrl: "https://github.com/Workshop-Koharu/koharu.live",
    icon: Sparkles,
  },
  {
    title: "Procedural 2D Dungeon Crawler",
    category: "Game / Algorithm",
    desc: "Bsp Tree와 셀룰러 오토마타를 결합하여 절차적으로 생성되는 맵과 타격감 있는 전투 액션 프로토타입입니다.",
    tags: ["C#", "Algorithm", "2D Action", "Pixel Art"],
    demoUrl: "https://koharu.live",
    githubUrl: "https://github.com/Workshop-Koharu",
    icon: Gamepad2,
  },
  {
    title: "Koharu Script Engine (AST Interpreter)",
    category: "Language / Tool",
    desc: "게임 내 대화 분기 트리와 퀘스트 트리거를 빌드 없이 실시간 핫리로드할 수 있는 경량 스크립트 인터프리터입니다.",
    tags: ["Compiler", "Lexer", "Parser", "C#"],
    demoUrl: "https://koharu.live",
    githubUrl: "https://github.com/Workshop-Koharu",
    icon: FolderGit2,
  },
  {
    title: "koharu.live v2.0 Portfolio",
    category: "Full-Stack Web",
    desc: "선아(SeonA)의 감성적인 디자인과 결합된 인터랙티브 포트폴리오. 인스타그램 스타일 블로그 및 Neon PostgreSQL 연동.",
    tags: ["React 19", "Vite", "Neon Postgres", "Drizzle ORM"],
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest font-bold text-pink-600">
              Works & Experiments
            </span>
            <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
              프로젝트 🎮
            </h1>
            <p className="text-sm text-[#7a6e8f] mt-2">
              직접 고민하고 코드로 실체화한 게임, 셰이더, 엔진 툴 작업물들입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PROJECTS.map((proj) => {
              const Icon = proj.icon;
              return (
                <div
                  key={proj.title}
                  className="glass-card !p-6 flex flex-col justify-between hover:border-pink-300"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-100 to-purple-100 flex items-center justify-center text-pink-600 border border-pink-200">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-pink-100 text-pink-700">
                        {proj.category}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-[#38314a] mb-2">
                      {proj.title}
                    </h2>

                    <p className="text-sm text-[#5a4c66] leading-relaxed mb-6">
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

                    <div className="flex items-center gap-3 pt-3 border-t border-pink-100">
                      <a
                        href={proj.demoUrl}
                        className="insta-action-btn insta-btn-primary !text-xs !py-1.5"
                      >
                        라이브 데모 <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="insta-action-btn insta-btn-secondary !text-xs !py-1.5"
                      >
                        GitHub <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
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
