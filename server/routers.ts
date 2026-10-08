import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import {
  createBlogPost,
  createGuestbookMessage,
  createPostComment,
  deleteBlogPost,
  getAllBlogPosts,
  getBlogPostById,
  getGuestbookMessages,
  getPostComments,
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
  togglePostLike,
  updateBlogPost,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import {
  ADMIN_SESSION_COOKIE,
  adminCookieOptions,
  createAdminSessionToken,
  getLocalAdminUser,
  isAdminEmail,
  isAdminLoginConfigured,
  isLocalAdminUser,
  verifyAdminPassword,
} from "./adminAuth";
import { storagePut } from "./storage";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure
      .input(z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(200) }))
      .mutation(async ({ ctx, input }) => {
        const valid = isAdminLoginConfigured() && isAdminEmail(input.email) && await verifyAdminPassword(input.password, ENV.adminPasswordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "이메일 또는 비밀번호가 올바르지 않습니다." });
        }
        const token = await createAdminSessionToken();
        ctx.res.cookie(ADMIN_SESSION_COOKIE, token, adminCookieOptions(ctx.req));
        return getLocalAdminUser();
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(ADMIN_SESSION_COOKIE, { ...adminCookieOptions(ctx.req), maxAge: 0 });
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  blog: router({
    list: publicProcedure.query(() => getPublishedBlogPosts()),
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => getPublishedBlogPostBySlug(input.slug)),
    byId: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .query(({ input }) => getBlogPostById(input.id)),
    comments: publicProcedure
      .input(z.object({ postId: z.number().int() }))
      .query(({ input }) => getPostComments(input.postId)),
    addComment: publicProcedure
      .input(
        z.object({
          postId: z.number().int(),
          authorName: z.string().trim().min(1).max(50),
          authorAvatar: z.string().max(500).optional(),
          content: z.string().trim().min(1).max(1000),
        })
      )
      .mutation(async ({ input }) => {
        const comment = await createPostComment({
          postId: input.postId,
          authorName: input.authorName,
          authorAvatar: input.authorAvatar || null,
          content: input.content,
        });
        if (!comment) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "댓글 작성에 실패했습니다." });
        return comment;
      }),
    like: publicProcedure
      .input(
        z.object({
          postId: z.number().int(),
          userIdentifier: z.string().min(1).max(255),
        })
      )
      .mutation(async ({ input }) => {
        return await togglePostLike(input.postId, input.userIdentifier);
      }),
    adminList: adminProcedure.query(({ ctx }) => {
      if (!isLocalAdminUser(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "사이트 소유자만 게시글을 관리할 수 있습니다." });
      }
      return getAllBlogPosts();
    }),
    create: adminProcedure
      .input(
        z.object({
          slug: z.string().trim().min(2).max(220),
          title: z.string().trim().min(1).max(180),
          caption: z.string().trim().min(1).max(3000),
          excerpt: z.string().trim().max(1000).optional(),
          content: z.string().trim().max(50000).optional(),
          coverUrl: z.string().trim().max(1000),
          images: z.array(z.string()).optional(),
          category: z.string().max(64).default("devlog"),
          published: z.boolean().default(true),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isLocalAdminUser(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "사이트 소유자만 게시글을 작성할 수 있습니다." });
        }

        try {
          const post = await createBlogPost({
            slug: input.slug,
            title: input.title,
            caption: input.caption,
            excerpt: input.excerpt || input.caption.slice(0, 150),
            content: input.content || input.caption,
            coverUrl: input.coverUrl,
            images: input.images || [input.coverUrl],
            category: input.category,
            authorOpenId: ctx.user.openId,
            publishedAt: input.published ? new Date() : null,
          });

          if (!post) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "게시글을 저장할 수 없습니다." });
          }

          return post;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "CONFLICT", message: "슬러그가 이미 사용 중이거나 게시글 저장에 실패했습니다." });
        }
      }),
    uploadImage: adminProcedure
      .input(
        z.object({
          filename: z.string().trim().min(1).max(160),
          contentType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]),
          data: z.string().min(1).max(7_000_000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!isLocalAdminUser(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "사이트 소유자만 이미지를 업로드할 수 있습니다." });
        }
        const data = Buffer.from(input.data, "base64");
        if (data.byteLength > 5 * 1024 * 1024) {
          throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "이미지는 5MB 이하만 업로드할 수 있습니다." });
        }
        const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-");
        try {
          return await storagePut(`blog-images/${Date.now()}-${safeFilename}`, data, input.contentType);
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "이미지 업로드에 실패했습니다." });
        }
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          slug: z.string().trim().min(2).max(220),
          title: z.string().trim().min(1).max(180),
          caption: z.string().trim().min(1).max(3000),
          excerpt: z.string().trim().max(1000).optional(),
          content: z.string().trim().max(50000).optional(),
          coverUrl: z.string().trim().max(1000).optional(),
          images: z.array(z.string()).optional(),
          category: z.string().max(64).optional(),
          published: z.boolean(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!isLocalAdminUser(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "사이트 소유자만 게시글을 수정할 수 있습니다." });
        }
        const existing = await getBlogPostById(input.id);
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "게시글을 찾을 수 없습니다." });
        }

        try {
          const updated = await updateBlogPost(input.id, {
            slug: input.slug,
            title: input.title,
            caption: input.caption,
            excerpt: input.excerpt || input.caption.slice(0, 150),
            content: input.content || input.caption,
            coverUrl: input.coverUrl ?? existing.coverUrl,
            images: input.images ?? existing.images,
            category: input.category ?? existing.category,
            publishedAt: input.published ? (existing.publishedAt ?? new Date()) : null,
          });
          if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "게시글을 수정할 수 없습니다." });
          return updated;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "CONFLICT", message: "슬러그가 이미 사용 중이거나 게시글 수정에 실패했습니다." });
        }
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        if (!isLocalAdminUser(ctx.user)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "사이트 소유자만 게시글을 삭제할 수 있습니다." });
        }
        const existing = await getBlogPostById(input.id);
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "게시글을 찾을 수 없습니다." });
        }
        await deleteBlogPost(input.id);
        return { success: true } as const;
      }),
  }),
  guestbook: router({
    list: publicProcedure.query(() => getGuestbookMessages()),
    create: publicProcedure
      .input(
        z.object({
          authorName: z.string().trim().min(1).max(50),
          authorAvatar: z.string().max(500).optional(),
          content: z.string().trim().min(1).max(1000),
          isSecret: z.boolean().default(false),
        })
      )
      .mutation(async ({ input }) => {
        const msg = await createGuestbookMessage({
          authorName: input.authorName,
          authorAvatar: input.authorAvatar || null,
          content: input.content,
          isSecret: input.isSecret,
        });
        if (!msg) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "방명록 작성에 실패했습니다." });
        return msg;
      }),
  }),
  ai: router({
    chat: publicProcedure
      .input(
        z.object({
          message: z.string().trim().min(1).max(4000),
          mode: z.enum(["auto", "chat", "code", "image"]).default("auto"),
          model: z.enum(["v1", "v2"]).default("v1"),
        })
      )
      .mutation(async ({ input }) => {
        const query = input.message.toLowerCase();
        let reply = "";

        if (input.mode === "code" || query.includes("코드") || query.includes("파이썬") || query.includes("c#") || query.includes("유니티") || query.includes("unity")) {
          if (query.includes("파이썬") || query.includes("python")) {
            reply = `안녕하세요! 파이썬 관련 요청이시군요.\n\n\`\`\`python\n# 코하루 AI 파이썬 예제\ndef main():\n    print("Hello from Koharu!")\n\nif __name__ == "__main__":\n    main()\n\`\`\`\n\n더 필요하신 기능이 있다면 편하게 말씀해주세요! 🎮`;
          } else {
            reply = `Unity C# 게임 개발 스크립트 예제입니다:\n\n\`\`\`csharp\nusing UnityEngine;\n\npublic class PlayerController : MonoBehaviour\n{\n    [SerializeField] private float speed = 5.0f;\n\n    void Update()\n    {\n        float h = Input.GetAxisRaw("Horizontal");\n        float v = Input.GetAxisRaw("Vertical");\n        Vector3 dir = new Vector3(h, 0, v).normalized;\n        transform.position += dir * speed * Time.deltaTime;\n    }\n}\n\`\`\`\n\n부드러운 조작감과 확장이 편리하도록 구성되어 있습니다! ✨`;
          }
        } else if (input.mode === "image" || query.includes("그려") || query.includes("디자인") || query.includes("일러스트")) {
          reply = `달빛 아래 몽환적인 파스텔 톤의 일러스트 컨셉을 생성했습니다 🌸\n\n✦ 프롬프트: *Dreamy pastel twilight, glowing magical crescent moon, cute stars, soft lavender aesthetics*\n\n메인 페이지와 인스타그램 피드에서도 멋진 비주얼을 확인하실 수 있어요!`;
        } else {
          reply = `안녕하세요! 코하루 포트폴리오의 AI 어시스턴트입니다 🌸\n\n"${input.message}"에 대해 답변해 드릴게요.\n코하루는 유니티와 C# 게임 프로그래밍, 커스텀 엔진 및 웹 개발에 깊은 열정을 쏟고 있는 개발자예요!\n\n궁금한 점이 있다면 언제든 물어보세요. 코드 작성부터 게임 시스템 설계, 포트폴리오 안내까지 친절하게 도와드릴게요 ⁽⁽ (˶> ᎑ <˶) ⁾⁾!`;
        }

        return {
          reply,
          timestamp: new Date().toISOString(),
          model: input.model,
          mode: input.mode,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
