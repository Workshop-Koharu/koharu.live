import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createBlogPost: vi.fn(),
  deleteBlogPost: vi.fn(),
  getAllBlogPosts: vi.fn(),
  getBlogPostById: vi.fn(),
  getPublishedBlogPostBySlug: vi.fn(),
  getPublishedBlogPosts: vi.fn(),
  updateBlogPost: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function adminContext(): TrpcContext {
  const now = new Date();
  return {
    user: { id: 0, openId: "admin:local-owner", name: "! Koharu", email: "owner@example.com", loginMethod: "local-admin", role: "admin", createdAt: now, updatedAt: now, lastSignedIn: now },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

const existingPost = {
  id: 4,
  slug: "first-note",
  title: "첫 기록",
  excerpt: "요약",
  content: "본문",
  coverUrl: "/manus-storage/blog-images/cover.png",
  authorOpenId: "admin:local-owner",
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("blog CRUD success paths", () => {
  it("lists all owner posts for the admin screen", async () => {
    dbMocks.getAllBlogPosts.mockResolvedValue([existingPost]);
    const result = await appRouter.createCaller(adminContext()).blog.adminList();
    expect(result).toEqual([existingPost]);
  });

  it("updates an owner post and preserves its publication date", async () => {
    dbMocks.getBlogPostById.mockResolvedValue(existingPost);
    dbMocks.updateBlogPost.mockResolvedValue({ ...existingPost, title: "수정된 제목" });
    const result = await appRouter.createCaller(adminContext()).blog.update({
      id: 4,
      slug: "first-note",
      title: "수정된 제목",
      excerpt: "수정 요약",
      content: "수정 본문",
      coverUrl: "/manus-storage/blog-images/new.png",
      published: true,
    });
    expect(dbMocks.updateBlogPost).toHaveBeenCalledWith(4, expect.objectContaining({ title: "수정된 제목", publishedAt: existingPost.publishedAt }));
    expect(result.title).toBe("수정된 제목");
  });

  it("deletes an owner post", async () => {
    dbMocks.getBlogPostById.mockResolvedValue(existingPost);
    dbMocks.deleteBlogPost.mockResolvedValue(true);
    await expect(appRouter.createCaller(adminContext()).blog.delete({ id: 4 })).resolves.toEqual({ success: true });
    expect(dbMocks.deleteBlogPost).toHaveBeenCalledWith(4);
  });
});
