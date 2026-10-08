import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  createBlogPost: vi.fn(async (input: Record<string, unknown>) => ({ id: 11, ...input })),
  getPublishedBlogPostBySlug: vi.fn(),
  getPublishedBlogPosts: vi.fn(),
}));

const { appRouter } = await import("./routers");
import type { TrpcContext } from "./_core/context";

function makeContext(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined, cookie: () => undefined } as TrpcContext["res"],
  };
}

const owner = {
  id: 0,
  openId: "admin:local-owner",
  name: "! Koharu",
  email: "codingexpertleon@gmail.com",
  loginMethod: "local-admin",
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("rich blog content", () => {
  it("passes Markdown content and coverUrl to the owner-only create procedure", async () => {
    const caller = appRouter.createCaller(makeContext(owner));
    const result = await caller.blog.create({
      slug: "rich-note",
      title: "Rich note",
      excerpt: "A formatted note",
      content: "# Heading\n\n**bold** and ![image](/manus-storage/blog-images/example.png)",
      coverUrl: "/manus-storage/blog-images/cover.png",
      published: true,
    });

    expect(result).toMatchObject({
      slug: "rich-note",
      content: expect.stringContaining("**bold**"),
      coverUrl: "/manus-storage/blog-images/cover.png",
    });
  });

  it("rejects image uploads from a non-owner admin account", async () => {
    const caller = appRouter.createCaller(makeContext({ ...owner, openId: "another-admin", email: "another@example.com" }));
    await expect(caller.blog.uploadImage({ filename: "x.png", contentType: "image/png", data: "aGVsbG8=" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
