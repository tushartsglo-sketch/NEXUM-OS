import { seedProjects } from "@/lib/domain";

export default function ProjectsPage() {
  return <main className="module-page">
    <header className="module-header"><div><p className="eyebrow">Workspaces</p><h1>Projects</h1><p>Keep research, content, business, and other long-running work connected.</p></div></header>
    <section className="project-grid">{seedProjects.map((project) => <article className="project-card" key={project.id}><div className="card-meta"><span>{project.status}</span><span>{project.progress}%</span></div><h2>{project.name}</h2><p>{project.description}</p><div className="progress-track"><span style={{ width: project.progress + "%" }} /></div></article>)}</section>
  </main>;
}