import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  Plus,
  QrCode,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";
import { QRButton } from "@/components/QRCodeModal";
import {
  createShortUrl,
  deleteShortUrl,
  fetchAllShortUrls,
  ShortUrlItem,
} from "@/lib/remoteDb";

export default function UrlShortenerPage() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ShortUrlItem[]>([]);
  const [createdResult, setCreatedResult] = useState<ShortUrlItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    try {
      const items = await fetchAllShortUrls();
      setHistory(items);
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalUrl.trim()) {
      toast.error("단축할 URL을 입력해주세요!");
      return;
    }

    setLoading(true);
    try {
      const result = await createShortUrl(originalUrl.trim(), customCode.trim());
      if (result) {
        setCreatedResult(result);
        setOriginalUrl("");
        setCustomCode("");
        toast.success(`단축 URL이 생성되었습니다! 🔗`);
        loadList();
      } else {
        toast.error("단축 URL을 생성하지 못했습니다. 다시 시도해주세요.");
      }
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    const fullUrl = `${window.location.origin}/${code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(code);
    toast.success("단축 링크가 클립보드에 복사되었습니다! ✨");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDelete = async (code: string) => {
    if (!window.confirm("이 단축 링크를 삭제하시겠습니까?")) return;
    await deleteShortUrl(code);
    setHistory((prev) => prev.filter((i) => i.code !== code));
    if (createdResult?.code === code) setCreatedResult(null);
    toast.success("단축 링크가 삭제되었습니다. 🗑️");
  };

  return (
    <div className="min-h-screen">
      <SiteNav active="/shorten" />

      <main className="page-container" id="main">
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-100/80 text-pink-700 text-xs font-bold mb-3 border border-pink-200">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            https://koharu.live/ 단축 서비스
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#c93b77] flex items-center justify-center gap-3">
            <LinkIcon className="w-8 h-8 text-pink-500" />
            URL 단축기
          </h1>
          <p className="text-sm font-semibold text-[#7a6e8f] mt-2">
            길고 복잡한 웹 링크를 <strong>https://koharu.live/&#123;랜덤코드&#125;</strong> 형태의 짧고 깔끔한 링크로 줄여보세요! 🌸
          </p>
        </div>

        {/* Shortener Form Card */}
        <div className="max-w-2xl mx-auto mb-10">
          <section className="glass-card !p-8 shadow-xl">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1.5">
                  원본 URL (긴 링크) <span className="text-pink-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="https://example.com/very/long/url/link"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-2xl border border-pink-200 focus:border-pink-500 outline-none bg-white/70 shadow-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1.5">
                  원하는 단축 코드 (선택 사항, 비워두면 6자리 무작위 생성)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#7a6e8f] bg-pink-50/80 px-3 py-3 rounded-2xl border border-pink-100 select-none">
                    koharu.live/
                  </span>
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="예: game, project, portfolio"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                    className="flex-1 text-sm px-4 py-3 rounded-2xl border border-pink-200 focus:border-pink-500 outline-none bg-white/70 shadow-sm transition font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full insta-action-btn insta-btn-primary !py-3.5 !text-sm cursor-pointer !rounded-2xl justify-center font-bold shadow-lg shadow-pink-500/20"
              >
                {loading ? (
                  "단축 링크 만드는 중..."
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> 링크 단축하기 ✨
                  </>
                )}
              </button>
            </form>

            {/* Created Result Banner */}
            {createdResult && (
              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 animate-in fade-in zoom-in-95">
                <div className="text-xs font-bold text-pink-600 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 방금 생성된 단축 링크!
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/80 p-3 rounded-xl border border-pink-100">
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/${createdResult.code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-extrabold text-[#c93b77] text-base hover:underline flex items-center gap-1 truncate"
                    >
                      https://koharu.live/{createdResult.code}
                      <ExternalLink className="w-3.5 h-3.5 inline text-pink-400" />
                    </a>
                    <div className="text-xs text-[#7a6e8f] truncate mt-0.5" title={createdResult.originalUrl}>
                      ↪ {createdResult.originalUrl}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => handleCopy(createdResult.code)}
                      className="insta-action-btn insta-btn-primary !text-xs !py-1.5 !px-3 cursor-pointer"
                    >
                      {copiedCode === createdResult.code ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> 복사됨!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> 복사
                        </>
                      )}
                    </button>
                    <QRButton
                      url={`${window.location.origin}/${createdResult.code}`}
                      label={`koharu.live/${createdResult.code}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* History List */}
        <div className="max-w-2xl mx-auto mb-14">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-lg font-bold text-[#38314a] flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-pink-500" />
              단축 링크 목록 ({history.length})
            </h2>
            <button
              onClick={loadList}
              className="text-xs text-pink-600 font-bold hover:underline cursor-pointer"
            >
              새로고침 ↻
            </button>
          </div>

          {history.length === 0 ? (
            <div className="glass-card !p-8 text-center text-xs text-[#7a6e8f]">
              아직 생성된 단축 링크가 없습니다. 위 입력창에서 첫 번째 링크를 만들어보세요! 🌸
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.code}
                  className="glass-card !p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-pink-300 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/${item.code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-bold text-[#c93b77] text-sm hover:underline flex items-center gap-1 truncate"
                      >
                        https://koharu.live/{item.code}
                        <ExternalLink className="w-3 h-3 text-pink-400" />
                      </a>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100/70 text-pink-700">
                        클릭 {item.clicks}회
                      </span>
                    </div>
                    <p className="text-xs text-[#7a6e8f] truncate mt-1" title={item.originalUrl}>
                      ↪ {item.originalUrl}
                    </p>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => handleCopy(item.code)}
                      className="insta-action-btn insta-btn-secondary !text-xs !py-1.5 !px-2.5 cursor-pointer"
                      title="단축 링크 복사"
                    >
                      {copiedCode === item.code ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-xs">{copiedCode === item.code ? "복사됨" : "복사"}</span>
                    </button>
                    <QRButton
                      url={`${window.location.origin}/${item.code}`}
                      label={`koharu.live/${item.code}`}
                    />
                    <button
                      onClick={() => handleDelete(item.code)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer transition"
                      title="단축 링크 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-[#7a6e8f] py-6">
          <p>Made with Code & Curiosity 🌸 ! Koharu · koharu.live</p>
        </footer>
      </main>
    </div>
  );
}
