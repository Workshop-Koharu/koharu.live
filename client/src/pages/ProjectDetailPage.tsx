import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useParams } from "wouter";
import PageShell from "@/components/PageShell";
import { projects } from "@/lib/projects";

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    return <PageShell active="/projects.html" eyebrow="Project" title="프로젝트를 찾을 수 없어요." description="요청한 프로젝트 페이지가 없습니다."><a className="back-link" href="/projects.html">프로젝트 목록으로 돌아가기</a></PageShell>;
  }

  return (
    <PageShell active="/projects.html" eyebrow={`${project.number} · ${project.type}`} title={project.name} description={project.description}>
      <article className="detail-card section-card entrance delay-1">
        <div className="section-kicker">about this work</div>
        <h2>{project.name}</h2>
        <p>{project.details}</p>
        <div className="detail-meta">{project.tags.map((tag) => <span className="meta-pill" key={tag}>{tag}</span>)}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "21px" }}>
          <a className="email-action" href="/projects.html"><ArrowLeft size={14} /> 프로젝트 목록</a>
          {project.external && project.href && (
            <a className="email-action" href={project.href} target="_blank" rel="noreferrer">공식 링크 열기 <ArrowUpRight size={14} /></a>
          )}
        </div>
      </article>
    </PageShell>
  );
}
