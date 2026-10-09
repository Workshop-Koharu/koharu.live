import { useEffect, useState } from "react";
import {
  Camera,
  ExternalLink,
  Plus,
  PlusCircle,
  Sparkles,
  Trash2,
  UploadCloud,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";

interface Person {
  id: number;
  name: string;
  handle: string | null;
  role: string | null;
  status: string | null;
  avatar: string | null;
  link: string | null;
  createdAt: string;
}

/**
 * Client-side image helper: compresses and reads user-uploaded file as base64 DataURL
 */
function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("이미지 파일만 선택할 수 있습니다."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("이미지를 처리하지 못했습니다."));
      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 800;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  // Add person modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState("Friend");
  const [status, setStatus] = useState("");
  const [avatar, setAvatar] = useState("");
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/people");
      if (res.ok) {
        const data = await res.json();
        setPeople(data.people || []);
      }
    } catch {
      toast.error("지인 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      setAvatar(dataUrl);
      toast.success("프로필 사진이 선택되었습니다! 🌸");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "이미지를 처리하지 못했습니다.";
      toast.error(msg);
    }
  };

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("이름(닉네임)을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          handle: handle.trim() ? (handle.trim().startsWith("@") ? handle.trim() : `@${handle.trim()}`) : null,
          role: role.trim() || "Friend",
          status: status.trim() || null,
          avatar: avatar.trim() || "/assets/koharu-profile.png",
          link: link.trim() || null,
        }),
      });

      if (res.ok) {
        toast.success(`${name} 님이 지인 목록에 등록되었습니다! 🌸`);
        setIsModalOpen(false);
        setName("");
        setHandle("");
        setRole("Friend");
        setStatus("");
        setAvatar("");
        setLink("");
        fetchPeople();
      } else {
        toast.error("지인 등록에 실패했습니다.");
      }
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePerson = async (id: number, personName: string) => {
    if (!window.confirm(`'${personName}' 님을 목록에서 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/people/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`${personName} 님이 삭제되었습니다.`);
        setPeople((prev) => prev.filter((p) => p.id !== id));
      } else {
        toast.error("삭제에 실패했습니다.");
      }
    } catch {
      toast.error("오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen">
      <SiteNav active="/person" />

      <main className="page-container" id="main">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 text-center sm:text-left">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-pink-600">
                Connections & Friends
              </span>
              <h1 className="text-3xl font-extrabold text-[#c93b77] mt-1">
                소중한 지인들 🌸
              </h1>
              <p className="text-sm text-[#7a6e8f] mt-1.5">
                코하루와 함께하는 소중한 사람들을 직접 등록하고 관리하는 공간입니다.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="insta-action-btn insta-btn-primary !px-4 !py-2.5 flex items-center gap-2 shadow-md shadow-pink-500/20"
            >
              <UserPlus className="w-4 h-4" /> 지인 등록하기
            </button>
          </div>

          {/* People List */}
          {loading ? (
            <div className="text-center py-20 text-[#7a6e8f]">
              <Sparkles className="w-8 h-8 animate-spin mx-auto mb-3 text-pink-500" />
              지인 목록을 불러오는 중...
            </div>
          ) : people.length === 0 ? (
            /* Clean Empty State */
            <div className="glass-card text-center py-20 px-6 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4 text-pink-500 shadow-sm">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-[#38314a] mb-2">
                아직 등록된 지인이 없습니다
              </h2>
              <p className="text-xs text-[#7a6e8f] leading-relaxed mb-6">
                친구, 동료, 소중한 인연들을 직접 등록해보세요!
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="insta-action-btn insta-btn-primary"
              >
                <Plus className="w-4 h-4" /> 첫 지인 등록하기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="glass-card !p-4 flex items-center gap-3.5 hover:border-pink-300 transition-all relative group"
                >
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-pink-300 to-purple-300 flex-shrink-0 shadow-md">
                    <img
                      src={person.avatar || "/assets/koharu-profile.png"}
                      alt={person.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-bold text-sm text-[#38314a] truncate">
                        {person.name}
                      </h2>
                      {person.role && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-pink-100 text-pink-700 flex-shrink-0">
                          {person.role}
                        </span>
                      )}
                    </div>

                    {person.handle && (
                      <div className="text-[11px] font-semibold text-pink-600 truncate mt-0.5">
                        {person.handle}
                      </div>
                    )}

                    {person.status && (
                      <p className="text-xs text-[#7a6e8f] truncate mt-1">
                        {person.status}
                      </p>
                    )}

                    {person.link && (
                      <a
                        href={person.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-pink-500 hover:text-pink-700 mt-1 truncate"
                      >
                        링크 방문 <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Delete Button (Visible on hover or mobile) */}
                  <button
                    onClick={() => handleDeletePerson(person.id, person.name)}
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors p-1 rounded-lg opacity-70 group-hover:opacity-100"
                    title="지인 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Register Acquaintance Modal (Rendered at root level with highest z-index) */}
      {isModalOpen && (
        <div
          className="insta-modal-backdrop"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative my-auto max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-pink-100 mb-4 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-[#c93b77] flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> 새 지인 등록
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePerson} className="space-y-4">
              {/* Avatar File Selector */}
              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1.5">
                  프로필 사진 (파일 업로드)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-pink-400 flex-shrink-0 bg-pink-100">
                    <img
                      src={avatar || "/assets/koharu-profile.png"}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border-2 border-dashed border-pink-300 hover:border-pink-500 bg-pink-50/40 hover:bg-pink-50/70 text-xs font-bold text-pink-700 cursor-pointer transition-colors text-center">
                    <Camera className="w-4 h-4" />
                    <span>사진 파일 선택하기</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileSelect}
                    />
                  </label>
                </div>
              </div>

              {/* Name & Handle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                    이름 / 닉네임 (필수)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 친구 이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-pink-200 outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                    핸들명 (@아이디)
                  </label>
                  <input
                    type="text"
                    placeholder="예: @myfriend"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-pink-200 outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Role / Relation */}
              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                  관계 / 역할
                </label>
                <input
                  type="text"
                  placeholder="예: Friend, 소중한 친구, 개발자 등"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-pink-200 outline-none focus:border-pink-500"
                />
              </div>

              {/* Status Message */}
              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                  한줄 소개 / 응원 메시지
                </label>
                <textarea
                  rows={2}
                  placeholder="예: 항상 밝은 에너지를 주는 친구 🌸"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-pink-200 outline-none focus:border-pink-500"
                />
              </div>

              {/* Social Link */}
              <div>
                <label className="block text-xs font-bold text-[#7a6e8f] mb-1">
                  웹사이트 / 소셜 링크 (선택사항)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-pink-200 outline-none focus:border-pink-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="insta-action-btn insta-btn-secondary"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="insta-action-btn insta-btn-primary"
                >
                  {submitting ? "등록 중..." : "지인 등록하기 ✨"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
