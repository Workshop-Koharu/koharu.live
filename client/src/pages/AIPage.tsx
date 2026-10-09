import { useEffect, useRef, useState } from "react";
import { Bot, Code2, Palette, Send, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

const SUGGESTIONS = [
  { mode: "code", label: "코딩", text: "유니티 C# 2D 플레이어 점프 및 이동 스크립트 작성해줘" },
  { mode: "code", label: "엔진", text: "파이썬으로 구현하는 간단한 타일맵 던전 생성 알고리즘 알려줘" },
  { mode: "image", label: "디자인", text: "달빛 아래 파스텔빛 풍경과 벚꽃 일러스트 컨셉 제안해줘" },
  { mode: "chat", label: "소개", text: "코하루 포트폴리오의 주요 프로젝트와 기술을 소개해줘" },
];

export default function AIPage() {
  const [model, setModel] = useState<"v1" | "v2">("v1");
  const [mode, setMode] = useState<"auto" | "chat" | "code" | "image">("auto");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "안녕하세요! 코하루 포트폴리오의 AI 어시스턴트입니다 🌸\n게임 프로그래밍, 유니티 C# 코드 작성, 셰이더 아이디어, 또는 궁금한 점이 있다면 편하게 물어보세요 ⁽⁽ (˶> ᎑ <˶) ⁾⁾!",
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          mode,
          model,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          role: "ai",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error();
      }
    } catch {
      // Fallback response
      const fallbackAiMsg: Message = {
        role: "ai",
        content: `"${textToSend}"에 대한 답변입니다 🌸\n\n코하루는 게임 프로그래밍과 웹 개발, 유니티 셰이더에 깊은 열정을 쏟고 있어요!\n궁금하신 코드가 있으시면 언제든 편하게 물어보세요. 곧 더 강력한 모델로 업데이트될 예정입니다 ✨`,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteNav active="/ai" />

      <main className="page-container" id="main">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-xs uppercase tracking-widest font-bold text-pink-600">
              Cloner AI
            </span>
            <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1 flex items-center justify-center gap-2">
              <Sparkles className="w-7 h-7 text-pink-500" /> Cloner AI 어시스턴트
            </h1>
            <p className="text-sm text-[#7a6e8f] mt-1">
              코하루의 게임 개발 및 프로그래밍 지식이 담긴 대화형 AI 어시스턴트입니다.
            </p>
          </div>

          {/* Model & Mode Controls */}
          <div className="glass-card !p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
            {/* Model switch */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/70 border border-pink-100">
              <button
                onClick={() => setModel("v1")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  model === "v1"
                    ? "bg-pink-600 text-white shadow"
                    : "text-[#7a6e8f] hover:text-pink-600"
                }`}
              >
                Cloner v1
              </button>
              <button
                onClick={() => setModel("v2")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  model === "v2"
                    ? "bg-purple-600 text-white shadow"
                    : "text-[#7a6e8f] hover:text-purple-600"
                }`}
              >
                Cloner v2 (3B)
              </button>
            </div>

            {/* Mode switch */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/70 border border-pink-100">
              {[
                { id: "auto", label: "자동" },
                { id: "chat", label: "채팅" },
                { id: "code", label: "코딩" },
                { id: "image", label: "디자인" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as any)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    mode === m.id
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow"
                      : "text-[#7a6e8f] hover:text-pink-600"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Container */}
          <div className="glass-card !p-0 overflow-hidden flex flex-col h-[520px]">
            {/* Messages Scroll Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "ai" && (
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-300 via-purple-300 to-sky-300 flex items-center justify-center flex-shrink-0 text-white shadow-md">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-500/10"
                        : "bg-white/90 text-[#38314a] border border-pink-100/80 shadow-sm"
                    }`}
                  >
                    {msg.content}
                    <div
                      className={`text-[10px] mt-1 text-right ${
                        msg.role === "user" ? "text-pink-100" : "text-[#7a6e8f]"
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-9 h-9 rounded-2xl bg-pink-100 flex items-center justify-center flex-shrink-0 text-pink-600">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 items-center text-xs text-[#7a6e8f]">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>Cloner가 생각을 정리하고 있어요...</span>
                </div>
              )}
            </div>

            {/* Suggestion Chips */}
            <div className="p-3 bg-pink-50/50 border-t border-pink-100 flex gap-2 overflow-x-auto scrollbar-none">
              {SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(item.text)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-[#38314a] hover:bg-pink-100/70 transition-colors flex items-center gap-1.5"
                >
                  <span className="font-bold text-pink-600">[{item.label}]</span>
                  <span>{item.text}</span>
                </button>
              ))}
            </div>

            {/* Composer Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white border-t border-pink-100 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Cloner에게 질문하거나 코드를 요청해보세요..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-pink-200 outline-none focus:border-pink-500 bg-pink-50/20"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="insta-action-btn insta-btn-primary !px-4 !py-2.5"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
