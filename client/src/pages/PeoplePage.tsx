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
  { name: "선아", handle: "sx0n._.a", role: "소중한 친구 💖" },
  { name: "코블", handle: "_koble_", role: "소중한 친구 🌸" },
  { name: "소성", handle: "seosungdev", role: "소중한 친구 ✨" },
  { name: "수냥", handle: "aer.unnynag0214", role: "소중한 친구 🐱" },
  { name: "제이", handle: "jxayx._.", role: "소중한 친구 💫" },
  { name: "김치", handle: "kimchi090113", role: "소중한 친구 🥬" },
  { name: "현이", handle: "07lee_hyun", role: "소중한 친구 🌿" },
  { name: "치킨무", handle: "chimu314", role: "소중한 친구 🍗" },
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
            const cleanRole = (dbPerson.role || fallback?.role || "소중한 친구")
              .replace(/Discord\s*Friend\s*/gi, "소중한 친구")
              .replace(/Developer/gi, "소중한 친구")
              .replace(/개발자/gi, "소중한 친구");
            return {
              name: dbPerson.name,
              handle: (dbPerson.handle || fallback?.handle || "").replace(/^@/, ""),
              role: cleanRole,
            };
          });
          setPeople(merged);
        }
      })
      .catch(() => {
        // Use curated default list
      });
  }, []);

  const copyId = (name: string, handle: string) => {
    const clean = handle.replace(/^@/, "").trim();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(clean);
    }
    setCopiedHandle(clean);
    toast.success(`${name}님의 아이디(@${clean})를 복사했습니다! ✨`);
    setTimeout(() => setCopiedHandle(null), 2000);
  };

  return (
    <div className="min-h-screen">
      <SiteNav active="/person" />

      <main className="page-container" id="main">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest font-bold text-pink-600 flex items-center justify-center">
              Connections & Friends
            </span>
            <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
              소중한 지인들 🌸
            </h1>
            <p className="text-sm text-[#7a6e8f] mt-2">
              코하루와 함께하는 소중한 친구들과 지인들입니다.
            </p>
          </div>

          {/* People Grid (No avatars, no discord references) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {people.map((person) => {
              const cleanHandle = person.handle.replace(/^@/, "").trim();
              const isCopied = copiedHandle === cleanHandle;

              return (
                <div
                  key={person.name}
                  className="glass-card !p-6 flex flex-col items-center text-center hover:border-pink-300 transition-all group shadow-sm hover:shadow-md"
                >
                  {/* 이름 */}
                  <h2 className="font-extrabold text-lg text-[#38314a] group-hover:text-pink-600 transition-colors">
                    {person.name}
                  </h2>

                  {/* 아이디 */}
                  <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-pink-50 text-pink-700 font-mono mt-2 mb-2 border border-pink-100">
                    @{cleanHandle}
                  </div>

                  {/* Role */}
                  {person.role && (
                    <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 mb-2">
                      {person.role.replace(/Discord\s*/gi, "").replace(/Developer/gi, "소중한 친구").replace(/개발자/gi, "소중한 친구")}
                    </span>
                  )}

                  {/* Copy ID Button */}
                  <button
                    type="button"
                    onClick={() => copyId(person.name, cleanHandle)}
                    className="w-full mt-3 pt-3 border-t border-pink-100/70 flex items-center justify-center gap-1.5 text-xs font-semibold text-pink-600 hover:text-pink-700 transition-colors cursor-pointer"
                    title="아이디 복사"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>아이디 복사</span>
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
