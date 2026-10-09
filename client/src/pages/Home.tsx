import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowUpRight,
  Calendar,
  Camera,
  Check,
  Copy,
  FolderGit2,
  Mail,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";

const skills = [
  { name: "Unity / C#", icon: "https://cdn.simpleicons.org/unity/E48CDC", level: 85 },
  { name: "Shader & HLSL", icon: "https://cdn.simpleicons.org/opengl/E48CDC", level: 78 },
  { name: "TypeScript", icon: "https://cdn.simpleicons.org/typescript/E48CDC", level: 82 },
  { name: "JavaScript", icon: "https://cdn.simpleicons.org/javascript/E48CDC", level: 80 },
  { name: "Python", icon: "https://cdn.simpleicons.org/python/E48CDC", level: 75 },
  { name: "Git & Engine Tools", icon: "https://cdn.simpleicons.org/git/E48CDC", level: 88 },
];

export default function Home() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("admin@koharu.live");
      setCopied(true);
      toast.success("이메일 주소(admin@koharu.live)를 복사했어요! 🌸");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("복사하지 못했습니다. admin@koharu.live 를 직접 복사해주세요.");
    }
  };

  return (
    <div className="min-h-screen">
      <SiteNav active="/profile" />

      <main className="page-container" id="main">
        {/* Centered Profile Card */}
        <div className="max-w-2xl mx-auto mb-12">
          <section className="glass-card text-center !p-10" aria-labelledby="profile-name">
            <div className="relative w-[136px] h-[136px] mx-auto mb-6">
              <div className="w-full h-full rounded-[32px] overflow-hidden p-1.5 bg-gradient-to-tr from-pink-400 via-purple-300 to-sky-300 shadow-xl shadow-pink-500/20">
                <img
                  src="/assets/koharu-profile.png"
                  alt="! Koharu 프로필 사진"
                  className="w-full h-full object-cover rounded-[26px]"
                />
              </div>
              <span className="absolute -bottom-2 -right-2 bg-white/95 text-pink-600 text-xs font-bold px-3 py-1 rounded-full shadow-md border border-pink-200">
                Online ✨
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
              <h1 id="profile-name" className="text-3xl sm:text-4xl font-extrabold text-[#c93b77]">
                ! Koharu · 코하루
              </h1>
            </div>

            <p className="text-sm font-semibold text-[#7a6e8f] mb-6">
              코드로 세상을 플레이어블하게 만드는 중 🌸
            </p>

            <div className="h-px bg-gradient-to-r from-transparent via-pink-300/40 to-transparent my-6" />

            <div className="text-left text-xs uppercase tracking-wider font-bold text-pink-600 mb-2">
              소개
            </div>
            <p className="text-left text-[15px] leading-relaxed text-[#4a3952]">
              안녕하세요! 게임 프로그래머 <strong>코하루</strong>입니다 ⁽⁽ (˶&gt; ᎑ &lt;˶) ⁾⁾<br />
              코드로 생동감 있는 움직임을 구현하고, 머릿속 아이디어를 플레이 가능한 장면으로 만들어가요.<br />
              Unity C#, 커스텀 셰이더, 경량 스크립트 엔진부터 웹 기술까지 호기심을 갖고 깊이 탐구하고 있습니다 ✨
            </p>
          </section>
        </div>

        {/* Skills Section */}
        <section className="max-w-4xl mx-auto mb-14" aria-labelledby="skills-title">
          <div className="flex items-center justify-between mb-6">
            <h2 id="skills-title" className="text-2xl font-bold text-[#c93b77] flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-pink-500" />
              스킬 & 역량
            </h2>
            <Link href="/skills" className="text-xs font-bold text-pink-600 hover:underline flex items-center gap-1">
              전체 보기 <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill) => (
              <div key={skill.name} className="glass-card !p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-100 to-purple-100 flex items-center justify-center flex-shrink-0 border border-pink-200/50">
                  <img src={skill.icon} alt={skill.name} className="w-5 h-5 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-[#38314a]">{skill.name}</span>
                    <span className="text-xs font-bold text-pink-600">{skill.level}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-pink-100/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-400 transition-all duration-1000"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact and Links Section */}
        <section className="glass-card max-w-4xl mx-auto mb-12" id="contact" aria-labelledby="contact-title">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-pink-600">Explore & Connect</span>
              <h2 id="contact-title" className="text-2xl font-bold text-[#c93b77] mt-1">
                주요 페이지 & 바로가기
              </h2>
            </div>
            <p className="text-xs text-[#7a6e8f] max-w-xs">
              인스타그램 피드와 프로젝트, 히스토리 등 코하루 포트폴리오의 다양한 공간을 탐색해보세요.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {/* Instagram Feed Link */}
            <Link
              href="/instagram"
              className="glass-card !p-4 flex items-center justify-between group hover:border-pink-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#38314a]">인스타그램 피드</div>
                  <div className="text-xs text-[#7a6e8f]">소식 & 사진 피드</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            {/* Projects Link */}
            <Link
              href="/projects"
              className="glass-card !p-4 flex items-center justify-between group hover:border-pink-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#38314a]">프로젝트</div>
                  <div className="text-xs text-[#7a6e8f]">작업물 둘러보기</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            {/* History Link */}
            <Link
              href="/history"
              className="glass-card !p-4 flex items-center justify-between group hover:border-pink-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#38314a]">히스토리</div>
                  <div className="text-xs text-[#7a6e8f]">개발 타임라인</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            {/* Secret Letter Link */}
            <Link
              href="/letter"
              className="glass-card !p-4 flex items-center justify-between group hover:border-pink-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#38314a]">비밀 편지</div>
                  <div className="text-xs text-[#7a6e8f]">코드 입력하고 열기</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            {/* Partners Link */}
            <Link
              href="/partners"
              className="glass-card !p-4 flex items-center justify-between group hover:border-pink-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#38314a]">파트너</div>
                  <div className="text-xs text-[#7a6e8f]">팀 라이트 (Team Light)</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            {/* People Link */}
            <Link
              href="/person"
              className="glass-card !p-4 flex items-center justify-between group hover:border-pink-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#38314a]">지인 목록</div>
                  <div className="text-xs text-[#7a6e8f]">소중한 인연들</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {/* Quick Copy Email Box */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white/60 border border-white/90">
            <div>
              <div className="font-bold text-sm text-[#38314a]">이메일 문의 & 협업 제안</div>
              <div className="text-xs text-[#7a6e8f]">admin@koharu.live · 언제든 편하게 연락주세요!</div>
            </div>
            <button
              onClick={copyEmail}
              className="insta-action-btn insta-btn-primary"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "복사완료!" : "이메일 복사하기"}
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-[#7a6e8f] py-6">
          <p>Made with Code & Curiosity 🌸 ! Koharu · koharu.live</p>
        </footer>
      </main>
    </div>
  );
}
