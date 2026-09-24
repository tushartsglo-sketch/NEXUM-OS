"use client";

import { useEffect, useMemo, useState } from "react";
import { KnowledgeType } from "@/lib/domain";

type Entry={id:string;title:string;type:KnowledgeType;topic:string;tags:string;content:string};
export default function KnowledgePage(){
 const [entries,setEntries]=useState<Entry[]>([]); const [query,setQuery]=useState(""); const [type,setType]=useState<"all"|KnowledgeType>("all");
 useEffect(()=>{fetch("/api/db?type=knowledge").then(r=>r.json()).then(setEntries);},[]);
 const filtered=useMemo(()=>entries.filter(e=>{const okType=type==="all"||e.type===type;return okType&&[e.title,e.topic,e.content,e.tags].join(" ").toLowerCase().includes(query.toLowerCase());}),[entries,query,type]);
 return <main className="module-page"><header className="module-header"><div><p className="eyebrow">Archive</p><h1>Knowledge</h1><p>Your persistent notes, sources, ideas, insights, and questions.</p></div><span className="module-count">{entries.length} entries</span></header><div className="toolbar"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search knowledge..." /><select value={type} onChange={e=>setType(e.target.value as "all"|KnowledgeType)}><option value="all">All types</option><option value="note">Notes</option><option value="source">Sources</option><option value="idea">Ideas</option><option value="insight">Insights</option><option value="question">Questions</option></select></div><section className="knowledge-grid">{filtered.map(e=><article className="knowledge-card" key={e.id}><div className="card-meta"><span>{e.type}</span><span>{e.topic}</span></div><h2>{e.title}</h2><p>{e.content}</p><div className="tag-row">{e.tags.split(",").filter(Boolean).map(t=><span key={t}>{t}</span>)}</div></article>)}</section></main>;
}