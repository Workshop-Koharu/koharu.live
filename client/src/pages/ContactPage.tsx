import { useState } from "react";
import { Check, Copy, ExternalLink, Mail, MessageCircle, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";

export default function ContactPage() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("admin@koharu.live");
      setCopied(true);
      toast.success("이메일 주소(admin@koharu.live)를 복사했습니다! 🌸");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("복사하지 못했습니다. admin@koharu.live를 직접 입력해주세요.");
    }
  };

  return (
    <div className="min-h-screen">
      <SiteNav active="/contact" />

      <main className="page-container" id="main">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest font-bold text-pink-600">
              Get in Touch
            </span>
            <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
              연락 및 소통 ✉️
            </h1>
            <p className="text-sm text-[#7a6e8f] mt-2">
              협업, 프로젝트 문의, 가벼운 대화 등 언제든 편하게 연락해주세요.
            </p>
          </div>

          {/* Contact Card */}
          <div className="glass-card !p-8 text-center max-w-xl mx-auto mb-8 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-pink-100 flex items-center justify-center mx-auto mb-5 text-pink-600 shadow-md">
              <Mail className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-[#38314a] mb-2">
              함께 멋진 것을 만들어볼까요?
            </h2>
            <p className="text-sm text-[#5a4c66] leading-relaxed mb-6">
              아이디어 제안, 인디 게임 및 웹 개발 협업, 피드백 등 소중한 연락을 항상 환영합니다.
            </p>

            {/* Email display & actions */}
            <div className="p-3.5 rounded-2xl bg-white/80 border border-pink-200/80 flex items-center justify-between gap-3 mb-6 shadow-sm">
              <span className="font-mono text-sm font-bold text-[#38314a] truncate">
                admin@koharu.live
              </span>
              <button
                onClick={copyEmail}
                className="px-3 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-xs font-bold text-pink-700 flex items-center gap-1.5 transition-colors flex-shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "복사됨" : "주소 복사"}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:admin@koharu.live"
                className="insta-action-btn insta-btn-primary !px-5 !py-2.5 flex items-center gap-2"
              >
                <Mail className="w-4 h-4" /> 이메일 바로 보내기
              </a>
              <a
                href="https://discord.gg/pwRZEZ4zmt"
                target="_blank"
                rel="noopener noreferrer"
                className="insta-action-btn insta-btn-secondary !px-5 !py-2.5 flex items-center gap-2"
              >
                <svg className="w-4 h-4 fill-[#5865F2] shrink-0" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span>디스코드 참여</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
