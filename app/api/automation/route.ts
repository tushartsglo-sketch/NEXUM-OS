import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Suggestion = {
  kind: string;
  priority: "high" | "medium" | "low";
  title: string;
  reason: string;
  action: string;
  entityType?: string;
  entityId?: string;
};

function taskDateTime(task: { date: Date; time: string }) {
  const [hours, minutes] = String(task.time || "00:00").split(":").map(Number);
  const date = new Date(task.date);
  date.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return date;
}

export async function GET() {
  const now = new Date();
  const [tasks, research, inbox, projects, content] = await Promise.all([
    db.task.findMany({ where: { status: { not: "done" } }, orderBy: { date: "asc" } }),
    db.researchProject.findMany({ orderBy: { updatedAt: "asc" }, include: { sources: true } }),
    db.inboxItem.findMany({ where: { status: "inbox" }, orderBy: { createdAt: "asc" } }),
    db.project.findMany({ where: { status: { not: "completed" } }, orderBy: { updatedAt: "asc" } }),
    db.contentItem.findMany({ where: { stage: { not: "published" } }, orderBy: { updatedAt: "asc" } })
  ]);

  const suggestions: Suggestion[] = [];

  for (const task of tasks) {
    const due = taskDateTime(task);
    const ageHours = (now.getTime() - due.getTime()) / 3600000;
    if (ageHours > 24) {
      suggestions.push({
        kind: "overdue-task",
        priority: "high",
        title: `Review overdue task: ${task.title}`,
        reason: `This task is more than 24 hours past its scheduled time.`,
        action: "Reschedule, complete, or deliberately cancel it.",
        entityType: "task",
        entityId: task.id
      });
    }
  }

  for (const item of inbox) {
    const ageDays = (now.getTime() - item.createdAt.getTime()) / 86400000;
    if (ageDays >= 3) {
      suggestions.push({
        kind: "stale-inbox",
        priority: "medium",
        title: `Process inbox item: ${item.text.slice(0, 90)}`,
        reason: `It has been waiting in Inbox for ${Math.floor(ageDays)} days.`,
        action: "Convert it into knowledge, a task, research, or archive it.",
        entityType: "inbox",
        entityId: item.id
      });
    }
  }

  for (const item of research) {
    const ageDays = (now.getTime() - item.updatedAt.getTime()) / 86400000;
    if (!["ready", "archived"].includes(item.status) && ageDays >= 7) {
      suggestions.push({
        kind: "stale-research",
        priority: "medium",
        title: `Resume research: ${item.title}`,
        reason: `No update has been recorded for ${Math.floor(ageDays)} days.`,
        action: item.sources.length === 0 ? "Add evidence or sources." : "Review evidence and write the next insight.",
        entityType: "research",
        entityId: item.id
      });
    }
  }

  for (const project of projects) {
    const ageDays = (now.getTime() - project.updatedAt.getTime()) / 86400000;
    if (ageDays >= 14) {
      suggestions.push({
        kind: "stale-project",
        priority: "low",
        title: `Review project: ${project.name}`,
        reason: `The project has not been updated for ${Math.floor(ageDays)} days.`,
        action: "Update progress, define the next milestone, or close it.",
        entityType: "project",
        entityId: project.id
      });
    }
  }

  for (const item of content) {
    const ageDays = (now.getTime() - item.updatedAt.getTime()) / 86400000;
    if (item.stage === "idea" && ageDays >= 14) {
      suggestions.push({
        kind: "stale-content-idea",
        priority: "low",
        title: `Develop content idea: ${item.title}`,
        reason: `This idea has remained untouched for ${Math.floor(ageDays)} days.`,
        action: "Draft it, attach supporting research, or archive it.",
        entityType: "content",
        entityId: item.id
      });
    }
  }

  const rank = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => rank[a.priority] - rank[b.priority] || a.title.localeCompare(b.title));

  return NextResponse.json({
    generatedAt: now.toISOString(),
    count: suggestions.length,
    suggestions: suggestions.slice(0, 30)
  });
}
