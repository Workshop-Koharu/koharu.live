import { useEffect, useState } from "react";
import { ExternalLink, Heart, Sparkles, UserCheck } from "lucide-react";
import SiteNav from "@/components/SiteNav";

interface Person {
  id?: number;
  name: string;
  handle: string;
  role?: string | null;
  status?: string | null;
  avatar?: string | null;
  link?: string | null;
}

const CURATED_PEOPLE: Person[] = [
  {
    name: "선아",
    handle: "@sx0n._.a",
    role: "Friend 💖",
    status: "소중한 친구 선아 🌸",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    link: "https://instagram.com/sx0n._.a",
  },
  {
    name: "코블",
    handle: "@_koble_",
    role: "Friend 🌸",
    status: "코블님 🐾",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    link: "https://instagram.com/_koble_",
  },
  {
    name: "소성",
    handle: "@seosungdev",
    role: "Developer ✨",
    status: "개발자 소성님 💻",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
    link: "https://instagram.com/seosungdev",
  },
  {
    name: "수냥",
    handle: "@aer.unnynag0214",
    role: "Friend 🐱",
    status: "수냥님 🐾",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
    link: "https://instagram.com/aer.unnynag0214",
  },
  {
    name: "제이",
    handle: "@jxayx._.",
    role: "Friend 💫",
    status: "제이님 ✨",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    link: "https://instagram.com/jxayx._.",
  },
  {
    name: "김치",
    handle: "@kimchi090113",
    role: "Friend 🥬",
    status: "김치님 🥢",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    link: "https://instagram.com/kimchi090113",
  },
  {
    name: "현이",
    handle: "@07lee_hyun",
    role: "Friend 🌿",
    status: "현이님 🌟",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    link: "https://instagram.com/07lee_hyun",
  },
  {
    name: "치킨무",
    handle: "@chimu314",
    role: "Friend 🍗",
    status: "치킨무님 🐥",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
    link: "https://instagram.com/chimu314",
  },
];

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>(CURATED_PEOPLE);

  useEffect(() => {
    fetch("/api/people")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.people && data.people.length > 0) {
          const merged = data.people.map((dbPerson: Person) => {
            const fallback = CURATED_PEOPLE.find((c) => c.name === dbPerson.name);
            return {
              ...dbPerson,
              avatar: dbPerson.avatar || fallback?.avatar || null,
              role: dbPerson.role || fallback?.role || "Friend",
            };
          });
          setPeople(merged);
        }
      })
      .catch(() => {
        // Use curated default list
      });
  }, []);

  return (
    <div className="min-h-screen">
      <SiteNav active="/person" />

      <main className="page-container" id="main">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
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

          {/* People Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {people.map((person) => (
              <a
                key={person.name}
                href={person.link || `https://instagram.com/${person.handle.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card !p-5 flex flex-col items-center text-center hover:border-pink-300 transition-all group shadow-sm hover:shadow-md"
              >
                {/* Avatar with pastel ring */}
                <div className="w-16 h-16 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-pink-300 via-purple-300 to-sky-300 mb-3 shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {person.avatar ? (
                      <img
                        src={person.avatar}
                        alt={person.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="font-bold text-pink-600 text-lg">
                        {person.name[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Name */}
                <h2 className="font-bold text-base text-[#38314a] group-hover:text-pink-600 transition-colors">
                  {person.name}
                </h2>

                {/* Handle */}
                <div className="text-xs font-semibold text-pink-600 mt-0.5">
                  {person.handle}
                </div>

                {/* Status or Role */}
                {person.role && (
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100/70 text-pink-700">
                    {person.role}
                  </span>
                )}

                {/* Visit profile link */}
                <div className="mt-3 pt-3 border-t border-pink-100/70 w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-[#7a6e8f] group-hover:text-pink-600 transition-colors">
                  인스타그램 방문 <ExternalLink className="w-3 h-3" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
