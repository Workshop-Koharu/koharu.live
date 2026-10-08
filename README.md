# ! Koharu (코하루) · Personal Portfolio v2.0 🌸

> **코드로 세상을 플레이어블하게 만드는 중**  
> 선아(SeonA)의 감성적인 파스텔 비주얼 & 인터랙티브 기능과 코하루의 게임 프로그래밍 포트폴리오를 결합하고, 인스타그램 스타일의 블로그 시스템과 Neon PostgreSQL을 연동한 프로젝트입니다.

---

## ✨ 주요 기능 및 특징

### 1. 🎨 선아(SeonA) x 코하루 감성 디자인 통합
- **Ambient Dreamy Background**: 은은하게 부유하는 빛의 궤도 오르브(Floating Orbs)와 반짝이는 별무리(Sparkles `✦`, `✧`, `·`)
- **Site Navigation Topbar**: 부드럽게 펼쳐지는 호버 라벨 애니메이션 메뉴바 및 실시간 블로그 공지 티커(Notice Bar)
- **Visual Identity**: `EF Diary` 감성 폰트와 파스텔톤 글래스모피즘(Glassmorphism) 카드 UI
- **Secret Letter (비밀 편지)**: 4자리 패스코드 키패드로 봉인을 해제하는 인터랙티브 편지 시스템
- **History Timeline (히스토리)**: 2024 ~ 2026 개발 발자취와 마일스톤 타임라인
- **Partners & People (파트너 & 지인)**: Team Light, 선아 등 소중한 인연과 협업 프로젝트 카드
- **Guestbook Board (방명록 게시판)**: 방문자가 직접 응원 메시지와 비밀글을 남길 수 있는 실시간 게시판
- **Cloner AI Chat**: 선아의 Cloner AI와 코하루의 게임 지식이 결합된 대화형 AI 어시스턴트 (v1/v2 모델, 코딩/디자인 모드)

### 2. 📸 인스타그램 스타일 블로그 시스템
- **Instagram Profile Header**: 무지개빛 스토리 링 그라데이션 아바타, `koharu.live` 인증 배지, 팔로우/메시지 토글, 게시물/팔로워 통계 및 스토리 하이라이트
- **3-Column Square Photo Grid (게시물 그리드)**: 인스타그램 고유의 정사각형 3열 그리드 레이아웃과 호버 시 나타나는 좋아요(❤️) 및 댓글(💬) 카운터
- **Vertical Feed Stream (피드 스트림)**: 게시물별 사진 더블클릭 하트 팝업(Double-tap Heart Burst), 좋아요/북마크 토글, 실시간 댓글 목록 및 댓글 작성
- **Detail Modal (게시물 상세 모달)**: 좌측 사진 / 우측 작성자 캡션 및 댓글 스크롤 스레드로 구성된 인스타그램 웹 뷰
- **새 게시물 만들기 (Create Post)**: 이미지 URL, 캡션(#해시태그), 카테고리 선택을 지원하는 인스타그램 스타일 업로드 다이얼로그

### 3. 🐘 Neon PostgreSQL Database
- **Host**: Neon Cloud PostgreSQL Serverless
- **ORM**: Drizzle ORM (`drizzle-orm/neon-http`)
- **Tables**:
  - `blog_posts`: 인스타그램 게시물 (슬러그, 제목, 캡션, 사진, 카테고리, 좋아요 수)
  - `post_comments`: 게시물별 실시간 방문자 댓글
  - `post_likes`: 게시물 좋아요 토글 추적
  - `guestbook_messages`: 방명록 메시지
  - `users`: 관리자 및 유저

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Sonner Toast
- **Backend / API**: Express, tRPC, Neon Serverless HTTP Driver
- **Database**: PostgreSQL (Neon Cloud), Drizzle ORM
- **Deployment & Hosting**: Vercel Serverless

---

## 🚀 로컬 실행 방법 (Local Development)

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정 (`.env`)
```env
DATABASE_URL=postgresql://neondb_owner:npg_NJhT4IV8bDrx@ep-rough-voice-b4xapbff-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=3000
```

### 3. 데이터베이스 초기화 (최초 1회 실행)
```bash
npm run db:init
```

### 4. 로컬 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000` 접속

---

## ☁️ Vercel 배포 가이드 (Vercel Deployment)

1. Vercel 대시보드에서 `Import Project` 클릭 후 본 깃허브 저장소(`https://github.com/Workshop-Koharu/koharu.live.git`) 연결
2. **Build and Output Settings**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - `DATABASE_URL`: `postgresql://neondb_owner:npg_NJhT4IV8bDrx@ep-rough-voice-b4xapbff-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
4. **Deploy** 버튼 클릭!
   - 정적 프론트엔드는 `dist`에서 즉시 전 세계 CDN으로 호스팅되고, `/api/*` 요청은 `api/index.ts` Vercel Serverless Function을 통해 Neon PostgreSQL과 직접 통신합니다.

---

© 2026 ! Koharu (코하루) · [koharu.live](https://koharu.live)
