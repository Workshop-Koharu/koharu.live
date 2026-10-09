import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Milestone,
  Sparkles,
  Layers,
  Bot,
  Gamepad2,
  Users,
  Code2,
  Rocket,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";

interface TimelineItem {
  year: string;
  title: string;
  category: string;
  desc: string;
  tags: string[];
  icon: typeof Rocket;
  highlight?: boolean;
}

const TIMELINE: TimelineItem[] = [
  {
    year: "2026. 08 ~",
    title: "Mirae AI (미래 AI) 서비스 개발 및 웹 배포",
    category: "AI Project",
    desc: "2026년 8월부터 코하루가 직접 개발을 시작한 대화형 AI 어시스턴트 Mirae AI를 공식 웹사이트(mirae.koharu.live)로 런칭하여 자연스러운 대화와 유용한 편의 기능을 제공하기 시작했습니다 ✨",
    tags: ["Mirae AI", "AI Assistant", "Web Service", "LLM"],
    icon: Bot,
    highlight: true,
  },
  {
    year: "2026. 03 ~ 현재",
    title: "! Koharu 포트폴리오 & 소셜 피드 플랫폼 오픈",
    category: "Release",
    desc: "자신만의 색깔과 따뜻한 감성을 담은 통합 포트폴리오 및 소셜 피드 플랫폼을 오픈했습니다. 다양한 프로젝트와 소중한 지인들과의 연결고리를 기록하고 소통하는 공간입니다 🌸",
    tags: ["React", "TypeScript", "TailwindCSS", "Full-Stack"],
    icon: Rocket,
    highlight: true,
  },
  {
    year: "2025. 08",
    title: "생성형 AI 모델 연동 및 프롬프트 엔지니어링 연구",
    category: "AI Research",
    desc: "다양한 거대 언어 모델(LLM)과 API 연동을 연구하며 사용자 친화적인 대화형 AI 챗봇 인터페이스와 실시간 응답 파이프라인의 기반을 닦았습니다 🤖",
    tags: ["Generative AI", "Prompt Engineering", "API Integration"],
    icon: Sparkles,
  },
  {
    year: "2025. 05",
    title: "Team Light 합류 및 디스코드 자동화 생태계 구축",
    category: "Team & Tool",
    desc: "디스코드 커뮤니티의 안전과 편의성을 극대화하기 위해 Team Light에 합류하여 봇 보호, 커뮤니티 운영 자동화 및 인프라 기능을 공동 연구하고 제작했습니다 💡",
    tags: ["Team Light", "Discord Bot", "Automation", "Security"],
    icon: Users,
    highlight: true,
  },
  {
    year: "2024. 12",
    title: "팬 커뮤니티 연말 이벤트 및 인터랙티브 시스템 운영",
    category: "Event & System",
    desc: "연말 맞이 커뮤니티 이벤트 기획과 자동화 추첨 봇, 아카이브 시스템을 제작하여 수천 명의 팬들이 함께 즐길 수 있는 축제의 장을 조성했습니다 🎉",
    tags: ["Event Bot", "Community Growth", "Discord"],
    icon: Layers,
  },
  {
    year: "2024. 09",
    title: "비공식 스텔라이브 팬 디스코드 커뮤니티 제작 및 운영 지원",
    category: "Community",
    desc: "7,000명 이상의 파스텔(팬)들이 함께 교류하고 소통하는 대규모 팬 디스코드 커뮤니티를 개설 및 제작 지원하며 활발한 팬아트·클립 공유 및 이벤트 환경을 구축했습니다 🎮",
    tags: ["스텔라이브", "7000+ Members", "Community", "Discord"],
    icon: Gamepad2,
    highlight: true,
  },
  {
    year: "2024. 06",
    title: "디스코드 봇 개발 및 커뮤니티 편의 기능 제작",
    category: "Bot Dev",
    desc: "서버 내 유저 관리, 환영 메시지 자동화, 역할 분배 등을 처리하는 맞춤형 디스코드 봇을 개발하며 실무 개발 역량을 확장했습니다 ⚡",
    tags: ["Discord.js", "Bot Automation", "Node.js"],
    icon: Code2,
  },
  {
    year: "2024. 03",
    title: "게임 및 웹 프로그래밍의 첫 걸음",
    category: "First Step",
    desc: "머릿속으로 상상하던 재미있는 장면과 아이디어를 플레이 가능한 코드로 구현하기 위해 게임 엔진과 웹 기술 공부를 본격적으로 시작하며 개발의 길을 열었습니다 💫",
    tags: ["Beginning", "Game Dev", "Interactive Web", "Study"],
    icon: Code2,
  },
];

export default function HistoryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(TIMELINE.map((t) => t.category)))];

  const filteredTimeline = TIMELINE.filter((item) => {
    if (selectedCategory === "all") return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="min-h-screen">
      <SiteNav active="/history" />

      <main className="page-container" id="main">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest font-bold text-pink-600 flex items-center justify-center gap-1.5">
              <Milestone className="w-4 h-4" /> Journey & Milestones
            </span>
            <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
              히스토리 📜
            </h1>
            <p className="text-sm text-[#7a6e8f] mt-2">
              코하루가 걸어온 개발의 발자취와 소중한 주요 전환점들을 기록하는 공간입니다.
            </p>

            {/* Filter buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-pink-600 text-white shadow-sm scale-105"
                      : "bg-white/80 text-[#7a6e8f] hover:bg-pink-50 hover:text-pink-600 border border-pink-100"
                  }`}
                >
                  {cat === "all" ? "전체 보기" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline List */}
          <div className="relative pl-6 sm:pl-8 border-l-2 border-pink-200/80 space-y-8 my-6">
            {filteredTimeline.map((item, idx) => {
              const Icon = item.icon;

              return (
                <div key={idx} className="relative group">
                  {/* Glowing Node on Timeline Line */}
                  <div
                    className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all group-hover:scale-110 ${
                      item.highlight
                        ? "bg-gradient-to-tr from-pink-500 to-purple-500 text-white ring-4 ring-pink-100"
                        : "bg-white text-pink-600 border-2 border-pink-300 ring-2 ring-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Timeline Card */}
                  <div
                    className={`glass-card !p-5 sm:!p-6 transition-all hover:border-pink-300 shadow-sm hover:shadow-md ${
                      item.highlight ? "border-pink-200/90 bg-white/85" : ""
                    }`}
                  >
                    {/* Top Row: Year badge & Category */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.year}
                      </span>
                      <span className="text-[11px] font-semibold text-[#7a6e8f] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                        {item.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-base sm:text-lg font-extrabold text-[#38314a] group-hover:text-pink-600 transition-colors">
                      {item.title}
                    </h2>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[#5a4d6b] mt-2 leading-relaxed">
                      {item.desc}
                    </p>

                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-pink-100/60">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-pink-50 text-[#7a6e8f]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Card */}
          <div className="glass-card text-center p-6 mt-12 bg-gradient-to-r from-pink-50/60 via-purple-50/60 to-pink-50/60 border border-pink-200/60">
            <Sparkles className="w-6 h-6 text-pink-500 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-[#38314a]">
              앞으로도 새로운 장면을 계속 만들어 갑니다 🌸
            </h3>
            <p className="text-xs text-[#7a6e8f] mt-1">
              코하루의 다음 도전과 발자취도 기대해주세요!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
