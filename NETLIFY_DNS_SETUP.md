# koharu.live Netlify 연결 안내

이 문서는 `koharu.live`를 Netlify 사이트에 연결하고 `www.koharu.live`에서도 접속할 수 있게 만드는 절차입니다. 도메인 연결 전에는 Netlify에 사이트를 먼저 배포해야 하며, Netlify가 생성한 사이트 주소를 아래 CNAME 값에 반영해야 합니다.

> **블로그 기능 호스팅 주의:** Netlify 배포는 `pnpm run build:netlify`로 생성한 Vite 정적 화면만 제공합니다. 관리자 로그인·이미지 업로드·블로그 저장 API는 Express/tRPC/DB/저장소를 실행하는 풀스택 호스팅이 필요하므로 Netlify 정적 배포만으로는 동작하지 않습니다. 블로그까지 운영하려면 Manus 풀스택 호스팅을 사용하거나, 별도 API 서버와 CORS·쿠키 도메인 설정을 추가해야 합니다.

## 1. Netlify에서 도메인 추가

Netlify 대시보드에서 배포된 사이트를 열고 **Domain management → Production domains → Add a domain**으로 이동합니다. `koharu.live`를 추가한 뒤, Netlify가 보여주는 **Pending DNS verification** 화면에서 사이트의 기본 Netlify 주소를 확인합니다. Netlify는 apex 도메인과 `www` 도메인을 함께 관리하므로 두 레코드를 모두 설정합니다.

## 2. 외부 DNS 제공업체에서 입력할 레코드

| 목적 | 타입 | 호스트/이름 | 값 | TTL |
|---|---|---|---|---|
| 기본 도메인 | ALIAS 또는 ANAME (지원하는 경우) | `@` 또는 빈 값 | `apex-loadbalancer.netlify.com` | 자동 또는 3600 |
| 기본 도메인 대체값 | A (ALIAS/ANAME 미지원 시) | `@` 또는 빈 값 | `75.2.60.5` | 자동 또는 3600 |
| www 접속 | CNAME | `www` | Netlify에서 발급된 정확한 사이트 주소, 예: `your-site-name.netlify.app` | 자동 또는 3600 |

일반적인 DNS 제공업체가 ALIAS/ANAME을 지원하지 않는 경우에는 `@`에 A 레코드 `75.2.60.5`를 사용합니다. `www`의 CNAME 값은 이 문서의 예시를 그대로 쓰지 말고, Netlify의 **Pending DNS verification** 화면에 표시된 실제 사이트 주소로 교체해야 합니다.

기존에 같은 호스트(`@`, `www`)에 연결된 A, AAAA, CNAME 레코드가 있으면 충돌할 수 있으므로 중복 레코드를 정리한 뒤 저장합니다. 이메일을 도메인으로 사용 중이라면 MX, SPF, DKIM 관련 레코드는 삭제하지 않습니다.

## 3. Netlify에서 확인

DNS 변경 후 Netlify의 도메인 화면에서 **Check DNS configuration** 또는 DNS 확인 버튼을 누릅니다. 전 세계 DNS 반영에는 수 시간, 경우에 따라 최대 24시간이 걸릴 수 있습니다. DNS 검증이 끝나면 Netlify의 무료 HTTPS 인증서 발급을 기다리고, **HTTPS**가 활성화된 뒤 `https://koharu.live`와 `https://www.koharu.live`를 각각 확인합니다.

## 4. 권장 기본 도메인

두 주소가 모두 연결되면 Netlify의 Domain management에서 원하는 기본 도메인을 지정합니다. 외부 DNS를 사용할 때는 `www.koharu.live`를 기본 도메인으로 사용하고 `koharu.live`에서 리디렉션하도록 설정하는 방식도 안정적입니다. 최종 도메인 선택은 Netlify 화면에 표시되는 DNS 상태와 인증서 상태를 기준으로 결정합니다.

## 주의사항

DNS 제공업체마다 `@` 입력 방식과 ALIAS/ANAME 지원 여부가 다릅니다. Netlify의 도메인 검증 화면에 표시되는 맞춤 안내가 이 문서보다 우선합니다. High-Performance Edge를 별도로 사용하는 사이트라면 Netlify가 제공하는 전용 load balancer 값이 일반 값보다 우선합니다.

## References

[1]: https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/ "Netlify Docs — Configure external DNS for a custom domain"

Netlify 공식 문서의 외부 DNS 안내에 따르면 apex 도메인은 ALIAS/ANAME/flattened CNAME이 가능할 때 `apex-loadbalancer.netlify.com`을 사용하고, 해당 기능이 없으면 A 레코드 `75.2.60.5`를 사용할 수 있습니다. `www` 같은 서브도메인은 사이트의 정확한 `netlify.app` 주소를 가리키는 CNAME을 사용합니다. [1]


## 이미지·블로그 API 운영 주의

프로필·배경·Team Light 정적 이미지는 `client/public/assets`에서 직접 제공됩니다. 블로그 업로드 이미지는 풀스택 API 서버의 저장소에서 제공되므로, 별도 API 도메인을 운영할 때 서버에 `PUBLIC_STORAGE_BASE_URL`을 설정하고 Netlify에는 동일 API의 tRPC 주소를 `VITE_API_BASE_URL`로 설정해야 합니다. 이 값을 설정하지 않은 정적 Netlify 사이트에서는 관리자 로그인과 업로드·수정·삭제가 unavailable 상태로 안내됩니다.

Netlify가 자동으로 붙이는 `Powered by Netlify` 배지는 코드가 아니라 사이트의 Deploy badge 설정에서 관리될 수 있습니다. Netlify 사이트 설정의 Deploy badges 항목을 비활성화하고 재배포하세요. 앱 CSS에도 가능한 배지 선택자를 숨기는 규칙을 포함했습니다.
