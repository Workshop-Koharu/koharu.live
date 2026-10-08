# Reference notes

## Reference portfolio: https://se01hxa.xyz/

- Single-page Discord-profile/link-hub style portfolio.
- Desktop view uses a slim left vertical navigation rail with a brand mark, name, numbered section tabs, and a mail/contact icon.
- Main content is an off-center narrow vertical column over a pastel pink/lilac/blue background.
- Content sections visible in the reference: profile, skills, contact/links, projects, partner, people.
- Cards are translucent white with large rounded corners, soft shadows, short Korean copy, pink headings, and simple arrow affordances.

## Netlify official guidance: https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/

- Add the custom domain in Netlify first: Domain management > Production domains > Add a domain.
- For `www.koharu.live`, create a CNAME record with host `www` pointing to the exact Netlify subdomain assigned to the site (for example, `your-site-name.netlify.app`). The exact target should be copied from the Netlify domain verification panel.
- For apex `koharu.live`, preferred external-DNS configuration is ALIAS, ANAME, or flattened CNAME at host `@` pointing to `apex-loadbalancer.netlify.com` when the DNS provider supports it.
- Fallback apex configuration is an A record at host `@` pointing to `75.2.60.5` when ALIAS/ANAME/flattened CNAME is unavailable.
- Assigning an apex or www domain causes Netlify to add both the apex and www domain, so configure both records.
- DNS propagation can take several hours and in some cases up to a full day. Netlify provisions HTTPS after DNS verification; do not add custom certificate records unless Netlify requests them.
- Netlify notes that `www` is recommended as the primary domain with external DNS because apex routing uses the load balancer.

## Newly verified links

Team Light 공식 사이트 `https://teamlight.pe.kr/`의 페이지 제목은 `Team Light - 디스코드를 밝고 선명하게`이며, 서버 보호·운영 자동화·명령어 정리 중심의 개발 팀으로 소개된다. 프로젝트 카드에는 이 공식 사이트 링크와 favicon을 사용한다.

`https://discord.gg/VYGqwWtK4f`는 Discord에서 `비공식 스텔라이브 팬서버 Discord 서버에 가입하세요!`라는 표시명을 확인했다. 프로젝트 카드에는 사용자가 제공한 서버명을 그대로 사용하고 초대 링크로 연결한다.

## Second-pass verification

개발 서버에서 `/projects.html`을 확인했고, 좌측 메뉴에는 프로필·스킬·프로젝트·파트너·블로그·연락처 아이콘이 표시되며 프로젝트 네 개가 렌더링된다. `/project/mirae-ai.html`은 내부 상세 페이지로 정상 진입하고, 프로젝트 목록으로 돌아가기와 Mirae AI 설명·태그·링크가 노출된다. Team Light 카드는 공식 favicon 이미지를 사용한다.

## Blog verification

`/admin/blog.html`에서는 로그인하지 않은 방문자에게 작성자 로그인 버튼과 소유자 전용 안내가 표시된다. `/blog.html`에서는 공개 게시글이 없을 때 빈 상태 문구와 작성자 전용 관리 링크가 표시되며, 게시글이 DB에 저장되면 목록 카드가 렌더링되는 구조다.
