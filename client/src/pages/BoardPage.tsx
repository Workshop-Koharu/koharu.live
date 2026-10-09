import { useEffect, useState } from "react";
import { Lock, MessageSquare, Send, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";

interface GuestbookEntry {
  id: number;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  isSecret: boolean;
  createdAt: string;
}

export default function BoardPage() {
  const [messages, setMessages] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/guestbook");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      toast.error("방명록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("메시지 내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    const authorName = name.trim() || "익명 방문자";

    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          content: content.trim(),
          isSecret,
        }),
      });

      if (res.ok) {
        toast.success("방명록에 응원 글이 등록되었습니다! 🌸");
        setContent("");
        setIsSecret(false);
        fetchMessages();
      } else {
        toast.error("등록에 실패했습니다.");
      }
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteNav active="/board" />

      <main className="page-container" id="main">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-widest font-bold text-pink-600">
              Guestbook & Board
            </span>
            <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
              방명록 게시판 💬
            </h1>
            <p className="text-sm text-[#7a6e8f] mt-2">
              코하루에게 따뜻한 응원의 한 마디와 소감을 자유롭게 남겨주세요.
            </p>
          </div>

          {/* New Message Form */}
          <div className="glass-card mb-10">
            <h2 className="text-lg font-bold text-[#38314a] mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-pink-600" />
              글 남기기
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                  닉네임
                </label>
                <input
                  type="text"
                  placeholder="닉네임 (기본: 익명 방문자)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-pink-200 outline-none bg-white/70 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                  남길 메시지
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="코하루에게 전하고 싶은 말을 적어주세요 ⁽⁽ (˶> ᎑ <˶) ⁾⁾..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-pink-200 outline-none bg-white/70 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-[#7a6e8f] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSecret}
                    onChange={(e) => setIsSecret(e.target.checked)}
                    className="accent-pink-600 rounded"
                  />
                  <span>비밀글로 남기기 (관리자만 보기)</span>
                </label>

                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="insta-action-btn insta-btn-primary"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "등록 중..." : "방명록 남기기"}
                </button>
              </div>
            </form>
          </div>

          {/* Message List */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#38314a] mb-4">
              남겨진 이야기들 ({messages.length})
            </h3>

            {loading ? (
              <div className="text-center py-12 text-[#7a6e8f]">
                <Sparkles className="w-6 h-6 animate-spin mx-auto mb-2 text-pink-500" />
                방명록을 불러오는 중...
              </div>
            ) : messages.length === 0 ? (
              <div className="glass-card text-center py-10">
                <p className="text-sm text-[#7a6e8f]">아직 남겨진 방명록이 없습니다. 첫 번째 글의 주인공이 되어보세요!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="glass-card !p-5 hover:border-pink-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {msg.authorAvatar ? (
                        <img
                          src={msg.authorAvatar}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-pink-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-200 to-purple-200 flex items-center justify-center font-bold text-sm text-pink-700">
                          {msg.authorName[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-sm text-[#38314a] flex items-center gap-2">
                          {msg.authorName}
                          {msg.isSecret && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> 비밀글
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#7a6e8f]">
                          {new Date(msg.createdAt).toLocaleString("ko-KR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-[#4a3952] leading-relaxed whitespace-pre-line pl-12">
                    {msg.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
