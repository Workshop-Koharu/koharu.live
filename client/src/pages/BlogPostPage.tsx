import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MessageCircle,
  Send,
  Share2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";

interface Post {
  id: number;
  slug: string;
  title: string;
  caption: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  images?: string[] | null;
  category: string;
  likesCount: number;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
}

interface Comment {
  id: number;
  postId: number;
  authorName: string;
  content: string;
  createdAt: string;
}

export default function BlogPostPage() {
  const [, params] = useRoute<{ slug: string }>("/blog/:slug.html");
  const [, cleanParams] = useRoute<{ slug: string }>("/blog/:slug");
  const [, instaParams] = useRoute<{ slug: string }>("/instagram/:slug.html");
  const [, instaCleanParams] = useRoute<{ slug: string }>("/instagram/:slug");
  const slug = params?.slug || cleanParams?.slug || instaParams?.slug || instaCleanParams?.slug;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const userIdentifier = "visitor-" + (typeof window !== "undefined" ? window.localStorage.getItem("koharu_uid") || "guest" : "guest");

  useEffect(() => {
    if (!slug) return;
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/posts/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
        if (data.post) {
          fetchComments(data.post.id);
        }
      }
    } catch {
      toast.error("게시물을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: number) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {
      // ignore
    }
  };

  const handleLike = async () => {
    if (!post) return;
    const isCurrentlyLiked = liked;
    setLiked(!isCurrentlyLiked);
    setPost({
      ...post,
      likesCount: isCurrentlyLiked ? Math.max(0, post.likesCount - 1) : post.likesCount + 1,
    });

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIdentifier }),
      });
      if (res.ok) {
        const data = await res.json();
        setPost((prev) => (prev ? { ...prev, likesCount: data.likesCount } : null));
      }
    } catch {
      // ignore
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentText.trim()) return;

    setSubmitting(true);
    const authorName = commentName.trim() || "익명 친구";

    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          content: commentText.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [data.comment, ...prev]);
        setCommentText("");
        toast.success("댓글을 등록했습니다! 🌸");
      }
    } catch {
      toast.error("댓글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteNav active="/instagram" />

      <main className="page-container" id="main">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <div className="mb-6">
            <Link
              href="/instagram"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-700"
            >
              <ArrowLeft className="w-4 h-4" /> 인스타그램 피드로 돌아가기
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20 text-[#7a6e8f]">
              <Sparkles className="w-8 h-8 animate-spin mx-auto mb-3 text-pink-500" />
              게시물을 불러오는 중...
            </div>
          ) : !post ? (
            <div className="glass-card text-center py-16">
              <h2 className="text-lg font-bold text-[#38314a] mb-2">게시물을 찾을 수 없습니다</h2>
              <Link href="/instagram" className="insta-action-btn insta-btn-primary mt-3">
                인스타그램 홈으로 가기
              </Link>
            </div>
          ) : (
            <article className="insta-post-card">
              {/* Header */}
              <div className="insta-post-header">
                <div className="insta-post-author">
                  <img
                    src="/assets/koharu-profile.png"
                    alt="koharu.live"
                    className="insta-post-author-img"
                  />
                  <div>
                    <div className="insta-post-author-name flex items-center gap-1.5">
                      koharu.live
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                        {post.category}
                      </span>
                    </div>
                    <div className="insta-post-time">
                      {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Media */}
              <div className="insta-post-media">
                <img src={post.coverUrl} alt={post.title} className="insta-post-img" />
              </div>

              {/* Action bar */}
              <div className="insta-post-actions">
                <div className="insta-action-group">
                  <button
                    onClick={handleLike}
                    className={`insta-icon-btn ${liked ? "is-liked" : ""}`}
                  >
                    <Heart
                      className={`w-6 h-6 ${liked ? "fill-[#ff3040] text-[#ff3040]" : ""}`}
                    />
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("게시물 링크를 복사했습니다! 🔗");
                      }
                    }}
                    className="insta-icon-btn"
                  >
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="insta-post-body">
                <div className="insta-likes-count">
                  좋아요 {post.likesCount}개
                </div>

                <h1 className="text-lg font-bold text-[#38314a] mb-2">
                  {post.title}
                </h1>

                <div className="insta-caption whitespace-pre-line text-sm leading-relaxed">
                  <strong>koharu.live</strong>
                  {post.caption}
                </div>

                {post.content && post.content !== post.caption && (
                  <div className="mt-4 pt-4 border-t border-pink-100 text-sm leading-relaxed text-[#4a3952] whitespace-pre-line bg-pink-50/30 p-4 rounded-xl">
                    {post.content}
                  </div>
                )}

                {/* Comments section */}
                <div className="mt-6 pt-4 border-t border-pink-100">
                  <h3 className="text-xs font-bold text-[#7a6e8f] uppercase tracking-wider mb-4">
                    댓글 ({comments.length})
                  </h3>

                  <div className="space-y-3 mb-6">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center font-bold text-xs text-pink-600 flex-shrink-0">
                          {c.authorName[0]}
                        </div>
                        <div>
                          <div>
                            <strong className="mr-2 text-[#38314a]">{c.authorName}</strong>
                            <span className="text-[#4a3952]">{c.content}</span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add comment form */}
                  <form onSubmit={handleAddComment} className="space-y-2">
                    <input
                      type="text"
                      placeholder="닉네임 (기본: 익명 친구)"
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-pink-200 outline-none bg-pink-50/20"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="댓글 달기..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 text-sm px-3.5 py-2 rounded-xl border border-pink-200 outline-none focus:border-pink-500"
                      />
                      <button
                        type="submit"
                        disabled={submitting || !commentText.trim()}
                        className="insta-action-btn insta-btn-primary"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
