"use client";
import {useState} from "react";
const tasks=[["08:00","Review today's priorities","20 min"],["11:30","Research consumer psychology","60 min"],["16:00","Develop content ideas","90 min"],["20:00","Daily review","20 min"]];
const library=[["342","Research"],["521","Sources"],["187","Ideas"],["164","Documents"]];
export default function Home(){
 const [done,setDone]=useState<number[]>([]);
 const [notice,setNotice]=useState("");
 const toggle=(i:number)=>setDone(v=>v.includes(i)?v.filter(x=>x!==i):[...v,i]);
 return <main className="shell">
  <aside className="sidebar"><div className="brand">NEXUM</div><nav>{["Dashboard","Inbox","Knowledge","Research","Projects","Tasks","Journal","Content","Library","Search","AI"].map((x,i)=><button className={i===0?"nav active":"nav"} key={x} onClick={()=>setNotice(x+" module is part of the NEXUM roadmap.")}>{x}</button>)}</nav><div className="sideFoot">PRIVATE WORKSPACE<br/><span>Personal archive</span></div></aside>
  <section className="content"><header className="top"><div><p className="eyebrow">FRIDAY · 25 SEPTEMBER 2026</p><h1>Good morning.</h1></div><button className="avatar">H</button></header>
  {notice&&<button className="notice" onClick={()=>setNotice("")}>{notice} ×</button>}
  <section className="grid"><div className="panel"><div className="head"><div><p className="eyebrow">TODAY</p><h2>Schedule</h2></div><button className="link" onClick={()=>setNotice("Full calendar and recurring task views are planned.")}>View all</button></div><div className="tasks">{tasks.map((t,i)=><div className={done.includes(i)?"task done":"task"} key={t[0]}><time>{t[0]}</time><div><strong>{t[1]}</strong><span>{t[2]}</span></div><button className="check" onClick={()=>toggle(i)}>{done.includes(i)?"✓":""}</button></div>)}</div></div>
  <div className="panel"><div className="head"><div><p className="eyebrow">KNOWLEDGE</p><h2>Your archive</h2></div><button className="link" onClick={()=>setNotice("Knowledge will connect notes, topics, sources, insights, and documents.")}>Open library</button></div><div className="stats">{library.map(x=><div className="stat" key={x[1]}><b>{x[0]}</b><span>{x[1]}</span></div>)}</div><div className="continue"><em>CONTINUE</em><strong>Consumer Psychology</strong><p>7 connected notes</p></div></div></section>
  <section className="grid lower"><div className="panel capture"><p className="eyebrow">QUICK CAPTURE</p><h2>Put it in NEXUM.</h2><p>Save a thought, source, link, question, or idea before you lose it.</p><button className="primary" onClick={()=>setNotice("Inbox is the fast-capture surface for notes, links, ideas, and sources.")}>Open inbox</button></div><div className="panel"><p className="eyebrow">RECENT</p><h2>Research threads</h2><div className="thread"><b>01</b><div><strong>Behavioral economics</strong><p>12 notes · 4 sources · 2 open questions</p></div></div><div className="thread"><b>02</b><div><strong>Digital products</strong><p>8 notes · 6 sources · 3 ideas</p></div></div></div></section>
  </section></main>;
}
