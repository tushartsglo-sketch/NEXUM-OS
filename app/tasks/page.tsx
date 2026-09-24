"use client";
import { useEffect,useState } from "react";
import type { Task } from "@/lib/domain";

const recurrence=["none","daily","weekly","monthly"];
const priorities=["low","medium","high"];

export default function TasksPage(){
 const [tasks,setTasks]=useState<Task[]>([]);
 const [title,setTitle]=useState(""),[description,setDescription]=useState(""),[date,setDate]=useState("2026-09-25"),[time,setTime]=useState("09:00"),[duration,setDuration]=useState("30"),[priority,setPriority]=useState("medium"),[project,setProject]=useState(""),[repeat,setRepeat]=useState("none");
 useEffect(()=>{fetch("/api/db?type=tasks").then(r=>r.json()).then(setTasks)},[]);
 async function create(){
  if(!title.trim())return;
  const x=await fetch("/api/db",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"task",title,description,date,time,duration:Number(duration),priority,project,recurrence:repeat})}).then(r=>r.json());
  setTasks(v=>[...v,x]);setTitle("");setDescription("");
 }
 async function toggle(task:Task){const status=task.status==="done"?"todo":"done";const x=await fetch("/api/db",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"task",id:task.id,status})}).then(r=>r.json());setTasks(v=>v.map(t=>t.id===x.id?x:t))}
 async function update(task:Task,patch:any){const x=await fetch("/api/db",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"task",id:task.id,...patch})}).then(r=>r.json());setTasks(v=>v.map(t=>t.id===x.id?x:t))}
 return <main className="module-page"><header className="module-header"><div><p className="eyebrow">EXECUTION ENGINE</p><h1>Tasks</h1><p>Schedule work precisely, repeat what matters, and keep execution connected to the rest of NEXUM.</p></div><span className="module-count">{tasks.filter(t=>t.status==="done").length}/{tasks.length} done</span></header>
 <section className="task-create"><div className="task-create-main"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What needs to happen?"/><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description or definition of done"/></div><div className="task-fields"><label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Time<input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label><label>Duration<select value={duration} onChange={e=>setDuration(e.target.value)}><option>15</option><option>30</option><option>45</option><option>60</option><option>90</option><option>120</option></select></label><label>Priority<select value={priority} onChange={e=>setPriority(e.target.value)}>{priorities.map(x=><option key={x}>{x}</option>)}</select></label><label>Repeat<select value={repeat} onChange={e=>setRepeat(e.target.value)}>{recurrence.map(x=><option key={x}>{x}</option>)}</select></label><label>Project<input value={project} onChange={e=>setProject(e.target.value)} placeholder="Optional"/></label></div><button className="primary-button" onClick={create}>Schedule task</button></section>
 <section className="task-list">{tasks.map(task=><article className={task.status==="done"?"task-row is-done":"task-row"} key={task.id}><button className="check-button" onClick={()=>toggle(task)}>{task.status==="done"?"✓":""}</button><div className="task-main"><h2>{task.title}</h2><p>{task.date?.slice(0,10)} · {task.time} · {task.duration} min{task.project?" · "+task.project:""}{task.recurrence&&task.recurrence!=="none"?" · repeats "+task.recurrence:""}</p>{task.description&&<small>{task.description}</small>}</div><select className={"priority-select "+task.priority} value={task.priority} onChange={e=>update(task,{priority:e.target.value})}>{priorities.map(x=><option key={x}>{x}</option>)}</select></article>)}</section></main>
}