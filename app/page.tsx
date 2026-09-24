"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Task={id:string;title:string;time:string;duration:number;status:string;priority:string;project?:string|null;date:string};
type Knowledge={id:string;title:string;type:string;topic:string};
type Project={id:string;name:string;progress:number;status:string};
type Inbox={id:string;text:string;status:string};

const nav=[["Dashboard","/"],["Inbox","/inbox"],["Knowledge","/knowledge"],["Research","/research"],["Projects","/projects"],["Content","/content"],["Tasks","/tasks"],["Journal","/journal"],["Library","/library"],["Search","/search"],["AI","/ai"]];

export default function Home(){
 const [tasks,setTasks]=useState<Task[]>([]); const [knowledge,setKnowledge]=useState<Knowledge[]>([]); const [projects,setProjects]=useState<Project[]>([]); const [inbox,setInbox]=useState<Inbox[]>([]);
 useEffect(()=>{Promise.all([fetch("/api/db?type=tasks").then(r=>r.json()),fetch("/api/db?type=knowledge").then(r=>r.json()),fetch("/api/db?type=projects").then(r=>r.json()),fetch("/api/db?type=inbox").then(r=>r.json())]).then(([t,k,p,i])=>{setTasks(t);setKnowledge(k);setProjects(p);setInbox(i);});},[]);
 const today=useMemo(()=>tasks.filter(t=>t.date?.slice(0,10)==="2026-09-25"),[tasks]);
 return <main className="shell"><aside className="sidebar"><div className="brand">NEXUM</div><nav>{nav.map(([x,href],i)=><Link className={i===0?"nav active":"nav"} href={href} key={x}>{x}</Link>)}</nav><div className="sideFoot">PRIVATE WORKSPACE<br/><span>Personal archive</span></div></aside>
 <section className="content"><header className="top"><div><p className="eyebrow">FRIDAY · 25 SEPTEMBER 2026</p><h1>Good morning.</h1></div><div className="avatar">H</div></header>
 <section className="grid"><div className="panel"><div className="head"><div><p className="eyebrow">TODAY</p><h2>Schedule</h2></div><Link className="link" href="/tasks">View all</Link></div><div className="tasks">{today.map(t=><div className={t.status==="done"?"task done":"task"} key={t.id}><time>{t.time}</time><div><strong>{t.title}</strong><span>{t.duration} min · {t.priority}{t.project?" · "+t.project:""}</span></div><span className="status-dot">{t.status==="done"?"✓":"○"}</span></div>)}{!today.length&&<div className="empty-state">No tasks scheduled for today.</div>}</div></div>
 <div className="panel"><div className="head"><div><p className="eyebrow">KNOWLEDGE</p><h2>Your archive</h2></div><Link className="link" href="/knowledge">Open library</Link></div><div className="stats"><div className="stat"><b>{knowledge.length}</b><span>Knowledge</span></div><div className="stat"><b>{inbox.length}</b><span>Inbox</span></div><div className="stat"><b>{projects.length}</b><span>Projects</span></div><div className="stat"><b>{tasks.filter(t=>t.status==="done").length}</b><span>Completed</span></div></div></div></section>
 <section className="grid lower"><div className="panel capture"><p className="eyebrow">QUICK CAPTURE</p><h2>Put it in NEXUM.</h2><p>{inbox.length ? "You have "+inbox.length+" items waiting to be organized." : "Save a thought, source, link, question, or idea before you lose it."}</p><Link className="primary" href="/inbox">Open inbox</Link></div><div className="panel"><p className="eyebrow">PROJECTS</p><h2>Current work</h2>{projects.slice(0,3).map(p=><div className="thread" key={p.id}><b>{String(p.progress).padStart(2,"0")}</b><div><strong>{p.name}</strong><p>{p.progress}% complete · {p.status}</p></div></div>)}{!projects.length&&<div className="empty-state">No projects yet.</div>}</div></section>
 </section></main>;
}