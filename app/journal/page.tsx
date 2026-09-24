"use client";

import { useEffect, useState } from "react";

type Fields={did:string;learned:string;mistakes:string;next:string};
type Entry=Fields & {id:string;date:string};

export default function JournalPage(){
 const [fields,setFields]=useState<Fields>({did:"",learned:"",mistakes:"",next:""}); const [saved,setSaved]=useState(false); const [history,setHistory]=useState<Entry[]>([]);
 useEffect(()=>{fetch("/api/journal").then(r=>r.json()).then(setHistory);},[]);
 function update(key:keyof Fields,value:string){setFields(v=>({...v,[key]:value}));}
 async function save(){const date=new Date().toISOString().slice(0,10);const entry=await fetch("/api/journal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...fields,date})}).then(r=>r.json());setHistory(v=>[entry,...v.filter(x=>x.id!==entry.id)]);setSaved(true);}
 return <main className="module-page"><header className="module-header"><div><p className="eyebrow">Reflection</p><h1>Daily Journal</h1><p>Build a durable record of what happened, what changed, and what comes next.</p></div></header><section className="journal-grid"><label>What I did<textarea value={fields.did} onChange={e=>update("did",e.target.value)} placeholder="Work, research, training, conversations..." /></label><label>What I learned<textarea value={fields.learned} onChange={e=>update("learned",e.target.value)} placeholder="New knowledge or changed understanding..." /></label><label>Mistakes<textarea value={fields.mistakes} onChange={e=>update("mistakes",e.target.value)} placeholder="What went wrong or could be improved?" /></label><label>Next<textarea value={fields.next} onChange={e=>update("next",e.target.value)} placeholder="What should happen next?" /></label></section><button className="primary-button" onClick={save}>{saved?"Saved to NEXUM":"Save today's entry"}</button>{history.length>0&&<section className="history"><p className="eyebrow">RECENT ENTRIES</p>{history.slice(0,5).map(e=><article className="list-row" key={e.id}><div><strong>{e.date.slice(0,10)}</strong><p>{e.learned||e.did||"No summary yet."}</p></div></article>)}</section>}</main>;
}