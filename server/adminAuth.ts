import { scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import type { User } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";

function deriveKey(password: string, salt: Buffer, length: number, options: { N: number; r: number; p: number; maxmem: number }) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, length, options, (error, derived) => {
      if (error) reject(error);
      else resolve(derived as Buffer);
    });
  });
}
export const LOCAL_ADMIN_OPEN_ID = "admin:local-owner";
export const ADMIN_SESSION_COOKIE = "koharu_admin_session";

type ParsedHash = {
  cost: number;
  blockSize: number;
  parallelization: number;
  salt: Buffer;
  digest: Buffer;
};

function parseHash(encoded: string): ParsedHash | null {
  const [algorithm, cost, blockSize, parallelization, salt, digest] = encoded.split("|");
  if (algorithm !== "scrypt" || !cost || !blockSize || !parallelization || !salt || !digest) return null;
  const parsed = {
    cost: Number(cost),
    blockSize: Number(blockSize),
    parallelization: Number(parallelization),
    salt: Buffer.from(salt, "base64url"),
    digest: Buffer.from(digest, "base64url"),
  };
  if (!Number.isSafeInteger(parsed.cost) || parsed.cost < 1024 || parsed.cost > 1_048_576) return null;
  if (!Number.isSafeInteger(parsed.blockSize) || parsed.blockSize < 1 || parsed.blockSize > 32) return null;
  if (!Number.isSafeInteger(parsed.parallelization) || parsed.parallelization < 1 || parsed.parallelization > 16) return null;
  if (parsed.salt.length < 16 || parsed.digest.length < 32) return null;
  return parsed;
}

export async function verifyAdminPassword(password: string, encodedHash: string): Promise<boolean> {
  const parsed = parseHash(encodedHash);
  if (!parsed || !password) return false;
  const derived = await deriveKey(password, parsed.salt, parsed.digest.length, {
    N: parsed.cost,
    r: parsed.blockSize,
    p: parsed.parallelization,
    maxmem: Math.max(64 * 1024 * 1024, 128 * parsed.cost * parsed.blockSize + 1024),
  });
  return derived.length === parsed.digest.length && timingSafeEqual(derived, parsed.digest);
}

export function isLocalAdminUser(user: Pick<User, "openId">) {
  return user.openId === LOCAL_ADMIN_OPEN_ID;
}

export function isAdminLoginConfigured() {
  return Boolean(ENV.adminLoginEmail && ENV.adminPasswordHash);
}

export function isAdminEmail(email: string) {
  return email.trim().toLowerCase() === ENV.adminLoginEmail.trim().toLowerCase();
}

export function getLocalAdminUser(): User {
  const now = new Date();
  return {
    id: 0,
    openId: LOCAL_ADMIN_OPEN_ID,
    name: "! Koharu",
    email: ENV.adminLoginEmail,
    loginMethod: "local-admin",
    role: "admin",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

export async function createAdminSessionToken() {
  const secret = new TextEncoder().encode(ENV.cookieSecret);
  return new SignJWT({ kind: "koharu-admin", email: ENV.adminLoginEmail })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyAdminSessionToken(token: string | undefined) {
  if (!token || !ENV.cookieSecret) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(ENV.cookieSecret), { algorithms: ["HS256"] });
    return payload.kind === "koharu-admin" && payload.email === ENV.adminLoginEmail;
  } catch {
    return false;
  }
}

export async function authenticateLocalAdminRequest(req: Request) {
  const cookieHeader = req.headers.cookie ?? "";
  const token = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`))?.slice(ADMIN_SESSION_COOKIE.length + 1);
  return (await verifyAdminSessionToken(token)) ? getLocalAdminUser() : null;
}

export function adminCookieOptions(req: Request) {
  return { ...getSessionCookieOptions(req), sameSite: "lax" as const, maxAge: 30 * 24 * 60 * 60 * 1000 };
}
