"use client";

import { FormEvent, useState } from "react";

const prompts = ["What have I learned recently?","What research threads look unfinished?","Find connections between my knowledge.","What should I investigate next?","What research could become content?"];

export default function AIPage() {
  const [question,setQuestion]=useState(""); const [answer,setAnswer]=useState(""); const [loading,setLoading]=useState(false);
  async function ask(event?:FormEvent){ event?.preventDefault(); if(!question.trim()) return; setLoading(true); setAnswer(""); try { const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question})}); const d=await r.json(); setAnswer(d.answer||d.error||"No response."); } catch { setAnswer("NEXUM could not reach the AI service."); } finally { setLoading(false); } }
  return <main className="module-page"><header className="module-header"><div><p className="eyebrow">NEXUM INTELLIGENCE</p><h1>Ask your archive.</h1><p>Ask questions across your knowledge, projects, tasks, journal, and inbox.</p></div></header><section className="ai-workspace"><form onSubmit={ask} className="ai-form"><textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="What do you want NEXUM to find, explain, connect, or surface?" /><button className="primary-button" disabled={loading}>{loading?"Thinking...":"Ask NEXUM"}</button></form><div className="prompt-row">{prompts.map(p=><button key={p} type="button" onClick={()=>setQuestion(p)}>{p}</button>)}</div>{answer&&<article className="ai-answer"><span className="row-label">NEXUM INTELLIGENCE</span><div>{answer}</div></article>}</section></main>;
}