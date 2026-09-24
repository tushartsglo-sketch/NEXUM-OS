"use client";

import { FormEvent, useEffect, useState } from "react";

export default function InboxPage() {
  const [value,setValue]=useState(""); const [items,setItems]=useState<{id:string;text:string;status:string}[]>([]);
  useEffect(()=>{fetch("/api/db?type=inbox").then(r=>r.json()).then(setItems);},[]);
  async function capture(e:FormEvent){e.preventDefault();const text=value.trim();if(!text)return;const item=await fetch("/api/db",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"inbox",text})}).then(r=>r.json());setItems(v=>[item,...v]);setValue("");}
  async function organize(id:string){const item=await fetch("/api/db",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"inbox",id,status:"processed"})}).then(r=>r.json());setItems(v=>v.map(x=>x.id===item.id?item:x));}
  return <main className="module-page"><header className="module-header"><div><p className="eyebrow">Capture</p><h1>Inbox</h1><p>Capture first. Organize when you have context.</p></div><span className="module-count">{items.length} items</span></header><form className="capture-form" onSubmit={capture}><textarea value={value} onChange={e=>setValue(e.target.value)} placeholder="Idea, question, URL, observation, task..." /><button className="primary-button">Capture</button></form><section className="list-stack">{items.map(item=><article className="list-row" key={item.id}><div><span className="row-label">{item.status.toUpperCase()}</span><p>{item.text}</p></div><button className="text-button" type="button" onClick={()=>organize(item.id)}>Organize</button></article>)}</section></main>;
}