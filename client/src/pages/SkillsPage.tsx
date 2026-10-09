import { ArrowLeft, Code2, Cpu, Gamepad2, Sparkles, Wrench } from "lucide-react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";

interface SkillItem {
  name: string;
  icon: string;
  level: number;
  desc: string;
}

interface SkillCategory {
  category: string;
  desc: string;
  icon: typeof Gamepad2;
  items: SkillItem[];
}

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    category: "Game & Engine Development",
    icon: Gamepad2,
    desc: "플레이 가능한 상호작용과 게임플레이 시스템을 구현하는 핵심 스택입니다.",
    items: [
      {
        name: "Unity / C#",
        icon: "https://cdn.simpleicons.org/unity/E48CDC",
        level: 85,
        desc: "게임플레이 시스템, 컴포넌트 아키텍처 및 게임 로직 구현",
      },
      {
        name: "Shader & HLSL",
        icon: "https://cdn.simpleicons.org/opengl/E48CDC",
        level: 78,
        desc: "URP 커스텀 셰이더, 시각 효과 및 라이팅 연출",
      },
      {
        name: "Script Engine & AST",
        icon: "https://cdn.simpleicons.org/csharp/E48CDC",
        level: 80,
        desc: "경량 인터프리터, 파서 및 실시간 핫리로드 시스템",
      },
    ],
  },
  {
    category: "Web & Frontend",
    icon: Code2,
    desc: "감성적이고 인터랙티브한 반응형 웹 경험을 제작하기 위한 스택입니다.",
    items: [
      {
        name: "TypeScript",
        icon: "https://cdn.simpleicons.org/typescript/E48CDC",
        level: 82,
        desc: "타입 안정성을 갖춘 견고한 웹 클라이언트 설계",
      },
      {
        name: "JavaScript / ES6+",
        icon: "https://cdn.simpleicons.org/javascript/E48CDC",
        level: 80,
        desc: "인터랙티브 UI 애니메이션과 비동기 데이터 통신",
      },
      {
        name: "React & Vite",
        icon: "https://cdn.simpleicons.org/react/E48CDC",
        level: 84,
        desc: "컴포넌트 중심 반응형 SPA 웹 애플리케이션 개발",
      },
    ],
  },
  {
    category: "Tools & Backend",
    icon: Wrench,
    desc: "더 나은 개발 흐름과 프로젝트 완성을 위한 도구 및 인프라입니다.",
    items: [
      {
        name: "Git & GitHub",
        icon: "https://cdn.simpleicons.org/git/E48CDC",
        level: 88,
        desc: "체계적인 버전 관리 및 릴리즈 프로세스",
      },
      {
        name: "Python",
        icon: "https://cdn.simpleicons.org/python/E48CDC",
        level: 75,
        desc: "데이터 가공 및 개발 자동화 보조 스크립트",
      },
      {
        name: "PostgreSQL & Drizzle",
        icon: "https://cdn.simpleicons.org/postgresql/E48CDC",
        level: 76,
        desc: "Neon Serverless PostgreSQL 데이터베이스 연동",
      },
    ],
  },
];

export default function SkillsPage() {
  return (
    <div className="min-h-screen">
      <SiteNav active="/skills" />

      <main className="page-container" id="main">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest font-bold text-pink-600">
              Tech Stack & Capabilities
            </span>
            <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
              스킬 & 역량 💻
            </h1>
            <p className="text-sm text-[#7a6e8f] mt-2">
              코하루가 직접 고민하고 프로젝트에서 다루는 기술 스택들입니다.
            </p>
          </div>

          {/* Skill Category Cards */}
          <div className="space-y-8">
            {SKILL_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.category} className="glass-card !p-6 sm:!p-7">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#38314a]">
                        {cat.category}
                      </h2>
                      <p className="text-xs text-[#7a6e8f]">
                        {cat.desc}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                    {cat.items.map((skill) => (
                      <div
                        key={skill.name}
                        className="p-4 rounded-2xl bg-white/70 border border-pink-100/80 hover:border-pink-300 transition-all shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-100 to-purple-100 flex items-center justify-center flex-shrink-0 border border-pink-200/50">
                              <img
                                src={skill.icon}
                                alt={skill.name}
                                className="w-5 h-5 object-contain"
                                loading="lazy"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-[#38314a] truncate">
                                {skill.name}
                              </div>
                              <div className="text-[11px] font-bold text-pink-600">
                                {skill.level}%
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-[#7a6e8f] leading-relaxed mb-3">
                            {skill.desc}
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 rounded-full bg-pink-100/70 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-pink-400 to-purple-400"
                            style={{ width: `${skill.level}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Philosophy Card */}
          <div className="glass-card mt-8 !p-6 sm:!p-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              <h2 className="text-lg font-bold text-[#38314a]">
                개발할 때 중요하게 생각하는 점
              </h2>
            </div>
            <p className="text-sm text-[#5a4c66] leading-relaxed">
              단순히 작동하는 코드에서 멈추지 않고, 사용하는 사람이 자연스럽게 몰입하고 즐길 수 있는 흐름과 마감 품질을 가장 소중하게 여깁니다. 새로운 기술과 도구를 두려움 없이 탐구하며, 작은 프로토타입부터 시작해 꾸준히 완성도를 높여갑니다 🌸
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
