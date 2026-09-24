"use client";
import { useEffect,useState } from "react";
type Result={id:string;kind:string;title:string;score:number;preview:string};
const labels:{[k:string]:string}={knowledge:"Knowledge",research:"Research",library:"Library"};
export default function SearchPage(){
 const [q,setQ]=useState(""),[semantic,setSemantic]=useState(true),[results,setResults]=useState<Result[]>([]),[loading,setLoading]=useState(false);
 useEffect(()=>{const t=setTimeout(async()=>{if(!q.trim()){setResults([]);return}setLoading(true);try{const r=await fetch("/api/search?q="+encodeURIComponent(q)+(semantic?"&semantic=1":""));const d=await r.json();setResults(d.results||[])}finally{setLoading(false)}},300);return()=>clearTimeout(t)},[q,semantic]);
 return <main className="module-page"><header className="module-header"><div><p className="eyebrow">NEXUM SEARCH</p><h1>Search everything.</h1><p>Find stored information by exact wording or meaning.</p></div><span className="module-count">{q?results.length+" matches":"Semantic memory"}</span></header>
 <section className="search-box"><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search your archive…"/><label className="semantic-toggle"><input type="checkbox" checked={semantic} onChange={e=>setSemantic(e.target.checked)}/> Semantic search</label></section>
 {loading&&<div className="empty-state">Searching the archive…</div>}
 <section className="search-results">{results.map(r=><article className="search-result" key={r.kind+r.id}><div className="card-meta"><span>{labels[r.kind]||r.kind}</span>{semantic&&<span>{Math.round(r.score*100)}% similarity</span>}</div><h2>{r.title}</h2><p>{r.preview}</p></article>)}</section>
 {!loading&&q&&!results.length&&<div className="empty-state">No matching records yet. Try another concept or index more records.</div>}
 </main>
}