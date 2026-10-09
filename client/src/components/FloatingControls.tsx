import { useEffect, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";

export default function FloatingControls() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 280);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <aside
      aria-label="화면 바로가기 컨트롤"
      className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-2.5 select-none"
    >
      {/* Scroll To Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md border border-pink-200/80 text-pink-600 shadow-lg shadow-pink-500/15 flex items-center justify-center hover:bg-gradient-to-tr hover:from-pink-500 hover:to-purple-500 hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-bottom-4 group"
          title="페이지 최상단으로 이동"
          aria-label="맨 위로 가기"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}
    </aside>
  );
}
