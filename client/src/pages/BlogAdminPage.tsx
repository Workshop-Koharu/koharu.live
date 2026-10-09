import { FormEvent, useState } from "react";
import { ImagePlus, LogIn, LogOut, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import PageShell from "@/components/PageShell";
import MarkdownEditor from "@/components/MarkdownEditor";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getAdminLoginErrorMessage } from "@/lib/apiErrors";
import { toast } from "sonner";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]);
type EditablePost = { id: number; title: string; slug: string; excerpt: string; content: string; coverUrl: string | null };

export function AdminLoginErrorNotice({ message }: { message: string }) {
  return <div className="auth-error" role="alert">{getAdminLoginErrorMessage(message)}</div>;
}

async function fileToBase64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    for (let offset = 0; offset < chunk.length; offset += 1) binary += String.fromCharCode(chunk[offset] ?? 0);
  }
  return btoa(binary);
}

export default function BlogAdminPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverName, setCoverName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const posts = trpc.blog.adminList.useQuery(undefined, { enabled: isAuthenticated && user?.loginMethod === "local-admin" });
  const login = trpc.auth.login.useMutation({
    onSuccess: async () => { setPassword(""); await utils.auth.me.invalidate(); toast.success("관리자 로그인이 완료됐어요."); },
    onError: (error) => toast.error(getAdminLoginErrorMessage(error.message)),
  });
  const uploadImage = trpc.blog.uploadImage.useMutation();
  const createPost = trpc.blog.create.useMutation({
    onSuccess: async () => { toast.success("글을 공개했어요."); await Promise.all([utils.blog.list.invalidate(), utils.blog.adminList.invalidate()]); resetForm(); },
    onError: (error) => toast.error(error.message),
  });
  const updatePost = trpc.blog.update.useMutation({
    onSuccess: async () => { toast.success("글을 수정했어요."); await Promise.all([utils.blog.list.invalidate(), utils.blog.adminList.invalidate()]); resetForm(); },
    onError: (error) => toast.error(error.message),
  });
  const deletePost = trpc.blog.delete.useMutation({
    onSuccess: async () => { toast.success("글을 삭제했어요."); await Promise.all([utils.blog.list.invalidate(), utils.blog.adminList.invalidate()]); },
    onError: (error) => toast.error(error.message),
  });

  function resetForm() {
    setEditingId(null); setTitle(""); setSlug(""); setExcerpt(""); setContent(""); setCoverUrl(""); setCoverName("");
  }

  const submitLogin = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); login.mutate({ email, password }); };
  const upload = async (file: File) => {
    if (!IMAGE_TYPES.has(file.type)) throw new Error("지원하지 않는 이미지 형식입니다.");
    if (file.size > 5 * 1024 * 1024) throw new Error("이미지는 5MB 이하만 업로드할 수 있습니다.");
    const result = await uploadImage.mutateAsync({ filename: file.name, contentType: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "image/svg+xml", data: await fileToBase64(file) });
    return result.url;
  };
  const handleCover = async (file: File) => { try { setCoverUrl(await upload(file)); setCoverName(file.name); toast.success("대표 이미지를 업로드했어요."); } catch (error) { toast.error(error instanceof Error ? error.message : "이미지 업로드에 실패했습니다."); } };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const finalCaption = excerpt || content || title;
    const finalCover = coverUrl || "/assets/koharu-profile.png";
    const input = {
      title,
      slug,
      caption: finalCaption,
      excerpt: excerpt || title,
      content,
      coverUrl: finalCover,
      published: true,
    };
    if (editingId) updatePost.mutate({ id: editingId, ...input });
    else createPost.mutate(input);
  };
  const startEdit = (post: EditablePost) => { setEditingId(post.id); setTitle(post.title); setSlug(post.slug); setExcerpt(post.excerpt); setContent(post.content); setCoverUrl(post.coverUrl ?? ""); setCoverName(post.coverUrl ? "현재 대표 이미지" : ""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = (id: number) => { if (window.confirm("이 게시글을 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.")) deletePost.mutate({ id }); };

  return (
    <PageShell active="/instagram" eyebrow="Private editor" title="인스타그램 피드 작성" description="등록된 관리자 계정만 새 글을 공개할 수 있습니다.">
      {loading && <p className="loading-state">로그인 상태를 확인하는 중이에요...</p>}
      {!loading && !isAuthenticated && <form className="detail-card section-card admin-form entrance delay-1" onSubmit={submitLogin}>
        <div className="section-kicker">owner only</div><h2>관리자 로그인</h2><p>관리자 이메일과 비밀번호는 서버에서만 검증되며, 평문으로 저장되지 않습니다.</p>
        <div className="form-field"><label className="form-label" htmlFor="admin-email">이메일</label><input className="form-input" id="admin-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="관리자 이메일" /></div>
        <div className="form-field"><label className="form-label" htmlFor="admin-password">비밀번호</label><input className="form-input" id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="비밀번호" /></div>
        {login.error && <AdminLoginErrorNotice message={login.error.message} />}
        <button className="primary-button" type="submit" disabled={login.isPending}><LogIn size={14} /> {login.isPending ? "확인 중..." : "관리자 로그인"}</button>
      </form>}
      {!loading && isAuthenticated && user?.loginMethod !== "local-admin" && <section className="detail-card section-card entrance delay-1"><div className="section-kicker">access denied</div><h2>관리자 전용 페이지입니다.</h2><p>이 사이트의 로컬 관리자 계정으로 다시 로그인해주세요.</p><button className="auth-button" onClick={() => void logout()}><LogOut size={14} /> 로그아웃</button></section>}
      {!loading && isAuthenticated && user?.loginMethod === "local-admin" && <>
        <section className="admin-posts detail-card section-card entrance delay-1">
          <div className="admin-section-heading"><div><div className="section-kicker">your posts</div><h2>게시글 관리</h2></div><button className="secondary-button" type="button" onClick={resetForm}><Plus size={14} /> 새 글</button></div>
          {posts.isLoading && <p className="loading-state">게시글을 불러오는 중이에요...</p>}
          {posts.error && <div className="empty-state">게시글 목록을 불러오지 못했어요. 서버 연결을 확인해주세요.</div>}
          {!posts.isLoading && !posts.error && posts.data?.length === 0 && <div className="empty-state">아직 작성한 글이 없습니다.</div>}
          <div className="admin-post-list">{posts.data?.map((post) => <div className="admin-post-row" key={post.id}><div><strong>{post.title}</strong><span>{post.slug}</span></div><div className="admin-post-actions"><button className="icon-button" type="button" aria-label={`${post.title} 수정`} onClick={() => startEdit(post)}><Pencil size={14} /></button><button className="icon-button danger" type="button" aria-label={`${post.title} 삭제`} onClick={() => remove(post.id)}><Trash2 size={14} /></button></div></div>)}</div>
        </section>
        <form className="detail-card section-card admin-form entrance delay-2" onSubmit={submit}>
          <div className="admin-section-heading"><div><div className="section-kicker">{editingId ? "edit post" : "new post"}</div><h2>{editingId ? "글 수정" : "새 글 작성"}</h2></div>{editingId && <button className="secondary-button" type="button" onClick={resetForm}><X size={14} /> 수정 취소</button>}</div>
          <div className="form-field"><label className="form-label" htmlFor="post-title">제목</label><input className="form-input" id="post-title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={180} placeholder="예: Enroll-Lang을 만들며 배운 것" /></div>
          <div className="form-field"><label className="form-label" htmlFor="post-slug">주소용 슬러그</label><input className="form-input" id="post-slug" value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={220} placeholder="예: making-enroll-lang" /></div>
          <div className="form-field"><label className="form-label" htmlFor="post-excerpt">요약</label><input className="form-input" id="post-excerpt" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} required maxLength={1000} placeholder="목록에 보여줄 짧은 설명" /></div>
          <div className="form-field"><span className="form-label">대표 이미지</span><label className="upload-dropzone"><ImagePlus size={17} /><span>{coverName || "이미지를 선택하세요 · 최대 5MB"}</span><input type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleCover(file); }} /></label>{coverUrl && <img className="cover-preview" src={coverUrl} alt="대표 이미지 미리보기" />}</div>
          <div className="form-field"><label className="form-label" htmlFor="post-content">본문</label><MarkdownEditor value={content} onChange={setContent} onUploadImage={upload} /></div>
          <div className="admin-form-actions"><button className="primary-button" type="submit" disabled={createPost.isPending || updatePost.isPending || uploadImage.isPending}><Save size={14} /> {editingId ? (updatePost.isPending ? "수정 중..." : "변경사항 저장") : (createPost.isPending ? "공개 중..." : "글 공개하기")}</button><button className="auth-button" type="button" onClick={() => void logout()}><LogOut size={14} /> 로그아웃</button></div>
        </form>
      </>}
    </PageShell>
  );
}
