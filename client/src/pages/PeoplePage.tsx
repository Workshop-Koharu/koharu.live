import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";

interface Person {
  name: string;
  handle: string;
  role?: string | null;
}

const CURATED_PEOPLE: Person[] = [
  { name: "선아", handle: "sx0n._.a", role: "Discord Friend 💖" },
  { name: "코블", handle: "_koble_", role: "Discord Friend 🌸" },
  { name: "소성", handle: "seosungdev", role: "Developer ✨" },
  { name: "수냥", handle: "aer.unnynag0214", role: "Discord Friend 🐱" },
  { name: "제이", handle: "jxayx._.", role: "Discord Friend 💫" },
  { name: "김치", handle: "kimchi090113", role: "Discord Friend 🥬" },
  { name: "현이", handle: "07lee_hyun", role: "Discord Friend 🌿" },
  { name: "치킨무", handle: "chimu314", role: "Discord Friend 🍗" },
];

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>(CURATED_PEOPLE);
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/people")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.people && data.people.length > 0) {
          const merged = data.people.map((dbPerson: Person) => {
            const fallback = CURATED_PEOPLE.find((c) => c.name === dbPerson.name);
            return {
              name: dbPerson.name,
              handle: (dbPerson.handle || fallback?.handle || "").replace(/^@/, ""),
              role: dbPerson.role || fallback?.role || "Discord Friend",
            };
          });
          setPeople(merged);
        }
      })
      .catch(() => {
        // Use curated default list
      });
  }, []);

  const copyDiscordId = (name: string, handle: string) => {
    const clean = handle.replace(/^@/, "").trim();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(clean);
    }
    setCopiedHandle(clean);
    toast.success(`${name}님의 디스코드 아이디(${clean})를 복사했습니다! ✨`);
    setTimeout(() => setCopiedHandle(null), 2000);
  };

  return (
    <div className="min-h-screen">
      <SiteNav active="/person" />

      <main className="page-container" id="main">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest font-bold text-[#5865F2] flex items-center justify-center gap-1.5">
              <svg
                className="w-4 h-4 fill-current"
                viewBox="0 0 127.14 96.36"
              >
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z" />
              </svg>
              Discord Connections & Friends
            </span>
            <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
              소중한 지인들 🌸
            </h1>
            <p className="text-sm text-[#7a6e8f] mt-2">
              코하루와 함께하는 소중한 디스코드 친구들과 지인들입니다.
            </p>
          </div>

          {/* People Grid (Discord-themed, NO photos) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {people.map((person) => {
              const cleanHandle = person.handle.replace(/^@/, "").trim();
              const isCopied = copiedHandle === cleanHandle;

              return (
                <div
                  key={person.name}
                  className="glass-card !p-5 flex flex-col items-center text-center hover:border-[#5865F2]/40 transition-all group shadow-sm hover:shadow-md"
                >
                  {/* Discord Logo Icon (No photo) */}
                  <div className="w-14 h-14 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 group-hover:bg-[#5865F2]/15 transition-all flex-shrink-0">
                    <svg
                      className="w-7 h-7 text-[#5865F2]"
                      viewBox="0 0 127.14 96.36"
                      fill="currentColor"
                    >
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z" />
                    </svg>
                  </div>

                  {/* 한글 디스코드 닉네임 */}
                  <h2 className="font-extrabold text-base text-[#38314a] group-hover:text-[#5865F2] transition-colors">
                    {person.name}
                  </h2>

                  {/* 영어 디스코드 아이디 */}
                  <div className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-[#5865F2]/10 text-[#5865F2] font-mono mt-1 mb-2">
                    @{cleanHandle}
                  </div>

                  {/* Role */}
                  {person.role && (
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100/70 text-pink-700 mb-2">
                      {person.role}
                    </span>
                  )}

                  {/* Copy Discord ID Button */}
                  <button
                    type="button"
                    onClick={() => copyDiscordId(person.name, cleanHandle)}
                    className="w-full mt-2 pt-3 border-t border-pink-100/70 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#5865F2] hover:text-[#4752c4] transition-colors cursor-pointer"
                    title="디스코드 아이디 복사"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>디스코드 아이디 복사</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
