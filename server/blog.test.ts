import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function makeContext(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("blog access control", () => {
  it("rejects blog creation for an unauthenticated visitor", async () => {
    const caller = appRouter.createCaller(makeContext(null));

    await expect(
      caller.blog.create({
        slug: "private-note",
        title: "Private note",
        excerpt: "A note",
        content: "Content",
        published: true,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects malformed slugs before reading public posts", async () => {
    const caller = appRouter.createCaller(makeContext(null));

    await expect(caller.blog.bySlug({ slug: "Not A Slug" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

it("rejects an admin account that is not the configured site owner", async () => {
  const caller = appRouter.createCaller(
    makeContext({
      id: 7,
      openId: "another-admin",
      name: "Another Admin",
      email: "another@example.com",
      loginMethod: "test",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }),
  );

  await expect(
    caller.blog.create({
      slug: "not-owner",
      title: "Not owner",
      excerpt: "A note",
      content: "Content",
      published: true,
    }),
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
});


describe("blog management access control", () => {
  it("rejects post updates for an unauthenticated visitor before database access", async () => {
    const caller = appRouter.createCaller(makeContext(null));
    await expect(caller.blog.update({ id: 1, slug: "edited-post", title: "Edited", excerpt: "Edited excerpt", content: "Edited content", published: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects post deletion for an unauthenticated visitor before database access", async () => {
    const caller = appRouter.createCaller(makeContext(null));
    await expect(caller.blog.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
