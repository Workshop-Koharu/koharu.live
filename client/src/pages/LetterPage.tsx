import { useState } from "react";
import { KeyRound, Lock, Mail, RefreshCw, Sparkles, Unlock } from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";

const SECRET_CODE = "1204"; // Default Koharu secret passcode (hint provided)

export default function LetterPage() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleNumClick = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin === SECRET_CODE) {
        setUnlocked(true);
        toast.success("비밀 편지가 열렸습니다! 🌸");
      } else if (nextPin.length === 4) {
        toast.error("비밀번호가 올바르지 않아요. 힌트를 확인해보세요!");
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleReset = () => {
    setPin("");
    setUnlocked(false);
  };

  return (
    <div className="min-h-screen">
      <SiteNav active="/letter.html" />

      <main className="page-container" id="main">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-widest font-bold text-pink-600">
              Secret Letter
            </span>
            <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
              비밀 편지 💌
            </h1>
            <p className="text-sm text-[#7a6e8f] mt-2">
              숫자 코드를 입력하면 열리는 코하루의 비밀 편지입니다.
            </p>
          </div>

          {!unlocked ? (
            /* PIN Keypad Screen */
            <div className="glass-card text-center p-8">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-200 to-purple-200 flex items-center justify-center mx-auto mb-6 text-pink-700 shadow-md">
                <Lock className="w-8 h-8" />
              </div>

              <h2 className="text-lg font-bold text-[#38314a] mb-2">
                4자리 숫자 코드를 입력해주세요
              </h2>

              {/* Pin Display Dots */}
              <div className="flex justify-center gap-4 my-6">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border-2 border-pink-400 transition-all ${
                      pin.length > index
                        ? "bg-pink-500 scale-125"
                        : "bg-white/80"
                    }`}
                  />
                ))}
              </div>

              {/* Numeric Keypad */}
              <div className="pin-keypad">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumClick(num)}
                    className="pin-btn"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleReset}
                  className="pin-btn text-xs font-semibold"
                >
                  지우기
                </button>
                <button
                  type="button"
                  onClick={() => handleNumClick("0")}
                  className="pin-btn"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="pin-btn text-xs font-semibold"
                >
                  ←
                </button>
              </div>

              {/* Hint section */}
              <div className="mt-6 pt-4 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="text-xs text-pink-600 font-bold hover:underline"
                >
                  {showHint ? "힌트 접기" : "💡 비밀번호 힌트 보기"}
                </button>
                {showHint && (
                  <p className="text-xs text-[#7a6e8f] mt-2 animate-fadeIn bg-pink-50 p-2.5 rounded-xl border border-pink-200">
                    힌트: 코하루가 가장 좋아하는 숫자 코드 [<strong>1204</strong>] 입니다!
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Unlocked Secret Letter Screen */
            <div className="letter-envelope animate-fadeIn">
              <div className="flex items-center justify-between pb-4 border-b border-pink-200/50 mb-6">
                <span className="flex items-center gap-2 text-pink-600 font-bold text-sm">
                  <Unlock className="w-4 h-4" /> 비밀 편지 봉인이 해제되었습니다
                </span>
                <button
                  onClick={handleReset}
                  className="text-xs text-[#7a6e8f] hover:text-pink-600 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 다시 잠그기
                </button>
              </div>

              <div className="text-left font-['EF_Diary'] text-[16px] leading-[2.1] text-[#3d2e47] space-y-4">
                <p>
                  안녕! 여기까지 찾아와 코드를 풀어줘서 고마워 ⁽⁽ (˶&gt; ᎑ &lt;˶) ⁾⁾🌸
                </p>
                <p>
                  혼자서 코드를 짜고 게임을 만들다 보면 가끔은 화면 속 세상이 전부인 것처럼 느껴질 때가 있어.
                  하지만 이렇게 누군가 내 페이지를 찾아와서, 내가 만든 장면들을 봐주고 있다는 생각을 하면
                  다시 손가락에 힘이 들어가곤 해.
                </p>
                <p>
                  코하루 포트폴리오에는 너희들과 함께한 순간들이 담겨있어.
                  앞으로도 더 재미있고 사랑스러운 게임과 인터랙티브한 경험들을 만들어 나갈 테니까,
                  지켜봐 주면 정말 기쁠 것 같아!
                </p>
                <p>
                  오늘 너의 하루도 버그 없이 평온하고, 좋아하는 일들로 반짝이기를 바랄게 ✨
                </p>
                <div className="text-right pt-6">
                  <p className="font-bold text-pink-600">! Koharu 드림 🌸</p>
                  <p className="text-xs text-[#7a6e8f]">From koharu.live</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
