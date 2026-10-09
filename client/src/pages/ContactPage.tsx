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
                <MessageCircle className="w-4 h-4 text-pink-500" /> 디스코드 참여
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
