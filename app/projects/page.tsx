"use client";

import { useEffect, useState } from "react";

type Project={id:string;name:string;description:string;status:string;progress:number};

export default function ProjectsPage(){
 const [projects,setProjects]=useState<Project[]>([]);
 const [name,setName]=useState(""); const [description,setDescription]=useState("");
 useEffect(()=>{fetch("/api/projects").then(r=>r.json()).then(setProjects);},[]);
 async function add(){if(!name.trim())return;const p=await fetch("/api/projects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,description})}).then(r=>r.json());setProjects(v=>[p,...v]);setName("");setDescription("");}
 async function advance(p:Project){const progress=Math.min(100,p.progress+10);const status=progress===100?"completed":"active";const updated=await fetch("/api/projects",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:p.id,progress,status})}).then(r=>r.json());setProjects(v=>v.map(x=>x.id===updated.id?updated:x));}
 return <main className="module-page"><header className="module-header"><div><p className="eyebrow">Workspaces</p><h1>Projects</h1><p>Persistent workspaces for long-running research, content, business, and custom work.</p></div><span className="module-count">{projects.length} projects</span></header><section className="capture-form project-create"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Project name" /><input value={description} onChange={e=>setDescription(e.target.value)} placeholder="What is this project for?" /><button className="primary-button" onClick={add}>Create project</button></section><section className="project-grid">{projects.map(p=><article className="project-card" key={p.id}><div className="card-meta"><span>{p.status}</span><span>{p.progress}%</span></div><h2>{p.name}</h2><p>{p.description}</p><div className="progress-track"><span style={{width:p.progress+"%"}} /></div><button className="text-button project-action" onClick={()=>advance(p)}>{p.progress===100?"Complete":"Advance +10%"}</button></article>)}</section></main>;
}