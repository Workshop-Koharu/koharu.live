import { useState } from "react";
import { Calendar, CheckCircle2, Milestone, Sparkles } from "lucide-react";
import SiteNav from "@/components/SiteNav";

interface TimelineItem {
  year: string;
  title: string;
  category: string;
  desc: string;
  tags: string[];
}

const TIMELINE: TimelineItem[] = [];

export default function HistoryPage() {
  return (
    <div className="min-h-screen">
      <SiteNav active="/history" />

      <main className="page-container" id="main">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest font-bold text-pink-600">
              Journey & Milestones
            </span>
            <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
              히스토리 📜
            </h1>
            <p className="text-sm text-[#7a6e8f] mt-2">
              코하루가 걸어온 개발의 발자취와 주요 전환점들을 기록하는 공간입니다.
            </p>
          </div>

          <div className="glass-card text-center py-20 px-6 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4 text-pink-500">
              <Calendar className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-[#38314a] mb-2">
              아직 등록된 히스토리가 없습니다
            </h2>
            <p className="text-xs text-[#7a6e8f] leading-relaxed">
              새로운 프로젝트와 여정, 소중한 순간들을 차근차근 기록해 나갈 예정입니다 ✨
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
