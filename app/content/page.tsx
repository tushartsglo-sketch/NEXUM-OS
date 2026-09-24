"use client";
import { useEffect, useState } from "react";

type Item={id:string;title:string;format:string;stage:string;body:string;sourceIdea:string;researchId?:string|null};
const stages=["idea","draft","production","published"];

export default function ContentPage(){
 const [items,setItems]=useState<Item[]>([]),[title,setTitle]=useState(""),[format,setFormat]=useState("carousel"),[sourceIdea,setSourceIdea]=useState("");
 useEffect(()=>{fetch("/api/content").then(r=>r.json()).then(setItems)},[]);
 async function create(){if(!title.trim())return;const response=await fetch("/api/content",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,format,sourceIdea})});const x=await response.json();if(!response.ok)throw new Error(x.error||"Unable to add content.");setItems(v=>[x,...v]);setTitle("");setSourceIdea("")}
 async function advance(x:Item){const i=Math.min(stages.indexOf(x.stage)+1,stages.length-1);const y=await fetch("/api/content",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({...x,stage:stages[i]})}).then(r=>r.json());setItems(v=>v.map(a=>a.id===y.id?y:a))}
 return <main className="module-page"><header className="module-header"><div><p className="eyebrow">CONTENT SYSTEM</p><h1>Content</h1><p>Turn research and ideas into drafts, production work, and published pieces.</p></div><span className="module-count">{items.length} pieces</span></header>
 <section className="capture-form project-create"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Content idea or title"/><select value={format} onChange={e=>setFormat(e.target.value)}><option>carousel</option><option>video</option><option>article</option><option>post</option><option>newsletter</option></select><input value={sourceIdea} onChange={e=>setSourceIdea(e.target.value)} placeholder="Source insight or research thread"/><button className="primary-button" onClick={create}>Add to pipeline</button></section>
 <section className="content-board">{stages.map(stage=><div className="content-column" key={stage}><div className="card-meta"><span>{stage}</span><span>{items.filter(x=>x.stage===stage).length}</span></div>{items.filter(x=>x.stage===stage).map(x=><article className="content-card" key={x.id}><h2>{x.title}</h2><p>{x.format} {x.sourceIdea?"· "+x.sourceIdea:""}</p><button className="text-button" onClick={()=>advance(x)}>{stage==="published"?"Published":"Move forward"}</button></article>)}</div>)}</section></main>
}