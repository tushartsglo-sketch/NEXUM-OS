"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/lib/domain";

export default function TasksPage() {
  const [tasks,setTasks]=useState<Task[]>([]);
  useEffect(()=>{ fetch("/api/db?type=tasks").then(r=>r.json()).then(setTasks); },[]);
  async function toggle(task:Task){
    const status=task.status==="done"?"todo":"done";
    const updated=await fetch("/api/db",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"task",id:task.id,status})}).then(r=>r.json());
    setTasks(v=>v.map(x=>x.id===updated.id?updated:x));
  }
  return <main className="module-page"><header className="module-header"><div><p className="eyebrow">Execution</p><h1>Tasks</h1><p>Persistent work, deadlines, priority, and completion.</p></div><span className="module-count">{tasks.filter(t=>t.status==="done").length}/{tasks.length} done</span></header><section className="task-list">{tasks.map(task=><article className={task.status==="done"?"task-row is-done":"task-row"} key={task.id}><button className="check-button" onClick={()=>toggle(task)}>{task.status==="done"?"✓":""}</button><div className="task-main"><h2>{task.title}</h2><p>{task.time} · {task.duration} min{task.project?" · "+task.project:""}</p></div><span className={"priority "+task.priority}>{task.priority}</span></article>)}</section></main>;
}