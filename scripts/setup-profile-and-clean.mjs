import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_NJhT4IV8bDrx@ep-rough-voice-b4xapbff-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function run() {
  console.log('[DB] Connecting to Neon PostgreSQL...');

  // Create site_profile table if not exists
  await sql.query(`
    CREATE TABLE IF NOT EXISTS site_profile (
      id SERIAL PRIMARY KEY,
      username VARCHAR(64) DEFAULT 'koharu.live',
      name VARCHAR(100) DEFAULT '! Koharu · 코하루',
      bio TEXT DEFAULT '🎮 게임 프로그래머 · 인디 게임 & 커스텀 엔진 제작\n🕹️ Unity / C# · HLSL Shader · TypeScript · Web\n🌸 플레이되는 아이디어를 코드로 실체화하는 중',
      avatar_url VARCHAR(1000) DEFAULT '/assets/koharu-profile.png',
      banner_url VARCHAR(1000) DEFAULT 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1400&q=80',
      birthdate VARCHAR(64) DEFAULT '2004. 12. 04',
      github_url VARCHAR(500) DEFAULT 'https://github.com/Workshop-Koharu',
      instagram_url VARCHAR(500) DEFAULT 'https://instagram.com/koharu.live',
      email VARCHAR(320) DEFAULT 'admin@koharu.live',
      website_url VARCHAR(500) DEFAULT 'https://koharu.live',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Update existing row if present
  await sql.query(`
    UPDATE site_profile 
    SET instagram_url = 'https://instagram.com/koharu.live' 
    WHERE instagram_url LIKE '%sx0n%';
  `);

  // Ensure default profile row exists
  const profileRows = await sql.query('SELECT COUNT(*) as count FROM site_profile');
  if (parseInt(profileRows[0]?.count || '0', 10) === 0) {
    await sql.query(`
      INSERT INTO site_profile (username, name, bio, avatar_url, banner_url, birthdate, github_url, instagram_url, email, website_url)
      VALUES (
        'koharu.live',
        '! Koharu · 코하루',
        '🎮 게임 프로그래머 · 인디 게임 & 커스텀 엔진 제작\n🕹️ Unity / C# · HLSL Shader · TypeScript · Web\n🌸 플레이되는 아이디어를 코드로 실체화하는 중',
        '/assets/koharu-profile.png',
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1400&q=80',
        '2004. 12. 04',
        'https://github.com/Workshop-Koharu',
        'https://instagram.com/koharu.live',
        'admin@koharu.live',
        'https://koharu.live'
      );
    `);
    console.log('[DB] Inserted default site_profile row.');
  }

  // Clear Instagram blog posts as requested: "인스타그램 엔 처음엔 아무것도 없게 세팅해줘"
  await sql.query('DELETE FROM post_comments;');
  await sql.query('DELETE FROM post_likes;');
  await sql.query('DELETE FROM blog_posts;');
  console.log('[DB] Emptied blog_posts, post_comments, post_likes for fresh Instagram start.');

  console.log('[DB] Completed successfully.');
}

run().catch(e => {
  console.error('[DB] Error:', e);
  process.exit(1);
});
