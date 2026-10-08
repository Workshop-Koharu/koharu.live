import { scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { ENV } from "./_core/env";
import { createContext } from "./_core/context";
import { ADMIN_SESSION_COOKIE, createAdminSessionToken, verifyAdminPassword, verifyAdminSessionToken } from "./adminAuth";
import type { TrpcContext } from "./_core/context";

function testHash(password: string) {
  const salt = Buffer.from("0123456789abcdef");
  const digest = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt|16384|8|1|${salt.toString("base64url")}|${digest.toString("base64url")}`;
}

describe("admin credentials", () => {
  it("creates and verifies an encrypted admin session token", async () => {
    const token = await createAdminSessionToken();
    await expect(verifyAdminSessionToken(token)).resolves.toBe(true);
  });

  it("loads the configured email and verifies the server-only hash without plaintext credentials in source", async () => {
    expect(ENV.adminLoginEmail).toBe("codingexpertleon@gmail.com");
    expect(ENV.adminPasswordHash).toMatch(/^scrypt\|/);
    await expect(verifyAdminPassword("definitely-not-the-admin-password", ENV.adminPasswordHash)).resolves.toBe(false);
  });
});

describe("auth.login API", () => {
  it("accepts a valid test fixture, sets a session cookie, and returns the local admin from auth.me", async () => {
    const originalEmail = ENV.adminLoginEmail;
    const originalHash = ENV.adminPasswordHash;
    ENV.adminLoginEmail = "fixture@example.com";
    ENV.adminPasswordHash = testHash("fixture-password");
    try {
      const cookieHeaders: string[] = [];
      const loginContext: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { cookie: (name: string, value: string) => cookieHeaders.push(`${name}=${value}`) } as TrpcContext["res"],
      };
      const loginResult = await appRouter.createCaller(loginContext).auth.login({ email: "fixture@example.com", password: "fixture-password" });
      expect(loginResult.loginMethod).toBe("local-admin");
      expect(cookieHeaders[0]).toMatch(new RegExp(`^${ADMIN_SESSION_COOKIE}=`));

      const context = await createContext({
        req: { protocol: "https", headers: { cookie: cookieHeaders[0] } } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      });
      await expect(appRouter.createCaller(context).auth.me()).resolves.toMatchObject({ loginMethod: "local-admin", role: "admin" });
    } finally {
      ENV.adminLoginEmail = originalEmail;
      ENV.adminPasswordHash = originalHash;
    }
  });

  it("rejects an invalid password with a generic unauthorized response", async () => {
    await expect(appRouter.createCaller({ user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }).auth.login({ email: ENV.adminLoginEmail, password: "wrong-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
