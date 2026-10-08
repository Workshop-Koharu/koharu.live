import { Heart, Sparkles, UserCheck } from "lucide-react";
import SiteNav from "@/components/SiteNav";

const PEOPLE = [
  {
    name: "선아 (SeonA)",
    role: "Aesthetic Designer & Creator",
    status: "하루하루를 행복하게 살아가보는중 🌸",
    avatar: "/images/seona-moon-logo.png",
  },
  {
    name: "Team Light Devs",
    role: "Full-Stack & Graphics Engineers",
    status: "더 나은 웹과 성능을 향해 코딩 중 ✨",
    avatar: "/assets/team-light-logo.png",
  },
  {
    name: "Luna",
    role: "Indie Game Tester",
    status: "플레이 피드백 주는 중 🎮",
    avatar: "/images/luna-profile.png",
  },
  {
    name: "Pixel Meister",
    role: "2D Pixel Artist",
    status: "도트 한 땀 한 땀 찍는 중 🎨",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  },
];

export default function PeoplePage() {
  return (
    <div className="min-h-screen">
      <SiteNav active="/person.html" />

      <main className="page-container" id="main">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest font-bold text-pink-600">
              Connections & Friends
            </span>
            <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
              소중한 지인들 🌸
            </h1>
            <p className="text-sm text-[#7a6e8f] mt-2">
              코하루의 곁에서 항상 든든한 응원과 영감을 건네주는 분들입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PEOPLE.map((person) => (
              <div
                key={person.name}
                className="glass-card !p-5 flex items-center gap-4 hover:border-pink-300"
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-pink-200 to-purple-200 flex-shrink-0 shadow-md">
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-bold text-base text-[#38314a] truncate">
                      {person.name}
                    </h2>
                  </div>
                  <div className="text-xs font-semibold text-pink-600 mb-1">
                    {person.role}
                  </div>
                  <p className="text-xs text-[#7a6e8f] truncate">
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
