"use client";

import { useState } from "react";
import { seedTasks, Task } from "@/lib/domain";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  function toggle(id: string) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, status: task.status === "done" ? "todo" : "done" } : task));
  }

  return <main className="module-page">
    <header className="module-header"><div><p className="eyebrow">Execution</p><h1>Tasks</h1><p>Time-bound work with clear ownership, priority, and completion state.</p></div><span className="module-count">{tasks.filter((t) => t.status === "done").length}/{tasks.length} done</span></header>
    <section className="task-list">{tasks.map((task) => <article className={task.status === "done" ? "task-row is-done" : "task-row"} key={task.id}><button className="check-button" onClick={() => toggle(task.id)} aria-label="Toggle task">{task.status === "done" ? "✓" : ""}</button><div className="task-main"><h2>{task.title}</h2><p>{task.time} · {task.duration} min{task.project ? " · " + task.project : ""}</p></div><span className={"priority " + task.priority}>{task.priority}</span></article>)}</section>
  </main>;
}