# ! Koharu 포트폴리오 디자인 결정

## Ground-truth Reference

이 프로젝트는 사용자가 제공한 `https://se01hxa.xyz/`와 첨부 이미지의 구조·분위기를 기준으로 한다. 핵심은 왼쪽 고정형 섹션 내비게이션, 넓은 파스텔 배경, 가운데로 흐르는 세로형 콘텐츠, 반투명한 흰색 카드, 핑크 계열 강조색, 짧고 친근한 한국어 카피다. 단순 복제가 아니라 `! Koharu`의 게임 프로그래머 정체성과 `koharu.live` 링크 허브를 담은 개인 브랜드 페이지로 재해석한다.

## Chosen Direction: Soft Game Atelier

### Design Movement

Soft brutalism과 일본식 웹 포트폴리오의 절제된 카드 UI를 섞은 파스텔 에디토리얼 디자인. 화면 전체는 가벼운 종이 질감과 색 번짐을 가진 하이키 캔버스 위에 배치하고, 콘텐츠는 정확한 간격과 단단한 타이포그래피로 잡는다.

### Core Principles

1. **Lightness with structure** — 흐릿한 색감 위에 섹션 번호, 얇은 구분선, 선명한 제목으로 탐색 구조를 만든다.
2. **Personal, not corporate** — `! Koharu`, 짧은 문장, 게임 제작 도구와 프로젝트 언어를 통해 사람의 온도를 유지한다.
3. **One continuous scroll** — 한 페이지 안에서 프로필, 스킬, 프로젝트, 파트너, 연락처를 자연스럽게 연결한다.
4. **Small moments of play** — 커서·별·픽셀·컨트롤러 모티프와 짧은 hover 움직임으로 게임 프로그래머의 성격을 보여준다.

### Color Philosophy

기본 배경은 따뜻한 아이보리와 라일락, 파우더 블루, 블러시 핑크가 만나는 하이키 색면이다. 텍스트는 대비가 충분한 먹색으로 두고, 링크와 진행률에는 브랜드 라즈베리 핑크를 사용해 시선이 머무는 위치를 만든다. 시그니처 컬러는 **Koharu Raspberry `#D93F84`**로, 친근하지만 유아적이지 않은 에너지와 창작자의 존재감을 전달한다.

### Layout Paradigm

좌측에는 데스크톱에서만 보이는 세로형 인덱스 레일을 두고, 콘텐츠는 화면 중앙보다 약간 오른쪽으로 치우친 좁은 리듬을 만든다. 모바일에서는 레일이 상단의 작은 목차 바로 바뀐다. 각 섹션은 카드와 여백이 교차하며 이어지고, 프로젝트는 한 개의 대표 카드와 링크 행으로 구성한다. 반복적인 중앙 정렬 대신 `rail → content column → open canvas`의 비대칭을 사용한다.

### Signature Elements

- 좌측 레일의 마젠타 숫자 탭과 작은 별표 마크
- 반투명 아이보리 카드, 큰 radius, 부드러운 그림자, 얇은 안쪽 하이라이트
- `→`, `↗`, `*` 기호를 이용한 텍스트 기반 인터랙션과 마이크로 카피

### Interaction Philosophy

클릭 가능한 요소는 명확히 보이되 과하게 튀지 않는다. 링크 hover 시 핑크 underline과 2px 정도의 이동, 카드 hover 시 아주 작은 translateY와 그림자 변화만 사용한다. 이메일은 기본 메일 앱을 여는 `mailto:` 링크로 제공하고, 외부 링크는 새 탭에서 열며 `rel="noreferrer"`를 적용한다. 키보드 포커스는 핑크 outline으로 보장한다.

### Animation

첫 로드에서는 프로필 카드, 스킬 행, 링크 카드가 50ms 간격으로 opacity 0에서 1로 짧게 나타난다. 지속적인 장식 애니메이션 대신 배경의 색 번짐만 느리게 움직이고, hover는 180ms ease-out으로 처리한다. `prefers-reduced-motion: reduce`에서는 모든 entrance와 배경 움직임을 제거한다.

### Typography System

제목은 `Space Grotesk`의 700 weight로 영문 브랜드와 큰 섹션 제목에 사용하고, 본문은 `Noto Sans KR` 400/500/700으로 가독성을 확보한다. 작은 eyebrow는 11px·700·자간 0.16em의 대문자 영문을 사용한다. 섹션 제목은 모바일 28px, 데스크톱 38px로 시작하고, 본문은 14–16px에 1.8 line-height를 유지한다.

### Brand Essence

게임을 만들고, 작은 아이디어를 플레이 가능한 경험으로 바꾸는 개인 개발자 `! Koharu`의 조용하고 다정한 온라인 포트폴리오. 성격은 **playful, thoughtful, makerly**다.

### Brand Voice

헤드라인은 짧고 자신감 있게, CTA는 명령형보다 초대형으로, 설명은 친한 동료에게 말하듯 쓴다. 과장된 자기소개나 가짜 후기·평점은 사용하지 않는다.

- 예시 헤드라인: `작은 아이디어를, 플레이 가능한 장면으로.`
- 예시 CTA: `작업물 구경하기 →`

### Wordmark & Logo

워드마크는 `!`를 별 모양 커서처럼 세우고 `Koharu`는 Space Grotesk Bold로 조합한다. 심볼은 네 꼭짓점 별과 게임 커서 화살표를 겹친 단순한 마크로 만들며, 헤더에서는 텍스트 워드마크와 함께 사용하고 favicon에서는 심볼만 사용한다.

### Signature Brand Color

**Koharu Raspberry — `#D93F84`**

## Content Scope

프로필: `! Koharu`, 게임 프로그래머, 작은 아이디어를 플레이 가능한 장면으로 바꾸는 사람.

스킬: Unity / C# / JavaScript / TypeScript / Git.

프로젝트: 대표 작업 카드 1개는 실제 정보가 없는 상태이므로 구체적인 성과를 꾸며내지 않고 `작업물 정리 중`으로 명시한다. 링크는 사용자가 추가할 수 있게 구조를 분리한다.

파트너: `Team Light` 사이트를 파트너 링크로 명시하고 `https://teamlight.pe.kr`로 연결한다. 사용자가 제공한 협업 관계만 표시하며 제3자의 후기나 평가를 만들지 않는다.

연락: `codingexpertleon@gmail.com`을 mailto 링크와 복사 가능한 텍스트로 제공한다.

## Implementation Reminder

이 문서는 스타일 기준이다. CSS와 컴포넌트를 수정할 때마다 "이 선택이 Soft Game Atelier과 `Koharu Raspberry`를 강화하는가, 희석하는가?"를 확인한다. 모든 이미지·미디어는 프로젝트 외부 자산 경로의 lifecycle URL만 사용한다.
