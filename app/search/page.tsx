"use client";
import { useEffect,useMemo,useState } from "react";
type Row={id:string;title?:string;name?:string;text?:string;description?:string;content?:string;question?:string};
type Results=Record<string,Row[]>;
const labels:{[k:string]:string}={knowledge:"Knowledge",research:"Research",library:"Library",content:"Content",projects:"Projects",tasks:"Tasks",journal:"Journal",inbox:"Inbox"};
export default function SearchPage(){
 const [q,setQ]=useState(""),[results,setResults]=useState<Results>({}),[loading,setLoading]=useState(false);
 useEffect(()=>{const t=setTimeout(async()=>{if(!q.trim()){setResults({});return}setLoading(true);const r=await fetch("/api/search?q="+encodeURIComponent(q));setResults(await r.json());setLoading(false)},250);return()=>clearTimeout(t)},[q]);
 const total=useMemo(()=>Object.values(results).reduce((n,a)=>n+a.length,0),[results]);
 return <main className="module-page"><header className="module-header"><div><p className="eyebrow">NEXUM SEARCH</p><h1>Search everything.</h1><p>Search across your knowledge, research, library, content, work, tasks, journal, and inbox.</p></div><span className="module-count">{q?total+" results":"Unified search"}</span></header>
 <section className="search-box"><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search anything in NEXUM…"/></section>
 {!q&&<div className="empty-state search-empty">Try a concept, person, topic, project, mistake, source, or idea.</div>}
 {loading&&<div className="empty-state">Searching…</div>}
 <section className="search-results">{Object.entries(labels).map(([key,label])=>results[key]?.length?<section className="search-group" key={key}><div className="card-meta"><span>{label}</span><span>{results[key].length}</span></div>{results[key].map(r=><article className="search-result" key={r.id}><h2>{r.title||r.name||r.text}</h2><p>{r.description||r.question||r.content||r.text||""}</p></article>)}</section>:null)}</section>
 {q&&!loading&&!total&&<div className="empty-state">No matching records yet.</div>}
 </main>
}