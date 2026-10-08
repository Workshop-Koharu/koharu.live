import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../drizzle/schema";
import {
  BlogPost,
  InsertBlogPost,
  InsertUser,
  PostComment,
  InsertPostComment,
  GuestbookMessage,
  InsertGuestbookMessage,
  SiteProfile,
  InsertSiteProfile,
  blogPosts,
  postComments,
  postLikes,
  guestbookMessages,
  siteProfile,
  users,
} from "../drizzle/schema";

const DEFAULT_DB_URL = "postgresql://neondb_owner:npg_NJhT4IV8bDrx@ep-rough-voice-b4xapbff-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL || DEFAULT_DB_URL;
    try {
      const client = neon(url);
      _db = drizzle(client, { schema });
    } catch (error) {
      console.warn("[Database] Failed to connect to Neon:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    await db
      .insert(users)
      .values({
        openId: user.openId,
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        role: user.role ?? "user",
        lastSignedIn: user.lastSignedIn ?? new Date(),
      })
      .onConflictDoUpdate({
        target: users.openId,
        set: {
          name: user.name ?? null,
          email: user.email ?? null,
          loginMethod: user.loginMethod ?? null,
          role: user.role ?? "user",
          lastSignedIn: user.lastSignedIn ?? new Date(),
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  const db = getDb();
  if (!db) return [];

  return db
    .select()
    .from(blogPosts)
    .where(isNotNull(blogPosts.publishedAt))
    .orderBy(desc(blogPosts.createdAt));
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const db = getDb();
  if (!db) return [];

  return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const db = getDb();
  if (!db) return undefined;

  const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  const post = result[0];
  return post?.publishedAt ? post : undefined;
}

export async function getBlogPostById(id: number): Promise<BlogPost | undefined> {
  const db = getDb();
  if (!db) return undefined;

  const result = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  return result[0];
}

export async function createBlogPost(post: InsertBlogPost): Promise<BlogPost | undefined> {
  const db = getDb();
  if (!db) return undefined;

  const result = await db.insert(blogPosts).values(post).returning();
  return result[0];
}

export async function updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
  const db = getDb();
  if (!db) return undefined;

  const result = await db
    .update(blogPosts)
    .set({ ...post, updatedAt: new Date() })
    .where(eq(blogPosts.id, id))
    .returning();

  return result[0];
}

export async function deleteBlogPost(id: number): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  return true;
}

export async function togglePostLike(postId: number, userIdentifier: string): Promise<{ liked: boolean; likesCount: number }> {
  const db = getDb();
  if (!db) return { liked: false, likesCount: 0 };

  const existing = await db
    .select()
    .from(postLikes)
    .where(sql`${postLikes.postId} = ${postId} AND ${postLikes.userIdentifier} = ${userIdentifier}`)
    .limit(1);

  let liked = false;
  if (existing.length > 0) {
    // Unlike
    await db
      .delete(postLikes)
      .where(sql`${postLikes.postId} = ${postId} AND ${postLikes.userIdentifier} = ${userIdentifier}`);
    await db
      .update(blogPosts)
      .set({ likesCount: sql`GREATEST(0, ${blogPosts.likesCount} - 1)` })
      .where(eq(blogPosts.id, postId));
    liked = false;
  } else {
    // Like
    await db.insert(postLikes).values({ postId, userIdentifier });
    await db
      .update(blogPosts)
      .set({ likesCount: sql`${blogPosts.likesCount} + 1` })
      .where(eq(blogPosts.id, postId));
    liked = true;
  }

  const post = await getBlogPostById(postId);
  return { liked, likesCount: post?.likesCount ?? 0 };
}

export async function getPostComments(postId: number): Promise<PostComment[]> {
  const db = getDb();
  if (!db) return [];

  return db
    .select()
    .from(postComments)
    .where(eq(postComments.postId, postId))
    .orderBy(desc(postComments.createdAt));
}

export async function createPostComment(comment: InsertPostComment): Promise<PostComment | undefined> {
  const db = getDb();
  if (!db) return undefined;

  const result = await db.insert(postComments).values(comment).returning();
  return result[0];
}

export async function getGuestbookMessages(): Promise<GuestbookMessage[]> {
  const db = getDb();
  if (!db) return [];

  return db.select().from(guestbookMessages).orderBy(desc(guestbookMessages.createdAt)).limit(50);
}

export async function createGuestbookMessage(msg: InsertGuestbookMessage): Promise<GuestbookMessage | undefined> {
  const db = getDb();
  if (!db) return undefined;

  const result = await db.insert(guestbookMessages).values(msg).returning();
  return result[0];
}

export async function getSiteProfile(): Promise<SiteProfile | undefined> {
  const db = getDb();
  if (!db) return undefined;

  const result = await db.select().from(siteProfile).limit(1);
  return result[0];
}

export async function updateSiteProfile(data: Partial<InsertSiteProfile>): Promise<SiteProfile | undefined> {
  const db = getDb();
  if (!db) return undefined;

  const existing = await getSiteProfile();
  if (existing) {
    const result = await db
      .update(siteProfile)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(siteProfile.id, existing.id))
      .returning();
    return result[0];
  } else {
    const result = await db.insert(siteProfile).values(data as InsertSiteProfile).returning();
    return result[0];
  }
}

