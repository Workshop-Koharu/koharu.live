import pg from "pg";

const connectionString =
  "postgresql://neondb_owner:npg_NJhT4IV8bDrx@ep-rough-voice-b4xapbff-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const pool = new pg.Pool({ connectionString });
  console.log("Testing connection...");
  const profileRes = await pool.query("SELECT * FROM site_profile LIMIT 1;");
  console.log("Current Profile in DB:", profileRes.rows[0]?.name);

  // Test updating profile
  await pool.query(
    "UPDATE site_profile SET name = $1, updated_at = NOW() WHERE id = $2;",
    ["! Koharu · 코하루", profileRes.rows[0].id]
  );
  console.log("Profile update query succeeded!");

  // Test inserting a test post and deleting it
  const postRes = await pool.query(
    `INSERT INTO blog_posts (slug, title, caption, excerpt, content, cover_url, category, likes_count, author_name, author_avatar)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id;`,
    [
      "test-save-" + Date.now(),
      "테스트 게시물",
      "테스트 캡션입니다",
      "테스트 요약",
      "테스트 본문",
      "https://example.com/test.jpg",
      "일상",
      0,
      "! Koharu",
      "/assets/koharu-profile.png",
    ]
  );
  console.log("Post creation query succeeded! ID:", postRes.rows[0].id);

  // Clean up test post
  await pool.query("DELETE FROM blog_posts WHERE id = $1;", [postRes.rows[0].id]);
  console.log("Test post cleaned up successfully!");

  await pool.end();
}

main().catch(console.error);
