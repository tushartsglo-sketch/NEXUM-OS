"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Task={id:string;title:string;time:string;duration:number;status:string;priority:string;project?:string|null;date:string};
type Knowledge={id:string;title:string;type:string;topic:string};
type Project={id:string;name:string;progress:number;status:string};
type Inbox={id:string;text:string;status:string};
type Suggestion={kind:string;priority:"high"|"medium"|"low";title:string;reason:string;action:string;entityType?:string;entityId?:string};

const nav=[["Dashboard","/"],["Inbox","/inbox"],["Knowledge","/knowledge"],["Research","/research"],["Connections","/connections"],["Projects","/projects"],["Content","/content"],["Tasks","/tasks"],["Journal","/journal"],["Library","/library"],["Search","/search"],["Insights","/insights"],["AI","/ai"]];

export default function Home(){
 const [tasks,setTasks]=useState<Task[]>([]),[knowledge,setKnowledge]=useState<Knowledge[]>([]),[projects,setProjects]=useState<Project[]>([]),[inbox,setInbox]=useState<Inbox[]>([]),[automation,setAutomation]=useState<Suggestion[]>([]);
 useEffect(()=>{Promise.all([fetch("/api/db?type=tasks").then(r=>r.json()),fetch("/api/db?type=knowledge").then(r=>r.json()),fetch("/api/db?type=projects").then(r=>r.json()),fetch("/api/db?type=inbox").then(r=>r.json()),fetch("/api/automation").then(r=>r.json())]).then(([t,k,p,i,a])=>{setTasks(t);setKnowledge(k);setProjects(p);setInbox(i);setAutomation(a.suggestions||[]);});},[]);
 const todayKey=new Date().toISOString().slice(0,10); const today=useMemo(()=>tasks.filter(t=>t.date?.slice(0,10)===todayKey),[tasks,todayKey]);
 const now=new Date(),hour=now.getHours(),greeting=hour<12?"Good morning.":hour<18?"Good afternoon.":"Good evening.";
 const dateLabel=new Intl.DateTimeFormat("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(now).toUpperCase();
 return <main className="shell"><aside className="sidebar"><div className="brand">NEXUM</div><nav>{nav.map(([x,href],i)=><Link className={i===0?"nav active":"nav"} href={href} key={x}>{x}</Link>)}</nav><div className="sideFoot">PRIVATE WORKSPACE<br/><span>Personal archive</span></div></aside>
 <section className="content"><header className="top"><div><p className="eyebrow">{dateLabel}</p><h1>{greeting}</h1></div><div className="avatar">H</div></header>
 <section className="grid"><div className="panel"><div className="head"><div><p className="eyebrow">TODAY</p><h2>Schedule</h2></div><Link className="link" href="/tasks">View all</Link></div><div className="tasks">{today.map(t=><div className={t.status==="done"?"task done":"task"} key={t.id}><time>{t.time}</time><div><strong>{t.title}</strong><span>{t.duration} min · {t.priority}{t.project?" · "+t.project:""}</span></div><span className="status-dot">{t.status==="done"?"✓":"○"}</span></div>)}{!today.length&&<div className="empty-state">No tasks scheduled for today.</div>}</div></div>
 <div className="panel"><div className="head"><div><p className="eyebrow">SYSTEM PULSE</p><h2>What needs attention</h2></div><Link className="link" href="/insights">Open insights</Link></div>{automation.slice(0,4).map(x=><div className="insight-row" key={x.kind+x.entityId}><strong>{x.title}</strong><span>{x.priority}</span></div>)}{!automation.length&&<div className="empty-state">No stale or overdue signals.</div>}</div></section>
 <section className="grid lower"><div className="panel capture"><p className="eyebrow">QUICK CAPTURE</p><h2>Put it in NEXUM.</h2><p>{inbox.length?"You have "+inbox.length+" items waiting to be organized.":"Save a thought, source, link, question, or idea before you lose it."}</p><Link className="primary" href="/inbox">Open inbox</Link></div><div className="panel"><p className="eyebrow">ACTIVE WORK</p><h2>Current projects</h2>{projects.slice(0,3).map(p=><div className="thread" key={p.id}><b>{String(p.progress).padStart(2,"0")}</b><div><strong>{p.name}</strong><p>{p.progress}% complete · {p.status}</p></div></div>)}{!projects.length&&<div className="empty-state">No projects yet.</div>}</div></section>
 <section className="grid lower"><div className="panel"><div className="head"><div><p className="eyebrow">KNOWLEDGE</p><h2>Recent archive</h2></div><Link className="link" href="/knowledge">Open library</Link></div>{knowledge.slice(0,5).map(k=><div className="insight-row" key={k.id}><strong>{k.title}</strong><span>{k.topic}</span></div>)}{!knowledge.length&&<div className="empty-state">Your archive is empty.</div>}</div><div className="panel"><p className="eyebrow">EXECUTION</p><h2>{tasks.filter(t=>t.status==="done").length} completed tasks</h2><p className="muted">{tasks.filter(t=>t.status!=="done").length} tasks remain open across your schedule.</p><Link className="link" href="/tasks">Open execution engine</Link></div></section>
 </section></main>;
}