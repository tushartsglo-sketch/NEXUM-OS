import { NextRequest, NextResponse } from "next/server";
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

function taskDateTime(task: { date: Date; time: string; timezone?: string }) {
  const [hours, minutes] = String(task.time || "00:00").split(":").map(Number);
  const safeHours = Number.isFinite(hours) ? hours : 0;
  const safeMinutes = Number.isFinite(minutes) ? minutes : 0;
  const zone = task.timezone || "UTC";
  const base = new Date(task.date);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(base);
  const values = Object.fromEntries(parts.filter(p => p.type !== "literal").map(p => [p.type, p.value]));
  const target = `${values.year}-${values.month}-${values.day}T${String(safeHours).padStart(2,"0")}:${String(safeMinutes).padStart(2,"0")}:00`;
  const asUtc = new Date(target + "Z");
  const rendered = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(asUtc);
  const r = Object.fromEntries(rendered.filter(p => p.type !== "literal").map(p => [p.type, p.value]));
  const zoneAsUtc = Date.UTC(Number(r.year), Number(r.month)-1, Number(r.day), Number(r.hour), Number(r.minute), Number(r.second));
  const offset = zoneAsUtc - asUtc.getTime();
  return new Date(asUtc.getTime() - offset);
}

function validId(value: unknown, name: string) { if (typeof value !== "string" || !value.trim()) throw new Error(name+" is required."); return value; }



function nextOccurrence(date: Date, recurrence: string, rule?: string | null) {
  const next = new Date(date);
  if (recurrence === "monthly") {
    const day = date.getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(day, lastDay));
    return next;
  }
  if (recurrence === "daily") next.setDate(next.getDate() + 1);
  else if (recurrence === "weekly") {
    if (rule === "weekday") {
      next.setDate(next.getDate() + 1);
      while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
    } else if (rule && /^weekday:\\d$/.test(rule)) {
      const target = Number(rule.split(":")[1]);
      let delta = (target - next.getDay() + 7) % 7 || 7;
      next.setDate(next.getDate() + delta);
    } else next.setDate(next.getDate() + 7);
  } else if (recurrence === "monthly") return next;
  else return null;
  return next;
}

async function generateRecurringTasks(now: Date) {
  const recurring = await db.task.findMany({
    where: { recurrence: { not: "none" } },
    orderBy: { date: "asc" }
  });
  let created = 0;
  const processedSeries = new Set<string>();

  for (const task of recurring) {
    const key = task.recurrenceKey || task.id;
    if (processedSeries.has(key)) continue;
    processedSeries.add(key);

    if (!task.recurrenceKey || !task.occurrenceDate) {
      await db.task.update({
        where: { id: task.id },
        data: { recurrenceKey: key, occurrenceDate: task.date }
      });
    }

    const latest = await db.task.findFirst({
      where: { OR: [{ recurrenceKey: key }, { id: key }] },
      orderBy: { date: "desc" }
    });
    if (!latest || latest.recurrence === "none") continue;

    let candidate = nextOccurrence(latest.date, latest.recurrence, latest.recurrenceRule);
    if (!candidate) continue;

    for (let i = 0; i < 12 && candidate <= now; i++) {
      const occurrenceDate = new Date(candidate);
      try {
        await db.task.create({
          data: {
            title: latest.title,
            description: latest.description,
            date: occurrenceDate,
            time: latest.time,
            duration: latest.duration,
            status: "todo",
            priority: latest.priority,
            project: latest.project,
            recurrence: latest.recurrence,
            recurrenceRule: latest.recurrenceRule,
            reminderMinutes: latest.reminderMinutes,
            recurrenceKey: key,
            occurrenceDate
          }
        });
        created++;
      } catch (error) {
        if (!(error && typeof error === "object" && "code" in error && error.code === "P2002")) {
          throw error;
        }
      }

      candidate = nextOccurrence(candidate, latest.recurrence, latest.recurrenceRule);
      if (!candidate) break;
    }
  }

  return created;
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


export async function POST(request: NextRequest) {
  if (request.headers.get("x-nexum-action") === "generate-recurring") {
    const created = await generateRecurringTasks(new Date());
    return NextResponse.json({ created });
  }
  try {
    const body = await request.json();
    const kind = validId(body.kind, "kind");
    const id = validId(body.entityId, "entityId");

    if (kind === "overdue-task" || kind === "stale-content-idea") {
      if (kind === "overdue-task") {
        const task = await db.task.findUnique({ where: { id } });
        if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
        if (body.action === "complete") {
          return NextResponse.json(await db.task.update({ where: { id }, data: { status: "done" } }));
        }
        if (body.action === "reschedule") {
          const date = new Date(body.date);
          if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Valid date is required." }, { status: 400 });
          return NextResponse.json(await db.task.update({ where: { id }, data: { date, ...(body.time ? { time: String(body.time) } : {}) } }));
        }
        return NextResponse.json({ error: "Supported task actions: complete, reschedule." }, { status: 400 });
      }
      const item = await db.contentItem.findUnique({ where: { id } });
      if (!item) return NextResponse.json({ error: "Content item not found." }, { status: 404 });
      if (body.action === "publish") return NextResponse.json(await db.contentItem.update({ where: { id }, data: { stage: "published" } }));
      if (body.action === "archive") return NextResponse.json(await db.contentItem.update({ where: { id }, data: { stage: "archived" } }));
      return NextResponse.json({ error: "Supported content actions: publish, archive." }, { status: 400 });
    }

    if (kind === "stale-inbox") {
      const item = await db.inboxItem.findUnique({ where: { id } });
      if (!item) return NextResponse.json({ error: "Inbox item not found." }, { status: 404 });
      if (body.action === "archive") return NextResponse.json(await db.inboxItem.update({ where: { id }, data: { status: "archived" } }));
      if (body.action === "complete") return NextResponse.json(await db.inboxItem.update({ where: { id }, data: { status: "processed" } }));
      return NextResponse.json({ error: "Supported inbox actions: complete, archive." }, { status: 400 });
    }

    return NextResponse.json({ error: "This automation has no executable action yet." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Automation action failed." }, { status: 400 });
  }
}
