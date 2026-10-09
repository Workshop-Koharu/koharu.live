import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";

export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("admin@koharu.live");
      setCopied(true);
      toast.success("이메일 주소를 복사했어요.");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("복사하지 못했어요.");
    }
  };

  return (
    <PageShell active="/contact" eyebrow="Contact" title="연락 및 링크" description="필요한 링크와 연락 수단을 한곳에 모았습니다.">
      <section className="contact-card entrance delay-1">
        <div><div className="section-kicker">open to ideas</div><h2 className="contact-title">같이 재미있는 것을 만들어볼까요?</h2><p className="contact-copy">협업, 프로젝트, 가벼운 이야기 모두 편하게 연락해주세요.</p></div>
        <div className="contact-actions">
          <a className="email-action" href="mailto:admin@koharu.live"><Mail size={14} /> 이메일 보내기</a>
          <button className="email-action" onClick={copyEmail}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "복사했어요" : "주소 복사"}</button>
        </div>
      </section>
      <div className="email-address" style={{ marginTop: "13px" }}>admin@koharu.live</div>
    </PageShell>
  );
}
