export type KnowledgeType = "note" | "source" | "idea" | "insight" | "question";
export type TaskStatus = "todo" | "done";
export type ProjectStatus = "active" | "paused" | "complete";

export interface KnowledgeEntry {
  id: string; title: string; type: KnowledgeType; topic: string; tags: string[]; content: string; createdAt: string;
}
export interface Task {
  id: string; title: string; date: string; time: string; duration: number; status: TaskStatus; project?: string; priority: "low" | "medium" | "high";
}
export interface Project {
  id: string; name: string; description: string; status: ProjectStatus; progress: number;
}
export const seedKnowledge: KnowledgeEntry[] = [
  { id: "k1", title: "Why people buy status", type: "insight", topic: "Psychology", tags: ["consumer behavior", "status"], content: "Status can shape perceived value and purchasing decisions.", createdAt: "2026-09-24" },
  { id: "k2", title: "Behavioral economics video", type: "source", topic: "Behavioral Economics", tags: ["bias", "decision-making"], content: "Reference source for research into predictable decision patterns.", createdAt: "2026-09-23" },
  { id: "k3", title: "Digital product idea", type: "idea", topic: "Business", tags: ["digital products", "business"], content: "A focused digital product built around a recurring user problem.", createdAt: "2026-09-22" }
];
export const seedTasks: Task[] = [
  { id: "t1", title: "Review today's priorities", date: "2026-09-25", time: "08:00", duration: 20, status: "todo", priority: "high" },
  { id: "t2", title: "Research consumer psychology", date: "2026-09-25", time: "11:30", duration: 60, status: "todo", project: "Research", priority: "medium" },
  { id: "t3", title: "Develop content ideas", date: "2026-09-25", time: "16:00", duration: 90, status: "todo", project: "Content", priority: "medium" },
  { id: "t4", title: "Daily review", date: "2026-09-25", time: "20:00", duration: 20, status: "todo", priority: "high" }
];
export const seedProjects: Project[] = [
  { id: "p1", name: "Research", description: "Active investigations and source collection.", status: "active", progress: 42 },
  { id: "p2", name: "Content", description: "Turn research into publishable ideas and drafts.", status: "active", progress: 28 },
  { id: "p3", name: "Business", description: "Build and validate useful digital products.", status: "active", progress: 17 }
];