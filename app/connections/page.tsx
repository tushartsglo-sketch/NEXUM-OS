"use client";
import { useEffect, useMemo, useState } from "react";

type Entity={id:string;title:string;name?:string;type:string};
type LinkRow={id:string;fromType:string;fromId:string;toType:string;toId:string;relation:string};

const types=["knowledge","research","library","content","project"];
const relations=["relates to","supports","contradicts","extends","derived from","cites","inspired","informs","produces","belongs to"];

function label(type:string){return type[0].toUpperCase()+type.slice(1)}
function entityName(e:Entity){return e.title||e.name||e.id}

export default function ConnectionsPage(){
 const [entities,setEntities]=useState<Record<string,Entity[]>>({});
 const [links,setLinks]=useState<LinkRow[]>([]);
 const [fromType,setFromType]=useState("knowledge"),[fromId,setFromId]=useState("");
 const [toType,setToType]=useState("research"),[toId,setToId]=useState("");
 const [relation,setRelation]=useState("relates to"),[message,setMessage]=useState("");
 useEffect(()=>{
  Promise.all([
   fetch("/api/db?type=knowledge").then(r=>r.json()),
   fetch("/api/research").then(r=>r.json()),
   fetch("/api/library").then(r=>r.json()),
   fetch("/api/content").then(r=>r.json()),
   fetch("/api/projects").then(r=>r.json()),
   fetch("/api/links").then(r=>r.json())
  ]).then(([k,r,l,c,p,ls])=>{
   setEntities({
    knowledge:k.map((x:any)=>({...x,type:"knowledge"})),
    research:r.map((x:any)=>({id:x.id,title:x.title,type:"research"})),
    library:l.map((x:any)=>({id:x.id,title:x.name,type:"library"})),
    content:c.map((x:any)=>({id:x.id,title:x.title,type:"content"})),
    project:p.map((x:any)=>({id:x.id,title:x.name,type:"project"}))
   }); setLinks(ls);
  });
 },[]);
 const fromOptions=entities[fromType]||[],toOptions=entities[toType]||[];
 const names=useMemo(()=>Object.fromEntries(types.flatMap(t=>(entities[t]||[]).map(e=>[t+":"+e.id,entityName(e)]))),[entities]);
 async function connect(){
  if(!fromId||!toId||fromType===toType&&fromId===toId)return;
  const r=await fetch("/api/links",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fromType,fromId,toType,toId,relation})});
  if(!r.ok){setMessage("Could not create connection.");return}
  const row=await r.json(); setLinks(v=>[row,...v.filter(x=>x.id!==row.id)]); setMessage("Connection saved.");
 }
 async function remove(row:LinkRow){
  await fetch("/api/links",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify(row)});
  setLinks(v=>v.filter(x=>x.id!==row.id));
 }
 return <main className="module-page"><header className="module-header"><div><p className="eyebrow">KNOWLEDGE GRAPH</p><h1>Connections</h1><p>Connect knowledge, research, sources, content, and projects so NEXUM can reason across your work.</p></div><span className="module-count">{links.length} connections</span></header>
 <section className="connection-form"><div><label>From</label><select value={fromType} onChange={e=>{setFromType(e.target.value);setFromId("")}}>{types.map(t=><option key={t} value={t}>{label(t)}</option>)}</select><select value={fromId} onChange={e=>setFromId(e.target.value)}><option value="">Select source…</option>{fromOptions.map(e=><option key={e.id} value={e.id}>{entityName(e)}</option>)}</select></div>
 <div><label>Relationship</label><select value={relation} onChange={e=>setRelation(e.target.value)}>{relations.map(x=><option key={x}>{x}</option>)}</select></div>
 <div><label>To</label><select value={toType} onChange={e=>{setToType(e.target.value);setToId("")}}>{types.map(t=><option key={t} value={t}>{label(t)}</option>)}</select><select value={toId} onChange={e=>setToId(e.target.value)}><option value="">Select target…</option>{toOptions.map(e=><option key={e.id} value={e.id}>{entityName(e)}</option>)}</select></div>
 <button className="primary-button" onClick={connect}>Create connection</button>{message&&<small>{message}</small>}</section>
 <section className="connection-list">{links.map(row=><article className="connection-row" key={row.id}><div><span>{label(row.fromType)}</span><b>{names[row.fromType+":"+row.fromId]||row.fromId}</b></div><strong>{row.relation}</strong><div><span>{label(row.toType)}</span><b>{names[row.toType+":"+row.toId]||row.toId}</b></div><button className="text-button" onClick={()=>remove(row)}>Remove</button></article>)}{!links.length&&<div className="empty-state">No connections yet. Start linking research to knowledge, sources to research, and content to the ideas behind it.</div>}</section>
 </main>
}