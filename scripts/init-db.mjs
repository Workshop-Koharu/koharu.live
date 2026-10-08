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
        slug: 'unity-vfx-custom-shader-graph',
        title: '새로운 물 셰이더와 림라이트 이펙트 구현 완료 ✨',
        caption: '이번 주말 동안 작업한 커스텀 물 반사 셰이더! 🌊 Depth buffer 기반으로 수심에 따라 색상이 그라데이션되고 림라이트가 은은하게 도는 느낌을 살려봤어요. C# Compute Shader로 잔물결 버텍스 애니메이션까지 적용 완료 🎮\n\n#Unity #HLSL #GameDev #ShaderGraph #개발일지 #코하루',
        excerpt: 'Depth buffer 기반의 투명도 제어와 림라이트가 적용된 커스텀 물 셰이더 제작기입니다.',
        content: 'Depth buffer 기반의 투명도 제어와 림라이트가 적용된 커스텀 물 셰이더 제작기입니다. 씬 라이팅과의 상호작용 및 최적화 노하우를 공유합니다.',
        cover_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80'
        ]),
        category: 'gamedev',
        likes_count: 38,
      },
      {
        slug: 'pixel-art-dungeon-crawler-mechanics',
        title: '도트 감성 던전 크롤러 프로토타입 🕹️',
        caption: '타일맵 기반 랜덤 던전 생성 알고리즘 (Bsp Tree + Cellular Automata) 테스트 중입니다. 캐릭터 피격 판정과 무적 프레임 애니메이션도 자연스럽게 연결되었어요! 완성되면 itch.io에 데모 올릴 예정입니다 ⚔️\n\n#PixelArt #IndieGame #GameProgramming #DotArt #코하루라이브',
        excerpt: 'Bsp Tree와 셀룰러 오토마타를 결합한 랜덤 던전 생성기 및 타격감 튜닝 과정입니다.',
        content: 'Bsp Tree와 셀룰러 오토마타를 결합한 랜덤 던전 생성기 및 타격감 튜닝 과정입니다. 애니메이션 캔슬 시스템 구현 세부 내용입니다.',
        cover_url: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=1200&q=80',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=1200&q=80'
        ]),
        category: 'project',
        likes_count: 52,
      },
      {
        slug: 'custom-scripting-language-lexer-parser',
        title: '게임용 경량 스크립트 언어 인터프리터 설계 💻',
        caption: 'C#으로 파서(Parser)와 AST(Abstract Syntax Tree) 평가기를 직접 만들고 있어요. 퀘스트 대화 분기 트리랑 이벤트 트리거를 스크립트로 바로 작성할 수 있도록 문법을 간결하게 디자인했습니다. 빌드 안 돌리고 실시간 핫리로드 되는 쾌감... 최고 🌿\n\n#Compiler #AST #CSharp #TypeScript #Engineering',
        excerpt: '게임 내 대화 및 퀘스트 트리거를 위한 커스텀 인터프리터 제작기입니다.',
        content: '게임 내 대화 및 퀘스트 트리거를 위한 커스텀 인터프리터 제작기입니다. 렉서 토큰화부터 런타임 스택 머신 최적화까지 다룹니다.',
        cover_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'
        ]),
        category: 'devlog',
        likes_count: 29,
      },
      {
        slug: 'workspace-setup-and-spring-vibe',
        title: '새로운 듀얼 모니터 데스크 셋업 & 봄맞이 🌸',
        caption: '코딩하기 딱 좋은 세팅 완성! 세로 모니터에 터미널이랑 문서 띄워놓고 작업하니까 생산성 2배 올라가는 기분이에요. 커피 한 잔 내려놓고 코하루 라이브 포트폴리오 개편 시작합니다 ☕✨\n\n#DeskSetup #DevLife #Workspace #일상 #코하루',
        excerpt: '새로운 데스크 셋업과 코하루 포트폴리오 대규모 리뉴얼 소식입니다.',
        content: '새로운 데스크 셋업과 코하루 포트폴리오 대규모 리뉴얼 소식입니다. 새로운 기능들이 많이 추가될 예정이니 기대해주세요!',
        cover_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
        ]),
        category: 'daily',
        likes_count: 64,
      },
      {
        slug: 'koharu-live-v2-announcement',
        title: '✨ koharu.live v2.0 오픈 안내 & 새로운 기능들',
        caption: '선아와의 콜라보 디자인을 담아 코하루 라이브가 새롭게 단장했습니다! 인스타그램 스타일 블로그, 비밀 편지, Cloner AI 대화, 방명록까지 모두 준비되어 있어요. 둘러보시고 방명록이나 댓글로 편하게 인사 남겨주세요 💕\n\n#공지사항 #Notice #Portfolio #WebDev #KoharuLive',
        excerpt: '코하루 라이브 포트폴리오 v2.0 공식 릴리즈 공지사항입니다.',
        content: '코하루 라이브 포트폴리오 v2.0 공식 릴리즈 공지사항입니다. 인스타그램 스타일 블로그, 비밀 편지, Cloner AI 대화 기능이 모두 오픈되었습니다.',
        cover_url: '/images/seona-opening-banner.png',
        images: JSON.stringify([
          '/images/seona-opening-banner.png',
          '/images/seona-opening-portrait.png'
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
            ($1, '선아 (SeonA)', '/images/seona-moon-logo.png', '코하루야 디자인 너무 예쁘게 잘 나왔다 축하해!! ⁽⁽ (˶> ᎑ <˶) ⁾⁾🌸'),
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
        ('선아 (SeonA)', '/images/seona-moon-logo.png', '코하루 안녕! 새로운 사이트 축하하러 왔어 ㅎㅎ 앞으로도 화이팅이야 🌸', false),
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
