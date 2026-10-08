import { useState } from "react";
import { Calendar, CheckCircle2, Milestone, Sparkles } from "lucide-react";
import SiteNav from "@/components/SiteNav";

const TIMELINE = [
  {
    year: "2026. 10",
    title: "koharu.live v2.0 공식 릴리즈 & SeonA 디자인 통합",
    category: "milestone",
    desc: "선아(SeonA)의 감성적인 파스텔 디자인 및 기능(비밀 편지, Cloner AI, 방명록)을 코하루 포트폴리오와 완벽히 결합하고 인스타그램 스타일 블로그 시스템 및 Neon PostgreSQL 데이터베이스를 연동했습니다.",
    tags: ["Release", "Instagram Blog", "Neon DB", "SeonA Collab"],
  },
  {
    year: "2026. 05",
    title: "유니티 기반 커스텀 렌더 파이프라인 (URP Extension) 개발",
    category: "project",
    desc: "카툰 렌더링 및 수채화풍 림라이트 효과를 구현하는 커스텀 HLSL 셰이더 패키지를 완성하여 오픈소스로 공개했습니다.",
    tags: ["Unity", "HLSL", "Shaders", "Graphics"],
  },
  {
    year: "2025. 11",
    title: "Team Light 파트너십 체결 & 웹 프로젝트 공동 런칭",
    category: "collab",
    desc: "Team Light와의 협업을 통해 인터랙티브 웹 포트폴리오 플랫폼을 공동 구축하고 성능 최적화를 진행했습니다.",
    tags: ["Team Light", "Partnership", "Web"],
  },
  {
    year: "2025. 06",
    title: "도트 감성 던전 크롤러 프로토타입 공개",
    category: "project",
    desc: "Bsp Tree와 셀룰러 오토마타를 결합한 절차적 맵 생성 알고리즘 기반 2D 액션 게임 프로토타입을 제작하여 플레이어 테스트를 진행했습니다.",
    tags: ["2D Action", "Algorithm", "Procedural"],
  },
  {
    year: "2024. 12",
    title: "게임 프로그래밍 및 커스텀 스크립트 인터프리터 설계 시작",
    category: "milestone",
    desc: "C#으로 렉서(Lexer)와 파서(Parser)를 작성하며 게임 내 대화 및 퀘스트 트리거를 자유롭게 제어할 수 있는 경량 스크립트 엔진을 기획하고 첫 코드를 작성했습니다.",
    tags: ["Compiler", "AST", "C#", "Inception"],
  },
];

export default function HistoryPage() {
  const [filter, setFilter] = useState("all");

  const filteredTimeline = TIMELINE.filter((item) => {
    if (filter === "all") return true;
    return item.category === filter;
  });

  return (
    <div className="min-h-screen">
      <SiteNav active="/history.html" />

      <main className="page-container" id="main">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest font-bold text-pink-600">
              Journey & Milestones
            </span>
            <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
              히스토리 타임라인 ⏳
            </h1>
            <p className="text-sm text-[#7a6e8f] mt-2">
              코하루가 걸어온 개발의 발자취와 주요 전환점들을 모았습니다.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex justify-center gap-2 mb-10">
            {[
              { id: "all", label: "전체" },
              { id: "milestone", label: "마일스톤" },
              { id: "project", label: "프로젝트" },
              { id: "collab", label: "협업" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filter === f.id
                    ? "bg-pink-600 text-white shadow-md shadow-pink-500/20"
                    : "bg-white/80 text-[#7a6e8f] hover:bg-white border border-pink-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Timeline List */}
          <div className="timeline-line">
            {filteredTimeline.map((item, idx) => (
              <div key={idx} className="timeline-node">
                <div className="glass-card !p-6 hover:border-pink-300">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-pink-100 text-pink-700">
                      {item.year}
                    </span>
                    <span className="text-xs font-semibold text-[#7a6e8f] capitalize">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#38314a] mb-2">
                    {item.title}
                  </h3>

                  <p className="text-sm text-[#5a4c66] leading-relaxed mb-4">
                    {item.desc}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-white/90 text-[#7a6e8f] border border-pink-100"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
