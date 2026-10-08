import PageShell from "@/components/PageShell";

const skills = [
  { name: "Unity / C#", icon: "C#", level: 82, copy: "게임플레이와 시스템 구현" },
  { name: "JavaScript", icon: "JS", level: 76, copy: "인터랙션과 웹 경험" },
  { name: "TypeScript", icon: "TS", level: 70, copy: "안전한 서비스 구조" },
  { name: "Git & Tools", icon: "G", level: 86, copy: "협업과 작업 흐름" },
];

export default function SkillsPage() {
  return (
    <PageShell active="/skills.html" eyebrow="Skills" title="스킬" description="만드는 데 필요한 도구를 익히고, 더 나은 흐름을 찾아가는 중입니다.">
      <section className="skill-stack entrance delay-1" aria-label="! Koharu 스킬 목록">
        {skills.map((skill) => (
          <article className="skill-row" key={skill.name}>
            <div className="skill-label"><span className="skill-icon">{skill.icon}</span><span>{skill.name}</span></div>
            <div className="skill-track" aria-label={`${skill.name} 숙련도 ${skill.level}%`}><div className="skill-fill" style={{ width: `${skill.level}%` }} /></div>
            <span className="section-note">{skill.copy}</span>
          </article>
        ))}
      </section>
      <section className="detail-card section-card entrance delay-2" style={{ marginTop: "12px" }}>
        <div className="section-kicker">how I work</div>
        <h2>기능보다 먼저, 플레이 흐름을 생각해요.</h2>
        <p>작동하는 코드만큼 중요한 것은 사람이 자연스럽게 다음 행동을 고를 수 있는 흐름이라고 생각합니다. 그래서 작은 프로토타입을 빠르게 만들고, 직접 사용해보며 다듬습니다.</p>
      </section>
    </PageShell>
  );
}
