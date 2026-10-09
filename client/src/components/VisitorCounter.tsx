/**
 * VisitorCounter — Odometer-style animated visitor counter.
 * Stores daily & total count in localStorage (no server needed).
 */
import { useEffect, useRef, useState } from "react";

function useOdometer(target: number, duration = 1200) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;

    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(fromRef.current + (target - fromRef.current) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return display;
}

function OdometerDigits({ value, digits = 6 }: { value: number; digits?: number }) {
  const padded = String(value).padStart(digits, "0");

  return (
    <div className="flex gap-0.5">
      {padded.split("").map((d, i) => (
        <div
          key={i}
          className="relative w-8 h-12 sm:w-10 sm:h-14 bg-gradient-to-b from-[#1a0a2e] to-[#2d1060] rounded-md overflow-hidden flex items-center justify-center shadow-inner border border-purple-900/60"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          {/* Reflection line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-black/30" />
          {/* Divider */}
          <div className="absolute top-1/2 -translate-y-px left-0 right-0 h-px bg-black/40 z-10" />
          <span
            className="text-pink-300 font-bold text-xl sm:text-2xl z-10 leading-none select-none"
            style={{
              textShadow: "0 0 8px #f9a8d4, 0 0 18px #e879f9",
            }}
          >
            {d}
          </span>
        </div>
      ))}
    </div>
  );
}

function getTodayKey() {
  const d = new Date();
  return `visit_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

export default function VisitorCounter({ className = "" }: { className?: string }) {
  const [todayCount, setTodayCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const todayKey = getTodayKey();
    const totalKey = "visit_total";

    try {
      // Increment visit counts
      const today = parseInt(localStorage.getItem(todayKey) || "0", 10) + 1;
      const total = parseInt(localStorage.getItem(totalKey) || "0", 10) + 1;

      localStorage.setItem(todayKey, String(today));
      localStorage.setItem(totalKey, String(total));

      setTodayCount(today);
      setTotalCount(total);
    } catch {
      setTodayCount(1);
      setTotalCount(1);
    }
  }, []);

  const displayToday = useOdometer(todayCount, 800);
  const displayTotal = useOdometer(totalCount, 1400);

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Today */}
      <div className="text-center">
        <div className="text-[10px] font-bold uppercase tracking-widest text-pink-400 mb-2 flex items-center gap-1.5 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse inline-block" />
          오늘 방문자
        </div>
        <OdometerDigits value={displayToday} digits={4} />
      </div>

      <div className="w-px h-8 bg-gradient-to-b from-pink-500/40 to-purple-500/40" />

      {/* Total */}
      <div className="text-center">
        <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-2 flex items-center gap-1.5 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse inline-block" />
          누적 방문자
        </div>
        <OdometerDigits value={displayTotal} digits={6} />
      </div>
    </div>
  );
}
