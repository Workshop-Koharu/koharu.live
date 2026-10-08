# ! Koharu 수정 작업 체크리스트

- [x] 참고 사이트의 좌측 버튼 패널 구조를 `.html` 페이지 링크 구조로 변경
- [x] 제공된 인물 이미지를 프로필 이미지와 favicon으로 교체
- [x] `Team Light`, `Mirae AI`, `Enroll-Lang`, `비공식 스텔라이브 팬서버` 프로젝트 등록
- [x] Team Light favicon 및 각 외부 링크 연결
- [x] 프로젝트 상세 HTML 페이지와 뒤로가기 동선 구현
- [x] 정적 앱을 인증·데이터 저장이 가능한 풀스택 구조로 확장
- [x] 소유자 전용 블로그 목록·상세·작성 화면 구현
- [x] 블로그 작성 권한을 로그인한 사이트 소유자로 제한
- [x] Netlify 배포 문서와 Downloads 사본 갱신
- [x] 반응형·타입 검사·빌드·주요 링크 흐름 검증

- [x] 프로젝트 상세 페이지에 프로젝트 목록으로 돌아가는 명시적 링크 추가 및 내부 CTA 목적지 수정
- [x] `blog.create`를 `OWNER_OPEN_ID` 직접 검증으로 강화하고 비소유자 테스트 보강
- [x] 최신 풀스택 프로젝트 전체를 Downloads 사본으로 다시 복사하고 복사 결과 확인
- [x] 최종 다중 `.html` 포트폴리오 버전에서 모바일 홈·프로젝트·블로그 반응형 레이아웃 재검증

- [x] Manus OAuth 대신 이메일·비밀번호 관리자 로그인과 HTTP-only 세션 구현
- [x] 평문 비밀번호를 소스·클라이언트·로그에 노출하지 않는 서버 해시 검증 추가
- [x] 관리자 글 작성기에 이미지 업로드와 저장소 연동 추가
- [x] 제목·소제목·굵게·기울임·목록·링크·인용·코드 등 서식 편집기 추가
- [x] 리치 콘텐츠 저장·공개 렌더링·작성 권한 테스트 보강
- [x] 관리자 화면 모바일 반응형과 보안 흐름 검증
- [x] 서식 편집기에 제목(H1)과 소제목(H2) 서식을 각각 명시적으로 추가하고 동작 확인
- [x] 로컬 관리자 로그인 성공·리치 콘텐츠 저장·coverUrl 저장·비소유자 업로드 거부 테스트 추가
- [x] 모바일 관리자 편집기 레이아웃과 이메일 로그인 API 성공·실패 흐름 검증
- [x] `auth.login` 성공·실패와 세션 쿠키 발급 후 `auth.me`를 Vitest로 검증
- [x] 모바일 관리자 로그인 화면과 편집기 반응형 CSS를 캡처·코드로 검증
- [x] 이메일 로그인 실패 API 응답과 UI 에러 처리를 검증

- [x] 첨부 ZIP에 `client/src/_core/hooks/useAuth.ts`가 포함되어 있는지 오류 로그와 대조
- [x] Netlify에서 누락되지 않도록 useAuth import/파일 구조 수정
- [x] Netlify 빌드 경고와 정적·풀스택 배포 호환성 점검
- [x] 수정된 ZIP을 다시 생성하고 로컬 Netlify 빌드 검증
- [x] 누락된 `client/src/_core/hooks/useAuth.ts`를 포함한 새 배포 ZIP 생성
- [x] Netlify용 publish/build 설정이 실제 업로드 방식과 일치하는지 검증
- [x] 새 ZIP을 Netlify 배포 기준으로 재압축하고 필수 파일 목록 확인
- [x] 새 ZIP을 압축 해제한 디렉터리에서 Netlify와 동일한 `pnpm run build:netlify` 실행
- [x] `netlify.toml`의 build/publish 설정을 읽고 ZIP 업로드 방식과 차이를 정리
- [x] 정적 Netlify 패키지와 풀스택 블로그 호스팅 요구를 문서에서 명확히 분리
- [x] `BlogAdminPage`의 useAuth 경로가 새 ZIP에 실제 포함되는지 빌드 로그로 증명
- [x] 최종 ZIP 압축 해제본에서 `pnpm install --frozen-lockfile` 후 `pnpm run build:netlify` 성공 로그와 `dist/public` 산출 확인

- [x] 배포 환경에서 깨지는 이미지 URL과 favicon 경로를 실제 로드 가능한 방식으로 수정
- [x] 하단 `Powered by Netlify` 표시를 앱·배포 산출물에서 제거
- [x] 정적 Netlify에서 관리자 로그인 요청이 HTML로 되돌아오는 원인과 API 호스팅 경로 수정
- [x] 관리자 블로그 게시글 수정·삭제 API와 화면 버튼 구현
- [x] 수정·삭제 권한 및 로그인 오류 처리 테스트 추가
- [x] 배포 산출물 기준 이미지·favicon·로그인·관리자 CRUD·반응형 검증
- [x] 블로그 업로드 이미지 URL을 별도 API/스토리지 도메인으로 보정할 수 있는 경로와 설정 추가
- [x] Netlify 하단 배지 선택자 숨김과 Deploy badge 설정 안내 추가
- [x] `VITE_API_BASE_URL` 기반 풀스택 API 연결과 정적 배포 미연결 안내를 문서·UI에 명확히 반영
- [x] `blog.update`·`blog.delete` 성공 경로와 정적 API 오류 UI 테스트 추가
- [x] 최신 로컬 배포 산출물 기준 정적 자산·favicon·CRUD 가능 조건을 재검증
- [x] BlogAdminPage에서 정적 API 오류가 실제 인라인 안내로 표시되는 UI 테스트 추가
- [x] 사전 빌드 산출물에서 API 미연결 안내와 VITE_API_BASE_URL·PUBLIC_STORAGE_BASE_URL 연결 조건을 문서·코드로 검증
