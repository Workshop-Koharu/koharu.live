import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ShieldCheck, Sparkles, User, AlertCircle } from "lucide-react";

export default function DiscordCallbackPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [adminDetected, setAdminDetected] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (error) {
      setStatus("error");
      setErrorMessage(errorDescription || error);
      toast.error(`디스코드 로그인 실패: ${errorDescription || error}`);
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMessage("인증 코드가 누락되었습니다.");
      return;
    }

    const exchangeCode = async () => {
      try {
        let redirectUri = `${window.location.origin}/auth/discord/callback`;
        if (!window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")) {
          redirectUri = "https://www.koharu.live/auth/discord/callback";
        }

        const res = await fetch("/api/auth/discord/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, redirectUri }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "디스코드 토큰 교환에 실패했습니다.");
        }

        const user = data.user;
        localStorage.setItem("koharu_app_user_v2", JSON.stringify(user));
        setAdminDetected(user.isAdmin);
        setStatus("success");

        if (user.isAdmin) {
          toast.success(`🌸 환영합니다 코하루님! 블로그 관리자 권한으로 로그인되었습니다.`, { duration: 4000 });
        } else {
          toast.success(`${user.name}님 환영합니다! 디스코드 로그인이 완료되었습니다.`);
        }

        const returnUrl = sessionStorage.getItem("auth_return_url") || "/blog";
        sessionStorage.removeItem("auth_return_url");

        setTimeout(() => {
          setLocation(returnUrl);
        }, 1200);
      } catch (err: any) {
        console.error("Discord callback processing error:", err);
        setStatus("error");
        setErrorMessage(err.message || "로그인 처리 중 오류가 발생했습니다.");
      }
    };

    exchangeCode();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-tr from-pink-50 via-purple-50 to-pink-100">
      <div className="max-w-md w-full glass-card text-center !p-8 shadow-2xl rounded-3xl border border-pink-200">
        {status === "loading" && (
          <div className="space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full border-4 border-pink-200 border-t-pink-600 animate-spin" />
            <h2 className="text-xl font-extrabold text-[#38314a]">디스코드 계정 확인 중...</h2>
            <p className="text-sm text-[#7a6e8f]">권한 및 로그인 정보를 동기화하고 있습니다. 잠시만 기다려주세요 🌸</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
              {adminDetected ? <ShieldCheck className="w-9 h-9" /> : <User className="w-9 h-9" />}
            </div>
            <h2 className="text-2xl font-extrabold text-[#38314a]">
              {adminDetected ? "블로그 최고 관리자 승인!" : "로그인 완료!"}
            </h2>
            <p className="text-sm text-[#7a6e8f]">
              {adminDetected
                ? "코하루 관리자 계정이 확인되었습니다. 글 작성 및 관리 권한이 부여되었습니다."
                : "정상적으로 인증되었습니다. 잠시 후 이전 페이지로 이동합니다."}
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-pink-600 font-bold bg-pink-100/70 px-3.5 py-1.5 rounded-full">
              <Sparkles className="w-4 h-4" /> 페이지로 이동 중...
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#38314a]">로그인 처리 오류</h2>
            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-200 font-mono text-xs">
              {errorMessage}
            </p>
            <button
              onClick={() => setLocation("/blog")}
              className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm transition"
            >
              블로그 메인으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

