import { ArrowUpRight, Heart, Sparkles, Users } from "lucide-react";
import SiteNav from "@/components/SiteNav";

const PARTNERS = [
  {
    name: "선아 (SeonA)",
    tag: "Aesthetic Collaborator & Designer",
    desc: "포트폴리오의 몽환적인 파스텔 비주얼 아이덴티티와 Cloner AI, 비밀 편지 등 감성적인 인터랙션 디자인을 함께 설계하고 구현한 최고의 파트너입니다 🌸",
    avatar: "/images/seona-moon-logo.png",
    link: "https://instagram.com/sx0n._a",
    badge: "Official Collab",
  },
  {
    name: "Team Light",
    tag: "Creative Development Team",
    desc: "기술적인 도전과 웹 최적화, 공동 프로젝트를 함께 연구하며 시너지를 만들어가는 소중한 개발 팀입니다 ✨",
    avatar: "/assets/team-light-logo.png",
    link: "https://teamlight.pe.kr",
    badge: "Development Partner",
  },
  {
    name: "Stellive Collaborators",
    tag: "Virtual Creator Project",
    desc: "팬 프로젝트 및 게임 개발 협업을 통해 인터랙티브 콘텐츠와 생동감 넘치는 연출을 함께 연구하고 있습니다 🎮",
    avatar: "/assets/stellive-logo.png",
    link: "https://stellive.me",
    badge: "Media Collab",
  },
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen">
      <SiteNav active="/partners.html" />

      <main className="page-container" id="main">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest font-bold text-pink-600">
              Partners & Collaboration
            </span>
            <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
              파트너 & 협업 🤝
            </h1>
            <p className="text-sm text-[#7a6e8f] mt-2">
              함께 멋진 가치와 영감을 나누는 파트너들을 소개합니다.
            </p>
          </div>

          <div className="space-y-6">
            {PARTNERS.map((partner) => (
              <div
                key={partner.name}
                className="glass-card !p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-pink-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden p-1 bg-gradient-to-tr from-pink-200 to-purple-200 flex-shrink-0 shadow-md">
                    <img
                      src={partner.avatar}
                      alt={partner.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-[#38314a]">
                        {partner.name}
                      </h2>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
                        {partner.badge}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-purple-600 mb-2">
                      {partner.tag}
                    </div>

                    <p className="text-sm text-[#5a4c66] leading-relaxed max-w-xl">
                      {partner.desc}
                    </p>
                  </div>
                </div>

                <a
                  href={partner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="insta-action-btn insta-btn-secondary self-end sm:self-center flex-shrink-0"
                >
                  방문하기 <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>

          {/* Invitation Card */}
          <div className="glass-card mt-10 text-center p-8 border-dashed border-2 border-pink-300">
            <Heart className="w-8 h-8 text-pink-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-[#38314a] mb-2">
              새로운 협업 제안을 기다립니다
            </h2>
            <p className="text-xs text-[#7a6e8f] max-w-md mx-auto mb-4">
              게임 개발, 셰이더 제작, 인터랙티브 웹 디자인 등 재미있는 아이디어가 있다면 언제든 연락주세요!
            </p>
            <a
              href="mailto:admin@koharu.live"
              className="insta-action-btn insta-btn-primary"
            >
              협업 제안 이메일 보내기
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
