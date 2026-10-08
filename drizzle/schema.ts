import { boolean, integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: varchar("role", { length: 32 }).default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Instagram-style Blog Posts table
 */
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  caption: text("caption").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverUrl: varchar("cover_url", { length: 1000 }).notNull(),
  images: jsonb("images").$type<string[]>(),
  category: varchar("category", { length: 64 }).default("devlog").notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  authorName: varchar("author_name", { length: 100 }).default("! Koharu").notNull(),
  authorAvatar: varchar("author_avatar", { length: 500 }).default("/assets/koharu-profile.png").notNull(),
  authorOpenId: varchar("author_open_id", { length: 64 }).default("koharu-owner"),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

/**
 * Post comments table (Instagram comments)
 */
export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  authorName: varchar("author_name", { length: 100 }).notNull(),
  authorAvatar: varchar("author_avatar", { length: 500 }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = typeof postComments.$inferInsert;

/**
 * Post likes tracking table
 */
export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userIdentifier: varchar("user_identifier", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostLike = typeof postLikes.$inferInsert;

/**
 * Guestbook / Board messages
 */
export const guestbookMessages = pgTable("guestbook_messages", {
  id: serial("id").primaryKey(),
  authorName: varchar("author_name", { length: 100 }).notNull(),
  authorAvatar: varchar("author_avatar", { length: 500 }),
  content: text("content").notNull(),
  isSecret: boolean("is_secret").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type GuestbookMessage = typeof guestbookMessages.$inferSelect;
export type InsertGuestbookMessage = typeof guestbookMessages.$inferInsert;