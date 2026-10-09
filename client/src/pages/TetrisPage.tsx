import { useState, useRef } from "react";
import {
  ExternalLink,
  Gamepad2,
  Maximize2,
  Minimize2,
  RotateCw,
  Sparkles,
  Trophy,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";

export default function TetrisPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  const reloadGame = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen">
      <SiteNav active="/tetris" />

      <main className="page-container" id="main">
        {/* Page Header */}
        <div className="max-w-4xl mx-auto mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-100/80 text-pink-700 text-xs font-bold mb-3 border border-pink-200">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            TETR.IO 공식 웹 게임 엔진
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#c93b77] flex items-center justify-center gap-3">
            <Gamepad2 className="w-8 h-8 text-pink-500" />
            TETR.IO 아케이드
          </h1>
          <p className="text-sm font-semibold text-[#7a6e8f] mt-2 max-w-lg mx-auto">
            세계에서 가장 인기 있는 초고속 모던 테트리스 <strong>TETR.IO</strong>를 코하루 포트폴리오에서 바로 플레이해보세요! 🌸
          </p>
        </div>

        {/* Game Container Card */}
        <div className="max-w-5xl mx-auto mb-10">
          <div
            ref={containerRef}
            className={`glass-card !p-4 sm:!p-6 flex flex-col items-center shadow-2xl border-pink-200/80 relative transition-all duration-300 ${
              isFullscreen ? "bg-[#0b0416] !p-2 !rounded-none" : ""
            }`}
          >
            {/* Toolbar */}
            <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-pink-100/80">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block shadow-sm" />
                <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block shadow-sm" />
                <span className="w-3 h-3 rounded-full bg-green-400 inline-block shadow-sm" />
                <span className="text-xs font-bold text-[#38314a] ml-2 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-pink-500" />
                  tetr.io (Live Web)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={reloadGame}
                  className="insta-action-btn insta-btn-secondary !text-xs !py-1.5 !px-3 cursor-pointer"
                  title="게임 다시 불러오기"
                >
                  <RotateCw className="w-3.5 h-3.5" /> 새로고침
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="insta-action-btn insta-btn-secondary !text-xs !py-1.5 !px-3 cursor-pointer"
                  title={isFullscreen ? "전체화면 종료" : "전체화면"}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5" /> 축소
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" /> 전체화면
                    </>
                  )}
                </button>

                <a
                  href="https://tetr.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="insta-action-btn insta-btn-primary !text-xs !py-1.5 !px-3 cursor-pointer inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> 새 창에서 열기
                </a>
              </div>
            </div>

            {/* TETR.IO iframe viewport */}
            <div
              className={`w-full rounded-2xl overflow-hidden bg-[#070114] border border-pink-900/40 shadow-inner relative ${
                isFullscreen ? "h-[calc(100vh-60px)]" : "h-[620px] sm:h-[750px]"
              }`}
            >
              <iframe
                key={iframeKey}
                src="https://tetr.io/"
                title="TETR.IO Game Client"
                className="w-full h-full border-0 block"
                allow="autoplay; fullscreen; microphone; camera; midi; encrypted-media; clipboard-read; clipboard-write; web-share; payment"
                loading="lazy"
              />
            </div>

            {/* Quick Play Guide below game */}
            <div className="w-full mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[#7a6e8f] px-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-[#c93b77]">🎮 기본 조작:</span>
                <span><strong>← →</strong> 이동</span>
                <span><strong>↑ / X</strong> 시계 회전</span>
                <span><strong>Z</strong> 반시계 회전</span>
                <span><strong>A</strong> 180° 회전</span>
                <span><strong>SPACE</strong> 하드 드롭</span>
                <span><strong>C / Shift</strong> 홀드</span>
              </div>
              <div>
                <span>배경음악 및 룸 참여, 솔로 스프린트 지원 ✨</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info & Tips Section */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="glass-card !p-5">
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 mb-3 font-bold text-lg">
              ⚡
            </div>
            <h3 className="font-bold text-sm text-[#38314a] mb-1">40 LINE SPRINT</h3>
            <p className="text-xs text-[#7a6e8f] leading-relaxed">
              40줄을 얼마나 빠른 시간 안에 클리어하는지 테스트해보세요! 세계 랭커들의 기록과 경쟁할 수 있습니다.
            </p>
          </div>

          <div className="glass-card !p-5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 mb-3 font-bold text-lg">
              💫
            </div>
            <h3 className="font-bold text-sm text-[#38314a] mb-1">T-SPIN & B2B</h3>
            <p className="text-xs text-[#7a6e8f] leading-relaxed">
              T-스핀과 테트리스(4줄)를 연속으로 성공시켜 Back-to-Back 콤보 공격을 연습하고 마스터해보세요.
            </p>
          </div>

          <div className="glass-card !p-5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 mb-3 font-bold text-lg">
              🌐
            </div>
            <h3 className="font-bold text-sm text-[#38314a] mb-1">전 세계 유저와 대전</h3>
            <p className="text-xs text-[#7a6e8f] leading-relaxed">
              TETR.IO 멀티플레이어 로비에 참여하여 실시간으로 다른 플레이어들과 방을 만들고 1:1 배틀을 즐길 수 있습니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-[#7a6e8f] py-6">
          <p>TETR.IO is created by osk · Embedded in ! Koharu koharu.live portfolio 🌸</p>
        </footer>
      </main>
    </div>
  );
}
