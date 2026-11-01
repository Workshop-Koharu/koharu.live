# ! Koharu (코하루) · Personal Portfolio & Moments / Tech Blog 🌸

> **코드로 세상을 플레이어블하게 만드는 중**  
> 감성적인 파스텔 비주얼 & 인터랙티브 기능과 코하루의 게임 프로그래밍 포트폴리오를 결합하고, 새로 개편된 **코하루 모먼트(Moments)**와 **전용 마크다운 개발 블로그(Tech Blog)**, 디스코드/구글 인증 시스템 및 Neon PostgreSQL을 연동한 프로젝트입니다.

---

## ✨ 2026 주요 전면 개편 및 신규 기능

### 1. 📸 코하루 모먼트 (Koharu Moments · 피드 & 갤러리)
- **전면 개편된 UI/UX**: AI 템플릿 느낌을 벗어나 트렌디한 인스타그램 스타일 스토리 하이라이트 링과 미니멀 그리드/피드 뷰 탑재
- **Google 로그인 연동**: 구글 계정으로 로그인한 사용자만 모먼트 피드를 이용하고 사진/댓글을 남길 수 있도록 보호
- **철저한 보안 및 삭제 권한 검증**: 본인이 작성한 게시글이나 댓글만 수정/삭제할 수 있도록 백엔드 및 프론트엔드 권한 체크 완벽 구현
- **QR 코드 & 공유**: 모달 스크롤 락 및 안티 지터(Anti-jitter) 엔진 적용으로 마우스 휠 조작 시에도 화면 떨림 없는 안정적인 QR 코드 생성

### 2. 📝 코하루 전용 개발 블로그 (Tech Blog)
- **마크다운 문법 지원**: 제목, 코드 하이라이트, 인용구, 이미지, 리스트 등 완벽 렌더링
- **Discord OAuth2 관리자 인증**:
  - 관리자 조건: 디스코드 이메일 `codingexpertleon@gmail.com`, 닉네임 `koharu_81s`, ID `1339604814631534667`
  - 관리자는 실시간 마크다운 에디터로 글 작성, 수정, 삭제의 모든 권한 보유
- **방문자 인터랙션**:
  - 일반 로그인 사용자는 게시글에 좋아요(Like 👍) 및 싫어요(Dislike 👎) 클릭 가능
  - 댓글 작성 및 본인이 작성한 댓글 수정/삭제 가능

### 3. 📱 완벽한 모바일 반응형 지원
- **스마트폰 맞춤 네비게이션**: 상단 헤더 햄버거 메뉴 및 하단 플로팅 탭바(Floating Dock) 제공
- **반응형 그리드**: 스마트폰/태블릿/데스크탑 화면 폭에 따라 1열/2열/3열 그리드 자동 전환

### 4. 🔗 URL 단축기 (`koharu.live/{code}`)
- 긴 웹 링크를 `https://koharu.live/{코드}` 로 단축하여 관리 및 클릭수 통계 제공

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Sonner Toast, Wouter
- **Backend / API**: Express, Vercel Serverless Function, Neon Serverless HTTP Driver
- **Authentication**: Discord OAuth2, Google Identity Services
- **Database**: PostgreSQL (Neon Cloud), Drizzle ORM
- **Deployment**: Vercel

---

## 🚀 로컬 실행 방법 (Local Development)

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정 (`.env`)
```env
DATABASE_URL=postgresql://neondb_owner:npg_NJhT4IV8bDrx@ep-rough-voice-b4xapbff-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DISCORD_CLIENT_ID=1523139211228741784
DISCORD_CLIENT_SECRET=tUGuQO8qivi42N0HFKFPOOtV_kdRg3HR
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
PORT=3000
```

### 3. 로컬 개발 서버 실행
```bash
npm run dev
```

---

© 2026 ! Koharu (코하루) · [koharu.live](https://koharu.live)
