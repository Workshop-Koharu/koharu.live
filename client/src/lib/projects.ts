export type Project = {
  slug: string;
  number: string;
  name: string;
  type: string;
  description: string;
  details: string;
  tags: string[];
  href?: string;
  external?: boolean;
  icon?: string;
  iconClass?: string;
};

export const projects: Project[] = [
  {
    slug: "team-light",
    number: "01",
    name: "Team Light",
    type: "Discord development team",
    description: "디스코드를 밝고 선명하게 만드는 개발 팀.",
    details: "Team Light는 더 안전하고 편리한 디스코드 환경을 만들기 위해 서버 보호, 운영 자동화, 커뮤니티 관리 기능을 직접 기획하고 개발하는 팀입니다.",
    tags: ["Discord", "Automation", "Community"],
    href: "https://teamlight.pe.kr/",
    external: true,
    icon: "/assets/team-light-logo.png",
    iconClass: "is-logo",
  },
  {
    slug: "mirae-ai",
    number: "02",
    name: "학습형 AI · Mirae AI",
    type: "Learning AI model",
    description: "대화와 피드백을 바탕으로 성장하는 생성형 AI 모델.",
    details: "Mirae AI는 단순히 답을 내는 데서 그치지 않고, 사용자의 질문과 피드백을 바탕으로 더 나은 답변 흐름을 학습하도록 설계한 모델 프로젝트입니다.",
    tags: ["AI", "Learning", "Model"],
    href: "/project/mirae-ai.html",
  },
  {
    slug: "enroll-lang",
    number: "03",
    name: "Enroll-Lang",
    type: "Custom esolang interpreter",
    description: "수강신청 시스템의 제어 흐름을 모티브로 한 난해한 언어.",
    details: "🎓 Enroll-Lang (수강신청랭) — 대학 수강신청 시스템의 제어 흐름을 모티브로 한 커스텀 Esolang 인터프리터입니다. 라이브러리 확장을 지원합니다.",
    tags: ["Esolang", "Interpreter", "Library"],
    href: "/project/enroll-lang.html",
  },
  {
    slug: "stellive-fan-server",
    number: "04",
    name: "비공식 스텔라이브 팬서버",
    type: "Discord community · 6,000+",
    description: "6,000명대 규모의 비공식 스텔라이브 팬 커뮤니티.",
    details: "팬들이 함께 이야기를 나누고 콘텐츠를 즐기는 비공식 스텔라이브 팬서버입니다. 서버 참여는 Discord 초대 링크를 통해 진행됩니다.",
    tags: ["Discord", "Community", "6,000+"],
    href: "https://discord.gg/VYGqwWtK4f",
    external: true,
    icon: "/assets/stellive-logo.png",
    iconClass: "is-logo",
  },
];
