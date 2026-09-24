import { createEmbedding } from "@/lib/embedding";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function requiredString(value: unknown, name: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(name + " is required.");
  return value.trim();
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeNumber(value: unknown, fallback: number, min: number, max: number) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error("Invalid numeric value.");
  return n;
}

function validDate(value: unknown, name: string) {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) throw new Error(name + " must be a valid date.");
  return date;
}

function validTime(value: unknown, fallback = "09:00") {
  const time = value === undefined || value === null || value === "" ? fallback : String(value);
  if (!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(time)) throw new Error("Time must use HH:MM format.");
  return time;
}

function validChoice(value: unknown, allowed: string[], fallback: string, name: string) {
  const choice = value === undefined || value === null || value === "" ? fallback : String(value);
  if (!allowed.includes(choice)) throw new Error("Invalid " + name + ".");
  return choice;
}

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get("type");
    if (type === "tasks") return NextResponse.json(await db.task.findMany({ orderBy: [{ date: "asc" }, { time: "asc" }] }));
    if (type === "knowledge") return NextResponse.json(await db.knowledgeEntry.findMany({ orderBy: { updatedAt: "desc" } }));
    if (type === "projects") return NextResponse.json(await db.project.findMany({ orderBy: { updatedAt: "desc" } }));
    if (type === "journal") return NextResponse.json(await db.journalEntry.findMany({ orderBy: { date: "desc" } }));
    if (type === "inbox") return NextResponse.json(await db.inboxItem.findMany({ orderBy: { createdAt: "desc" } }));
    return NextResponse.json({ error: "Unknown data type." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database request failed." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body.type;

    if (type === "inbox") {
      return NextResponse.json(await db.inboxItem.create({ data: { text: requiredString(body.text, "text") } }));
    }

    if (type === "knowledge") {
      const title = requiredString(body.title, "title");
      const topic = optionalString(body.topic) || "General";
      const tags = optionalString(body.tags);
      const content = optionalString(body.content);
      const created = await db.knowledgeEntry.create({
        data: {
          title,
          type: optionalString(body.entryType) || "note",
          topic,
          tags,
          content,
          embedding: await createEmbedding(title + "\n" + topic + "\n" + tags + "\n" + content)
        }
      });
      return NextResponse.json(created);
    }

    if (type === "project") {
      return NextResponse.json(await db.project.create({
        data: { name: requiredString(body.name, "name"), description: optionalString(body.description) }
      }));
    }

    if (type === "journal") {
      const date = validDate(body.date, "date");
      return NextResponse.json(await db.journalEntry.upsert({
        where: { date },
        update: {
          did: optionalString(body.did),
          learned: optionalString(body.learned),
          mistakes: optionalString(body.mistakes),
          next: optionalString(body.next)
        },
        create: {
          date,
          did: optionalString(body.did),
          learned: optionalString(body.learned),
          mistakes: optionalString(body.mistakes),
          next: optionalString(body.next)
        }
      }));
    }

    if (type === "task") {
      const requestedRecurrence = validChoice(body.recurrence, ["none", "daily", "weekly", "monthly", "weekday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], "none", "recurrence");
      const weekdayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const recurrence = ["weekday", ...weekdayNames].includes(requestedRecurrence) ? "weekly" : requestedRecurrence;
      const recurrenceRule = optionalString(body.recurrenceRule) || (requestedRecurrence === "weekday" ? "weekday" : weekdayNames.includes(requestedRecurrence) ? "weekday:" + weekdayNames.indexOf(requestedRecurrence) : null);
      return NextResponse.json(await db.task.create({
        data: {
          title: requiredString(body.title, "title"),
          description: optionalString(body.description) || null,
          date: validDate(body.date, "date"),
          time: validTime(body.time),
          duration: safeNumber(body.duration, 30, 1, 1440),
          priority: validChoice(body.priority, ["low", "medium", "high"], "medium", "priority"),
          project: optionalString(body.project) || null,
          recurrence,
          recurrenceRule,
          reminderMinutes: safeNumber(body.reminderMinutes, 10, 0, 1440)
        }
      }));
    }

    return NextResponse.json({ error: "Unknown data type." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database write failed." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id || typeof body.id !== "string") return NextResponse.json({ error: "id is required." }, { status: 400 });

    if (body.type === "task") {
      const existing = await db.task.findUnique({ where: { id: body.id } });
      if (!existing) return NextResponse.json({ error: "Task not found." }, { status: 404 });
      const data: Record<string, unknown> = {};
      if (body.status !== undefined) data.status = validChoice(body.status, ["todo", "done"], "todo", "status");
      if (body.title !== undefined) data.title = requiredString(body.title, "title");
      if (body.description !== undefined) data.description = optionalString(body.description) || null;
      if (body.date !== undefined) data.date = validDate(body.date, "date");
      if (body.time !== undefined) data.time = validTime(body.time);
      if (body.duration !== undefined) data.duration = safeNumber(body.duration, 30, 1, 1440);
      if (body.priority !== undefined) data.priority = validChoice(body.priority, ["low", "medium", "high"], "medium", "priority");
      if (body.project !== undefined) data.project = optionalString(body.project) || null;
      if (body.recurrence !== undefined) data.recurrence = validChoice(body.recurrence, ["none", "daily", "weekly", "monthly"], "none", "recurrence");
      if (body.recurrenceRule !== undefined) data.recurrenceRule = optionalString(body.recurrenceRule) || null;
      if (body.recurrence !== undefined || body.recurrenceRule !== undefined) { data.recurrenceKey = null; data.occurrenceDate = null; }
      if (body.recurrenceRule !== undefined) data.recurrenceRule = optionalString(body.recurrenceRule) || null;
      if (body.reminderMinutes !== undefined) data.reminderMinutes = safeNumber(body.reminderMinutes, 10, 0, 1440);
      return NextResponse.json(await db.task.update({ where: { id: body.id }, data }));
    }

    if (body.type === "inbox") {
      return NextResponse.json(await db.inboxItem.update({
        where: { id: body.id },
        data: { status: validChoice(body.status, ["inbox", "processed", "archived"], "inbox", "status") }
      }));
    }

    if (body.type === "project") {
      const progress = safeNumber(body.progress, 0, 0, 100);
      const status = validChoice(body.status, ["active", "completed", "paused", "archived"], "active", "status");
      return NextResponse.json(await db.project.update({ where: { id: body.id }, data: { progress, status } }));
    }

    if (body.type === "knowledge") {
      const title = requiredString(body.title, "title");
      const topic = optionalString(body.topic) || "General";
      const tags = optionalString(body.tags);
      const content = optionalString(body.content);
      return NextResponse.json(await db.knowledgeEntry.update({
        where: { id: body.id },
        data: {
          title,
          type: optionalString(body.entryType) || "note",
          topic,
          tags,
          content,
          embedding: await createEmbedding(title + "\n" + topic + "\n" + tags + "\n" + content)
        }
      }));
    }

    return NextResponse.json({ error: "Unknown data type." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database update failed." }, { status: 400 });
  }
}
