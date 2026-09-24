"use client";

import { useEffect, useState } from "react";

type Source={id:string;title:string;url:string;notes:string};
type Research={id:string;title:string;question:string;status:string;notes:string;insights:string;sources:Source[]};

const statuses=["idea","researching","analyzing","ready","archived"];

export default function ResearchPage(){
 const [items,setItems]=useState<Research[]>([]); const [title,setTitle]=useState(""); const [question,setQuestion]=useState("");
 useEffect(()=>{fetch("/api/research").then(r=>r.json()).then(setItems);},[]);
 async function create(){if(!title.trim())return;const item=await fetch("/api/research",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,question})}).then(r=>r.json());setItems(v=>[item,...v]);setTitle("");setQuestion("");}
 async function advance(item:Research){const next=statuses[Math.min(statuses.indexOf(item.status)+1,statuses.length-1)];const updated=await fetch("/api/research",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:item.id,status:next,notes:item.notes,insights:item.insights})}).then(r=>r.json());setItems(v=>v.map(x=>x.id===updated.id?updated:x));}
 return <main className="module-page"><header className="module-header"><div><p className="eyebrow">RESEARCH WORKSPACE</p><h1>Research</h1><p>Move a question from idea to evidence, insight, and publishable opportunity.</p></div><span className="module-count">{items.length} threads</span></header>
 <section className="capture-form project-create"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Research title" /><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Research question" /><button className="primary-button" onClick={create}>Start research</button></section>
 <section className="research-list">{items.map(item=><article className="research-card" key={item.id}><div className="card-meta"><span>{item.status}</span><span>{item.sources.length} sources</span></div><h2>{item.title}</h2><p className="research-question">{item.question||"No research question defined."}</p><div className="research-flow">{statuses.map(s=><span className={s===item.status?"active":""} key={s}>{s}</span>)}</div><div className="research-sections"><div><b>Notes</b><p>{item.notes||"Evidence and notes will live here."}</p></div><div><b>Insights</b><p>{item.insights||"Key conclusions will live here."}</p></div></div><button className="text-button" onClick={()=>advance(item)}>{item.status==="archived"?"Archived":"Move to "+statuses[Math.min(statuses.indexOf(item.status)+1,statuses.length-1)]}</button></article>)}</section></main>;
}