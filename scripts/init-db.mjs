import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_NJhT4IV8bDrx@ep-rough-voice-b4xapbff-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

const sql = neon(DATABASE_URL);

async function initDb() {
  console.log('[DB] Connecting to Neon PostgreSQL...');

  // Create tables
  await sql.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      open_id VARCHAR(64) UNIQUE NOT NULL,
      name TEXT,
      email VARCHAR(320),
      login_method VARCHAR(64),
      role VARCHAR(32) DEFAULT 'user' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      last_signed_in TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(220) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      caption TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      cover_url VARCHAR(1000) NOT NULL,
      images JSONB DEFAULT '[]'::jsonb,
      category VARCHAR(64) DEFAULT 'devlog' NOT NULL,
      likes_count INTEGER DEFAULT 0 NOT NULL,
      author_name VARCHAR(100) DEFAULT '! Koharu' NOT NULL,
      author_avatar VARCHAR(500) DEFAULT '/assets/koharu-profile.png' NOT NULL,
      author_open_id VARCHAR(64) DEFAULT 'koharu-owner',
      published_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS post_comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
      author_name VARCHAR(100) NOT NULL,
      author_avatar VARCHAR(500),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
      user_identifier VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT unique_post_user_like UNIQUE (post_id, user_identifier)
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS guestbook_messages (
      id SERIAL PRIMARY KEY,
      author_name VARCHAR(100) NOT NULL,
      author_avatar VARCHAR(500),
      content TEXT NOT NULL,
      is_secret BOOLEAN DEFAULT FALSE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `);

  console.log('[DB] Tables verified/created successfully.');

  // Check if we need to seed initial Instagram posts for Koharu
  const existing = await sql.query('SELECT COUNT(*) as count FROM blog_posts');
  const count = parseInt(existing[0]?.count || '0', 10);
  console.log(`[DB] Existing posts count: ${count}`);

  if (count === 0) {
    console.log('[DB] Seeding realistic Instagram devlog posts...');
    const seedPosts = [
      {
        slug: 'koharu-live-v2-announcement',
        title: '✨ koharu.live v2.0 오픈 안내 & 새로운 기능들',
        caption: '코하루 포트폴리오가 새롭게 단장했습니다! 인스타그램 피드, 비밀 편지, 방명록까지 모두 준비되어 있어요. 둘러보시고 방명록이나 댓글로 편하게 인사 남겨주세요 💕\n\n#공지사항 #Notice #Portfolio #WebDev #KoharuLive',
        excerpt: '코하루 포트폴리오 v2.0 공식 릴리즈 공지사항입니다.',
        content: '코하루 포트폴리오 v2.0 공식 릴리즈 공지사항입니다. 인스타그램 피드, 비밀 편지, 방명록 기능이 모두 오픈되었습니다.',
        cover_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80'
        ]),
        category: 'notice',
        likes_count: 89,
      }
    ];

    for (const post of seedPosts) {
      const res = await sql.query(`
        INSERT INTO blog_posts (slug, title, caption, excerpt, content, cover_url, images, category, likes_count, author_name, author_avatar)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id;
      `, [
        post.slug,
        post.title,
        post.caption,
        post.excerpt,
        post.content,
        post.cover_url,
        post.images,
        post.category,
        post.likes_count,
        '! Koharu',
        '/assets/koharu-profile.png'
      ]);

      const postId = res[0].id;

      // Seed sample comments
      if (post.slug === 'koharu-live-v2-announcement') {
        await sql.query(`
          INSERT INTO post_comments (post_id, author_name, author_avatar, content)
          VALUES 
            ($1, 'Team Light', '/assets/team-light-logo.png', '새로운 koharu.live v2 오픈 축하드립니다! 앞으로도 멋진 프로젝트 기대할게요 ✨')
        `, [postId]);
      } else if (post.slug === 'unity-vfx-custom-shader-graph') {
        await sql.query(`
          INSERT INTO post_comments (post_id, author_name, author_avatar, content)
          VALUES 
            ($1, 'GameDev_Lover', '', '물 반사 느낌 진짜 자연스럽네요! 혹시 모바일에서도 프레임 잘 나오나요?')
        `, [postId]);
      }
    }
    console.log('[DB] Seeding finished successfully!');
  }

  // Check guestbook
  const gbCount = await sql.query('SELECT COUNT(*) as count FROM guestbook_messages');
  if (parseInt(gbCount[0]?.count || '0', 10) === 0) {
    await sql.query(`
      INSERT INTO guestbook_messages (author_name, author_avatar, content, is_secret)
      VALUES 
        ('Team Light', '/assets/team-light-logo.png', '코하루 안녕! 새로운 사이트 축하하러 왔어 ㅎㅎ 앞으로도 화이팅이야 🌸', false),
        ('방문자', '', '포트폴리오 감성이 너무 좋네요. 인스타 피드랑 게임 데모 멋져요!', false)
    `);
    console.log('[DB] Seeded initial guestbook messages.');
  }

  console.log('[DB] Initialization complete.');
}

initDb().catch(e => {
  console.error('[DB] Initialization error:', e);
  process.exit(1);
});
