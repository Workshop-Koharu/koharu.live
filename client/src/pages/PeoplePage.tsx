import { Heart, Sparkles, UserCheck } from "lucide-react";
import SiteNav from "@/components/SiteNav";

const PEOPLE = [
  {
    name: "Team Light",
    role: "Full-Stack Dev Team",
    status: "더 나은 웹과 성능을 향해 코딩 중 ✨",
    avatar: "/assets/team-light-logo.png",
    handle: "@teamlight",
  },
  {
    name: "루나♡",
    role: "Friend",
    status: "루나입니다 ㅎㅎ 항상 응원해 🌙",
    avatar: "/images/luna-profile.png",
    handle: "@babo_1362",
  },
  {
    name: "하루카♡",
    role: "Friend",
    status: "행복한 하루 되세요 💖",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    handle: "@haruka_226",
  },
  {
    name: "네쥬(설월)",
    role: "Friend",
    status: "눈꽃처럼 포근하게 ❄️",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    handle: "@jia_prettysnow",
  },
  {
    name: "한체린",
    role: "Friend",
    status: "반가워요! 🌸",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
    handle: "@c_x_r1n",
  },
  {
    name: "소라",
    role: "Friend",
    status: "소라입니다 🐚",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    handle: "@k.ey_0706",
  },
  {
    name: "시로",
    role: "Friend",
    status: "언제나 밝게 ☀️",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    handle: "@xo._.dai07",
  },
  {
    name: "조랭이",
    role: "Friend",
    status: "조랭이떡처럼 말랑하게 🍡",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    handle: "@jolaeng.i",
  },
  {
    name: "남다람쥐",
    role: "Friend",
    status: "날다람쥐처럼 슝슝 🐿️",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    handle: "@flying_squirrel__",
  },
  {
    name: "파스",
    role: "Friend",
    status: "파스입니다 🌿",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80",
    handle: "@psd_psdpsdpspd",
  },
  {
    name: "세유",
    role: "Friend",
    status: "반갑습니다 ✨",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
    handle: "@_nxu3o",
  },
  {
    name: "HS",
    role: "Friend",
    status: "화이팅! 🚀",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
    handle: "@huiseong",
  },
  {
    name: "이솔",
    role: "Friend",
    status: "항상 응원해요 🌟",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
    handle: "@lum2sol",
  },
  {
    name: "Daze",
    role: "Friend",
    status: "좋은 하루! 🍀",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    handle: "@hina_te1",
  },
  {
    name: "리트",
    role: "Friend",
    status: "리트입니다 💫",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
    handle: "@litu_",
  },
];

export default function PeoplePage() {
  return (
    <div className="min-h-screen">
      <SiteNav active="/person" />

      <main className="page-container" id="main">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest font-bold text-pink-600">
              Connections & Friends
            </span>
            <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
              소중한 지인들 🌸
            </h1>
            <p className="text-sm text-[#7a6e8f] mt-2">
              코하루의 곁에서 항상 든든한 응원과 영감을 건네주는 소중한 사람들입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {PEOPLE.map((person) => (
              <div
                key={person.name}
                className="glass-card !p-5 flex items-center gap-3.5 hover:border-pink-300"
              >
                <div className="w-13 h-13 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-pink-200 to-purple-200 flex-shrink-0 shadow-md">
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-sm text-[#38314a] truncate">
                      {person.name}
                    </h2>
                  </div>
                  <div className="text-[11px] font-semibold text-pink-600 truncate">
                    {person.handle}
                  </div>
                  <p className="text-xs text-[#7a6e8f] truncate mt-0.5">
                    {person.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
